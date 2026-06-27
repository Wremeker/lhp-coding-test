import { useCallback, useEffect, useRef, useState } from 'react';
import {
    fetchEvents,
    type DisplayEvent,
    type EventFilters,
} from '@/data/events-api';

/** Initial page size, then smaller pages as the user scrolls. */
const INITIAL_LIMIT = 30;
const PAGE_LIMIT = 15;

interface EventFeed {
    events: DisplayEvent[];
    loading: boolean;
    loadingMore: boolean;
    error: string | null;
    hasMore: boolean;
    loadMore: () => void;
}

/**
 * Loads events for the given filters (sorted by date) and exposes a `loadMore`
 * for infinite scroll. Changing the filters resets to the first page; a request
 * generation guard drops responses from superseded filter sets.
 */
export function useEventFeed(filters: EventFilters): EventFeed {
    const [events, setEvents] = useState<DisplayEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);

    const cursorRef = useRef<string | null>(null);
    const generationRef = useRef(0);
    const loadingRef = useRef(false);

    const filterKey = JSON.stringify(filters);

    // First page (and reset) whenever the filters change.
    useEffect(() => {
        const generation = ++generationRef.current;
        loadingRef.current = true;
        setLoading(true);
        setError(null);
        const controller = new AbortController();

        fetchEvents(filters, null, INITIAL_LIMIT, controller.signal)
            .then((page) => {
                if (generation !== generationRef.current) {
                    return;
                }

                setEvents(page.data);
                cursorRef.current = page.nextCursor;
                setHasMore(page.nextCursor !== null);
                setLoading(false);
                loadingRef.current = false;
            })
            .catch((err: unknown) => {
                if (generation !== generationRef.current || controller.signal.aborted) {
                    return;
                }

                setError(err instanceof Error ? err.message : 'Failed to load events');
                setLoading(false);
                loadingRef.current = false;
            });

        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterKey]);

    const loadMore = useCallback(() => {
        if (loadingRef.current || cursorRef.current === null) {
            return;
        }

        const generation = generationRef.current;
        loadingRef.current = true;
        setLoadingMore(true);

        fetchEvents(filters, cursorRef.current, PAGE_LIMIT)
            .then((page) => {
                if (generation !== generationRef.current) {
                    return;
                }

                setEvents((prev) => [...prev, ...page.data]);
                cursorRef.current = page.nextCursor;
                setHasMore(page.nextCursor !== null);
                setLoadingMore(false);
                loadingRef.current = false;
            })
            .catch((err: unknown) => {
                if (generation !== generationRef.current) {
                    return;
                }

                setError(err instanceof Error ? err.message : 'Failed to load events');
                setLoadingMore(false);
                loadingRef.current = false;
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterKey]);

    return { events, loading, loadingMore, error, hasMore, loadMore };
}
