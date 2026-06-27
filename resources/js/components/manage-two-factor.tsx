import { Form } from '@inertiajs/react';
import { Button } from '@heroui/react';
import { ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import Heading from '@/components/heading';
import TwoFactorRecoveryCodes from '@/components/two-factor-recovery-codes';
import TwoFactorSetupModal from '@/components/two-factor-setup-modal';
import { useTwoFactorAuth } from '@/hooks/use-two-factor-auth';
import { disable, enable } from '@/routes/two-factor';

export type ManageTwoFactorProps = {
    canManageTwoFactor?: boolean;
    requiresConfirmation?: boolean;
    twoFactorEnabled?: boolean;
};

export default function ManageTwoFactor({
    canManageTwoFactor = false,
    requiresConfirmation = false,
    twoFactorEnabled = false,
}: ManageTwoFactorProps) {
    const { hasSetupData, clearTwoFactorAuthData } = useTwoFactorAuth();
    const [showSetupModal, setShowSetupModal] = useState(false);

    useEffect(() => {
        return () => clearTwoFactorAuthData();
    }, [clearTwoFactorAuthData]);

    if (!canManageTwoFactor) {
        return null;
    }

    return (
        <div className="space-y-6">
            <Heading
                variant="small"
                title="Two-factor authentication"
                description="Manage your two-factor authentication settings"
            />

            {!twoFactorEnabled ? (
                <div className="flex flex-col items-start justify-start space-y-4">
                    <p className="text-muted-foreground text-sm">
                        When you enable two-factor authentication, you will be
                        prompted for a secure pin during login. This pin can be
                        retrieved from a TOTP-supported application on your
                        phone.
                    </p>

                    <div>
                        {hasSetupData ? (
                            <Button onPress={() => setShowSetupModal(true)}>
                                <ShieldCheck className="size-4" />
                                Continue setup
                            </Button>
                        ) : (
                            <Form
                                {...enable.form()}
                                onSuccess={() => setShowSetupModal(true)}
                            >
                                {({ processing }) => (
                                    <Button
                                        type="submit"
                                        isDisabled={processing}
                                    >
                                        Enable 2FA
                                    </Button>
                                )}
                            </Form>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-start justify-start space-y-4">
                    <p className="text-muted-foreground text-sm">
                        You will be prompted for a secure, random pin during
                        login, which you can retrieve from the TOTP-supported
                        application on your phone.
                    </p>

                    <div className="relative inline">
                        <Form {...disable.form()}>
                            {({ processing }) => (
                                <Button
                                    variant="danger"
                                    type="submit"
                                    isDisabled={processing}
                                >
                                    Disable 2FA
                                </Button>
                            )}
                        </Form>
                    </div>

                    <TwoFactorRecoveryCodes />
                </div>
            )}

            <TwoFactorSetupModal
                isOpen={showSetupModal}
                onOpenChange={setShowSetupModal}
                requiresConfirmation={requiresConfirmation}
                twoFactorEnabled={twoFactorEnabled}
            />
        </div>
    );
}
