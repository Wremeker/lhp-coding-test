<?php

namespace Database\Factories;

use App\Models\Event;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Event>
 */
class EventFactory extends Factory
{
    protected $model = Event::class;

    public function definition(): array
    {
        $type = fake()->randomElement(['concert', 'conference', 'meetup', 'workshop', 'festival', 'sports', 'networking', 'exhibition']);
        $lat = fake()->latitude();
        $lng = fake()->longitude();
        $startsAt = fake()->numberBetween(strtotime('-1 year'), strtotime('+1 year'));
        $endsAt = $startsAt + 7200;
        $name = ucwords(fake()->words(3, true));
        $price = fake()->randomFloat(2, 0, 250);

        return [
            'user_id' => User::factory(),
            'type' => $type,
            'status' => fake()->randomElement(['draft', 'published', 'cancelled', 'sold_out']),
            'name' => $name,
            'created_time' => $startsAt,
            'start_at' => gmdate('Y-m-d H:i:s', $startsAt),
            'end_at' => gmdate('Y-m-d H:i:s', $endsAt),
            'price' => $price,
            'latitude' => $lat,
            'longitude' => $lng,
            'payload' => [
                'name' => $name,
                'category' => $type,
                'venue' => ['name' => fake()->company(), 'capacity' => fake()->numberBetween(20, 50000)],
                'location' => ['lat' => $lat, 'lng' => $lng],
                'schedule' => ['starts_at' => $startsAt, 'ends_at' => $endsAt],
                'pricing' => ['currency' => 'USD', 'min_price' => $price],
            ],
        ];
    }
}
