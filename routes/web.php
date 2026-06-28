<?php

use App\Http\Controllers\Admin\EventController as AdminEventController;
use App\Http\Controllers\Admin\EventImageController as AdminEventImageController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\EventImageController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/events')->name('home');

// Public event browsing (map + timeline).
Route::inertia('events', 'Events/Index')->name('events.index');
Route::get('events/data', [EventController::class, 'index'])->name('events.data');
Route::get('events/{event}', [EventController::class, 'show'])->name('events.show');
Route::post('events/{event}/images', [EventImageController::class, 'store'])
    ->middleware('auth')
    ->name('events.images.store');

Route::middleware(['auth', 'admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('events', [AdminEventController::class, 'index'])->name('events.index');
        Route::get('events/{event}/edit', [AdminEventController::class, 'edit'])->name('events.edit');
        Route::put('events/{event}', [AdminEventController::class, 'update'])->name('events.update');
        Route::post('events/{event}/images', [AdminEventImageController::class, 'store'])->name('events.images.store');
        Route::delete('events/{event}/images/{image}', [AdminEventImageController::class, 'destroy'])->name('events.images.destroy');
    });

require __DIR__.'/settings.php';
