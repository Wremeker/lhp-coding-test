import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';

export default function Dashboard() {
    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Dashboard',
                    href: dashboard(),
                },
            ]}
        >
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col items-center justify-center gap-4 rounded-xl p-8 text-center">
                <h1 className="text-2xl font-semibold">Dashboard</h1>
            </div>
        </AppLayout>
    );
}
