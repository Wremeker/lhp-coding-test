import { Form, Head } from '@inertiajs/react';
import { Alert, Button, Input, Label, Spinner, TextField } from '@heroui/react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';
import { email } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <AuthLayout
            title="Forgot password"
            description="Enter your email to receive a password reset link"
        >
            <Head title="Forgot password" />

            {status && (
                <Alert status="success" className="mb-4">
                    <Alert.Indicator />
                    <Alert.Content>
                        <Alert.Description>{status}</Alert.Description>
                    </Alert.Content>
                </Alert>
            )}

            <div className="space-y-6">
                <Form {...email.form()}>
                    {({ errors, processing }) => (
                        <>
                            <TextField isInvalid={!!errors.email}>
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="off"
                                    autoFocus
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </TextField>

                            <div className="my-6 flex items-center justify-start">
                                <Button
                                    type="submit"
                                    className="w-full"
                                    isDisabled={processing}
                                    data-test="email-password-reset-link-button"
                                >
                                    {processing && <Spinner size="sm" />}
                                    Email password reset link
                                </Button>
                            </div>
                        </>
                    )}
                </Form>

                <div className="space-x-1 text-center text-sm text-muted-foreground">
                    <span>Or, return to</span>{' '}
                    <TextLink href={login()}>log in</TextLink>
                </div>
            </div>
        </AuthLayout>
    );
}
