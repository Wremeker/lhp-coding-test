<?php

use App\Models\Event;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('backfills name, start_at, end_at and price from the payload', function () {
    $startsAt = 1_805_989_811;
    $endsAt = 1_806_193_992;

    $event = Event::factory()->for(User::factory())->create([
        'name' => null,
        'start_at' => null,
        'end_at' => null,
        'price' => null,
        'payload' => [
            'name' => 'Global Book Symposium',
            'schedule' => [
                'starts_at' => (string) $startsAt,
                'ends_at' => (string) $endsAt,
            ],
            'pricing' => [
                'currency' => 'USD',
                'min_price' => '232.36',
            ],
        ],
    ]);

    $this->artisan('events:extract-payload')->assertSuccessful();

    $event->refresh();
    expect($event->name)->toBe('Global Book Symposium');
    expect($event->start_at?->timestamp)->toBe($startsAt);
    expect($event->end_at?->timestamp)->toBe($endsAt);
    expect((string) $event->price)->toBe('232.36');
});

it('honors the --limit option', function () {
    Event::factory()->for(User::factory())->count(3)->create([
        'name' => null,
        'payload' => [
            'name' => 'Sample Event',
            'schedule' => ['starts_at' => '1700000000', 'ends_at' => '1700007200'],
            'pricing' => ['min_price' => '10.00'],
        ],
    ]);

    $this->artisan('events:extract-payload', ['--limit' => 1])->assertSuccessful();

    expect(Event::whereNotNull('name')->count())->toBe(1);
    expect(Event::whereNull('name')->count())->toBe(2);
});

it('skips events that are already extracted', function () {
    Event::factory()->for(User::factory())->create([
        'name' => 'Already Extracted',
        'start_at' => now(),
        'end_at' => now()->addHour(),
        'price' => 99.99,
        'payload' => ['name' => 'Different Name'],
    ]);

    $this->artisan('events:extract-payload')->assertSuccessful();

    expect(Event::where('name', 'Different Name')->count())->toBe(0);
    expect(Event::where('name', 'Already Extracted')->count())->toBe(1);
});

it('stores schedule timestamps that fall on a DST transition day', function () {
    $startsAt = strtotime('2027-03-28 02:52:35 UTC');
    $endsAt = strtotime('2027-03-28 04:15:00 UTC');

    $event = Event::factory()->for(User::factory())->create([
        'name' => null,
        'start_at' => null,
        'end_at' => null,
        'payload' => [
            'name' => 'DST Edge Case',
            'schedule' => [
                'starts_at' => (string) $startsAt,
                'ends_at' => (string) $endsAt,
            ],
        ],
    ]);

    $this->artisan('events:extract-payload')->assertSuccessful();

    $event->refresh();
    expect($event->start_at?->utc()->format('Y-m-d H:i:s'))->toBe('2027-03-28 02:52:35');
    expect($event->end_at?->utc()->format('Y-m-d H:i:s'))->toBe('2027-03-28 04:15:00');
});

it('leaves columns null when payload fields are missing', function () {
    $event = Event::factory()->for(User::factory())->create([
        'name' => null,
        'start_at' => null,
        'end_at' => null,
        'price' => null,
        'payload' => ['category' => 'networking'],
    ]);

    $this->artisan('events:extract-payload')->assertSuccessful();

    $event->refresh();
    expect($event->name)->toBeNull();
    expect($event->start_at)->toBeNull();
    expect($event->end_at)->toBeNull();
    expect($event->price)->toBeNull();
});
