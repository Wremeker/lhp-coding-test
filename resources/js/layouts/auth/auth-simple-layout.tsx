import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';

type AuthSimpleLayoutProps = {
    title?: string;
    description?: string;
    children: ReactNode;
};

export default function AuthSimpleLayout({
    title = '',
    description = '',
    children,
}: AuthSimpleLayoutProps) {
    return (
        <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <Link
                            href={home()}
                            className="flex flex-col items-center gap-2 font-medium"
                        >
                            <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-md">
                                <AppLogoIcon className="text-[var(--foreground)] size-9 fill-current dark:text-white" />
                            </div>
                            <span className="sr-only">{title}</span>
                        </Link>
                        <div className="space-y-2 text-center">
                            <h1 className="text-xl font-medium">{title}</h1>
                            {description ? (
                                <p className="text-muted-foreground text-center text-sm">
                                    {description}
                                </p>
                            ) : null}
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
