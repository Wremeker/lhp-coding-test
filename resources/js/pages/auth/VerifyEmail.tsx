import { Form, Head } from '@inertiajs/react';
import { Alert, Button, Spinner } from '@heroui/react';
import TextLink from '@/components/text-link';
import AuthLayout from '@/layouts/auth-layout';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <AuthLayout
            title="Email verification"
            description="Please verify your email address by clicking on the link we just emailed to you."
        >
            <Head title="Email verification" />

            {status === 'verification-link-sent' && (
                <Alert status="success" className="mb-4">
                    <Alert.Indicator />
                    <Alert.Content>
                        <Alert.Description>
                            A new verification link has been sent to the email
                            address you provided during registration.
                        </Alert.Description>
                    </Alert.Content>
                </Alert>
            )}

            <Form {...send.form()} className="space-y-6 text-center">
                {({ processing }) => (
                    <>
                        <Button
                            type="submit"
                            isDisabled={processing}
                            variant="secondary"
                        >
                            {processing && <Spinner size="sm" />}
                            Resend verification email
                        </Button>

                        <TextLink href={logout()} as="button">
                            Log out
                        </TextLink>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
