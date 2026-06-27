<?php

namespace App\Services\EventPayload;

use Illuminate\Support\Carbon;

readonly class ExtractedPayloadFields
{
    public function __construct(
        public ?string $name,
        public ?Carbon $startAt,
        public ?Carbon $endAt,
        public ?string $price,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     */
    public static function fromPayload(array $payload): self
    {
        $schedule = is_array($payload['schedule'] ?? null) ? $payload['schedule'] : [];
        $pricing = is_array($payload['pricing'] ?? null) ? $payload['pricing'] : [];

        $name = self::stringOrNull($payload['name'] ?? null);
        $startAt = self::timestampOrNull($schedule['starts_at'] ?? null);
        $endAt = self::timestampOrNull($schedule['ends_at'] ?? null);
        $price = self::priceOrNull($pricing['min_price'] ?? null);

        return new self($name, $startAt, $endAt, $price);
    }

    public function isEmpty(): bool
    {
        return $this->name === null
            && $this->startAt === null
            && $this->endAt === null
            && $this->price === null;
    }

    private static function stringOrNull(mixed $value): ?string
    {
        if (! is_string($value) && ! is_numeric($value)) {
            return null;
        }

        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }

    private static function timestampOrNull(mixed $value): ?Carbon
    {
        if (! is_string($value) && ! is_numeric($value)) {
            return null;
        }

        $value = trim((string) $value);

        if ($value === '' || ! ctype_digit($value)) {
            return null;
        }

        return Carbon::createFromTimestampUTC((int) $value);
    }

    private static function priceOrNull(mixed $value): ?string
    {
        if (! is_string($value) && ! is_numeric($value)) {
            return null;
        }

        $value = trim((string) $value);

        if ($value === '' || ! is_numeric($value)) {
            return null;
        }

        return number_format((float) $value, 2, '.', '');
    }
}
