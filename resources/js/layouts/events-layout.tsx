import type { ReactNode } from 'react';

type EventsLayoutProps = {
    children: ReactNode;
};

export default function EventsLayout({ children }: EventsLayoutProps) {
    return (
        <div className="min-h-svh bg-background text-foreground">
            <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
                {children}
            </main>
        </div>
    );
}
