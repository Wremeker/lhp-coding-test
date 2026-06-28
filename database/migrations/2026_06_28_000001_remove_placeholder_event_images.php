<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('event_images')
            ->where('path', 'like', '/event-placeholders/%')
            ->delete();
    }

    public function down(): void
    {
        // Placeholder rows were synthetic — not restored on rollback.
    }
};
