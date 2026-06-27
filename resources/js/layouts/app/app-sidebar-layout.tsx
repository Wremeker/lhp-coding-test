import type { ReactNode } from 'react';
import { Toast } from '@heroui/react';
import AppContent from '@/components/app-content';
import AppShell from '@/components/app-shell';
import AppSidebar from '@/components/app-sidebar';
import AppSidebarHeader from '@/components/app-sidebar-header';
import type { BreadcrumbItem } from '@/types';

type AppSidebarLayoutProps = {
    breadcrumbs?: BreadcrumbItem[];
    children: ReactNode;
};

export default function AppSidebarLayout({
    breadcrumbs = [],
    children,
}: AppSidebarLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
            </AppContent>
            <Toast.Provider placement="bottom end" />
        </AppShell>
    );
}
