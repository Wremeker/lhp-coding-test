import { Form, Head, Link, router } from '@inertiajs/react';
import { Button, Card, Input, Label, TextArea } from '@heroui/react';
import { Trash2, Upload } from 'lucide-react';
import { EventCover } from '@/components/events/EventCover';
import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import { CATS, type Category } from '@/data/events-api';
import { index as eventsIndex } from '@/routes/events';

interface EventImageRow {
    id: number;
    path: string;
    sort_order: number;
}

interface AdminEvent {
    id: string;
    name: string | null;
    description: string;
    type: string;
    status: string;
    start_at: string | null;
    end_at: string | null;
    price: string | number | null;
    latitude: number | null;
    longitude: number | null;
    address: string | null;
    city: string | null;
    country: string | null;
    images: EventImageRow[];
}

export default function Edit({
    event,
    categories,
    statuses,
}: {
    event: AdminEvent;
    categories: string[];
    statuses: string[];
}) {
    const category = event.type as Category;
    const displayEvent = {
        id: event.id,
        title: event.name ?? 'Untitled event',
        catLabel: CATS[category]?.label ?? event.type,
        category,
        catColor: CATS[category]?.color ?? '#64748b',
        images: event.images.map((img) => img.path),
    };

    function deleteImage(imageId: number) {
        if (!confirm('Remove this image?')) {
            return;
        }

        router.delete(`/admin/events/${event.id}/images/${imageId}`, {
            preserveScroll: true,
        });
    }

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Browse events', href: eventsIndex() },
                { title: 'Manage events', href: '/admin/events' },
                {
                    title: event.name ?? 'Edit event',
                    href: `/admin/events/${event.id}/edit`,
                },
            ]}
        >
            <Head title={`Edit — ${event.name ?? event.id}`} />

            <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight">
                            {event.name ?? 'Untitled event'}
                        </h1>
                        <p className="text-sm text-zinc-500">
                            Update details, location, and images.
                        </p>
                    </div>
                    <div className="flex gap-3 text-sm font-semibold">
                        <Link
                            href={`/events/${event.id}`}
                            className="text-sky-600 hover:underline"
                        >
                            Public page
                        </Link>
                        <Link
                            href="/admin/events"
                            className="text-zinc-500 hover:underline"
                        >
                            Back to list
                        </Link>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <Card className="p-5">
                        <h2 className="mb-4 text-lg font-bold">Event details</h2>
                        <Form
                            action={`/admin/events/${event.id}`}
                            method="put"
                            className="space-y-4"
                        >
                            {({ errors, processing }) => (
                                <>
                                    <div>
                                        <Label htmlFor="name">Name</Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            defaultValue={event.name ?? ''}
                                            required
                                            className="mt-1 w-full"
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div>
                                        <Label htmlFor="description">
                                            Description
                                        </Label>
                                        <TextArea
                                            id="description"
                                            name="description"
                                            defaultValue={event.description}
                                            rows={4}
                                            className="mt-1 w-full"
                                        />
                                        <InputError
                                            message={errors.description}
                                        />
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <Label htmlFor="type">
                                                Category
                                            </Label>
                                            <select
                                                id="type"
                                                name="type"
                                                defaultValue={event.type}
                                                className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm"
                                            >
                                                {categories.map((c) => (
                                                    <option key={c} value={c}>
                                                        {c}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError message={errors.type} />
                                        </div>
                                        <div>
                                            <Label htmlFor="status">
                                                Status
                                            </Label>
                                            <select
                                                id="status"
                                                name="status"
                                                defaultValue={event.status}
                                                className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm"
                                            >
                                                {statuses.map((s) => (
                                                    <option key={s} value={s}>
                                                        {s.replace('_', ' ')}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError
                                                message={errors.status}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <Label htmlFor="start_at">
                                                Starts
                                            </Label>
                                            <Input
                                                id="start_at"
                                                name="start_at"
                                                type="datetime-local"
                                                defaultValue={
                                                    event.start_at ?? ''
                                                }
                                                required
                                                className="mt-1 w-full"
                                            />
                                            <InputError
                                                message={errors.start_at}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="end_at">Ends</Label>
                                            <Input
                                                id="end_at"
                                                name="end_at"
                                                type="datetime-local"
                                                defaultValue={event.end_at ?? ''}
                                                className="mt-1 w-full"
                                            />
                                            <InputError message={errors.end_at} />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="price">
                                            Price (USD)
                                        </Label>
                                        <Input
                                            id="price"
                                            name="price"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            defaultValue={
                                                event.price?.toString() ?? ''
                                            }
                                            className="mt-1 w-full"
                                        />
                                        <InputError message={errors.price} />
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <Label htmlFor="latitude">
                                                Latitude
                                            </Label>
                                            <Input
                                                id="latitude"
                                                name="latitude"
                                                type="number"
                                                step="any"
                                                defaultValue={
                                                    event.latitude?.toString() ??
                                                    ''
                                                }
                                                className="mt-1 w-full"
                                            />
                                            <InputError
                                                message={errors.latitude}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="longitude">
                                                Longitude
                                            </Label>
                                            <Input
                                                id="longitude"
                                                name="longitude"
                                                type="number"
                                                step="any"
                                                defaultValue={
                                                    event.longitude?.toString() ??
                                                    ''
                                                }
                                                className="mt-1 w-full"
                                            />
                                            <InputError
                                                message={errors.longitude}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="address">Address</Label>
                                        <Input
                                            id="address"
                                            name="address"
                                            defaultValue={event.address ?? ''}
                                            className="mt-1 w-full"
                                        />
                                        <InputError message={errors.address} />
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <Label htmlFor="city">City</Label>
                                            <Input
                                                id="city"
                                                name="city"
                                                defaultValue={event.city ?? ''}
                                                className="mt-1 w-full"
                                            />
                                            <InputError message={errors.city} />
                                        </div>
                                        <div>
                                            <Label htmlFor="country">
                                                Country
                                            </Label>
                                            <Input
                                                id="country"
                                                name="country"
                                                defaultValue={
                                                    event.country ?? ''
                                                }
                                                className="mt-1 w-full"
                                            />
                                            <InputError
                                                message={errors.country}
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        isDisabled={processing}
                                        className="bg-zinc-900 font-semibold text-white"
                                    >
                                        {processing
                                            ? 'Saving…'
                                            : 'Save changes'}
                                    </Button>
                                </>
                            )}
                        </Form>
                    </Card>

                    <div className="space-y-4">
                        <Card className="p-5">
                            <h2 className="mb-4 text-lg font-bold">Images</h2>

                            {event.images.length > 0 ? (
                                <div className="mb-4 grid grid-cols-2 gap-3">
                                    {event.images.map((image, i) => (
                                        <div
                                            key={image.id}
                                            className="group relative"
                                        >
                                            <EventCover
                                                event={displayEvent}
                                                index={i}
                                                className="aspect-square rounded-xl"
                                            />
                                            <Button
                                                isIconOnly
                                                variant="ghost"
                                                aria-label="Delete image"
                                                onPress={() =>
                                                    deleteImage(image.id)
                                                }
                                                className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <EventCover
                                    event={displayEvent}
                                    className="mb-4 aspect-video rounded-xl"
                                />
                            )}

                            <Form
                                action={`/admin/events/${event.id}/images`}
                                method="post"
                                encType="multipart/form-data"
                                className="space-y-3"
                            >
                                {({ errors, processing }) => (
                                    <>
                                        <div>
                                            <Label htmlFor="images">
                                                Upload images
                                            </Label>
                                            <Input
                                                id="images"
                                                name="images[]"
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                                                multiple
                                                required
                                                className="mt-1 w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-sky-500 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
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
                                            className="w-full bg-sky-500 font-semibold text-white"
                                        >
                                            <Upload className="h-4 w-4" />
                                            {processing
                                                ? 'Uploading…'
                                                : 'Upload'}
                                        </Button>
                                    </>
                                )}
                            </Form>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
