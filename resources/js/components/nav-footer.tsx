import type { LinkComponentBaseProps } from '@inertiajs/core';
import type { LucideIcon } from 'lucide-react';
import { toUrl } from '@/lib/utils';
import type { NavItem } from '@/types';

type NavFooterProps = {
    items: NavItem[];
    className?: string;
};

export default function NavFooter({ items, className }: NavFooterProps) {
    return (
        <div className={className}>
            <nav className="flex flex-col gap-1 px-2">
                {items.map((item) => {
                    const Icon = item.icon;

                    return (
                        <a
                            key={item.title}
                            href={toUrl(item.href)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-neutral-600 transition-colors hover:text-neutral-800 dark:text-neutral-300 dark:hover:text-neutral-100"
                        >
                            {Icon ? <Icon className="size-4 shrink-0" /> : null}
                            <span className="truncate">{item.title}</span>
                        </a>
                    );
                })}
            </nav>
        </div>
    );
}
