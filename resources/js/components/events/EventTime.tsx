interface EventTimeProps {
    event: {
        time: string;
        timezoneLabel: string;
        userTimeHint?: string | null;
    };
    /** Show "X your time" when the viewer is in a different timezone. */
    showUserHint?: boolean;
    hintClassName?: string;
}

/** Venue-local start time with timezone abbreviation. */
export function EventTime({ event, showUserHint = false, hintClassName }: EventTimeProps) {
    if (!event.time) {
        return <span>Time TBC</span>;
    }

    return (
        <>
            {event.time}
            <span className="text-slate-300"> · </span>
            <span>{event.timezoneLabel}</span>
            {showUserHint && event.userTimeHint && (
                <span className={hintClassName ?? 'font-normal text-zinc-400'}>
                    {' '}
                    ({event.userTimeHint})
                </span>
            )}
        </>
    );
}
