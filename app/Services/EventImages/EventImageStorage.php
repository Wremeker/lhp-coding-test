<?php

namespace App\Services\EventImages;

use App\Models\Event;
use App\Models\EventImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class EventImageStorage
{
    /**
     * Store uploaded files on the public disk and attach them to the event.
     *
     * @param  list<UploadedFile>  $files
     * @return Collection<int, EventImage>
     */
    public function store(Event $event, array $files): Collection
    {
        $nextSort = ((int) $event->images()->max('sort_order')) + 1;
        $created = collect();

        foreach ($files as $file) {
            $filename = Str::uuid().'.'.$file->getClientOriginalExtension();
            $stored = $file->storeAs("event-images/{$event->id}", $filename, 'public');

            $created->push($event->images()->create([
                'path' => '/storage/'.$stored,
                'sort_order' => $nextSort++,
            ]));
        }

        return $created;
    }

    public function destroy(EventImage $image): void
    {
        if (str_starts_with($image->path, '/storage/')) {
            Storage::disk('public')->delete(Str::after($image->path, '/storage/'));
        }

        $image->delete();
    }
}
