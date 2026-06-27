import { Form, Head } from '@inertiajs/react';
import { Button, Input, InputOTP, TextField } from '@heroui/react';
import { useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import AuthLayout from '@/layouts/auth-layout';
import { store } from '@/routes/two-factor/login';
import type { TwoFactorConfigContent } from '@/types';

export default function TwoFactorChallenge() {
    const [showRecoveryInput, setShowRecoveryInput] = useState(false);
    const [code, setCode] = useState('');

    const authConfigContent = useMemo<TwoFactorConfigContent>(() => {
        if (showRecoveryInput) {
            return {
                title: 'Recovery code',
                description:
                    'Please confirm access to your account by entering one of your emergency recovery codes.',
                buttonText: 'login using an authentication code',
            };
        }

        return {
            title: 'Authentication code',
            description:
                'Enter the authentication code provided by your authenticator application.',
            buttonText: 'login using a recovery code',
        };
    }, [showRecoveryInput]);

    const toggleRecoveryMode = (clearErrors: () => void) => {
        setShowRecoveryInput((current) => !current);
        clearErrors();
        setCode('');
    };

    return (
        <AuthLayout
            title={authConfigContent.title}
            description={authConfigContent.description}
        >
            <Head title="Two-factor authentication" />

            <div className="space-y-6">
                {!showRecoveryInput ? (
                    <Form
                        {...store.form()}
                        className="space-y-4"
                        resetOnError
                        onError={() => setCode('')}
                    >
                        {({ errors, processing, clearErrors }) => (
                            <>
                                <input type="hidden" name="code" value={code} />
                                <div className="flex flex-col items-center justify-center space-y-3 text-center">
                                    <div className="flex w-full items-center justify-center">
                                        <InputOTP
                                            id="otp"
                                            maxLength={6}
                                            value={code}
                                            onChange={setCode}
                                            isDisabled={processing}
                                            autoFocus
                                        >
                                            <InputOTP.Group>
                                                {Array.from({ length: 6 }, (_, index) => (
                                                    <InputOTP.Slot
                                                        key={index}
                                                        index={index}
                                                    />
                                                ))}
                                            </InputOTP.Group>
                                        </InputOTP>
                                    </div>
                                    <InputError message={errors.code} />
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full"
                                    isDisabled={processing}
                                >
                                    Continue
                                </Button>
                                <div className="text-center text-sm text-muted-foreground">
                                    <span>or you can </span>
                                    <button
                                        type="button"
                                        className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                        onClick={() =>
                                            toggleRecoveryMode(clearErrors)
                                        }
                                    >
                                        {authConfigContent.buttonText}
                                    </button>
                                </div>
                            </>
                        )}
                    </Form>
                ) : (
                    <Form
                        {...store.form()}
                        className="space-y-4"
                        resetOnError
                    >
                        {({ errors, processing, clearErrors }) => (
                            <>
                                <TextField isInvalid={!!errors.recovery_code}>
                                    <Input
                                        name="recovery_code"
                                        type="text"
                                        placeholder="Enter recovery code"
                                        autoFocus={showRecoveryInput}
                                        required
                                    />
                                    <InputError message={errors.recovery_code} />
                                </TextField>
                                <Button
                                    type="submit"
                                    className="w-full"
                                    isDisabled={processing}
                                >
                                    Continue
                                </Button>

                                <div className="text-center text-sm text-muted-foreground">
                                    <span>or you can </span>
                                    <button
                                        type="button"
                                        className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                        onClick={() =>
                                            toggleRecoveryMode(clearErrors)
                                        }
                                    >
                                        {authConfigContent.buttonText}
                                    </button>
                                </div>
                            </>
                        )}
                    </Form>
                )}
            </div>
        </AuthLayout>
    );
}
