import { Button } from '@heroui/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Calendar, Check, Clock, MapPin, Tag, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    CategoryChips,
    DateRangeFilter,
    EventSearch,
    FILTER_RAIL_CLASS,
    PriceFilter,
    RegisterModal,
} from '@/components/events/controls';
import type { DateRange } from '@/components/events/controls';
import {
    CATEGORY_KEYS,
    CATS,
    fmtLongISO,
    formatPrice,
    getInterest,
    locationLabel,
    setInterest,
    type Category,
    type DisplayEvent,
    type EventFilters,
} from '@/data/events-api';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useEventFeed } from '@/hooks/use-event-feed';

/**
 * Event Map view — a full-bleed Leaflet map with a filterable sidebar and an
 * infinite-scroll event list. Events come from the `/events/data` API (filtered
 * server-side, sorted by date, keyset-paginated): the first page loads 30, then
 * 15 more each time the list is scrolled to the bottom. Current (upcoming)
 * events are shown on the map as small dots by default.
 */

const CATEGORY_OPTIONS = CATEGORY_KEYS.map((c) => ({
    value: c,
    label: CATS[c].label,
    color: CATS[c].color,
}));

export default function MapView() {
    // Raw inputs (debounced before they become query filters).
    const [searchInput, setSearchInput] = useState('');
    const [countryInput, setCountryInput] = useState('');
    const [cityInput, setCityInput] = useState('');
    const [priceMinInput, setPriceMinInput] = useState('');
    const [priceMaxInput, setPriceMaxInput] = useState('');

    // Applied-immediately inputs.
    const [range, setRange] = useState<DateRange>(null);
    const [selectedCats, setSelectedCats] = useState<Set<Category>>(new Set());

    const search = useDebouncedValue(searchInput, 350);
    const country = useDebouncedValue(countryInput, 350);
    const city = useDebouncedValue(cityInput, 350);
    const priceMin = useDebouncedValue(priceMinInput, 350);
    const priceMax = useDebouncedValue(priceMaxInput, 350);

    const filters = useMemo<EventFilters>(() => {
        // Empty or full selection means "no category filter" (all categories).
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

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [hoverId, setHoverId] = useState<string | null>(null);
    const [galleryIndex, setGalleryIndex] = useState(0);
    const [registered, setRegistered] = useState<Set<string>>(new Set());
    const [modalId, setModalId] = useState<string | null>(null);

    const mapEl = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markersRef = useRef<Record<string, L.Marker>>({});
    const listRef = useRef<HTMLDivElement | null>(null);
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        setRegistered(new Set(getInterest()));
    }, []);

    const selected = useMemo<DisplayEvent | null>(
        () => events.find((e) => e.id === selectedId) ?? null,
        [events, selectedId],
    );
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

    // --- map init ---
    useEffect(() => {
        if (!mapEl.current || mapRef.current) {
            return;
        }

        const map = L.map(mapEl.current, {
            zoomControl: true,
            minZoom: 2,
            maxBounds: [
                [-85, -180],
                [85, 180],
            ],
            maxBoundsViscosity: 1,
        }).setView([35, 5], 3);
        L.tileLayer(
            'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
            {
                attribution: '© OpenStreetMap, © CARTO',
                subdomains: 'abcd',
                maxZoom: 19,
                noWrap: true,
            },
        ).addTo(map);
        mapRef.current = map;
        setTimeout(() => map.invalidateSize(), 120);

        const onResize = () => map.invalidateSize();
        window.addEventListener('resize', onResize);

        return () => {
            window.removeEventListener('resize', onResize);
            map.remove();
            mapRef.current = null;
        };
    }, []);

    // --- sync markers with the loaded events (small dots) ---
    useEffect(() => {
        const map = mapRef.current;

        if (!map) {
            return;
        }

        const markers = markersRef.current;
        const wanted = new Set(events.map((e) => e.id));

        Object.keys(markers).forEach((id) => {
            if (!wanted.has(id)) {
                map.removeLayer(markers[id]);
                delete markers[id];
            }
        });

        events.forEach((e) => {
            if (markers[e.id]) {
                return;
            }

            const icon = L.divIcon({
                className: '',
                iconSize: [12, 12],
                iconAnchor: [6, 6],
                html: `<div class="cmarker" style="width:12px;height:12px;border-radius:50%;background:${e.catColor};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>`,
            });
            const marker = L.marker([e.lat, e.lng], { icon }).addTo(map);
            marker.on('click', () => selectEvent(e.id));
            markers[e.id] = marker;
        });
        styleMarkers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [events]);

    const styleMarkers = () => {
        const markers = markersRef.current;
        Object.keys(markers).forEach((id) => {
            const el = markers[id].getElement();

            if (!el) {
                return;
            }

            const inner = el.firstElementChild as HTMLElement | null;
            const sel = id === selectedId;
            const hov = id === hoverId;
            el.style.zIndex = sel ? '1000' : hov ? '900' : '';

            if (inner) {
                inner.style.transform = sel
                    ? 'scale(2)'
                    : hov
                      ? 'scale(1.55)'
                      : 'scale(1)';
                inner.style.boxShadow = sel
                    ? '0 0 0 6px rgba(14,165,233,.22), 0 1px 4px rgba(0,0,0,.35)'
                    : '0 1px 4px rgba(0,0,0,.35)';
            }
        });
    };
    useEffect(styleMarkers, [selectedId, hoverId]);

    // --- infinite scroll: load the next page when the sentinel comes into view ---
    useEffect(() => {
        const sentinel = sentinelRef.current;
        const root = listRef.current;

        if (!sentinel || !root) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting && hasMore && !loadingMore) {
                    loadMore();
                }
            },
            { root, rootMargin: '200px' },
        );
        observer.observe(sentinel);

        return () => observer.disconnect();
    }, [hasMore, loadingMore, loadMore]);

    function selectEvent(id: string) {
        setSelectedId(id);
        setGalleryIndex(0);
        const e = events.find((x) => x.id === id);

        if (mapRef.current && e) {
            mapRef.current.flyTo([e.lat, e.lng], 6, { duration: 1.1 });
        }
    }

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
                {/* SIDEBAR */}
                <aside className={`order-2 flex min-h-0 w-full flex-1 flex-col border-t border-black/[0.07] bg-white md:order-none md:flex-none md:border-t-0 ${FILTER_RAIL_CLASS}`}>
                    <div className="border-b border-black/[0.06] p-5 pb-3.5">
                        <div className="mb-3.5 flex items-baseline justify-between">
                            <h1 className="text-[21px] font-extrabold tracking-tight">
                                Explore events
                            </h1>
                            <span className="text-[13px] font-bold text-sky-500">
                                {loading
                                    ? 'Loading…'
                                    : `${events.length}${hasMore ? '+' : ''} shown`}
                            </span>
                        </div>

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

                        <div className="mb-2.5">
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

                    {/* LIST */}
                    <div
                        ref={listRef}
                        className="min-h-0 flex-1 overflow-y-auto px-3 pt-2.5 pb-6"
                    >
                        {error && (
                            <div className="px-5 py-10 text-center">
                                <div className="text-[14px] font-bold text-red-500">
                                    {error}
                                </div>
                            </div>
                        )}

                        {loading &&
                            Array.from({ length: 6 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="mb-1 flex animate-pulse gap-3 rounded-2xl p-2.5"
                                >
                                    <div className="h-16 w-16 flex-none rounded-[11px] bg-zinc-100" />
                                    <div className="flex flex-1 flex-col justify-center gap-2">
                                        <div className="h-3 w-1/3 rounded bg-zinc-100" />
                                        <div className="h-4 w-2/3 rounded bg-zinc-100" />
                                        <div className="h-3 w-1/2 rounded bg-zinc-100" />
                                    </div>
                                </div>
                            ))}

                        {!loading &&
                            events.map((e) => {
                                const sel = e.id === selectedId;
                                const hov = e.id === hoverId;

                                return (
                                    <div
                                        key={e.id}
                                        onClick={() => selectEvent(e.id)}
                                        onMouseEnter={() => setHoverId(e.id)}
                                        onMouseLeave={() => setHoverId(null)}
                                        className="mb-1 flex cursor-pointer gap-3 rounded-2xl border-[1.5px] p-2.5 transition-all"
                                        style={{
                                            background: sel
                                                ? 'rgba(14,165,233,.08)'
                                                : hov
                                                  ? '#f8fafc'
                                                  : '#fff',
                                            borderColor: sel
                                                ? 'rgba(14,165,233,.55)'
                                                : hov
                                                  ? 'rgba(0,0,0,.1)'
                                                  : 'transparent',
                                        }}
                                    >
                                        <div
                                            className="relative h-16 w-16 flex-none overflow-hidden rounded-[11px] ring-1 ring-black/[0.04] ring-inset"
                                            style={{ background: e.covers[0] }}
                                        >
                                            <span className="absolute top-1.5 left-1.5 rounded-md bg-black/30 px-1.5 py-0.5 text-[9px] font-extrabold tracking-wide text-white uppercase backdrop-blur-sm">
                                                {e.catLabel}
                                            </span>
                                        </div>
                                        <div className="flex min-w-0 flex-1 flex-col justify-center">
                                            <div className="flex items-center gap-1.5">
                                                <span
                                                    className="text-[11.5px] font-bold"
                                                    style={{ color: e.catColor }}
                                                >
                                                    {e.date}
                                                </span>
                                                <span className="text-[11.5px] font-semibold text-zinc-400">
                                                    · {e.time} UTC
                                                </span>
                                                <span className="ml-auto text-[11.5px] font-bold text-zinc-700">
                                                    {formatPrice(e.price)}
                                                </span>
                                            </div>
                                            <div className="my-0.5 truncate text-[15px] font-extrabold tracking-tight">
                                                {e.title}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-zinc-500">
                                                <MapPin className="h-3 w-3 flex-none text-zinc-400" />
                                                <span className="truncate">
                                                    {locationLabel(e)}
                                                </span>
                                                {registered.has(e.id) && (
                                                    <span className="ml-auto flex-none text-[11px] font-extrabold text-green-600">
                                                        ✓ On list
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                        {!loading && events.length === 0 && !error && (
                            <div className="px-5 py-12 text-center text-zinc-400">
                                <div className="text-[15px] font-bold text-zinc-500">
                                    No events match
                                </div>
                                <div className="mt-1 text-[13px]">
                                    Try clearing a filter.
                                </div>
                                <Button
                                    variant="primary"
                                    onPress={clearFilters}
                                    className="mt-3.5 rounded-[10px] bg-sky-500 font-bold text-white"
                                >
                                    Reset filters
                                </Button>
                            </div>
                        )}

                        {/* Infinite-scroll sentinel + loader */}
                        <div ref={sentinelRef} className="h-1 w-full" />
                        {loadingMore && (
                            <div className="py-4 text-center text-[12.5px] font-semibold text-zinc-400">
                                Loading more…
                            </div>
                        )}
                    </div>
                </aside>

                {/* MAP */}
                <div className="relative order-1 h-[45vh] min-w-0 flex-none md:order-none md:h-auto md:flex-1">
                    <div ref={mapEl} className="absolute inset-0" />

                    {activeFilterCount > 0 && (
                        <div className="absolute top-4 left-4 z-[500] hidden rounded-xl border border-black/[0.07] bg-white/90 px-3 py-2 text-[12.5px] font-bold text-zinc-600 shadow-lg backdrop-blur-md sm:block">
                            {activeFilterCount} filter
                            {activeFilterCount > 1 ? 's' : ''} active
                        </div>
                    )}

                    {/* DETAIL CARD */}
                    {selected && (
                        <div
                            key={selected.id}
                            className="evt-pop absolute right-3 bottom-[22px] left-3 z-[600] overflow-hidden rounded-[20px] bg-white shadow-2xl sm:right-auto sm:left-5 sm:w-[344px]"
                        >
                            <div
                                className="relative h-[150px]"
                                style={{
                                    background:
                                        selected.covers[
                                            Math.min(
                                                galleryIndex,
                                                selected.covers.length - 1,
                                            )
                                        ],
                                }}
                            >
                                <Button
                                    isIconOnly
                                    variant="ghost"
                                    onPress={() => setSelectedId(null)}
                                    aria-label="Close"
                                    className="absolute top-3 right-3 h-[30px] w-[30px] rounded-full bg-black/30 text-white backdrop-blur-sm"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                                <span className="absolute top-3.5 left-3.5 rounded-lg bg-black/30 px-2.5 py-1 text-[11px] font-extrabold tracking-wider text-white uppercase backdrop-blur-sm">
                                    {selected.catLabel}
                                </span>
                                {selected.covers.length > 1 && (
                                    <div className="absolute right-0 bottom-2.5 left-0 flex justify-center gap-1.5">
                                        {selected.covers.map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() =>
                                                    setGalleryIndex(i)
                                                }
                                                aria-label={`Image ${i + 1}`}
                                                className="h-[7px] rounded-full transition-all"
                                                style={{
                                                    width:
                                                        i === galleryIndex
                                                            ? '20px'
                                                            : '7px',
                                                    background:
                                                        i === galleryIndex
                                                            ? '#fff'
                                                            : 'rgba(255,255,255,.5)',
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="px-[18px] pt-4 pb-[18px]">
                                <h2 className="mb-2 text-xl leading-tight font-extrabold tracking-tight">
                                    {selected.title}
                                </h2>
                                <div className="mb-1.5 flex items-center gap-2 text-[13.5px] font-bold text-sky-700">
                                    <Calendar className="h-[15px] w-[15px]" />
                                    {fmtLongISO(selected.startISO)}
                                </div>
                                <div className="mb-1.5 flex items-center gap-2 text-[13px] font-semibold text-zinc-600">
                                    <Clock className="h-[15px] w-[15px] text-zinc-400" />
                                    {selected.time}{' '}
                                    <span className="text-zinc-400">·</span> UTC
                                </div>
                                <div className="mb-1.5 flex items-center gap-2 text-[13px] font-semibold text-zinc-600">
                                    <MapPin className="h-[15px] w-[15px] text-zinc-400" />
                                    {locationLabel(selected)}
                                </div>
                                <div className="mb-4 flex items-center gap-2 text-[13px] font-semibold text-zinc-600">
                                    <Tag className="h-[15px] w-[15px] text-zinc-400" />
                                    {formatPrice(selected.price)}
                                </div>

                                {registered.has(selected.id) ? (
                                    <div className="flex h-[46px] items-center justify-center gap-2 rounded-[13px] bg-green-100 text-[14.5px] font-extrabold text-green-700">
                                        <Check className="h-[18px] w-[18px]" />
                                        You're on the list
                                    </div>
                                ) : (
                                    <Button
                                        variant="primary"
                                        fullWidth
                                        onPress={() => setModalId(selected.id)}
                                        className="h-[46px] rounded-[13px] bg-sky-500 text-[14.5px] font-extrabold text-white shadow-lg shadow-sky-500/30"
                                    >
                                        Register interest
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <RegisterModal
                event={modalEvent}
                onClose={() => setModalId(null)}
                onRegistered={registerInterest}
            />
        </>
    );
}
