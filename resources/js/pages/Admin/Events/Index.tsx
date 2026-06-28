import { Head, Link, router } from '@inertiajs/react';
import { Button, Input, Label } from '@heroui/react';
import { Pencil, Search } from 'lucide-react';
import { FormEvent, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { index as eventsIndex } from '@/routes/events';

interface AdminEventRow {
    id: string;
    name: string | null;
    type: string;
    status: string;
    start_at: string | null;
    city: string | null;
    country: string | null;
    price: number | null;
    images_count: number;
}

interface PaginatedEvents {
    data: AdminEventRow[];
    current_page: number;
    last_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

export default function Index({
    events,
    filters,
    statuses,
}: {
    events: PaginatedEvents;
    filters: { search: string; status: string };
    statuses: string[];
    categories: string[];
}) {
    const [search, setSearch] = useState(filters.search);
    const [status, setStatus] = useState(filters.status);

    function applyFilters(e?: FormEvent) {
        e?.preventDefault();
        router.get(
            '/admin/events',
            {
                search: search || undefined,
                status: status || undefined,
            },
            { preserveState: true, replace: true },
        );
    }

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Browse events', href: eventsIndex() },
                { title: 'Manage events', href: '/admin/events' },
            ]}
        >
            <Head title="Manage events" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight">
                            Manage events
                        </h1>
                        <p className="text-sm text-zinc-500">
                            {events.total.toLocaleString()} events in the
                            database
                        </p>
                    </div>
                    <Link
                        href="/events"
                        className="text-sm font-semibold text-sky-600 hover:underline"
                    >
                        View public listing →
                    </Link>
                </div>

                <form
                    onSubmit={applyFilters}
                    className="flex flex-col gap-3 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm sm:flex-row sm:items-end"
                >
                    <div className="flex-1">
                        <Label htmlFor="search">Search by name</Label>
                        <Input
                            id="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Annual Jazz Festival…"
                            className="mt-1 w-full"
                        />
                    </div>
                    <div className="sm:w-44">
                        <Label htmlFor="status">Status</Label>
                        <select
                            id="status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm"
                        >
                            <option value="">All statuses</option>
                            {statuses.map((s) => (
                                <option key={s} value={s}>
                                    {s.replace('_', ' ')}
                                </option>
                            ))}
                        </select>
                    </div>
                    <Button
                        type="submit"
                        variant="primary"
                        className="bg-zinc-900 font-semibold text-white"
                    >
                        <Search className="h-4 w-4" />
                        Filter
                    </Button>
                </form>

                <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-zinc-50 text-left text-xs font-bold tracking-wide text-zinc-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3">Event</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Starts</th>
                                    <th className="px-4 py-3">Location</th>
                                    <th className="px-4 py-3">Imgs</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody>
                                {events.data.map((event) => (
                                    <tr
                                        key={event.id}
                                        className="border-t border-black/[0.05] hover:bg-zinc-50/80"
                                    >
                                        <td className="max-w-[220px] truncate px-4 py-3 font-semibold text-zinc-900">
                                            {event.name ?? 'Untitled'}
                                        </td>
                                        <td className="px-4 py-3 capitalize text-zinc-600">
                                            {event.type}
                                        </td>
                                        <td className="px-4 py-3 capitalize text-zinc-600">
                                            {event.status.replace('_', ' ')}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-zinc-600">
                                            {event.start_at
                                                ? new Date(
                                                      event.start_at,
                                                  ).toLocaleDateString()
                                                : '—'}
                                        </td>
                                        <td className="max-w-[160px] truncate px-4 py-3 text-zinc-600">
                                            {[event.city, event.country]
                                                .filter(Boolean)
                                                .join(', ') || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-zinc-600">
                                            {event.images_count}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Link
                                                href={`/admin/events/${event.id}/edit`}
                                                className="inline-flex items-center gap-1 font-bold text-sky-600 hover:underline"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                                Edit
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {events.last_page > 1 && (
                        <div className="flex flex-wrap gap-2 border-t border-black/[0.06] px-4 py-3">
                            {events.links.map((link, i) =>
                                link.url ? (
                                    <Link
                                        key={i}
                                        href={link.url}
                                        className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                                            link.active
                                                ? 'bg-zinc-900 text-white'
                                                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                                        }`}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ) : (
                                    <span
                                        key={i}
                                        className="rounded-lg px-3 py-1.5 text-xs font-bold text-zinc-300"
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ),
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
