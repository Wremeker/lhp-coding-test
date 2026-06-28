<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreEventImagesRequest;
use App\Models\Event;
use App\Models\EventImage;
use App\Services\EventImages\EventImageStorage;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class EventImageController extends Controller
{
    public function store(
        StoreEventImagesRequest $request,
        Event $event,
        EventImageStorage $storage,
    ): RedirectResponse {
        $storage->store($event, $request->file('images', []));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Images uploaded.']);

        return back();
    }

    public function destroy(
        Event $event,
        EventImage $image,
        EventImageStorage $storage,
    ): RedirectResponse {
        abort_unless($image->event_id === $event->id, 404);

        $storage->destroy($image);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Image removed.']);

        return back();
    }
}
