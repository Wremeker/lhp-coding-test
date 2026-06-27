import { Link, router } from '@inertiajs/react';
import { Dropdown, Separator } from '@heroui/react';
import { LogOut, Settings } from 'lucide-react';
import UserInfo from '@/components/user-info';
import { logout } from '@/routes';
import { edit } from '@/routes/profile';
import type { User } from '@/types';

type UserMenuContentProps = {
    user: User;
};

export default function UserMenuContent({ user }: UserMenuContentProps) {
    const handleLogout = () => {
        router.flushAll();
    };

    return (
        <div className="p-1">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm font-normal">
                <UserInfo user={user} showEmail />
            </div>
            <Separator className="my-1" />
            <Dropdown.Menu aria-label="User menu">
                <Dropdown.Item id="settings" textValue="Settings">
                    <Link
                        className="flex w-full cursor-pointer items-center"
                        href={edit()}
                        prefetch
                    >
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                    </Link>
                </Dropdown.Item>
                <Dropdown.Item id="logout" textValue="Log out">
                    <Link
                        className="flex w-full cursor-pointer items-center"
                        href={logout()}
                        onClick={handleLogout}
                        as="button"
                        data-test="logout-button"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                    </Link>
                </Dropdown.Item>
            </Dropdown.Menu>
        </div>
    );
}
