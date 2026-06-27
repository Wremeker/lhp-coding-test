import { Head, Link } from '@inertiajs/react';
import { Card } from '@heroui/react';
import EventsLayout from '@/layouts/events-layout';
import { index } from '@/routes/events';

interface EventDetail {
    id: string;
    type: string;
    status: string;
    created_time: number | null;
    latitude: number | null;
    longitude: number | null;
    payload: Record<string, unknown>;
}

export default function Show({ event }: { event: EventDetail }) {
    const prettyPayload = JSON.stringify(event.payload, null, 2);

    return (
        <EventsLayout>
            <Head title={`Event ${event.id}`} />

            <div className="flex flex-col gap-4">
                <Link
                    href={index()}
                    className="text-primary inline-flex w-fit items-center text-sm hover:underline"
                >
                    ← Back to events
                </Link>

                <h1 className="text-2xl font-semibold tracking-tight">
                    Event {event.id}
                </h1>

                <Card>
                    <pre className="overflow-x-auto p-4 text-xs">
                        {prettyPayload}
                    </pre>
                </Card>
            </div>
        </EventsLayout>
    );
}
