import { Button, Chip, Modal, useOverlayState } from '@heroui/react';
import { KeyRound, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { Passkey } from '@/types/auth';

type PasskeyItemProps = {
    passkey: Passkey;
    onRemove: (id: number, onError: () => void) => void;
};

export default function PasskeyItem({ passkey, onRemove }: PasskeyItemProps) {
    const modalState = useOverlayState();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = () => {
        setIsDeleting(true);
        onRemove(passkey.id, () => {
            setIsDeleting(false);
        });
    };

    return (
        <div className="flex items-center justify-between border-b p-4 last:border-b-0">
            <div className="flex items-center gap-4">
                <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                    <KeyRound className="text-muted-foreground h-5 w-5" />
                </div>
                <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                        <p className="font-medium tracking-tight">
                            {passkey.name}
                        </p>
                        {passkey.authenticator ? (
                            <Chip size="sm" variant="secondary">
                                <Chip.Label>{passkey.authenticator}</Chip.Label>
                            </Chip>
                        ) : null}
                    </div>
                    <p className="text-muted-foreground text-sm">
                        Added {passkey.created_at_diff}
                        {passkey.last_used_at_diff ? (
                            <>
                                <span className="text-muted-foreground/50 mx-1">
                                    /
                                </span>
                                Last used {passkey.last_used_at_diff}
                            </>
                        ) : null}
                    </p>
                </div>
            </div>

            <Modal state={modalState}>
                <Modal.Trigger>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove</span>
                    </Button>
                </Modal.Trigger>
                <Modal.Backdrop>
                    <Modal.Container>
                        <Modal.Dialog>
                            <Modal.Header>
                                <Modal.Heading>Remove passkey</Modal.Heading>
                            </Modal.Header>
                            <Modal.Body>
                                <p className="text-muted-foreground text-sm">
                                    Are you sure you want to remove the "
                                    {passkey.name}" passkey? You will no longer
                                    be able to use it to sign in.
                                </p>
                            </Modal.Body>
                            <Modal.Footer className="gap-2">
                                <Modal.CloseTrigger>
                                    <Button variant="secondary">Cancel</Button>
                                </Modal.CloseTrigger>
                                <Button
                                    variant="danger"
                                    isDisabled={isDeleting}
                                    onPress={handleDelete}
                                >
                                    {isDeleting
                                        ? 'Removing...'
                                        : 'Remove passkey'}
                                </Button>
                            </Modal.Footer>
                        </Modal.Dialog>
                    </Modal.Container>
                </Modal.Backdrop>
            </Modal>
        </div>
    );
}
