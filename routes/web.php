<?php

use App\Http\Controllers\EventController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/events')->name('home');

// Single events page; the Map / Timeline toggle lives client-side.
Route::inertia('events', 'Events/Index')->name('events.index');
// JSON feed backing the map + infinite-scroll list (filters + keyset pagination).
Route::get('events/data', [EventController::class, 'index'])->name('events.data');
Route::get('events/{event}', [EventController::class, 'show'])->name('events.show');

Route::inertia('dashboard', 'Dashboard')->name('dashboard');

require __DIR__.'/settings.php';
