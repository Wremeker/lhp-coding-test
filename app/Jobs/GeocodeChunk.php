<?php

namespace App\Jobs;

use App\Models\Event;
use App\Services\Geocoding\EventChunkGeocoder;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class GeocodeChunk implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    /** @var array<int, int> */
    public array $backoff = [10, 30, 60];

    /**
     * @param  array<int, string>  $eventIds
     */
    public function __construct(
        public array $eventIds,
        public int $concurrency = 32,
    ) {}

    public function handle(EventChunkGeocoder $geocoder): void
    {
        $events = Event::query()
            ->whereKey($this->eventIds)
            ->whereNull('geocoded_at')
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->select('id', 'latitude', 'longitude')
            ->get();

        if ($events->isEmpty()) {
            return;
        }

        $geocoder->geocode($events, $this->concurrency);
    }
}
