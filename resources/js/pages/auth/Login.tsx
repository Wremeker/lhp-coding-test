import { Form, Head } from '@inertiajs/react';
import {
    Alert,
    Button,
    Checkbox,
    Input,
    Label,
    Spinner,
    TextField,
} from '@heroui/react';
import InputError from '@/components/input-error';
import PasskeyVerify from '@/components/passkey-verify';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    return (
        <AuthLayout
            title="Log in to your account"
            description="Enter your email and password below to log in"
        >
            <Head title="Log in" />

            {status && (
                <Alert status="success" className="mb-4">
                    <Alert.Indicator />
                    <Alert.Content>
                        <Alert.Description>{status}</Alert.Description>
                    </Alert.Content>
                </Alert>
            )}

            <PasskeyVerify />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ errors, processing }) => (
                    <>
                        <div className="grid gap-6">
                            <TextField isInvalid={!!errors.email}>
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </TextField>

                            <TextField isInvalid={!!errors.password}>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            tabindex={5}
                                        >
                                            Forgot your password?
                                        </TextLink>
                                    )}
                                </div>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Password"
                                />
                                <InputError message={errors.password} />
                            </TextField>

                            <Checkbox name="remember">
                                <Checkbox.Content>
                                    <Checkbox.Control>
                                        <Checkbox.Indicator />
                                    </Checkbox.Control>
                                    Remember me
                                </Checkbox.Content>
                            </Checkbox>

                            <Button
                                type="submit"
                                className="mt-4 w-full"
                                isDisabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner size="sm" />}
                                Log in
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            Don&apos;t have an account?{' '}
                            <TextLink href={register()} tabindex={5}>
                                Sign up
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
