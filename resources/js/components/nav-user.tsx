import { usePage } from '@inertiajs/react';
import { Dropdown } from '@heroui/react';
import { ChevronsUpDown } from 'lucide-react';
import UserInfo from '@/components/user-info';
import UserMenuContent from '@/components/user-menu-content';
import { useSidebar } from '@/components/app-shell';
import type { User } from '@/types';

export default function NavUser() {
    const { props } = usePage<{ auth: { user: User | null } }>();
    const user = props.auth.user;
    const { isMobile, state } = useSidebar();

    if (!user) {
        return null;
    }

    return (
        <div className="px-2 py-2">
            <Dropdown>
                <Dropdown.Trigger
                    className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground flex w-full items-center gap-2 rounded-md px-2 py-2"
                    data-test="sidebar-menu-button"
                >
                    <UserInfo user={user} />
                    <ChevronsUpDown className="ml-auto size-4" />
                </Dropdown.Trigger>
                <Dropdown.Popover
                    placement={
                        isMobile
                            ? 'bottom'
                            : state === 'collapsed'
                              ? 'left'
                              : 'bottom'
                    }
                    className="min-w-56 rounded-lg"
                >
                    <UserMenuContent user={user} />
                </Dropdown.Popover>
            </Dropdown>
        </div>
    );
}
