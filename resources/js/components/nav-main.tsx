import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import type { NavItem } from '@/types';

type NavMainProps = {
    items: NavItem[];
};

export default function NavMain({ items }: NavMainProps) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <div className="px-2 py-0">
            <div className="text-sidebar-foreground/70 px-2 py-2 text-xs font-medium">
                Platform
            </div>
            <nav className="flex flex-col gap-1">
                {items.map((item) => {
                    const Icon = item.icon as LucideIcon | undefined;
                    const active = isCurrentUrl(item.href);

                    return (
                        <Link
                            key={item.title}
                            href={toUrl(item.href)}
                            className={cn(
                                'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors',
                                active &&
                                    'bg-sidebar-accent text-sidebar-accent-foreground font-medium',
                            )}
                            title={item.title}
                        >
                            {Icon ? <Icon className="size-4 shrink-0" /> : null}
                            <span className="truncate">{item.title}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
