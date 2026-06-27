import type { ReactNode } from 'react';
import type { BreadcrumbItem } from '@/types/navigation';

export type Appearance = 'light';
export type ResolvedAppearance = 'light';

export type AppLayoutProps = {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
};

export type AppVariant = 'header' | 'sidebar';

export type FlashToast = {
    type: 'success' | 'info' | 'warning' | 'error';
    message: string;
};
