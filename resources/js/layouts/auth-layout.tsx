import type { ReactNode } from 'react';
import AuthSimpleLayout from '@/layouts/auth/auth-simple-layout';

type AuthLayoutProps = {
    title?: string;
    description?: string;
    children: ReactNode;
};

export default function AuthLayout({
    title = '',
    description = '',
    children,
}: AuthLayoutProps) {
    return (
        <AuthSimpleLayout title={title} description={description}>
            {children}
        </AuthSimpleLayout>
    );
}
