import type { UrlMethodPair } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import { usePasskeyVerify } from '@laravel/passkeys/react';
import { Button, Separator, Spinner } from '@heroui/react';
import { KeyRound } from 'lucide-react';
import InputError from '@/components/input-error';

type PasskeyVerifyProps = {
    routes?: {
        options: UrlMethodPair;
        submit: UrlMethodPair;
    };
    label?: string;
    loadingLabel?: string;
    separator?: string;
};

export default function PasskeyVerify({
    routes,
    label,
    loadingLabel,
    separator,
}: PasskeyVerifyProps) {
    const { verify, isLoading, error, isSupported } = usePasskeyVerify({
        ...(routes
            ? {
                  routes: {
                      options: routes.options.url,
                      submit: routes.submit.url,
                  },
              }
            : {}),
        onSuccess: (response) => {
            router.visit(response.redirect ?? '/events');
        },
    });

    if (!isSupported) {
        return null;
    }

    return (
        <div>
            <div className="grid gap-2">
                <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onPress={() => void verify()}
                    isDisabled={isLoading}
                >
                    {isLoading ? (
                        <Spinner size="sm" />
                    ) : (
                        <KeyRound className="h-4 w-4" />
                    )}
                    {isLoading
                        ? (loadingLabel ?? 'Authenticating...')
                        : (label ?? 'Sign in with a passkey')}
                </Button>

                {error ? (
                    <div className="text-center">
                        <InputError message={error} />
                    </div>
                ) : null}
            </div>

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background text-muted-foreground px-2">
                        {separator ?? 'Or continue with email'}
                    </span>
                </div>
            </div>
        </div>
    );
}
