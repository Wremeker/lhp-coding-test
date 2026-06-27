<?php

namespace App\Http\Requests;

use App\Models\Event;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EventIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            // Single-day filter.
            'date' => ['nullable', 'date_format:Y-m-d'],
            // Date range filter (inclusive).
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:date_from'],
            // Location filter (populated by geocoding).
            'city' => ['nullable', 'string', 'max:255'],
            'country' => ['nullable', 'string', 'max:255'],
            // Category filter (the `type` column); one or many.
            'categories' => ['nullable', 'array'],
            'categories.*' => [Rule::in(Event::CATEGORIES)],
            // Price range filter.
            'price_min' => ['nullable', 'numeric', 'min:0'],
            'price_max' => ['nullable', 'numeric', 'min:0'],
            // Name search.
            'name' => ['nullable', 'string', 'max:100'],
            // Keyset pagination.
            'cursor' => ['nullable', 'string'],
            'limit' => ['nullable', 'integer', 'between:1,50'],
        ];
    }
}
