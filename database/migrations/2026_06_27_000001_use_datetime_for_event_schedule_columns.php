<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('events', 'start_at')) {
            return;
        }

        $driver = Schema::getConnection()->getDriverName();

        if (! in_array($driver, ['mysql', 'mariadb'], true)) {
            return;
        }

        DB::statement('ALTER TABLE events MODIFY start_at DATETIME NULL');
        DB::statement('ALTER TABLE events MODIFY end_at DATETIME NULL');
    }

    public function down(): void
    {
        if (! Schema::hasColumn('events', 'start_at')) {
            return;
        }

        $driver = Schema::getConnection()->getDriverName();

        if (! in_array($driver, ['mysql', 'mariadb'], true)) {
            return;
        }

        DB::statement('ALTER TABLE events MODIFY start_at TIMESTAMP NULL');
        DB::statement('ALTER TABLE events MODIFY end_at TIMESTAMP NULL');
    }
};
