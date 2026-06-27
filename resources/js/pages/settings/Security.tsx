import { Form, Head } from '@inertiajs/react';
import { Button, Label, Spinner, TextField } from '@heroui/react';
import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import ManagePasskeys from '@/components/manage-passkeys';
import ManageTwoFactor from '@/components/manage-two-factor';
import PasswordInput from '@/components/password-input';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit } from '@/routes/security';
import type { Passkey } from '@/types/auth';

type Props = {
    passwordRules: string;
    canManageTwoFactor?: boolean;
    requiresConfirmation?: boolean;
    twoFactorEnabled?: boolean;
    canManagePasskeys?: boolean;
    passkeys?: Passkey[];
};

export default function Security({
    passwordRules,
    canManageTwoFactor = false,
    requiresConfirmation = false,
    twoFactorEnabled = false,
    canManagePasskeys = false,
    passkeys = [],
}: Props) {
    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Security settings',
                    href: edit(),
                },
            ]}
        >
            <SettingsLayout>
                <Head title="Security settings" />

                <h1 className="sr-only">Security settings</h1>

                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Update password"
                        description="Ensure your account is using a long, random password to stay secure"
                    />

                    <Form
                        {...SecurityController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        resetOnSuccess
                        resetOnError={[
                            'password',
                            'password_confirmation',
                            'current_password',
                        ]}
                        className="space-y-6"
                    >
                        {({ errors, processing }) => (
                            <>
                                <TextField isInvalid={!!errors.current_password}>
                                    <Label htmlFor="current_password">
                                        Current password
                                    </Label>
                                    <PasswordInput
                                        id="current_password"
                                        name="current_password"
                                        className="mt-1 block w-full"
                                        autoComplete="current-password"
                                        placeholder="Current password"
                                    />
                                    <InputError
                                        message={errors.current_password}
                                    />
                                </TextField>

                                <TextField isInvalid={!!errors.password}>
                                    <Label htmlFor="password">New password</Label>
                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        className="mt-1 block w-full"
                                        autoComplete="new-password"
                                        placeholder="New password"
                                        {...{ passwordrules: passwordRules }}
                                    />
                                    <InputError message={errors.password} />
                                </TextField>

                                <TextField
                                    isInvalid={!!errors.password_confirmation}
                                >
                                    <Label htmlFor="password_confirmation">
                                        Confirm password
                                    </Label>
                                    <PasswordInput
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        className="mt-1 block w-full"
                                        autoComplete="new-password"
                                        placeholder="Confirm password"
                                        {...{ passwordrules: passwordRules }}
                                    />
                                    <InputError
                                        message={errors.password_confirmation}
                                    />
                                </TextField>

                                <div className="flex items-center gap-4">
                                    <Button
                                        type="submit"
                                        isDisabled={processing}
                                        data-test="update-password-button"
                                    >
                                        Save
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                </div>

                <ManageTwoFactor
                    canManageTwoFactor={canManageTwoFactor}
                    requiresConfirmation={requiresConfirmation}
                    twoFactorEnabled={twoFactorEnabled}
                />

                <ManagePasskeys
                    canManagePasskeys={canManagePasskeys}
                    passkeys={passkeys}
                />
            </SettingsLayout>
        </AppLayout>
    );
}
