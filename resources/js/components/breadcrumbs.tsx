import { Breadcrumbs as HeroUIBreadcrumbs } from '@heroui/react';
import type { BreadcrumbItem } from '@/types';
import { toUrl } from '@/lib/utils';

type BreadcrumbsProps = {
    breadcrumbs: BreadcrumbItem[];
};

export default function Breadcrumbs({ breadcrumbs }: BreadcrumbsProps) {
    if (breadcrumbs.length === 0) {
        return null;
    }

    return (
        <HeroUIBreadcrumbs>
            {breadcrumbs.map((item, index) => {
                const isLast = index === breadcrumbs.length - 1;

                return (
                    <HeroUIBreadcrumbs.Item
                        key={`${item.title}-${index}`}
                        href={isLast ? undefined : toUrl(item.href)}
                    >
                        {item.title}
                    </HeroUIBreadcrumbs.Item>
                );
            })}
        </HeroUIBreadcrumbs>
    );
}
