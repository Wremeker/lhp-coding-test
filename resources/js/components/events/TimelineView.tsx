import { Button } from '@heroui/react';
import { Check, Clock, MapPin, Tag, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    CategoryChips,
    DateRangeFilter,
    EventSearch,
    FILTER_RAIL_CLASS,
    PriceFilter,
    RegisterModal,
} from '@/components/events/controls';
import { EventCover } from '@/components/events/EventCover';
import { EventTime } from '@/components/events/EventTime';
import type { DateRange } from '@/components/events/controls';
import {
    CATEGORY_KEYS,
    CATS,
    dayParts,
    formatPrice,
    getInterest,
    locationLabel,
    monthKey,
    monthLabel,
    setInterest,
    type Category,
    type DisplayEvent,
    type EventFilters,
} from '@/data/events-api';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useEventFeed } from '@/hooks/use-event-feed';
import { cn } from '@/lib/utils';

/**
 * Event Timeline view — a vertical, month-grouped timeline with a sticky month
 * rail (jump-to + scroll-spy) and staggered card reveals. Reads the same
 * `/events/data` API as the map (filtered server-side, sorted by date): the
 * first page loads 30 events, then 15 more each time the list nears its end.
 */

const CATEGORY_OPTIONS = CATEGORY_KEYS.map((c) => ({
    value: c,
    label: CATS[c].label,
    color: CATS[c].color,
}));

interface TimelineGroup {
    key: string;
    month: string;
    year: string;
    items: DisplayEvent[];
}

