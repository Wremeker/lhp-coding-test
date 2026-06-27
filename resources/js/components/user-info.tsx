import { Avatar } from '@heroui/react';
import { getInitials } from '@/hooks/use-initials';
import type { User } from '@/types';

type UserInfoProps = {
    user: User;
    showEmail?: boolean;
};

export default function UserInfo({ user, showEmail = false }: UserInfoProps) {
    const showAvatar = Boolean(user.avatar && user.avatar !== '');

    return (
        <>
            <Avatar className="h-8 w-8 overflow-hidden rounded-lg">
                {showAvatar ? (
                    <Avatar.Image src={user.avatar!} alt={user.name} />
                ) : null}
                <Avatar.Fallback className="rounded-lg text-black dark:text-white">
                    {getInitials(user.name)}
                </Avatar.Fallback>
            </Avatar>

            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                {showEmail ? (
                    <span className="text-muted-foreground truncate text-xs">
                        {user.email}
                    </span>
                ) : null}
            </div>
        </>
    );
}
