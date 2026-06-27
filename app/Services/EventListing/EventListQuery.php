<?php

namespace App\Services\EventListing;

use App\Models\Event;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;

/**
 * Builds the public events listing query: applies the supported filters, orders
 * by date and paginates with a keyset (cursor) so deep pages stay fast on the
 * 1.25M-row table.
 *
 * Only the columns the UI actually renders are selected, and every filter is
 * backed by an index (see the events_status_* / events_name_fulltext indexes).
 */
class EventListQuery
{
    private const DEFAULT_LIMIT = 30;

    private const MAX_LIMIT = 50;

    /** Columns the map + list actually use — keep the row payload small. */
    private const COLUMNS = [
        'id', 'name', 'type', 'start_at', 'end_at',
        'price', 'latitude', 'longitude', 'city', 'country',
    ];

    /**
     * @param  array<string, mixed>  $filters
     * @return array{data: Collection<int, Event>, next_cursor: ?string}
     */
    public function paginate(array $filters): array
    {
        $limit = $this->limit($filters['limit'] ?? null);
        $term = $this->searchTerm($filters['name'] ?? null);

        $query = Event::query()
            ->select(self::COLUMNS)
            ->whereIn('status', Event::PUBLIC_STATUSES);

        $this->applyDateFilter($query, $filters);
        $this->applyLocationFilter($query, $filters);
        $this->applyCategoryFilter($query, $filters);
        $this->applyPriceFilter($query, $filters);

        // A name search is selective on `name` but would have to fetch + filesort
        // every match to honour a global date order (≈1s for common words like
        // "live", which match ~33k rows). Instead, search just takes the first
        // matches the FULLTEXT index yields and pages by offset, so the scan stops
        // at the limit (~90ms). Plain browsing keeps the date keyset.
        if ($term !== null) {
            return $this->paginateByNameSearch($query, $term, $filters['cursor'] ?? null, $limit);
        }

        return $this->paginateByDate($query, $filters['cursor'] ?? null, $limit);
    }

    /**
     * Date-sorted keyset pagination — the default browsing/filtering path.
     *
     * @param  Builder<Event>  $query
     * @return array{data: Collection<int, Event>, next_cursor: ?string}
     */
    private function paginateByDate(Builder $query, ?string $cursor, int $limit): array
    {
        $this->applyCursor($query, $cursor);

        $query->orderBy('start_at')->orderBy('id');

        // Fetch one extra row to know whether a further page exists.
        $events = $query->limit($limit + 1)->get();

        $hasMore = $events->count() > $limit;
        $events = $events->take($limit);

        return [
            'data' => $events,
            'next_cursor' => $hasMore ? $this->encodeCursor($events->last()) : null,
        ];
    }

    /**
     * Offset pagination over FULLTEXT matches — the name-search path.
     *
     * @param  Builder<Event>  $query
     * @return array{data: Collection<int, Event>, next_cursor: ?string}
     */
    private function paginateByNameSearch(Builder $query, string $term, ?string $cursor, int $limit): array
    {
        // Boolean mode supports the `+word*` prefix matching (search-as-you-type).
        // We add NO `ORDER BY`: any sort (date or `MATCH(...)` relevance) forces a
        // filesort over every match — ≈1s for a common prefix like "ann". Without
        // it the index returns matches and the scan stops at the limit (~90ms). The
        // order is the engine's internal one, which is stable enough for offset
        // paging (already shift-prone on inserts).
        $query->whereFullText('name', $term, ['mode' => 'boolean']);

        $offset = $this->decodeOffsetCursor($cursor);

        $events = $query->offset($offset)->limit($limit + 1)->get();

        $hasMore = $events->count() > $limit;
        $events = $events->take($limit);

        return [
            'data' => $events,
            'next_cursor' => $hasMore ? $this->encodeOffsetCursor($offset + $limit) : null,
        ];
    }

