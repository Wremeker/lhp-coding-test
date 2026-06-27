<?php

namespace App\Console\Commands;

use App\Models\Event;
use App\Services\EventPayload\EventChunkPayloadBackfiller;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Builder;

class ExtractEventPayload extends Command
{
    protected $signature = 'events:extract-payload
        {--limit= : Maximum number of events to process this run}
        {--chunk=500 : Events read and written per chunk}';

    protected $description = 'Backfill name, start_at, end_at and price for events from their JSON payload.';

    public function handle(EventChunkPayloadBackfiller $backfiller): int
    {
        $chunk = max(1, (int) $this->option('chunk'));
        $limit = $this->option('limit') !== null ? max(0, (int) $this->option('limit')) : null;

        $pending = $this->baseQuery()->count();
        $total = $limit !== null ? min($limit, $pending) : $pending;

        if ($total === 0) {
            $this->info('No events require payload extraction.');

            return self::SUCCESS;
        }

        $this->info(sprintf('Extracting payload fields for %d event(s) (chunk=%d).', $total, $chunk));

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $processed = 0;
        $extracted = 0;
        $lastId = null;

        while ($processed < $total) {
            $take = min($chunk, $total - $processed);

            $query = $this->baseQuery()
                ->orderBy('id')
                ->select('id', 'payload')
                ->limit($take);

            if ($lastId !== null) {
                $query->where('id', '>', $lastId);
            }

            $events = $query->get();

            if ($events->isEmpty()) {
                break;
            }

            $lastId = $events->last()->getKey();
            $extracted += $backfiller->backfill($events);
            $processed += $events->count();
            $bar->advance($events->count());
        }

        $bar->finish();
        $this->newLine(2);
        $this->info(sprintf('Extracted payload fields for %d of %d processed event(s).', $extracted, $processed));

        return self::SUCCESS;
    }

    /**
     * Events still needing payload extraction.
     *
     * @return Builder<Event>
     */
    private function baseQuery(): Builder
    {
        return Event::query()->whereNull('name');
    }
}
