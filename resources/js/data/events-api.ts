// Client for the `/events/data` JSON feed (filters + keyset pagination) plus the
// small presentation helpers the map/list need. Replaces the old self-contained
// mock data — events now come from the backend.
//
// Timezone policy: instants are stored/served as UTC (ISO-8601). We derive the
// venue IANA zone from lat/lng and render date/time in that zone so "7 PM in
// Berlin" reads correctly regardless of the viewer's browser clock.

import {
    buildEventSchedule,
    dayPartsFromLocalDate,
    formatLongDate,
    formatShortDate,
    formatShortLocalDate,
    monthKeyFromLocalDate,
    monthLabelFromLocalDate,
} from '@/lib/event-time';

export type Category =
    | 'concert'
    | 'conference'
    | 'exhibition'
    | 'festival'
    | 'meetup'
    | 'networking'
    | 'sports'
    | 'workshop';

/** Raw shape returned by the API (see EventResource). */
export interface ApiEvent {
    id: string;
    name: string | null;
    category: Category;
    start_at: string | null;
    end_at: string | null;
    price: number | null;
    latitude: number;
    longitude: number;
    city: string | null;
    country: string | null;
    /** Uploaded image URLs (may be empty until the organizer uploads). */
    images: string[];
}

/** Presentation-ready event used by the views (images, labels, parsed dates). */
export interface DisplayEvent {
    id: string;
    title: string;
    category: Category;
    catLabel: string;
    catColor: string;
    lat: number;
    lng: number;
    price: number | null;
    city: string | null;
    country: string | null;
    /** YYYY-MM-DD in the venue timezone — used for grouping and list labels. */
    date: string;
    /** HH:MM in the venue timezone. */
    time: string;
    /** IANA timezone id for the venue (from coordinates). */
    timezone: string;
    /** Short label at start time, e.g. "CET" or "GMT-5". */
    timezoneLabel: string;
    /** Set when the viewer's timezone differs from the venue. */
    userTimeHint: string | null;
    startISO: string | null;
    endISO: string | null;
    images: string[];
}

export const CATS: Record<Category, { label: string; color: string; hue: number }> = {
    concert: { label: 'Concert', color: '#0ea5e9', hue: 199 },
    festival: { label: 'Festival', color: '#ec4899', hue: 330 },
    conference: { label: 'Conference', color: '#8b5cf6', hue: 262 },
    workshop: { label: 'Workshop', color: '#f59e0b', hue: 38 },
    meetup: { label: 'Meetup', color: '#10b981', hue: 160 },
    networking: { label: 'Networking', color: '#14b8a6', hue: 173 },
    sports: { label: 'Sports', color: '#ef4444', hue: 6 },
    exhibition: { label: 'Exhibition', color: '#6366f1', hue: 239 },
};

export const CATEGORY_KEYS = Object.keys(CATS) as Category[];

const grad = (h1: number, h2: number, angle: number) =>
    `linear-gradient(${angle}deg, hsl(${h1} 82% 62%), hsl(${h2} 78% 44%))`;

function hueShift(id: string): number {
    let h = 0;

    for (let i = 0; i < id.length; i++) {
        h = (h * 31 + id.charCodeAt(i)) % 60;
    }

    return h - 30;
}

/** CSS gradient used when an event has no uploaded images yet. */
export function coverGradient(
    category: Category,
    id: string,
    variant = 0,
): string {
    const base = CATS[category].hue + hueShift(id) + variant * 40;

    return grad(base, base + 28, 135 + variant * 25);
}

export function toDisplayEvent(e: ApiEvent): DisplayEvent {
    const lat = Number(e.latitude);
    const lng = Number(e.longitude);
    const schedule = buildEventSchedule(e.start_at, lat, lng);

    return {
        id: e.id,
        title: e.name ?? 'Untitled event',
        category: e.category,
        catLabel: CATS[e.category]?.label ?? e.category,
        catColor: CATS[e.category]?.color ?? '#64748b',
        lat,
        lng,
        price: e.price,
        city: e.city,
        country: e.country,
        date: schedule.date,
        time: schedule.time,
        timezone: schedule.timezone,
        timezoneLabel: schedule.timezoneLabel,
        userTimeHint: schedule.userTimeHint,
        startISO: e.start_at,
        endISO: e.end_at,
        images: e.images ?? [],
    };
}

