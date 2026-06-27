import { Form } from '@inertiajs/react';
import { Button, Label, Modal, useOverlayState } from '@heroui/react';
import { useRef } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import PasswordInput, {
    type PasswordInputHandle,
} from '@/components/password-input';

export default function DeleteUser() {
    const modalState = useOverlayState();
    const passwordInputRef = useRef<PasswordInputHandle>(null);

    return (
        <div className="space-y-6">
            <Heading
                variant="small"
                title="Delete account"
                description="Delete your account and all of its resources"
            />
            <div className="space-y-4 rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-200/10 dark:bg-red-700/10">
                <div className="relative space-y-0.5 text-red-600 dark:text-red-100">
                    <p className="font-medium">Warning</p>
                    <p className="text-sm">
                        Please proceed with caution, this cannot be undone.
                    </p>
                </div>
                <Modal state={modalState}>
                    <Modal.Trigger>
                        <Button
                            variant="danger"
                            data-test="delete-user-button"
                        >
                            Delete account
                        </Button>
                    </Modal.Trigger>
                    <Modal.Backdrop>
                        <Modal.Container>
                            <Modal.Dialog>
                                <Form
                                    {...ProfileController.destroy.form()}
                                    resetOnSuccess
                                    onError={() =>
                                        passwordInputRef.current?.focus()
                                    }
                                    options={{ preserveScroll: true }}
                                    className="space-y-6"
                                >
                                    {({
                                        errors,
                                        processing,
                                        reset,
                                        clearErrors,
                                    }) => (
                                        <>
                                            <Modal.Header className="space-y-3">
                                                <Modal.Heading>
                                                    Are you sure you want to
                                                    delete your account?
                                                </Modal.Heading>
                                                <p className="text-muted-foreground text-sm">
                                                    Once your account is
                                                    deleted, all of its
                                                    resources and data will also
                                                    be permanently deleted.
                                                    Please enter your password
                                                    to confirm you would like to
                                                    permanently delete your
                                                    account.
                                                </p>
                                            </Modal.Header>

                                            <Modal.Body>
                                                <div className="grid gap-2">
                                                    <Label
                                                        htmlFor="password"
                                                        className="sr-only"
                                                    >
                                                        Password
                                                    </Label>
                                                    <PasswordInput
                                                        id="password"
                                                        name="password"
                                                        ref={passwordInputRef}
                                                        placeholder="Password"
                                                    />
                                                    <InputError
                                                        message={
                                                            errors.password
                                                        }
                                                    />
                                                </div>
                                            </Modal.Body>

                                            <Modal.Footer className="gap-2">
                                                <Modal.CloseTrigger>
                                                    <Button
                                                        variant="secondary"
                                                        onPress={() => {
                                                            clearErrors();
                                                            reset();
                                                        }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </Modal.CloseTrigger>

                                                <Button
                                                    type="submit"
                                                    variant="danger"
                                                    isDisabled={processing}
                                                    data-test="confirm-delete-user-button"
                                                >
                                                    Delete account
                                                </Button>
                                            </Modal.Footer>
                                        </>
                                    )}
                                </Form>
                            </Modal.Dialog>
                        </Modal.Container>
                    </Modal.Backdrop>
                </Modal>
            </div>
        </div>
    );
}
