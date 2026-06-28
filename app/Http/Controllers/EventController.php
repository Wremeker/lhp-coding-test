<?php

namespace App\Http\Controllers;

use App\Http\Requests\EventIndexRequest;
use App\Http\Resources\EventResource;
use App\Models\Event;
use App\Services\EventListing\EventListQuery;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    /**
     * Paginated, filterable JSON feed of public events (consumed by the map +
     * infinite-scroll list on the events page).
     */
    public function index(EventIndexRequest $request, EventListQuery $query): JsonResponse
    {
        $result = $query->paginate($request->validated());

        return EventResource::collection($result['data'])
            ->additional(['next_cursor' => $result['next_cursor']])
            ->response();
    }

    public function show(Event $event): Response
    {
        $event->load(['user', 'images']);

        return Inertia::render('Events/Show', [
            'event' => [
                'id' => $event->id,
                'name' => $event->name,
                'type' => $event->type,
                'status' => $event->status,
                'created_time' => $event->created_time,
                'latitude' => $event->latitude,
                'longitude' => $event->longitude,
                'payload' => $event->payload,
                'images' => $event->images->pluck('path')->values()->all(),
                'can_upload' => auth()->id() === $event->user_id,
            ],
        ]);
    }
}
