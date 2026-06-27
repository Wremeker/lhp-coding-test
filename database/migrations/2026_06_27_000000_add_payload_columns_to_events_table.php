<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->string('name')->nullable()->after('status');
            $table->dateTime('start_at')->nullable()->after('created_time');
            $table->dateTime('end_at')->nullable()->after('start_at');
            $table->decimal('price', 10, 2)->nullable()->after('end_at');

            $table->index('start_at');
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropIndex(['start_at']);
            $table->dropColumn(['name', 'start_at', 'end_at', 'price']);
        });
    }
};
