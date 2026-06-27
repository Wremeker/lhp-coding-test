<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->string('address')->nullable()->after('longitude');
            $table->string('city')->nullable()->after('address');
            $table->string('country')->nullable()->after('city');
            $table->timestamp('geocoded_at')->nullable()->after('country');

            $table->index('geocoded_at');
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropIndex(['geocoded_at']);
            $table->dropColumn(['address', 'city', 'country', 'geocoded_at']);
        });
    }
};
