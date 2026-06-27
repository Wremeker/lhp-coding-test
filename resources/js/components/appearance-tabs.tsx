import { Sun } from 'lucide-react';

export default function AppearanceTabs() {
    return (
        <div className="inline-flex gap-1 rounded-lg bg-neutral-100 p-1">
            <div className="flex items-center rounded-md bg-white px-3.5 py-1.5 shadow-xs">
                <Sun className="-ml-1 h-4 w-4" />
                <span className="ml-1.5 text-sm">Light</span>
            </div>
        </div>
    );
}
