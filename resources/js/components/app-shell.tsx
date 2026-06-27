import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import { usePage } from '@inertiajs/react';
import type { AppVariant } from '@/types';

export const SIDEBAR_WIDTH = '16rem';
export const SIDEBAR_WIDTH_MOBILE = '18rem';
export const SIDEBAR_WIDTH_ICON = '3rem';

type SidebarState = 'expanded' | 'collapsed';

type SidebarContextValue = {
    state: SidebarState;
    open: boolean;
    setOpen: (open: boolean) => void;
    isMobile: boolean;
    openMobile: boolean;
    setOpenMobile: (open: boolean) => void;
    toggleSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar(): SidebarContextValue {
    const context = useContext(SidebarContext);

    if (!context) {
        throw new Error('useSidebar must be used within AppShell');
    }

    return context;
}

type AppShellProps = {
    variant?: AppVariant;
    children: ReactNode;
};

export default function AppShell({
    variant = 'sidebar',
    children,
}: AppShellProps) {
    const { props } = usePage();
    const defaultOpen = props.sidebarOpen as boolean;
    const [open, setOpen] = useState(defaultOpen);
    const [openMobile, setOpenMobile] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(max-width: 767px)');
        const update = () => setIsMobile(mediaQuery.matches);

        update();
        mediaQuery.addEventListener('change', update);

        return () => mediaQuery.removeEventListener('change', update);
    }, []);

    const state: SidebarState = open ? 'expanded' : 'collapsed';

    const toggleSidebar = useCallback(() => {
        if (isMobile) {
            setOpenMobile((current) => !current);
            return;
        }

        setOpen((current) => !current);
    }, [isMobile]);

    const value = useMemo<SidebarContextValue>(
        () => ({
            state,
            open,
            setOpen,
            isMobile,
            openMobile,
            setOpenMobile,
            toggleSidebar,
        }),
        [isMobile, open, openMobile, state, toggleSidebar],
    );

    if (variant === 'header') {
        return (
            <div className="flex min-h-screen w-full flex-col">{children}</div>
        );
    }

    return (
        <SidebarContext.Provider value={value}>
            <div
                className="group/sidebar-wrapper flex min-h-svh w-full"
                data-state={state}
                style={
                    {
                        '--sidebar-width': SIDEBAR_WIDTH,
                        '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
                    } as React.CSSProperties
                }
            >
                {children}
            </div>
        </SidebarContext.Provider>
    );
}
