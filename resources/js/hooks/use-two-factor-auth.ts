import { useHttp } from '@inertiajs/react';
import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react';
import { qrCode, recoveryCodes, secretKey } from '@/routes/two-factor';

export type UseTwoFactorAuthReturn = {
    qrCodeSvg: string | null;
    manualSetupKey: string | null;
    recoveryCodesList: string[];
    errors: string[];
    hasSetupData: boolean;
    clearSetupData: () => void;
    clearErrors: () => void;
    clearTwoFactorAuthData: () => void;
    fetchQrCode: () => Promise<void>;
    fetchSetupKey: () => Promise<void>;
    fetchSetupData: () => Promise<void>;
    fetchRecoveryCodes: () => Promise<void>;
};

type TwoFactorStore = {
    qrCodeSvg: string | null;
    manualSetupKey: string | null;
    recoveryCodesList: string[];
    errors: string[];
};

let store: TwoFactorStore = {
    qrCodeSvg: null,
    manualSetupKey: null,
    recoveryCodesList: [],
    errors: [],
};

const listeners = new Set<() => void>();

function emitChange() {
    listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
    listeners.add(listener);

    return () => listeners.delete(listener);
}

function getSnapshot(): TwoFactorStore {
    return store;
}

export function useTwoFactorAuth(): UseTwoFactorAuthReturn {
    const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
    const http = useHttp();
    const httpRef = useRef(http);
    httpRef.current = http;

    const hasSetupData = useMemo(
        () => state.qrCodeSvg !== null && state.manualSetupKey !== null,
        [state.manualSetupKey, state.qrCodeSvg],
    );

    const clearErrors = useCallback(() => {
        store = { ...store, errors: [] };
        emitChange();
    }, []);

    const clearSetupData = useCallback(() => {
        store = {
            ...store,
            manualSetupKey: null,
            qrCodeSvg: null,
            errors: [],
        };
        emitChange();
    }, []);

    const clearTwoFactorAuthData = useCallback(() => {
        store = {
            qrCodeSvg: null,
            manualSetupKey: null,
            recoveryCodesList: [],
            errors: [],
        };
        emitChange();
    }, []);

    const fetchQrCode = useCallback(async (): Promise<void> => {
        try {
            const { svg } = (await httpRef.current.submit(qrCode())) as {
                svg: string;
                url: string;
            };

            store = { ...store, qrCodeSvg: svg };
            emitChange();
        } catch {
            store = {
                ...store,
                errors: [...store.errors, 'Failed to fetch QR code'],
                qrCodeSvg: null,
            };
            emitChange();
        }
    }, []);

    const fetchSetupKey = useCallback(async (): Promise<void> => {
        try {
            const { secretKey: key } = (await httpRef.current.submit(
                secretKey(),
            )) as {
                secretKey: string;
            };

            store = { ...store, manualSetupKey: key };
            emitChange();
        } catch {
            store = {
                ...store,
                errors: [...store.errors, 'Failed to fetch a setup key'],
                manualSetupKey: null,
            };
            emitChange();
        }
    }, []);

    const fetchRecoveryCodes = useCallback(async (): Promise<void> => {
        try {
            store = { ...store, errors: [] };
            emitChange();

            const codes = (await httpRef.current.submit(
                recoveryCodes(),
            )) as string[];

            store = { ...store, recoveryCodesList: codes };
            emitChange();
        } catch {
            store = {
                ...store,
                errors: [...store.errors, 'Failed to fetch recovery codes'],
                recoveryCodesList: [],
            };
            emitChange();
        }
    }, []);

    const fetchSetupData = useCallback(async (): Promise<void> => {
        try {
            store = { ...store, errors: [] };
            emitChange();
            await Promise.all([fetchQrCode(), fetchSetupKey()]);
        } catch {
            store = {
                ...store,
                qrCodeSvg: null,
                manualSetupKey: null,
            };
            emitChange();
        }
    }, [fetchQrCode, fetchSetupKey]);

    return {
        qrCodeSvg: state.qrCodeSvg,
        manualSetupKey: state.manualSetupKey,
        recoveryCodesList: state.recoveryCodesList,
        errors: state.errors,
        hasSetupData,
        clearSetupData,
        clearErrors,
        clearTwoFactorAuthData,
        fetchQrCode,
        fetchSetupKey,
        fetchSetupData,
        fetchRecoveryCodes,
    };
}
