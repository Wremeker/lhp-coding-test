import { Form, Head } from '@inertiajs/react';
import { Button, Input, Label, Spinner, TextField } from '@heroui/react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import AuthLayout from '@/layouts/auth-layout';
import { update } from '@/routes/password';

export default function ResetPassword({
    token,
    email,
    passwordRules,
}: {
    token: string;
    email: string;
    passwordRules: string;
}) {
    const [inputEmail, setInputEmail] = useState(email);

    return (
        <AuthLayout
            title="Reset password"
            description="Please enter your new password below"
        >
            <Head title="Reset password" />

            <Form
                {...update.form()}
                transform={(data) => ({ ...data, token, email: inputEmail })}
                resetOnSuccess={['password', 'password_confirmation']}
            >
                {({ errors, processing }) => (
                    <div className="grid gap-6">
                        <TextField isInvalid={!!errors.email}>
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                autoComplete="email"
                                value={inputEmail}
                                onChange={(event) =>
                                    setInputEmail(event.target.value)
                                }
                                className="mt-1 block w-full"
                                readOnly
                            />
                            <InputError message={errors.email} />
                        </TextField>

                        <TextField isInvalid={!!errors.password}>
                            <Label htmlFor="password">Password</Label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    autoComplete="new-password"
                                    className="mt-1 block w-full"
                                    autoFocus
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
                                    name="password_confirmation"
                                    autoComplete="new-password"
                                    className="mt-1 block w-full"
                                    placeholder="Confirm password"
                                    {...{ passwordrules: passwordRules }}
                                />
                            <InputError
                                message={errors.password_confirmation}
                            />
                        </TextField>

                        <Button
                            type="submit"
                            className="mt-4 w-full"
                            isDisabled={processing}
                            data-test="reset-password-button"
                        >
                            {processing && <Spinner size="sm" />}
                            Reset password
                        </Button>
                    </div>
                )}
            </Form>
        </AuthLayout>
    );
}
