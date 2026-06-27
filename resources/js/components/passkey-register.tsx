import { usePasskeyRegister } from '@laravel/passkeys/react';
import { Button, Input, Label, TextField } from '@heroui/react';
import { FormEvent, useState } from 'react';
import InputError from '@/components/input-error';

type PasskeyRegisterProps = {
    onSuccess?: () => void;
};

const getDefaultPasskeyName = () => {
    const ua = navigator.userAgent;

    const browser = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera'].find(
        (candidate) => new RegExp(candidate).test(ua),
    );

    const os = ['iPhone', 'iPad', 'Android', 'Mac', 'Windows'].find(
        (candidate) => new RegExp(candidate).test(ua),
    );

    return [browser, os].filter(Boolean).join(' on ') || '';
};

export default function PasskeyRegister({ onSuccess }: PasskeyRegisterProps) {
    const [name, setName] = useState(getDefaultPasskeyName);
    const [showForm, setShowForm] = useState(false);

    const { register, isLoading, error, isSupported } = usePasskeyRegister({
        onSuccess: () => {
            setName('');
            setShowForm(false);
            onSuccess?.();
        },
    });

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();

        if (!name.trim()) {
            return;
        }

        await register(name);
    };

    const handleCancel = () => {
        setShowForm(false);
        setName('');
    };

    if (!isSupported) {
        return (
            <p className="text-muted-foreground text-sm">
                Passkeys are not supported in this browser.
            </p>
        );
    }

    if (!showForm) {
        return (
            <Button variant="outline" onPress={() => setShowForm(true)}>
                Add passkey
            </Button>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="border-border bg-muted/50 space-y-4 rounded-lg border p-4"
        >
            <TextField>
                <Label htmlFor="passkey-name">Passkey name</Label>
                <Input
                    id="passkey-name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="e.g., MacBook Pro, iPhone"
                    className="border-foreground/20 mt-1 block w-full"
                    autoFocus
                />
                <p className="text-muted-foreground text-xs">
                    A name helps you identify this passkey later.
                </p>
            </TextField>

            {error ? <InputError message={error} /> : null}

            <div className="flex gap-2">
                <Button type="submit" isDisabled={isLoading || !name.trim()}>
                    {isLoading ? 'Registering...' : 'Register passkey'}
                </Button>
                <Button type="button" variant="ghost" onPress={handleCancel}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}
