<?php

namespace App\Console\Commands;

use App\Jobs\GeocodeChunk;
use App\Models\Event;
use App\Services\Geocoding\EventChunkGeocoder;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Builder;

class GeocodeEvents extends Command
{
    protected $signature = 'events:geocode
        {--limit= : Maximum number of events to process this run}
        {--chunk=500 : Events read and written per chunk}
        {--concurrency=32 : Parallel HTTP requests per pool}
        {--queue : Dispatch chunk jobs onto the "geocode" queue instead of running inline}';

    protected $description = 'Backfill address/city/country for events by reverse-geocoding their coordinates via Nominatim.';

    public function handle(EventChunkGeocoder $chunkGeocoder): int
    {
        $chunk = max(1, (int) $this->option('chunk'));
        $concurrency = max(1, (int) $this->option('concurrency'));
        $queue = (bool) $this->option('queue');
        $limit = $this->option('limit') !== null ? max(0, (int) $this->option('limit')) : null;

        $pending = $this->baseQuery()->count();
        $total = $limit !== null ? min($limit, $pending) : $pending;

        if ($total === 0) {
            $this->info('No events require geocoding.');

            return self::SUCCESS;
        }

        $this->info(sprintf(
            '%s %d event(s) (chunk=%d, concurrency=%d).',
            $queue ? 'Dispatching' : 'Geocoding',
            $total,
            $chunk,
            $concurrency,
        ));

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $processed = 0;
        $geocoded = 0;
        $lastId = null;

        while ($processed < $total) {
            $take = min($chunk, $total - $processed);

            $query = $this->baseQuery()
                ->orderBy('id')
                ->select('id', 'latitude', 'longitude')
                ->limit($take);

            if ($lastId !== null) {
                $query->where('id', '>', $lastId);
            }

            $events = $query->get();

            if ($events->isEmpty()) {
                break;
            }

            $lastId = $events->last()->getKey();

            if ($queue) {
                GeocodeChunk::dispatch($events->pluck('id')->all(), $concurrency)
                    ->onQueue('geocode');
            } else {
                $geocoded += $chunkGeocoder->geocode($events, $concurrency);
            }

            $processed += $events->count();
            $bar->advance($events->count());
        }

        $bar->finish();
        $this->newLine(2);

        if ($queue) {
            $this->info(sprintf('Dispatched %d event(s) to the "geocode" queue.', $processed));
            $this->line('Run workers, e.g.: php artisan queue:work --queue=geocode');
        } else {
            $this->info(sprintf('Geocoded %d of %d processed event(s).', $geocoded, $processed));
        }

        return self::SUCCESS;
    }

    /**
     * Events still needing geocoding: missing address data but with coordinates.
     *
     * @return Builder<Event>
     */
    private function baseQuery(): Builder
    {
        return Event::query()
            ->whereNull('geocoded_at')
            ->whereNotNull('latitude')
            ->whereNotNull('longitude');
    }
}
