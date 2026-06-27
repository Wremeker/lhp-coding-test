import { useCallback } from 'react';

export type UseInitialsReturn = {
    getInitials: (fullName?: string) => string;
};

function getInitial(name: string): string {
    return Array.from(name)[0] ?? '';
}

export function getInitials(fullName?: string): string {
    if (!fullName) {
        return '';
    }

    const names = fullName.trim().split(/\s+/u).filter(Boolean);

    if (names.length === 0) {
        return '';
    }

    if (names.length === 1) {
        return getInitial(names[0]).toUpperCase();
    }

    const firstInitial = getInitial(names[0]);
    const lastInitial = getInitial(names[names.length - 1]);

    return `${firstInitial}${lastInitial}`.toUpperCase();
}

export function useInitials(): UseInitialsReturn {
    const getInitialsCallback = useCallback(
        (fullName?: string): string => getInitials(fullName),
        [],
    );

    return { getInitials: getInitialsCallback };
}