export default function TimelineView() {
    const [searchInput, setSearchInput] = useState('');
    const [countryInput, setCountryInput] = useState('');
    const [cityInput, setCityInput] = useState('');
    const [priceMinInput, setPriceMinInput] = useState('');
    const [priceMaxInput, setPriceMaxInput] = useState('');
    const [range, setRange] = useState<DateRange>(null);
    const [selectedCats, setSelectedCats] = useState<Set<Category>>(new Set());

    const search = useDebouncedValue(searchInput, 350);
    const country = useDebouncedValue(countryInput, 350);
    const city = useDebouncedValue(cityInput, 350);
    const priceMin = useDebouncedValue(priceMinInput, 350);
    const priceMax = useDebouncedValue(priceMaxInput, 350);

    const filters = useMemo<EventFilters>(() => {
        const cats =
            selectedCats.size === 0 || selectedCats.size === CATEGORY_KEYS.length
                ? []
                : [...selectedCats];

        return {
            name: search,
            dateFrom: range ? range.start.toString() : null,
            dateTo: range ? range.end.toString() : null,
            country: country || null,
            city: city || null,
            categories: cats,
            priceMin: priceMin || null,
            priceMax: priceMax || null,
        };
    }, [search, range, country, city, selectedCats, priceMin, priceMax]);

    const { events, loading, loadingMore, error, hasMore, loadMore } =
        useEventFeed(filters);

    const [activeMonth, setActiveMonth] = useState<string | null>(null);
    const [registered, setRegistered] = useState<Set<string>>(new Set());
    const [modalId, setModalId] = useState<string | null>(null);

    const scrollRef = useRef<HTMLElement | null>(null);
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        setRegistered(new Set(getInterest()));
    }, []);

    const groups = useMemo<TimelineGroup[]>(() => {
        const order: string[] = [];
        const map: Record<string, DisplayEvent[]> = {};

        events.forEach((e) => {
            const k = monthKey(e.date);

            if (!map[k]) {
                map[k] = [];
                order.push(k);
            }

            map[k].push(e);
        });

        return order.map((k) => {
            const { month, year } = monthLabel(map[k][0].date);

            return { key: k, month, year, items: map[k] };
        });
    }, [events]);

    const modalEvent = useMemo<DisplayEvent | null>(
        () => events.find((e) => e.id === modalId) ?? null,
        [events, modalId],
    );

    function onRangeChange(next: DateRange) {
        setRange(next);
    }

    function toggleCat(value: string) {
        setSelectedCats((prev) => {
            const next = new Set(prev);

            if (next.has(value as Category)) {
                next.delete(value as Category);
            } else {
                next.add(value as Category);
            }

            return next;
        });
    }

    function clearFilters() {
        setSearchInput('');
        setCountryInput('');
        setCityInput('');
        setPriceMinInput('');
        setPriceMaxInput('');
        setRange(null);
        setSelectedCats(new Set());
    }

    const activeFilterCount =
        (search ? 1 : 0) +
        (range ? 1 : 0) +
        (country ? 1 : 0) +
        (city ? 1 : 0) +
        (priceMin || priceMax ? 1 : 0) +
        (filters.categories && filters.categories.length > 0 ? 1 : 0);

    // Keep the rail's active month in sync with the scroll position.
    function onScroll() {
        const sc = scrollRef.current;

        if (!sc) {
            return;
        }

        let current: string | null = null;
        const top = sc.scrollTop;
        sc.querySelectorAll<HTMLElement>('[data-month]').forEach((h) => {
            if (h.offsetTop - 60 <= top) {
                current = h.getAttribute('data-month');
            }
        });

        if (current && current !== activeMonth) {
            setActiveMonth(current);
        }
    }

    function jumpTo(key: string) {
        const sc = scrollRef.current;

        if (!sc) {
            return;
        }

        const el = sc.querySelector<HTMLElement>(`[data-month="${key}"]`);

        if (!el) {
            return;
        }

        const reduce = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;
        sc.scrollTo({
            top: el.offsetTop - 12,
            behavior: reduce ? 'auto' : 'smooth',
        });
    }

    // Infinite scroll: load the next page when the sentinel nears the viewport.
    useEffect(() => {
        const sentinel = sentinelRef.current;
        const root = scrollRef.current;

        if (!sentinel || !root) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting && hasMore && !loadingMore) {
                    loadMore();
                }
            },
            { root, rootMargin: '300px' },
        );
        observer.observe(sentinel);

        return () => observer.disconnect();
    }, [hasMore, loadingMore, loadMore]);

    function registerInterest(id: string) {
        const next = getInterest();

        if (!next.includes(id)) {
            next.push(id);
        }

        setInterest(next);
        setRegistered(new Set(next));
    }

    return (
        <>
            <div className="flex min-h-0 flex-1 flex-col md:flex-row">
                {/* LEFT RAIL — filters + month jump-to */}
                <aside className={`flex w-full flex-none flex-col border-b border-black/[0.07] bg-white md:overflow-y-auto md:border-b-0 ${FILTER_RAIL_CLASS}`}>
                    <div className="p-[22px] pb-4">
                        <h1 className="mb-1 text-[22px] font-extrabold tracking-tight">
                            What's on
                        </h1>
                        <p className="mb-[18px] text-[13px] font-semibold text-zinc-400">
                            {loading
                                ? 'Loading…'
                                : `${events.length}${hasMore ? '+' : ''} events`}
                        </p>

                        <div className="mb-3">
                            <EventSearch
                                value={searchInput}
                                onChange={setSearchInput}
                                placeholder="Search by event name"
                            />
                        </div>

                        <div className="mb-2.5">
                            <DateRangeFilter
                                value={range}
                                onChange={onRangeChange}
                            />
                        </div>

                        <div className="mb-2.5 flex gap-2">
                            <EventSearch
                                value={countryInput}
                                onChange={setCountryInput}
                                placeholder="Country"
                            />
                            <EventSearch
                                value={cityInput}
                                onChange={setCityInput}
                                placeholder="City"
                            />
                        </div>

                        <div className="mb-3.5">
                            <PriceFilter
                                min={priceMinInput}
                                max={priceMaxInput}
                                onChange={({ min, max }) => {
                                    if (min !== undefined) {
                                        setPriceMinInput(min);
                                    }

                                    if (max !== undefined) {
                                        setPriceMaxInput(max);
                                    }
                                }}
                            />
                        </div>

                        <CategoryChips
                            options={CATEGORY_OPTIONS}
                            selected={selectedCats}
                            onToggle={toggleCat}
                        />

                        {activeFilterCount > 0 && (
                            <button
                                onClick={clearFilters}
                                className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-zinc-500 transition-colors hover:text-zinc-800"
                            >
                                <X className="h-3.5 w-3.5" />
                                Clear all filters
                            </button>
                        )}
                    </div>

                    {/* Month "jump to" rail — desktop only */}
                    <div className="mx-[22px] mt-1 mb-3.5 hidden h-px bg-black/[0.07] md:block" />

                    <div className="hidden px-3.5 pb-[22px] md:block">
                        <div className="px-2 pb-2 text-[11px] font-extrabold tracking-widest text-zinc-400 uppercase">
                            Jump to
                        </div>
                        {groups.map((g) => {
                            const active = g.key === activeMonth;

                            return (
                                <button
                                    key={g.key}
                                    onClick={() => jumpTo(g.key)}
                                    className={cn(
                                        'mb-0.5 flex w-full items-center justify-between rounded-[10px] px-3 py-[9px] transition-colors',
                                        active
                                            ? 'bg-sky-500/10'
                                            : 'bg-transparent',
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'flex items-center gap-[9px] text-[13.5px] font-bold',
                                            active
                                                ? 'text-sky-700'
                                                : 'text-zinc-600',
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                'h-[7px] w-[7px] rounded-full transition-all',
                                                active
                                                    ? 'bg-sky-500'
                                                    : 'bg-zinc-300',
                                            )}
                                        />
                                        {g.month} {g.year}
                                    </span>
                                    <span className="text-[12px] font-bold text-zinc-400">
                                        {g.items.length}
                                        {hasMore ? '+' : ''}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </aside>

                {/* TIMELINE */}
                <main
                    ref={scrollRef}
                    onScroll={onScroll}
                    className="relative min-w-0 flex-1 overflow-y-auto"
                >
                    <div className="mx-auto max-w-[840px] px-4 pt-[30px] pb-[120px] sm:px-10">
                        {error && (
                            <div className="px-5 py-[90px] text-center">
                                <div className="text-[16px] font-bold text-red-500">
                                    {error}
                                </div>
                            </div>
                        )}

                        {loading && (
                            <div className="space-y-[22px]">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="flex animate-pulse items-stretch gap-3 sm:gap-5"
                                    >
                                        <div className="w-[58px] flex-none" />
                                        <div className="h-32 flex-1 rounded-[20px] bg-zinc-100" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {!loading && groups.length === 0 && !error && (
                            <div className="px-5 py-[90px] text-center text-zinc-400">
                                <div className="text-[17px] font-bold text-zinc-500">
                                    No events match your filters
                                </div>
                                <Button
                                    variant="primary"
                                    onPress={clearFilters}
                                    className="mt-4 rounded-[11px] bg-sky-500 font-bold text-white"
                                >
                                    Reset filters
                                </Button>
                            </div>
                        )}

                        {!loading &&
                            groups.map((g) => (
                                <section key={g.key} data-month={g.key}>
                                    <div className="sticky top-0 z-10 mb-1.5 flex items-baseline gap-3.5 bg-gradient-to-b from-zinc-100 from-[72%] to-transparent py-3.5">
                                        <h2 className="text-[27px] font-extrabold tracking-tight">
                                            {g.month}
                                        </h2>
                                        <span className="text-sm font-bold text-zinc-400">
                                            {g.year}
                                        </span>
                                        <span className="ml-auto rounded-full bg-sky-500/10 px-[11px] py-1 text-[12.5px] font-bold text-sky-500">
                                            {g.items.length}
                                            {hasMore ? '+' : ''} events
                                        </span>
                                    </div>

                                    {g.items.map((e, idx) => {
                                        const { day, dow } = dayParts(e.date);
                                        const interested = registered.has(e.id);

                                        return (
                                            <div
                                                key={e.id}
                                                className="animate-evt-reveal-up mb-[22px] flex items-stretch gap-3 [animation-delay:var(--reveal-delay)] sm:gap-5"
                                                style={
                                                    {
                                                        '--reveal-delay': `${Math.min(idx, 6) * 85}ms`,
                                                    } as React.CSSProperties
                                                }
                                            >
                                                {/* spine */}
                                                <div className="relative flex w-[58px] flex-none flex-col items-center">
                                                    <div className="absolute top-0 bottom-[-22px] w-0.5 bg-black/[0.08]" />
                                                    <div className="relative z-[1] mt-[30px] bg-zinc-100 py-1 text-center">
                                                        <div className="text-[21px] leading-none font-extrabold tracking-tight">
                                                            {day}
                                                        </div>
                                                        <div className="mt-0.5 text-[10.5px] font-bold tracking-wide text-zinc-400 uppercase">
                                                            {dow}
                                                        </div>
                                                        <div
                                                            className="mx-auto mt-[9px] h-[13px] w-[13px] rounded-full border-[3px] border-white bg-[color:var(--cat-color)] shadow-[0_0_0_2px_var(--cat-color)]"
                                                            style={
                                                                {
                                                                    '--cat-color':
                                                                        e.catColor,
                                                                } as React.CSSProperties
                                                            }
                                                        />
                                                    </div>
                                                </div>

                                                {/* card */}
                                                <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[20px] border border-black/[0.05] bg-white shadow-[0_4px_18px_rgba(0,0,0,.06)] transition-all hover:-translate-y-[3px] hover:shadow-[0_16px_38px_rgba(0,0,0,.12)] sm:flex-row">
                                                    <EventCover
                                                        event={e}
                                                        className="h-28 w-full flex-none sm:h-auto sm:w-[228px]"
                                                    >
                                                        <span className="absolute top-3.5 left-3.5 rounded-lg bg-black/30 px-2.5 py-1 text-[10.5px] font-extrabold tracking-wider text-white uppercase backdrop-blur-sm">
                                                            {e.catLabel}
                                                        </span>
                                                        <span className="absolute right-3.5 bottom-3 rounded-lg bg-black/30 px-2.5 py-1 text-[11px] font-extrabold text-white backdrop-blur-sm">
                                                            {formatPrice(e.price)}
                                                        </span>
                                                    </EventCover>
                                                    <div className="flex min-w-0 flex-1 flex-col p-[20px_22px]">
                                                        <div className="mb-[7px] flex flex-wrap items-center gap-2 text-[13px] font-bold text-sky-700">
                                                            <Clock className="h-[15px] w-[15px]" />
                                                            <EventTime
                                                                event={e}
                                                                showUserHint
                                                                hintClassName="font-normal text-zinc-400"
                                                            />
                                                        </div>
                                                        <h3 className="mb-[7px] text-[21px] leading-tight font-extrabold tracking-tight">
                                                            {e.title}
                                                        </h3>
                                                        <div className="mb-2.5 flex items-center gap-1.5 text-[13px] font-semibold text-zinc-500">
                                                            <MapPin className="h-3.5 w-3.5 flex-none text-zinc-400" />
                                                            <span className="truncate">
                                                                {locationLabel(e)}
                                                            </span>
                                                        </div>
                                                        <div className="mb-4 flex items-center gap-1.5 text-[13px] font-semibold text-zinc-500">
                                                            <Tag className="h-3.5 w-3.5 flex-none text-zinc-400" />
                                                            {formatPrice(e.price)}
                                                        </div>
                                                        <div className="mt-auto">
                                                            {interested ? (
                                                                <span className="inline-flex h-10 items-center gap-[7px] rounded-[11px] bg-green-100 px-4 text-[13.5px] font-extrabold text-green-700">
                                                                    <Check className="h-4 w-4" />
                                                                    You're on the
                                                                    list
                                                                </span>
                                                            ) : (
                                                                <Button
                                                                    variant="primary"
                                                                    onPress={() =>
                                                                        setModalId(
                                                                            e.id,
                                                                        )
                                                                    }
                                                                    className="h-10 rounded-[11px] bg-sky-500 text-[13.5px] font-extrabold text-white shadow-lg shadow-sky-500/30"
                                                                >
                                                                    Register
                                                                    interest
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </section>
                            ))}

                        {/* Infinite-scroll sentinel + loader */}
                        <div ref={sentinelRef} className="h-1 w-full" />
                        {loadingMore && (
                            <div className="py-6 text-center text-[13px] font-semibold text-zinc-400">
                                Loading more…
                            </div>
                        )}
                    </div>
                </main>
            </div>

            <RegisterModal
                event={modalEvent}
                onClose={() => setModalId(null)}
                onRegistered={registerInterest}
            />
        </>
    );
}
