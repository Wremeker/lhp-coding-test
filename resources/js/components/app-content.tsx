import type { ReactNode } from 'react';
import { useSidebar } from '@/components/app-shell';
import { cn } from '@/lib/utils';
import type { AppVariant } from '@/types';

type AppContentProps = {
    variant?: AppVariant;
    className?: string;
    children: ReactNode;
};

export default function AppContent({
    variant = 'sidebar',
    className,
    children,
}: AppContentProps) {
    const { open } = useSidebar();

    if (variant === 'sidebar') {
        return (
            <main
                data-slot="sidebar-inset"
                className={cn(
                    'bg-background relative flex w-full flex-1 flex-col transition-[margin] duration-200',
                    open ? 'md:ml-[var(--sidebar-width)]' : 'md:ml-[var(--sidebar-width-icon)]',
                    className,
                )}
            >
                {children}
            </main>
        );
    }

    return (
        <main
            className={cn(
                'mx-auto flex h-full w-full max-w-7xl flex-1 flex-col gap-4 rounded-xl',
                className,
            )}
        >
            {children}
        </main>
    );
}
