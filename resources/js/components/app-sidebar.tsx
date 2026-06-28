import { Link, usePage } from '@inertiajs/react';
import { BookOpen, FolderGit2, ListOrdered, Settings2 } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import {
    SIDEBAR_WIDTH,
    SIDEBAR_WIDTH_ICON,
    SIDEBAR_WIDTH_MOBILE,
    useSidebar,
} from '@/components/app-shell';
import NavFooter from '@/components/nav-footer';
import NavMain from '@/components/nav-main';
import NavUser from '@/components/nav-user';
import { cn } from '@/lib/utils';
import type { Auth } from '@/types';

const footerNavItems = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: FolderGit2,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

function SidebarPanel({ className }: { className?: string }) {
    const { auth } = usePage<{ auth: Auth }>().props;

    const mainNavItems = [
        {
            title: 'Browse events',
            href: '/events',
            icon: ListOrdered,
        },
        ...(auth.user?.is_admin
            ? [
                  {
                      title: 'Manage events',
                      href: '/admin/events',
                      icon: Settings2,
                  },
              ]
            : []),
    ];

    return (
        <div
            className={cn(
                'flex h-full w-full flex-col bg-sidebar text-sidebar-foreground',
                className,
            )}
        >
            <div className="border-b border-sidebar-border p-2">
                <Link
                    href="/events"
                    className="flex items-center gap-2 rounded-md p-2 hover:bg-sidebar-accent"
                >
                    <AppLogo />
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
                <NavMain items={mainNavItems} />
            </div>

            <div className="mt-auto border-t border-sidebar-border py-2">
                <NavFooter items={footerNavItems} />
                <NavUser />
            </div>
        </div>
    );
}

export default function AppSidebar() {
    const { isMobile, openMobile, setOpenMobile, open, state } = useSidebar();

    if (isMobile) {
        return (
            <>
                {openMobile ? (
                    <div
                        className="fixed inset-0 z-40 bg-black/50 md:hidden"
                        onClick={() => setOpenMobile(false)}
                        aria-hidden="true"
                    />
                ) : null}
                <aside
                    className={cn(
                        'fixed inset-y-0 left-0 z-50 flex h-svh flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200 md:hidden',
                        openMobile ? 'translate-x-0' : '-translate-x-full',
                    )}
                    style={{ width: SIDEBAR_WIDTH_MOBILE }}
                >
                    <SidebarPanel />
                </aside>
            </>
        );
    }

    return (
        <aside
            data-state={state}
            className="group/sidebar peer fixed inset-y-0 left-0 z-10 hidden h-svh flex-col border-r border-neutral-200 transition-[width] duration-200 md:flex dark:border-neutral-800"
            style={{
                width: open ? SIDEBAR_WIDTH : SIDEBAR_WIDTH_ICON,
            }}
        >
            <SidebarPanel
                className={cn(!open && '[&_span:not(.sr-only)]:hidden')}
            />
        </aside>
    );
}
