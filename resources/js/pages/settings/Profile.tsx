import { Form, Head, Link, usePage } from '@inertiajs/react';
import { Button, Input, Label, Spinner, TextField } from '@heroui/react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';

import type { Auth } from '@/types';

export default function Profile() {
    const page = usePage<{ auth: Auth }>();
    const user = page.props.auth.user!;

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Profile settings',
                    href: edit(),
                },
            ]}
        >
            <SettingsLayout>
                <Head title="Profile settings" />

                <h1 className="sr-only">Profile settings</h1>

                <div className="flex flex-col space-y-6">
                    <Heading
                        variant="small"
                        title="Profile"
                        description="Update your name and email address"
                    />

                    <Form
                        {...ProfileController.update.form()}
                        className="space-y-6"
                    >
                        {({ errors, processing }) => (
                            <>
                                <TextField isInvalid={!!errors.name}>
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        className="mt-1 block w-full"
                                        name="name"
                                        defaultValue={user.name}
                                        required
                                        autoComplete="name"
                                        placeholder="Full name"
                                    />
                                    <InputError message={errors.name} />
                                </TextField>

                                <TextField isInvalid={!!errors.email}>
                                    <Label htmlFor="email">Email address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        className="mt-1 block w-full"
                                        name="email"
                                        defaultValue={user.email}
                                        required
                                        autoComplete="username"
                                        placeholder="Email address"
                                    />
                                    <InputError message={errors.email} />
                                </TextField>

                                {page.props.mustVerifyEmail &&
                                    !user.email_verified_at && (
                                        <div>
                                            <p className="-mt-4 text-sm text-muted-foreground">
                                                Your email address is
                                                unverified.{' '}
                                                <Link
                                                    href={send()}
                                                    as="button"
                                                    className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                                >
                                                    Click here to re-send the
                                                    verification email.
                                                </Link>
                                            </p>

                                            {page.props.status ===
                                                'verification-link-sent' && (
                                                <p className="mt-2 text-sm font-medium text-green-600">
                                                    A new verification link has
                                                    been sent to your email
                                                    address.
                                                </p>
                                            )}
                                        </div>
                                    )}

                                <div className="flex items-center gap-4">
                                    <Button
                                        type="submit"
                                        isDisabled={processing}
                                        data-test="update-profile-button"
                                    >
                                        Save
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                </div>

                <DeleteUser />
            </SettingsLayout>
        </AppLayout>
    );
}
