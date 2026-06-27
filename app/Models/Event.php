<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Event extends Model
{
    use HasFactory, HasUuids;

    /** Event categories (the `type` column) exposed to the public listing. */
    public const CATEGORIES = [
        'concert',
        'conference',
        'exhibition',
        'festival',
        'meetup',
        'networking',
        'sports',
        'workshop',
    ];

    /** Statuses that should be visible on the public listing. */
    public const PUBLIC_STATUSES = ['published', 'sold_out'];

    protected $guarded = [];

    protected $casts = [
        'payload' => 'array',
        'latitude' => 'float',
        'longitude' => 'float',
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'price' => 'decimal:2',
        'geocoded_at' => 'datetime',
    ];

    public function newUniqueId(): string
    {
        return (string) Str::uuid();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
