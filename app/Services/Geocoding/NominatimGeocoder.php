<?php

namespace App\Services\Geocoding;

use Illuminate\Http\Client\Pool;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class NominatimGeocoder
{
    private string $baseUrl;

    private int $timeout;

    private string $userAgent;

    public function __construct()
    {
        /** @var array<string, mixed> $config */
        $config = config('services.nominatim');

        $this->baseUrl = rtrim((string) ($config['base_url'] ?? 'http://localhost:8080'), '/');
        $this->timeout = (int) ($config['timeout'] ?? 15);
        $this->userAgent = (string) ($config['user_agent'] ?? 'laravel-events-geocoder');
    }

    /**
     * Reverse-geocode a single coordinate pair.
     */
    public function reverse(float $latitude, float $longitude): ?GeocodedAddress
    {
        try {
            $response = Http::baseUrl($this->baseUrl)
                ->timeout($this->timeout)
                ->withHeaders(['User-Agent' => $this->userAgent])
                ->get('/reverse', $this->query($latitude, $longitude));

            return $this->parse($response);
        } catch (Throwable $e) {
            Log::warning('Nominatim reverse lookup failed', [
                'lat' => $latitude,
                'lng' => $longitude,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Reverse-geocode many coordinates concurrently via an HTTP pool.
     *
     * @param  iterable<array{id: string|int, latitude: float|string, longitude: float|string}>  $points
     * @return array<string|int, GeocodedAddress|null> Keyed by the point id.
     */
    public function reverseMany(iterable $points): array
    {
        /** @var array<int, array{id: string|int, latitude: float|string, longitude: float|string}> $list */
        $list = is_array($points) ? array_values($points) : iterator_to_array($points, false);

        if ($list === []) {
            return [];
        }

        $keys = [];

        /** @var array<string, Response> $responses */
        $responses = Http::pool(function (Pool $pool) use ($list, &$keys) {
            $requests = [];

            foreach ($list as $point) {
                $key = (string) $point['id'];
                $keys[] = ['id' => $point['id'], 'key' => $key];

                $requests[] = $pool->as($key)
                    ->baseUrl($this->baseUrl)
                    ->timeout($this->timeout)
                    ->withHeaders(['User-Agent' => $this->userAgent])
                    ->get('/reverse', $this->query(
                        (float) $point['latitude'],
                        (float) $point['longitude'],
                    ));
            }

            return $requests;
        });

        $results = [];

        foreach ($keys as $entry) {
            $response = $responses[$entry['key']] ?? null;

            $results[$entry['id']] = $response instanceof Response
                ? $this->parse($response)
                : $this->logPooledFailure($entry['id'], $response);
        }

        return $results;
    }

    /**
     * @return array<string, mixed>
     */
    private function query(float $latitude, float $longitude): array
    {
        return [
            'lat' => $latitude,
            'lon' => $longitude,
            'format' => 'jsonv2',
            'zoom' => 18,
            'addressdetails' => 1,
        ];
    }

    private function parse(Response $response): ?GeocodedAddress
    {
        if (! $response->successful()) {
            return null;
        }

        /** @var array<string, mixed>|null $body */
        $body = $response->json();

        if (! is_array($body) || isset($body['error'])) {
            return null;
        }

        return GeocodedAddress::fromNominatim($body);
    }

    private function logPooledFailure(string|int $id, mixed $response): null
    {
        $message = $response instanceof Throwable ? $response->getMessage() : 'no response';

        Log::warning('Nominatim pooled lookup failed', [
            'id' => $id,
            'error' => $message,
        ]);

        return null;
    }
}
