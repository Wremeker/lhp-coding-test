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
        $event->load('user');

        return Inertia::render('Events/Show', [
            'event' => $event,
        ]);
    }
}
