<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEventImagesRequest;
use App\Models\Event;
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

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Images uploaded successfully.']);

        return back();
    }
}
