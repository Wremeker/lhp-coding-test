<?php

namespace App\Services\EventPayload;

use App\Models\Event;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class EventChunkPayloadBackfiller
{
    /**
     * Extract payload fields for a batch of events and persist them in a single
     * batched UPDATE.
     *
     * @param  Collection<int, Event>|array<int, Event>  $events
     * @return int Number of events written.
     */
    public function backfill(Collection|array $events): int
    {
        $events = $events instanceof Collection ? $events : collect($events);

        /** @var array<string, ExtractedPayloadFields> $extracted */
        $extracted = [];

        foreach ($events as $event) {
            $payload = $event->payload;

            if (! is_array($payload)) {
                continue;
            }

            $fields = ExtractedPayloadFields::fromPayload($payload);

            if ($fields->isEmpty()) {
                continue;
            }

            $extracted[(string) $event->getKey()] = $fields;
        }

        return $this->persist($extracted);
    }

    /**
     * @param  array<string, ExtractedPayloadFields>  $extracted
     */
    private function persist(array $extracted): int
    {
        if ($extracted === []) {
            return 0;
        }

        $ids = array_keys($extracted);

        $nameCase = '';
        $startAtCase = '';
        $endAtCase = '';
        $priceCase = '';
        $bindings = [];

        foreach ($extracted as $id => $fields) {
            $nameCase .= ' WHEN ? THEN ?';
            $bindings[] = $id;
            $bindings[] = $fields->name;
        }

        foreach ($extracted as $id => $fields) {
            $startAtCase .= ' WHEN ? THEN ?';
            $bindings[] = $id;
            $bindings[] = $fields->startAt?->utc()->format('Y-m-d H:i:s');
        }

        foreach ($extracted as $id => $fields) {
            $endAtCase .= ' WHEN ? THEN ?';
            $bindings[] = $id;
            $bindings[] = $fields->endAt?->utc()->format('Y-m-d H:i:s');
        }

        foreach ($extracted as $id => $fields) {
            $priceCase .= ' WHEN ? THEN ?';
            $bindings[] = $id;
            $bindings[] = $fields->price;
        }

        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $bindings = array_merge($bindings, $ids);

        $sql = 'UPDATE events SET '
            ."name = CASE id{$nameCase} ELSE name END, "
            ."start_at = CASE id{$startAtCase} ELSE start_at END, "
            ."end_at = CASE id{$endAtCase} ELSE end_at END, "
            ."price = CASE id{$priceCase} ELSE price END "
            ."WHERE id IN ({$placeholders})";

        DB::update($sql, $bindings);

        return count($extracted);
    }
}
