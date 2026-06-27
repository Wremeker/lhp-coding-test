import { Form, Head } from '@inertiajs/react';
import { Button, Input, Label, Spinner, TextField } from '@heroui/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';
import { store } from '@/routes/register';

export default function Register({
    passwordRules,
}: {
    passwordRules: string;
}) {
    return (
        <AuthLayout
            title="Create an account"
            description="Enter your details below to create your account"
        >
            <Head title="Register" />

            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                className="flex flex-col gap-6"
            >
                {({ errors, processing }) => (
                    <>
                        <div className="grid gap-6">
                            <TextField isInvalid={!!errors.name}>
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    placeholder="Full name"
                                />
                                <InputError message={errors.name} />
                            </TextField>

                            <TextField isInvalid={!!errors.email}>
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </TextField>

                            <TextField isInvalid={!!errors.password}>
                                <Label htmlFor="password">Password</Label>
                                <PasswordInput
                                    id="password"
                                    required
                                    tabIndex={3}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder="Password"
                                    {...{ passwordrules: passwordRules }}
                                />
                                <InputError message={errors.password} />
                            </TextField>

                            <TextField isInvalid={!!errors.password_confirmation}>
                                <Label htmlFor="password_confirmation">
                                    Confirm password
                                </Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    required
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder="Confirm password"
                                    {...{ passwordrules: passwordRules }}
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </TextField>

                            <Button
                                type="submit"
                                className="mt-2 w-full"
                                isDisabled={processing}
                                data-test="register-user-button"
                            >
                                {processing && <Spinner size="sm" />}
                                Create account
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <TextLink
                                href={login()}
                                tabindex={6}
                            >
                                Log in
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
