import type { LinkComponentBaseProps } from '@inertiajs/core';
import { Link } from '@inertiajs/react';
import type { ElementType, ReactNode } from 'react';

type TextLinkProps = {
    href: LinkComponentBaseProps['href'];
    children: ReactNode;
    tabindex?: number;
    method?: LinkComponentBaseProps['method'];
    as?: ElementType;
};

export default function TextLink({
    href,
    children,
    tabindex,
    method,
    as,
}: TextLinkProps) {
    return (
        <Link
            href={href}
            tabIndex={tabindex}
            method={method}
            as={as}
            className="text-foreground decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out underline hover:decoration-current! dark:decoration-neutral-500"
        >
            {children}
        </Link>
    );
}
