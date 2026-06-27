import { Form, Head } from '@inertiajs/react';
import { Button, Label, Spinner, TextField } from '@heroui/react';
import {
    index as confirmOptions,
    store as confirmStore,
} from '@/actions/Laravel/Passkeys/Http/Controllers/PasskeyConfirmationController';
import InputError from '@/components/input-error';
import PasskeyVerify from '@/components/passkey-verify';
import PasswordInput from '@/components/password-input';
import AuthLayout from '@/layouts/auth-layout';
import { store } from '@/routes/password/confirm';

export default function ConfirmPassword() {
    return (
        <AuthLayout
            title="Confirm password"
            description="This is a secure area of the application. Please confirm your password before continuing."
        >
            <Head title="Confirm password" />

            <PasskeyVerify
                routes={{
                    options: confirmOptions(),
                    submit: confirmStore(),
                }}
                label="Confirm with passkey"
                loadingLabel="Confirming..."
                separator="Or confirm with password"
            />

            <Form {...store.form()} resetOnSuccess>
                {({ errors, processing }) => (
                    <div className="space-y-6">
                        <TextField isInvalid={!!errors.password}>
                            <Label htmlFor="password">Password</Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                className="mt-1 block w-full"
                                required
                                autoComplete="current-password"
                                autoFocus
                            />
                            <InputError message={errors.password} />
                        </TextField>

                        <div className="flex items-center">
                            <Button
                                type="submit"
                                className="w-full"
                                isDisabled={processing}
                                data-test="confirm-password-button"
                            >
                                {processing && <Spinner size="sm" />}
                                Confirm password
                            </Button>
                        </div>
                    </div>
                )}
            </Form>
        </AuthLayout>
    );
}
