<?php

namespace App\Services\Geocoding;

use App\Models\Event;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class EventChunkGeocoder
{
    public function __construct(private readonly NominatimGeocoder $geocoder) {}

    /**
     * Reverse-geocode a batch of events and persist the results in a single
     * batched UPDATE. HTTP requests are fired in pools of at most
     * $concurrency to bound parallel connections. Events that fail to resolve
     * are left untouched (their geocoded_at stays null) so a later run retries
     * them.
     *
     * @param  Collection<int, Event>|array<int, Event>  $events
     * @return int Number of events successfully geocoded and written.
     */
    public function geocode(Collection|array $events, int $concurrency = 32): int
    {
        $events = $events instanceof Collection ? $events : collect($events);

        $points = $events->map(fn (Event $event) => [
            'id' => $event->getKey(),
            'latitude' => (float) $event->latitude,
            'longitude' => (float) $event->longitude,
        ])->all();

        if ($points === []) {
            return 0;
        }

        $concurrency = max(1, $concurrency);
        $started = microtime(true);

        /** @var array<string, GeocodedAddress> $resolved */
        $resolved = [];

        foreach (array_chunk($points, $concurrency) as $batch) {
            foreach ($this->geocoder->reverseMany($batch) as $id => $address) {
                if ($address instanceof GeocodedAddress) {
                    $resolved[(string) $id] = $address;
                }
            }
        }

        $written = $this->persist($resolved);

        $this->throttle(count($points), $started);

        return $written;
    }

    /**
     * Persist resolved addresses with one batched CASE update.
     *
     * @param  array<string, GeocodedAddress>  $resolved
     */
    private function persist(array $resolved): int
    {
        if ($resolved === []) {
            return 0;
        }

        $ids = array_keys($resolved);

        $addressCase = '';
        $cityCase = '';
        $countryCase = '';
        $bindings = [];

        foreach ($resolved as $id => $address) {
            $addressCase .= ' WHEN ? THEN ?';
            $bindings[] = $id;
            $bindings[] = $address->address;
        }

        foreach ($resolved as $id => $address) {
            $cityCase .= ' WHEN ? THEN ?';
            $bindings[] = $id;
            $bindings[] = $address->city;
        }

        foreach ($resolved as $id => $address) {
            $countryCase .= ' WHEN ? THEN ?';
            $bindings[] = $id;
            $bindings[] = $address->country;
        }

        $bindings[] = Carbon::now()->toDateTimeString();

        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $bindings = array_merge($bindings, $ids);

        $sql = 'UPDATE events SET '
            ."address = CASE id{$addressCase} ELSE address END, "
            ."city = CASE id{$cityCase} ELSE city END, "
            ."country = CASE id{$countryCase} ELSE country END, "
            .'geocoded_at = ? '
            ."WHERE id IN ({$placeholders})";

        DB::update($sql, $bindings);

        return count($resolved);
    }

    /**
     * When a positive rate cap is configured, pace each batch so the overall
     * request rate stays under services.nominatim.rate_per_second.
     */
    private function throttle(int $requestCount, float $startedAt): void
    {
        $rate = (int) config('services.nominatim.rate_per_second', 0);

        if ($rate <= 0) {
            return;
        }

        $target = $requestCount / $rate;
        $elapsed = microtime(true) - $startedAt;
        $remaining = $target - $elapsed;

        if ($remaining > 0) {
            usleep((int) round($remaining * 1_000_000));
        }
    }
}
