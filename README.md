# Event Visuals

Laravel 13 + Inertia/React app for browsing events. Uses SQLite by default.

## Requirements

- PHP 8.3+ with the usual Laravel extensions
- Composer
- Node 20+ and npm

## Setup

```bash
composer setup
```

This installs PHP/JS deps, copies `.env`, generates the app key, runs migrations, and builds assets.

> Geocoding (`events:geocode`) expects a local [Nominatim](https://nominatim.org/) instance at the `NOMINATIM_BASE_URL` in `.env` (default `http://localhost:8080`). Skip it if you don't need addresses backfilled.

## Seed & prepare data

```bash
php artisan db:seed                 # seeds events (set SEED_ROWS to use fewer, e.g. SEED_ROWS=5000)
php artisan events:extract-payload  # fills name/start_at/end_at/price from JSON payload
php artisan events:geocode          # backfills address/city/country from lat/lng
```

The default seed is large (~1.25M events). For local dev, prefer a smaller set:

```bash
SEED_ROWS=5000 php artisan db:seed
```

## Run

```bash
composer dev
```

Starts the PHP server, queue worker, log tailer, and Vite together. Open http://localhost:8000.

Emails use the `log` mailer by default (`MAIL_MAILER=log`), so confirmations/reminders are written to `storage/logs/laravel.log`.

## Tests & linting

```bash
composer test   # pint + phpstan + pest
```
