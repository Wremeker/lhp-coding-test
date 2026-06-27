// Client for the `/events/data` JSON feed (filters + keyset pagination) plus the
// small presentation helpers the map/list need. Replaces the old self-contained
// mock data — events now come from the backend.

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
}

/** Presentation-ready event used by the views (covers, labels, parsed dates). */
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
    /** YYYY-MM-DD (UTC) — also used by shared controls. */
    date: string;
    /** HH:MM (UTC). */
    time: string;
    startISO: string | null;
    endISO: string | null;
    covers: string[];
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

// Deterministic per-event hue shift so repeated covers differ a little.
function hueShift(id: string): number {
    let h = 0;

    for (let i = 0; i < id.length; i++) {
        h = (h * 31 + id.charCodeAt(i)) % 60;
    }

    return h - 30;
}

function covers(category: Category, id: string): string[] {
    const base = CATS[category].hue + hueShift(id);

    return [
        grad(base, base + 28, 135),
        grad(base + 180, base + 150, 160),
        grad(base + 40, base - 30, 110),
    ];
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL_DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const FULL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function pad(n: number): string {
    return n < 10 ? `0${n}` : String(n);
}

/**
 * Events are global, so we render the stored time as UTC (deterministic, no
 * browser-timezone drift) and label it as such in the UI.
 */
export function toDisplayEvent(e: ApiEvent): DisplayEvent {
    const d = e.start_at ? new Date(e.start_at) : null;
    const date = d
        ? `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
        : '';
    const time = d ? `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}` : '';

    return {
        id: e.id,
        title: e.name ?? 'Untitled event',
        category: e.category,
        catLabel: CATS[e.category]?.label ?? e.category,
        catColor: CATS[e.category]?.color ?? '#64748b',
        lat: Number(e.latitude),
        lng: Number(e.longitude),
        price: e.price,
        city: e.city,
        country: e.country,
        date,
        time,
        startISO: e.start_at,
        endISO: e.end_at,
        covers: covers(e.category, e.id),
    };
}

export function fmtShortISO(iso: string | null): string {
    if (!iso) {
        return 'Date TBC';
    }

    const x = new Date(iso);

    return `${DOW[x.getUTCDay()]}, ${MONTHS[x.getUTCMonth()]} ${x.getUTCDate()}`;
}

export function fmtLongISO(iso: string | null): string {
    if (!iso) {
        return 'Date to be confirmed';
    }

    const x = new Date(iso);

    return `${FULL_DOW[x.getUTCDay()]}, ${FULL_MONTHS[x.getUTCMonth()]} ${x.getUTCDate()}, ${x.getUTCFullYear()}`;
}

/** "Jul 2026" — month grouping key for the timeline. */
export function monthKey(date: string): string {
    if (!date) {
        return 'Undated';
    }

    const [y, m] = date.split('-').map(Number);

    return `${MONTHS[m - 1]} ${y}`;
}

/** Long month + year for timeline section headings. */
export function monthLabel(date: string): { month: string; year: string } {
    const [y, m] = date.split('-').map(Number);

    return { month: FULL_MONTHS[m - 1], year: String(y) };
}

/** Day number + short weekday (UTC) for the timeline spine. */
export function dayParts(date: string): { day: number; dow: string } {
    const [y, m, d] = date.split('-').map(Number);
    const dow = DOW[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];

    return { day: d, dow };
}

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
