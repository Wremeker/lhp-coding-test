import { ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { Head } from '@inertiajs/react';
import { Clock, MapPin } from 'lucide-react';
import { useState } from 'react';
import MapView from '@/components/events/MapView';
import TimelineView from '@/components/events/TimelineView';

/**
 * Events page — a single screen that toggles between two layouts of the same
 * events: the Map view and the Timeline view. The page owns the shared chrome
 * (header + view toggle + fonts/animations); each view renders its own body.
 * The view switch is a HeroUI ToggleButtonGroup.
 *
 * Both views read the same `/events/data` API (filtered, date-sorted, paginated).
 */

type View = 'map' | 'timeline';

const TABS: { id: View; label: string; Icon: typeof MapPin }[] = [
    { id: 'map', label: 'Map', Icon: MapPin },
    { id: 'timeline', label: 'Timeline', Icon: Clock },
];

export default function Index() {
    const [view, setView] = useState<View>('map');

    return (
        <>
            <Head title="Events">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin=""
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <div className="relative flex h-screen flex-col overflow-hidden bg-zinc-100 font-manrope text-zinc-900">
                {/* VIEW TOGGLE (HeroUI) — floats over the content, top-right */}
                <ToggleButtonGroup
                    selectionMode="single"
                    disallowEmptySelection
                    selectedKeys={[view]}
                    onSelectionChange={(keys) => {
                        const next = [...keys][0];

                        if (next) {
                            setView(next as View);
                        }
                    }}
                    className="absolute top-3 right-3 z-[800] rounded-xl border border-black/[0.07] bg-white/90 p-1 shadow-lg backdrop-blur-md sm:top-4 sm:right-4"
                >
                    {TABS.map(({ id, label, Icon }) => {
                        const active = view === id;

                        return (
                            <ToggleButton
                                key={id}
                                id={id}
                                className={`flex items-center gap-[7px] rounded-[9px] px-[15px] py-[7px] text-[13.5px] font-bold transition-colors ${
                                    active
                                        ? 'bg-white text-zinc-900 shadow-sm'
                                        : 'text-zinc-500 hover:text-zinc-800'
                                }`}
                            >
                                <Icon
                                    className={`h-[15px] w-[15px] ${active ? 'text-sky-500' : ''}`}
                                />
                                {label}
                            </ToggleButton>
                        );
                    })}
                </ToggleButtonGroup>

                {view === 'map' ? <MapView /> : <TimelineView />}
            </div>
        </>
    );
}
