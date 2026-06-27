<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Indexes that back the public events listing endpoint. The dominant query is
 * "published events, filtered, ordered by start_at (+ id as a keyset tie-break)".
 *
 * Each composite index leads with `status` (the listing only exposes published
 * events) and ends with `start_at` so the same index serves both the WHERE
 * filter and the ORDER BY / keyset range. The trailing PK (`id`) is appended to
 * every secondary index by InnoDB, which makes the (start_at, id) keyset seek
 * index-only-friendly.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Superseded by the (status, start_at) composite below.
        Schema::table('events', function (Blueprint $table) {
            $table->dropIndex('events_status_index');
        });

        Schema::table('events', function (Blueprint $table) {
            // Default listing: published events ordered by date.
            $table->index(['status', 'start_at'], 'events_status_start_at_index');
            // Category filter (`type`) + date order.
            $table->index(['status', 'type', 'start_at'], 'events_status_type_start_at_index');
            // Location filter (city/country, populated by geocoding) + date order.
            $table->index(['status', 'country', 'start_at'], 'events_status_country_start_at_index');
        });

        // Name search — FULLTEXT so substring/keyword matching avoids a full scan.
        DB::statement('ALTER TABLE events ADD FULLTEXT events_name_fulltext (name)');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE events DROP INDEX events_name_fulltext');

        Schema::table('events', function (Blueprint $table) {
            $table->dropIndex('events_status_start_at_index');
            $table->dropIndex('events_status_type_start_at_index');
            $table->dropIndex('events_status_country_start_at_index');

            $table->index('status', 'events_status_index');
        });
    }
};
