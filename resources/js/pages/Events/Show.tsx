import { Form, Head, Link, usePage } from '@inertiajs/react';
import { Button, Card, Input, Label } from '@heroui/react';
import { Upload } from 'lucide-react';
import { EventCover } from '@/components/events/EventCover';
import InputError from '@/components/input-error';
import EventsLayout from '@/layouts/events-layout';
import { CATS, type Category } from '@/data/events-api';
import { index } from '@/routes/events';
import { login } from '@/routes';

import type { Auth } from '@/types';

interface EventDetail {
    id: string;
    name: string | null;
    type: string;
    status: string;
    created_time: number | null;
    latitude: number | null;
    longitude: number | null;
    payload: Record<string, unknown>;
    images: string[];
    can_upload: boolean;
}

export default function Show({ event }: { event: EventDetail }) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const prettyPayload = JSON.stringify(event.payload, null, 2);
    const category = event.type as Category;
    const displayEvent = {
        id: event.id,
        title: event.name ?? 'Untitled event',
        catLabel: CATS[category]?.label ?? event.type,
        category,
        catColor: CATS[category]?.color ?? '#64748b',
        images: event.images,
    };

    return (
        <EventsLayout>
            <Head title={event.name ?? `Event ${event.id}`} />

            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
                <Link
                    href={index()}
                    className="text-primary inline-flex w-fit items-center text-sm hover:underline"
                >
                    ← Back to events
                </Link>

                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {event.name ?? 'Untitled event'}
                    </h1>
                    <p className="mt-1 text-sm text-zinc-500 capitalize">
                        {event.type} · {event.status}
                    </p>
                </div>

                {event.images.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {event.images.map((src, i) => (
                            <EventCover
                                key={`${src}-${i}`}
                                event={displayEvent}
                                index={i}
                                className="aspect-[4/3] rounded-xl"
                            />
                        ))}
                    </div>
                ) : (
                    <EventCover
                        event={displayEvent}
                        className="aspect-[21/9] rounded-xl"
                    />
                )}

                {event.can_upload ? (
                    <Card className="p-5">
                        <h2 className="mb-1 text-lg font-semibold">
                            Upload images
                        </h2>
                        <p className="mb-4 text-sm text-zinc-500">
                            Add up to 5 images at a time (JPEG, PNG, WebP, GIF,
                            or SVG — max 5 MB each). Uploaded files are stored
                            locally and appear in the event listing.
                        </p>
                        <Form
                            action={`/events/${event.id}/images`}
                            method="post"
                            encType="multipart/form-data"
                            className="space-y-4"
                        >
                            {({ errors, processing }) => (
                                <>
                                    <div>
                                        <Label htmlFor="images">
                                            Choose images
                                        </Label>
                                        <Input
                                            id="images"
                                            name="images[]"
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                                            multiple
                                            required
                                            className="mt-2 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-sky-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-sky-600"
                                        />
                                        <InputError
                                            message={
                                                errors.images ??
                                                errors['images.0']
                                            }
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        isDisabled={processing}
                                        className="bg-sky-500 font-semibold text-white"
                                    >
                                        <Upload className="h-4 w-4" />
                                        {processing
                                            ? 'Uploading…'
                                            : 'Upload images'}
                                    </Button>
                                </>
                            )}
                        </Form>
                    </Card>
                ) : auth.user ? (
                    <p className="text-sm text-zinc-500">
                        Only the event organizer can upload images for this
                        event.
                    </p>
                ) : (
                    <p className="text-sm text-zinc-500">
                        <Link
                            href={login()}
                            className="font-semibold text-sky-600 hover:underline"
                        >
                            Sign in
                        </Link>{' '}
                        as the event organizer to upload images.
                    </p>
                )}

                <Card>
                    <pre className="overflow-x-auto p-4 text-xs">
                        {prettyPayload}
                    </pre>
                </Card>
            </div>
        </EventsLayout>
    );
}
