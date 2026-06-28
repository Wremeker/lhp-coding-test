import tzlookup from 'tz-lookup';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL_DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const FULL_MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

function pad(n: number): string {
    return n < 10 ? `0${n}` : String(n);
}

/** Resolve the IANA timezone for a venue from its coordinates. */
export function resolveEventTimezone(lat: number, lng: number): string {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return 'UTC';
    }

    try {
        return tzlookup(lat, lng);
    } catch {
        return 'UTC';
    }
}

function partsInTimezone(iso: string, timeZone: string): Intl.DateTimeFormatPart[] {
    return new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).formatToParts(new Date(iso));
}

function part(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
    return parts.find((p) => p.type === type)?.value ?? '';
}

/** Calendar date (YYYY-MM-DD) for the event start in the venue timezone. */
export function localDateKey(iso: string, timeZone: string): string {
    const parts = partsInTimezone(iso, timeZone);

    return `${part(parts, 'year')}-${part(parts, 'month')}-${part(parts, 'day')}`;
}

/** Clock time (HH:MM) for the event start in the venue timezone. */
export function localTime(iso: string, timeZone: string): string {
    const parts = partsInTimezone(iso, timeZone);

    return `${part(parts, 'hour')}:${part(parts, 'minute')}`;
}

/** Short timezone label at the event instant (e.g. "CET", "GMT-5"). */
export function timezoneAbbr(iso: string, timeZone: string): string {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        timeZoneName: 'short',
    }).formatToParts(new Date(iso));

    return parts.find((p) => p.type === 'timeZoneName')?.value ?? timeZone;
}

/** "Fri, Jul 3" in the venue timezone. */
export function formatShortDate(iso: string, timeZone: string): string {
    const d = new Date(iso);
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    }).formatToParts(d);

    const weekday = part(parts, 'weekday');
    const month = part(parts, 'month');
    const day = part(parts, 'day');

    return `${weekday}, ${month} ${day}`;
}

/** "Friday, July 3, 2026" in the venue timezone. */
export function formatLongDate(iso: string, timeZone: string): string {
    const d = new Date(iso);
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    }).formatToParts(d);

    return `${part(parts, 'weekday')}, ${part(parts, 'month')} ${part(parts, 'day')}, ${part(parts, 'year')}`;
}

/** "Jul 2026" grouping key from a local YYYY-MM-DD string. */
export function monthKeyFromLocalDate(date: string): string {
    if (!date) {
        return 'Undated';
    }

    const [y, m] = date.split('-').map(Number);

    return `${MONTHS[m - 1]} ${y}`;
}

export function monthLabelFromLocalDate(date: string): { month: string; year: string } {
    const [y, m] = date.split('-').map(Number);

    return { month: FULL_MONTHS[m - 1], year: String(y) };
}

/** Day number + short weekday from a local YYYY-MM-DD string. */
export function dayPartsFromLocalDate(date: string): { day: number; dow: string } {
    const [y, m, d] = date.split('-').map(Number);
    const dow = DOW[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];

    return { day: d, dow };
}

/** "Fri, Jul 3" from a local YYYY-MM-DD string (filter pills, register modal). */
export function formatShortLocalDate(date: string): string {
    const [y, m, d] = date.split('-').map(Number);
    const x = new Date(Date.UTC(y, m - 1, d));

    return `${DOW[x.getUTCDay()]}, ${MONTHS[m - 1]} ${d}`;
}

/**
 * When the viewer's timezone differs from the venue, return a short hint like
 * "2:30 PM your time". Returns null when they match (or cannot be determined).
 */
export function userTimeHint(iso: string, venueTimezone: string): string | null {
    let userTimezone: string;

    try {
        userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
        return null;
    }

    if (userTimezone === venueTimezone) {
        return null;
    }

    const venueTime = localTime(iso, venueTimezone);
    const userTime = localTime(iso, userTimezone);

    if (venueTime === userTime && localDateKey(iso, venueTimezone) === localDateKey(iso, userTimezone)) {
        return null;
    }

    const formatted = new Intl.DateTimeFormat(undefined, {
        timeZone: userTimezone,
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(iso));

    return `${formatted} your time`;
}

export interface EventSchedule {
    timezone: string;
    /** YYYY-MM-DD in venue timezone — used for grouping and filters sent to the API. */
    date: string;
    /** HH:MM in venue timezone. */
    time: string;
    timezoneLabel: string;
    userTimeHint: string | null;
}

/** Build presentation fields for an event instant at a venue. */
export function buildEventSchedule(
    startISO: string | null,
    lat: number,
    lng: number,
): EventSchedule {
    if (!startISO) {
        return {
            timezone: 'UTC',
            date: '',
            time: '',
            timezoneLabel: 'UTC',
            userTimeHint: null,
        };
    }

    const timezone = resolveEventTimezone(lat, lng);

    return {
        timezone,
        date: localDateKey(startISO, timezone),
        time: localTime(startISO, timezone),
        timezoneLabel: timezoneAbbr(startISO, timezone),
        userTimeHint: userTimeHint(startISO, timezone),
    };
}
