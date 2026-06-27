<?php

namespace App\Services\Geocoding;

class GeocodedAddress
{
    public function __construct(
        public readonly ?string $address,
        public readonly ?string $city,
        public readonly ?string $country,
    ) {}

    /**
     * Build from a Nominatim reverse-geocode response body.
     *
     * @param  array<string, mixed>  $payload
     */
    public static function fromNominatim(array $payload): self
    {
        /** @var array<string, mixed> $details */
        $details = is_array($payload['address'] ?? null) ? $payload['address'] : [];

        $address = self::street($details) ?? ($payload['display_name'] ?? null);

        $city = $details['city']
            ?? $details['town']
            ?? $details['village']
            ?? $details['municipality']
            ?? $details['county']
            ?? null;

        $country = $details['country'] ?? null;

        return new self(
            self::trimToNull($address),
            self::trimToNull($city),
            self::trimToNull($country),
        );
    }

    /**
     * @param  array<string, mixed>  $details
     */
    private static function street(array $details): ?string
    {
        $road = $details['road'] ?? $details['pedestrian'] ?? $details['neighbourhood'] ?? null;

        if ($road === null) {
            return null;
        }

        $houseNumber = $details['house_number'] ?? null;

        return $houseNumber !== null
            ? trim("{$houseNumber} {$road}")
            : (string) $road;
    }

    private static function trimToNull(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $value = trim($value);

        return $value === '' ? null : $value;
    }
}
