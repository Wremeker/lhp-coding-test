import type { ReactNode } from 'react';
import { coverGradient, type DisplayEvent } from '@/data/events-api';
import { cn } from '@/lib/utils';

interface EventCoverProps {
    event: Pick<
        DisplayEvent,
        'images' | 'title' | 'catLabel' | 'category' | 'id' | 'catColor'
    >;
    /** Which image from the gallery to show (defaults to the first). */
    index?: number;
    className?: string;
    imgClassName?: string;
    children?: ReactNode;
}

/** Event thumbnail / hero — uploaded photo when available, otherwise a category tint. */
export function EventCover({
    event,
    index = 0,
    className = '',
    imgClassName = 'h-full w-full object-cover',
    children,
}: EventCoverProps) {
    const src = event.images[index] ?? event.images[0];

    return (
        <div
            className={cn(
                'relative overflow-hidden',
                !src && '[background:var(--cover-bg)]',
                className,
            )}
            style={
                src
                    ? undefined
                    : ({
                          '--cover-bg': coverGradient(
                              event.category,
                              event.id,
                              index,
                          ),
                      } as React.CSSProperties)
            }
        >
            {src ? (
                <img
                    src={src}
                    alt={`${event.title} — image ${index + 1}`}
                    className={imgClassName}
                    loading="lazy"
                    decoding="async"
                />
            ) : (
                <span className="sr-only">{event.title}</span>
            )}
            {children}
        </div>
    );
}
