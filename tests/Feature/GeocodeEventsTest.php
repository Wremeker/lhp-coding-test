<?php

use App\Models\Event;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

beforeEach(function () {
    config(['services.nominatim.base_url' => 'http://nominatim.test']);
});

function fakeNominatim(?array $address = null): void
{
    Http::fake([
        'nominatim.test/*' => Http::response([
            'display_name' => '10 Main Street, Springfield, USA',
            'address' => $address ?? [
                'house_number' => '10',
                'road' => 'Main Street',
                'city' => 'Springfield',
                'country' => 'USA',
            ],
        ], 200),
    ]);
}

it('backfills address, city and country from a reverse lookup', function () {
    fakeNominatim();

    $event = Event::factory()->for(User::factory())->create([
        'latitude' => 40.7128,
        'longitude' => -74.0060,
        'geocoded_at' => null,
    ]);

    $this->artisan('events:geocode')->assertSuccessful();

    $event->refresh();
    expect($event->address)->toBe('10 Main Street');
    expect($event->city)->toBe('Springfield');
    expect($event->country)->toBe('USA');
    expect($event->geocoded_at)->not->toBeNull();
});

it('honors the --limit option', function () {
    fakeNominatim();

    Event::factory()->for(User::factory())->count(3)->create(['geocoded_at' => null]);

    $this->artisan('events:geocode', ['--limit' => 1])->assertSuccessful();

    expect(Event::whereNotNull('geocoded_at')->count())->toBe(1);
    expect(Event::whereNull('geocoded_at')->count())->toBe(2);
});

it('sends one request per event across concurrency batches', function () {
    fakeNominatim();

    Event::factory()->for(User::factory())->count(5)->create(['geocoded_at' => null]);

    $this->artisan('events:geocode', ['--concurrency' => 2])->assertSuccessful();

    Http::assertSentCount(5);
    expect(Event::whereNull('geocoded_at')->count())->toBe(0);
});

it('skips events that are already geocoded', function () {
    fakeNominatim();

    Event::factory()->for(User::factory())->create([
        'geocoded_at' => now(),
        'address' => 'Existing Street',
    ]);

    $this->artisan('events:geocode')->assertSuccessful();

    Http::assertNothingSent();
});

it('leaves an event for retry when the lookup fails', function () {
    Http::fake([
        'nominatim.test/*' => Http::response(['error' => 'Unable to geocode'], 200),
    ]);

    $event = Event::factory()->for(User::factory())->create(['geocoded_at' => null]);

    $this->artisan('events:geocode')->assertSuccessful();

    $event->refresh();
    expect($event->geocoded_at)->toBeNull();
    expect($event->address)->toBeNull();
});
