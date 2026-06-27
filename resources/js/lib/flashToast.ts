import { router } from '@inertiajs/react';
import { toast } from '@heroui/react';
import type { FlashToast } from '@/types/ui';

const toastByType = {
    success: toast.success,
    info: toast.info,
    warning: toast.warning,
    error: toast.danger,
} as const;

export function initializeFlashToast(): void {
    router.on('flash', (event) => {
        const data = event.detail?.flash?.toast as FlashToast | undefined;

        if (!data) {
            return;
        }

        toastByType[data.type](data.message);
    });
}
