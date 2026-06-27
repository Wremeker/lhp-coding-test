import { Button } from '@heroui/react';
import { PanelLeft } from 'lucide-react';
import Breadcrumbs from '@/components/breadcrumbs';
import { useSidebar } from '@/components/app-shell';
import type { BreadcrumbItem } from '@/types';

type AppSidebarHeaderProps = {
    breadcrumbs?: BreadcrumbItem[];
};

export default function AppSidebarHeader({
    breadcrumbs = [],
}: AppSidebarHeaderProps) {
    const { toggleSidebar } = useSidebar();

    return (
        <header className="border-sidebar-border/70 flex h-16 shrink-0 items-center gap-2 border-b px-6 transition-[width,height] ease-linear md:px-4">
            <div className="flex items-center gap-2">
                <Button
                    isIconOnly
                    variant="ghost"
                    size="sm"
                    className="-ml-1"
                    onPress={toggleSidebar}
                    aria-label="Toggle sidebar"
                >
                    <PanelLeft className="size-4" />
                </Button>
                {breadcrumbs.length > 0 ? (
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                ) : null}
            </div>
        </header>
    );
}
