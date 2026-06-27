import { Form } from '@inertiajs/react';
import {
    Button,
    InputOTP,
    Modal,
    Spinner,
    useOverlayState,
} from '@heroui/react';
import { Check, Copy, ScanLine } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import AlertError from '@/components/alert-error';
import InputError from '@/components/input-error';
import { useTwoFactorAuth } from '@/hooks/use-two-factor-auth';
import { confirm } from '@/routes/two-factor';
import type { TwoFactorConfigContent } from '@/types';

type TwoFactorSetupModalProps = {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    requiresConfirmation: boolean;
    twoFactorEnabled: boolean;
};

export default function TwoFactorSetupModal({
    isOpen,
    onOpenChange,
    requiresConfirmation,
    twoFactorEnabled,
}: TwoFactorSetupModalProps) {
    const modalState = useOverlayState({ isOpen, onOpenChange });
    const { qrCodeSvg, manualSetupKey, clearSetupData, fetchSetupData, errors } =
        useTwoFactorAuth();
    const [showVerificationStep, setShowVerificationStep] = useState(false);
    const [code, setCode] = useState('');
    const [copied, setCopied] = useState(false);
    const pinInputContainerRef = useRef<HTMLDivElement>(null);

    const modalConfig = useMemo<TwoFactorConfigContent>(() => {
        if (twoFactorEnabled) {
            return {
                title: 'Two-factor authentication enabled',
                description:
                    'Two-factor authentication is now enabled. Scan the QR code or enter the setup key in your authenticator app.',
                buttonText: 'Close',
            };
        }

        if (showVerificationStep) {
            return {
                title: 'Verify authentication code',
                description:
                    'Enter the 6-digit code from your authenticator app',
                buttonText: 'Continue',
            };
        }

        return {
            title: 'Enable two-factor authentication',
            description:
                'To finish enabling two-factor authentication, scan the QR code or enter the setup key in your authenticator app',
            buttonText: 'Continue',
        };
    }, [showVerificationStep, twoFactorEnabled]);

    const resetModalState = () => {
        if (twoFactorEnabled) {
            clearSetupData();
        }

        setShowVerificationStep(false);
        setCode('');
        setCopied(false);
    };

    useEffect(() => {
        if (!isOpen) {
            resetModalState();
            return;
        }

        if (!qrCodeSvg) {
            void fetchSetupData();
        }
    }, [fetchSetupData, isOpen, qrCodeSvg, twoFactorEnabled]);

    const handleModalNextStep = () => {
        if (requiresConfirmation) {
            setShowVerificationStep(true);

            requestAnimationFrame(() => {
                pinInputContainerRef.current?.querySelector('input')?.focus();
            });

            return;
        }

        clearSetupData();
        onOpenChange(false);
    };

    const handleCopy = async () => {
        if (!manualSetupKey) {
            return;
        }

        await navigator.clipboard.writeText(manualSetupKey);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Modal state={modalState}>
            <Modal.Backdrop>
                <Modal.Container size="md">
                    <Modal.Dialog>
                        <Modal.Header className="flex items-center justify-center">
                            <div className="border-border bg-card mb-3 w-auto rounded-full border p-0.5 shadow-sm">
                                <div className="border-border bg-muted relative overflow-hidden rounded-full border p-2.5">
                                    <div className="absolute inset-0 grid grid-cols-5 opacity-50">
                                        {Array.from({ length: 5 }).map(
                                            (_, index) => (
                                                <div
                                                    key={`col-${index}`}
                                                    className="border-border border-r last:border-r-0"
                                                />
                                            ),
                                        )}
                                    </div>
                                    <div className="absolute inset-0 grid grid-rows-5 opacity-50">
                                        {Array.from({ length: 5 }).map(
                                            (_, index) => (
                                                <div
                                                    key={`row-${index}`}
                                                    className="border-border border-b last:border-b-0"
                                                />
                                            ),
                                        )}
                                    </div>
                                    <ScanLine className="text-foreground relative z-20 size-6" />
                                </div>
                            </div>
                            <Modal.Heading>{modalConfig.title}</Modal.Heading>
                            <p className="text-muted-foreground text-center text-sm">
                                {modalConfig.description}
                            </p>
                        </Modal.Header>

                        <Modal.Body>
                            <div className="relative flex w-auto flex-col items-center justify-center space-y-5">
                                {!showVerificationStep ? (
                                    <>
                                        {errors.length > 0 ? (
                                            <AlertError errors={errors} />
                                        ) : (
                                            <>
                                                <div className="relative mx-auto flex max-w-md items-center overflow-hidden">
                                                    <div className="border-border relative mx-auto aspect-square w-64 overflow-hidden rounded-lg border">
                                                        {!qrCodeSvg ? (
                                                            <div className="bg-background absolute inset-0 z-10 flex aspect-square h-auto w-full animate-pulse items-center justify-center">
                                                                <Spinner size="md" />
                                                            </div>
                                                        ) : (
                                                            <div className="relative z-10 overflow-hidden border p-5">
                                                                <div
                                                                    className="flex aspect-square size-full items-center justify-center"
                                                                    dangerouslySetInnerHTML={{
                                                                        __html: qrCodeSvg,
                                                                    }}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex w-full items-center space-x-5">
                                                    <Button
                                                        className="w-full"
                                                        onPress={
                                                            handleModalNextStep
                                                        }
                                                    >
                                                        {modalConfig.buttonText}
                                                    </Button>
                                                </div>

                                                <div className="relative flex w-full items-center justify-center">
                                                    <div className="bg-border absolute inset-0 top-1/2 h-px w-full" />
                                                    <span className="bg-card relative px-2 py-1 text-sm">
                                                        or, enter the code
                                                        manually
                                                    </span>
                                                </div>

                                                <div className="flex w-full items-center justify-center space-x-2">
                                                    <div className="border-border flex w-full items-stretch overflow-hidden rounded-xl border">
                                                        {!manualSetupKey ? (
                                                            <div className="bg-muted flex h-full w-full items-center justify-center p-3">
                                                                <Spinner size="sm" />
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <input
                                                                    type="text"
                                                                    readOnly
                                                                    value={
                                                                        manualSetupKey
                                                                    }
                                                                    className="bg-background text-foreground h-full w-full p-3"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        void handleCopy()
                                                                    }
                                                                    className="border-border hover:bg-muted relative block h-auto border-l px-3"
                                                                >
                                                                    {copied ? (
                                                                        <Check className="w-4 text-green-500" />
                                                                    ) : (
                                                                        <Copy className="w-4" />
                                                                    )}
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <Form
                                        {...confirm.form()}
                                        resetOnError
                                        onFinish={() => setCode('')}
                                        onSuccess={() => onOpenChange(false)}
                                    >
                                        {({ errors: formErrors, processing }) => (
                                            <>
                                                <input
                                                    type="hidden"
                                                    name="code"
                                                    value={code}
                                                />
                                                <div
                                                    ref={pinInputContainerRef}
                                                    className="relative w-full space-y-3"
                                                >
                                                    <div className="flex w-full flex-col items-center justify-center space-y-3 py-2">
                                                        <InputOTP
                                                            maxLength={6}
                                                            value={code}
                                                            onChange={setCode}
                                                            isDisabled={
                                                                processing
                                                            }
                                                            autoFocus
                                                        >
                                                            <InputOTP.Group>
                                                                {Array.from({
                                                                    length: 6,
                                                                }).map(
                                                                    (
                                                                        _,
                                                                        index,
                                                                    ) => (
                                                                        <InputOTP.Slot
                                                                            key={
                                                                                index
                                                                            }
                                                                            index={
                                                                                index
                                                                            }
                                                                        />
                                                                    ),
                                                                )}
                                                            </InputOTP.Group>
                                                        </InputOTP>
                                                        <InputError
                                                            message={
                                                                formErrors.code
                                                            }
                                                        />
                                                    </div>

                                                    <div className="flex w-full items-center space-x-5">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            className="w-auto flex-1"
                                                            onPress={() =>
                                                                setShowVerificationStep(
                                                                    false,
                                                                )
                                                            }
                                                            isDisabled={
                                                                processing
                                                            }
                                                        >
                                                            Back
                                                        </Button>
                                                        <Button
                                                            type="submit"
                                                            className="w-auto flex-1"
                                                            isDisabled={
                                                                processing ||
                                                                code.length < 6
                                                            }
                                                        >
                                                            Confirm
                                                        </Button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </Form>
                                )}
                            </div>
                        </Modal.Body>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}
