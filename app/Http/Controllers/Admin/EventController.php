<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateEventRequest;
use App\Models\Event;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $status = $request->query('status');

        $events = Event::query()
            ->select(['id', 'name', 'type', 'status', 'start_at', 'city', 'country', 'price'])
            ->withCount('images')
            ->when($search !== '', fn ($q) => $q->where('name', 'like', '%'.$search.'%'))
            ->when(
                is_string($status) && $status !== '',
                fn ($q) => $q->where('status', $status),
            )
            ->orderByDesc('start_at')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Event $event) => [
                'id' => $event->id,
                'name' => $event->name,
                'type' => $event->type,
                'status' => $event->status,
                'start_at' => $event->start_at?->toIso8601String(),
                'city' => $event->city,
                'country' => $event->country,
                'price' => $event->price !== null ? (float) $event->price : null,
                'images_count' => $event->images_count,
            ]);

        return Inertia::render('Admin/Events/Index', [
            'events' => $events,
            'filters' => [
                'search' => $search,
                'status' => is_string($status) ? $status : '',
            ],
            'statuses' => ['draft', 'published', 'cancelled', 'sold_out'],
            'categories' => Event::CATEGORIES,
        ]);
    }

    public function edit(Event $event): Response
    {
        $event->load('images');

        $payload = is_array($event->payload) ? $event->payload : [];

        return Inertia::render('Admin/Events/Edit', [
            'event' => [
                'id' => $event->id,
                'name' => $event->name,
                'description' => is_string($payload['description'] ?? null) ? $payload['description'] : '',
                'type' => $event->type,
                'status' => $event->status,
                'start_at' => $event->start_at?->format('Y-m-d\TH:i'),
                'end_at' => $event->end_at?->format('Y-m-d\TH:i'),
                'price' => $event->price,
                'latitude' => $event->latitude,
                'longitude' => $event->longitude,
                'address' => $event->address,
                'city' => $event->city,
                'country' => $event->country,
                'images' => $event->images->map(fn ($image) => [
                    'id' => $image->id,
                    'path' => $image->path,
                    'sort_order' => $image->sort_order,
                ])->values()->all(),
            ],
            'categories' => Event::CATEGORIES,
            'statuses' => ['draft', 'published', 'cancelled', 'sold_out'],
        ]);
    }

    public function update(UpdateEventRequest $request, Event $event): RedirectResponse
    {
        $data = $request->validated();
        $payload = is_array($event->payload) ? $event->payload : [];

        $payload['name'] = $data['name'];
        $payload['category'] = $data['type'];
        $payload['description'] = $data['description'] ?? '';

        $event->update([
            'name' => $data['name'],
            'type' => $data['type'],
            'status' => $data['status'],
            'start_at' => $data['start_at'],
            'end_at' => $data['end_at'] ?? null,
            'price' => $data['price'] ?? null,
            'latitude' => $data['latitude'] ?? null,
            'longitude' => $data['longitude'] ?? null,
            'address' => $data['address'] ?? null,
            'city' => $data['city'] ?? null,
            'country' => $data['country'] ?? null,
            'payload' => $payload,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Event updated.']);

        return back();
    }
}
