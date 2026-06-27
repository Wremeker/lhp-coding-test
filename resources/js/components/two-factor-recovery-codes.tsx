import { Form } from '@inertiajs/react';
import { Button, Card } from '@heroui/react';
import { Eye, EyeOff, LockKeyhole, RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import AlertError from '@/components/alert-error';
import { useTwoFactorAuth } from '@/hooks/use-two-factor-auth';
import { regenerateRecoveryCodes } from '@/routes/two-factor';
import { cn } from '@/lib/utils';

export default function TwoFactorRecoveryCodes() {
    const { recoveryCodesList, fetchRecoveryCodes, errors } =
        useTwoFactorAuth();
    const [isRecoveryCodesVisible, setIsRecoveryCodesVisible] = useState(false);
    const recoveryCodeSectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!recoveryCodesList.length) {
            void fetchRecoveryCodes();
        }
    }, [fetchRecoveryCodes, recoveryCodesList.length]);

    const toggleRecoveryCodesVisibility = async () => {
        if (!isRecoveryCodesVisible && !recoveryCodesList.length) {
            await fetchRecoveryCodes();
        }

        setIsRecoveryCodesVisible((current) => !current);

        if (!isRecoveryCodesVisible) {
            requestAnimationFrame(() => {
                recoveryCodeSectionRef.current?.scrollIntoView({
                    behavior: 'smooth',
                });
            });
        }
    };

    return (
        <Card className="w-full">
            <Card.Header>
                <Card.Title className="flex gap-3">
                    <LockKeyhole className="size-4" />
                    2FA recovery codes
                </Card.Title>
                <Card.Description>
                    Recovery codes let you regain access if you lose your 2FA
                    device. Store them in a secure password manager.
                </Card.Description>
            </Card.Header>
            <Card.Content>
                <div className="flex flex-col gap-3 select-none sm:flex-row sm:items-center sm:justify-between">
                    <Button
                        onPress={() => void toggleRecoveryCodesVisibility()}
                        className="w-fit"
                    >
                        {isRecoveryCodesVisible ? (
                            <EyeOff className="size-4" />
                        ) : (
                            <Eye className="size-4" />
                        )}
                        {isRecoveryCodesVisible ? 'Hide' : 'View'} recovery codes
                    </Button>

                    {isRecoveryCodesVisible && recoveryCodesList.length > 0 ? (
                        <Form
                            {...regenerateRecoveryCodes.form()}
                            method="post"
                            options={{ preserveScroll: true }}
                            onSuccess={() => void fetchRecoveryCodes()}
                        >
                            {({ processing }) => (
                                <Button
                                    variant="secondary"
                                    type="submit"
                                    isDisabled={processing}
                                >
                                    <RefreshCw className="size-4" />
                                    Regenerate codes
                                </Button>
                            )}
                        </Form>
                    ) : null}
                </div>
                <div
                    className={cn(
                        'relative overflow-hidden transition-all duration-300',
                        isRecoveryCodesVisible
                            ? 'h-auto opacity-100'
                            : 'h-0 opacity-0',
                    )}
                >
                    {errors.length > 0 ? (
                        <div className="mt-6">
                            <AlertError errors={errors} />
                        </div>
                    ) : (
                        <div className="mt-3 space-y-3">
                            <div
                                ref={recoveryCodeSectionRef}
                                className="bg-muted grid gap-1 rounded-lg p-4 font-mono text-sm"
                            >
                                {!recoveryCodesList.length ? (
                                    <div className="space-y-2">
                                        {Array.from({ length: 8 }).map(
                                            (_, index) => (
                                                <div
                                                    key={index}
                                                    className="bg-muted-foreground/20 h-4 animate-pulse rounded"
                                                />
                                            ),
                                        )}
                                    </div>
                                ) : (
                                    recoveryCodesList.map((code, index) => (
                                        <div key={index}>{code}</div>
                                    ))
                                )}
                            </div>
                            <p className="text-muted-foreground text-xs select-none">
                                Each recovery code can be used once to access
                                your account and will be removed after use. If
                                you need more, click{' '}
                                <span className="font-bold">
                                    Regenerate codes
                                </span>{' '}
                                above.
                            </p>
                        </div>
                    )}
                </div>
            </Card.Content>
        </Card>
    );
}