export function fmtShortISO(iso: string | null, timezone: string): string {
    if (!iso) {
        return 'Date TBC';
    }

    return formatShortDate(iso, timezone);
}

export function fmtLongISO(iso: string | null, timezone: string): string {
    if (!iso) {
        return 'Date to be confirmed';
    }

    return formatLongDate(iso, timezone);
}

/** "Jul 2026" — month grouping key for the timeline (venue-local date). */
export function monthKey(date: string): string {
    return monthKeyFromLocalDate(date);
}

/** Long month + year for timeline section headings. */
export function monthLabel(date: string): { month: string; year: string } {
    return monthLabelFromLocalDate(date);
}

/** Day number + short weekday for the timeline spine. */
export function dayParts(date: string): { day: number; dow: string } {
    return dayPartsFromLocalDate(date);
}

/** "Fri, Jul 3" from a venue-local YYYY-MM-DD string. */
export { formatShortLocalDate as fmtShortLocalDate };

const INTEREST_KEY = 'cultura_interest';

export function getInterest(): string[] {
    try {
        return JSON.parse(localStorage.getItem(INTEREST_KEY) || '[]');
    } catch {
        return [];
    }
}

export function setInterest(ids: string[]): void {
    try {
        localStorage.setItem(INTEREST_KEY, JSON.stringify(ids));
    } catch {
        // ignore (e.g. private mode)
    }
}

/** Human label for an event's location, falling back to coordinates pre-geocoding. */
export function locationLabel(e: DisplayEvent): string {
    const parts = [e.city, e.country].filter(Boolean);

    if (parts.length > 0) {
        return parts.join(', ');
    }

    return `${e.lat.toFixed(2)}, ${e.lng.toFixed(2)}`;
}

export function formatPrice(price: number | null): string {
    if (price === null) {
        return 'Free';
    }

    if (price === 0) {
        return 'Free';
    }

    return `$${price.toFixed(2)}`;
}

export interface EventFilters {
    name?: string;
    date?: string | null;
    dateFrom?: string | null;
    dateTo?: string | null;
    country?: string | null;
    city?: string | null;
    categories?: Category[];
    priceMin?: string | null;
    priceMax?: string | null;
}

export interface EventPage {
    data: DisplayEvent[];
    nextCursor: string | null;
}

function buildQuery(filters: EventFilters, cursor: string | null, limit: number): string {
    const params = new URLSearchParams();
    params.set('limit', String(limit));

    if (cursor) {
        params.set('cursor', cursor);
    }

    if (filters.name?.trim()) {
        params.set('name', filters.name.trim());
    }

    if (filters.date) {
        params.set('date', filters.date);
    } else {
        if (filters.dateFrom) {
            params.set('date_from', filters.dateFrom);
        }

        if (filters.dateTo) {
            params.set('date_to', filters.dateTo);
        }
    }

    if (filters.country) {
        params.set('country', filters.country);
    }

    if (filters.city) {
        params.set('city', filters.city);
    }

    if (filters.priceMin) {
        params.set('price_min', filters.priceMin);
    }

    if (filters.priceMax) {
        params.set('price_max', filters.priceMax);
    }

    (filters.categories ?? []).forEach((c) => params.append('categories[]', c));

    return params.toString();
}

export async function fetchEvents(
    filters: EventFilters,
    cursor: string | null,
    limit: number,
    signal?: AbortSignal,
): Promise<EventPage> {
    const res = await fetch(`/events/data?${buildQuery(filters, cursor, limit)}`, {
        headers: { Accept: 'application/json' },
        signal,
    });

    if (!res.ok) {
        throw new Error(`Failed to load events (${res.status})`);
    }

    const json = (await res.json()) as { data: ApiEvent[]; next_cursor: string | null };

    return {
        data: json.data.map(toDisplayEvent),
        nextCursor: json.next_cursor,
    };
}