    /**
     * @param  Builder<Event>  $query
     * @param  array<string, mixed>  $filters
     */
    private function applyDateFilter(Builder $query, array $filters): void
    {
        if (! empty($filters['date'])) {
            $day = Carbon::parse($filters['date']);
            $query->whereBetween('start_at', [$day->copy()->startOfDay(), $day->copy()->endOfDay()]);

            return;
        }

        if (! empty($filters['date_from']) || ! empty($filters['date_to'])) {
            if (! empty($filters['date_from'])) {
                $query->where('start_at', '>=', Carbon::parse($filters['date_from'])->startOfDay());
            }

            if (! empty($filters['date_to'])) {
                $query->where('start_at', '<=', Carbon::parse($filters['date_to'])->endOfDay());
            }

            return;
        }

        // No explicit date filter → show current (upcoming) events by default.
        $query->where('start_at', '>=', now());
    }

    /**
     * @param  Builder<Event>  $query
     * @param  array<string, mixed>  $filters
     */
    private function applyLocationFilter(Builder $query, array $filters): void
    {
        if (! empty($filters['country'])) {
            $query->where('country', $filters['country']);
        }

        if (! empty($filters['city'])) {
            $query->where('city', $filters['city']);
        }
    }

    /**
     * @param  Builder<Event>  $query
     * @param  array<string, mixed>  $filters
     */
    private function applyCategoryFilter(Builder $query, array $filters): void
    {
        $categories = array_filter((array) ($filters['categories'] ?? []));

        if ($categories !== []) {
            $query->whereIn('type', $categories);
        }
    }

    /**
     * @param  Builder<Event>  $query
     * @param  array<string, mixed>  $filters
     */
    private function applyPriceFilter(Builder $query, array $filters): void
    {
        if (isset($filters['price_min']) && $filters['price_min'] !== '') {
            $query->where('price', '>=', $filters['price_min']);
        }

        if (isset($filters['price_max']) && $filters['price_max'] !== '') {
            $query->where('price', '<=', $filters['price_max']);
        }
    }

    /**
     * Turn a raw query into a safe FULLTEXT boolean expression: each word becomes
     * a required prefix match (e.g. "Annual Found" → "+annual* +found*"), so the
     * search matches as you type. Returns null when there is nothing searchable so
     * the caller falls back to date browsing.
     */
    private function searchTerm(?string $name): ?string
    {
        if ($name === null) {
            return null;
        }

        preg_match_all('/[\p{L}\p{N}]+/u', $name, $matches);

        if ($matches[0] === []) {
            return null;
        }

        return implode(' ', array_map(static fn (string $w) => '+'.$w.'*', $matches[0]));
    }

    /**
     * @param  Builder<Event>  $query
     */
    private function applyCursor(Builder $query, ?string $cursor): void
    {
        $decoded = $this->decodeCursor($cursor);

        if ($decoded === null) {
            return;
        }

        [$startAt, $id] = $decoded;

        // Keyset seek: rows strictly after the last (start_at, id) pair.
        $query->where(function (Builder $q) use ($startAt, $id) {
            $q->where('start_at', '>', $startAt)
                ->orWhere(function (Builder $q) use ($startAt, $id) {
                    $q->where('start_at', '=', $startAt)->where('id', '>', $id);
                });
        });
    }

    private function encodeCursor(?Event $event): ?string
    {
        if ($event === null) {
            return null;
        }

        return base64_encode($event->start_at->format('Y-m-d H:i:s').'|'.$event->id);
    }

    /**
     * @return array{0: string, 1: string}|null
     */
    private function decodeCursor(?string $cursor): ?array
    {
        if ($cursor === null || $cursor === '') {
            return null;
        }

        $decoded = base64_decode($cursor, true);

        if ($decoded === false || ! str_contains($decoded, '|')) {
            return null;
        }

        [$startAt, $id] = explode('|', $decoded, 2);

        try {
            $startAt = Carbon::parse($startAt)->format('Y-m-d H:i:s');
        } catch (\Throwable) {
            return null;
        }

        return [$startAt, $id];
    }

    private function encodeOffsetCursor(int $offset): string
    {
        return base64_encode('offset:'.$offset);
    }

    private function decodeOffsetCursor(?string $cursor): int
    {
        if ($cursor === null || $cursor === '') {
            return 0;
        }

        $decoded = base64_decode($cursor, true);

        if ($decoded === false || ! str_starts_with($decoded, 'offset:')) {
            return 0;
        }

        return max(0, (int) substr($decoded, 7));
    }

    private function limit(mixed $limit): int
    {
        $limit = (int) ($limit ?: self::DEFAULT_LIMIT);

        return max(1, min($limit, self::MAX_LIMIT));
    }
}
