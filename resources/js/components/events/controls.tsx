import {
    Button,
    I18nProvider,
    Input,
    Label,
    ListBox,
    Modal,
    Popover,
    RangeCalendar,
    Select,
    TextField,
    useOverlayState,
} from '@heroui/react';
import type { DateValue } from '@internationalized/date';
import {
    Calendar as CalendarIcon,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Search,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

/** A selected from–to date range (HeroUI/react-aria date values), or null when cleared. */
export type DateRange = { start: DateValue; end: DateValue } | null;

/** Shared left-rail width and right accent border for map/timeline filter sidebars. */
export const FILTER_RAIL_CLASS = 'md:w-[360px] md:border-r-[3px] md:border-r-sky-500';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Fri, Jul 3" from a YYYY-MM-DD string (used by the date-range pill + modal). */
function fmtShort(date: string): string {
    const [y, m, d] = date.split('-').map(Number);
    const x = new Date(Date.UTC(y, m - 1, d));

    return `${DOW[x.getUTCDay()]}, ${MONTHS[x.getUTCMonth()]} ${d}`;
}

/**
 * Minimal shape the registration modal needs. Both the mock `CulturaEvent` and
 * the API-backed `DisplayEvent` satisfy it, so the modal is shared across views.
 */
export interface RegisterableEvent {
    id: string;
    title: string;
    date: string;
    city: string | null;
    country: string | null;
    covers: string[];
}

/**
 * Shared, HeroUI-based controls for the Events views (Map + Timeline).
 * Centralising them keeps the two layouts consistent and avoids duplicating
 * the verbose HeroUI compound APIs.
 */

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

interface Option {
    value: string;
    label: string;
}

/** Search box (HeroUI TextField + Input) with a leading search icon. */
export function EventSearch({
    value,
    onChange,
    placeholder,
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}) {
    return (
        <TextField
            aria-label="Search events"
            value={value}
            onChange={onChange}
            className="relative w-full"
        >
            <Search className="pointer-events-none absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
                placeholder={placeholder}
                className="w-full pl-9 placeholder:text-zinc-500"
            />
        </TextField>
    );
}

/** Labelled dropdown (HeroUI Select + ListBox). */
export function FilterSelect({
    ariaLabel,
    value,
    onChange,
    options,
    className,
}: {
    ariaLabel: string;
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    className?: string;
}) {
    return (
        <Select
            aria-label={ariaLabel}
            selectedKey={value}
            onSelectionChange={(key) => onChange(String(key))}
            className={className}
        >
            <Select.Trigger className="w-full">
                <Select.Value />
                <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
                <ListBox>
                    {options.map((o) => (
                        <ListBox.Item key={o.value} id={o.value}>
                            {o.label}
                        </ListBox.Item>
                    ))}
                </ListBox>
            </Select.Popover>
        </Select>
    );
}

/**
 * Date-range filter — a HeroUI Popover (anchored to its trigger button) holding
 * a standalone RangeCalendar. The trigger shows the selected range (or "Any
 * dates"); a clear button appears once a range is picked.
 *
 * A plain Popover + RangeCalendar is used rather than DateRangePicker because
 * the latter anchors its popover to an editable date-input group we don't want;
 * without that group its popover fails to position (renders at 0,0).
 */
export function DateRangeFilter({
    value,
    onChange,
}: {
    value: DateRange;
    onChange: (value: DateRange) => void;
}) {
    const label = value
        ? value.start.toString() === value.end.toString()
            ? fmtShort(value.start.toString())
            : `${fmtShort(value.start.toString())} – ${fmtShort(value.end.toString())}`
        : 'Any date or range';

    return (
        <div className="flex items-center gap-2">
            <Popover>
                <Popover.Trigger className="min-w-0 flex-1">
                    <Button
                        variant="outline"
                        className="h-[38px] w-full justify-between gap-2 rounded-[11px] border-black/10 bg-zinc-50 px-3 text-[13px] font-semibold text-zinc-800"
                    >
                        <span className="flex min-w-0 items-center gap-2 truncate">
                            <CalendarIcon className="h-4 w-4 flex-none text-zinc-400" />
                            <span className="truncate">{label}</span>
                        </span>
                        <ChevronDown className="h-4 w-4 flex-none text-zinc-400" />
                    </Button>
                </Popover.Trigger>
                <Popover.Content placement="bottom start" className="z-[900]">
                    {/* Force English regardless of the browser locale. */}
                    <I18nProvider locale="en-US">
                        <Popover.Dialog className="rounded-xl border border-black/10 bg-white p-0 shadow-xl">
                            <RangeCalendar
                                value={value}
                                onChange={onChange}
                                className="w-[17rem] max-w-[calc(100vw-2rem)] p-3"
                            >
                                <RangeCalendar.Header className="mb-2 flex items-center justify-between gap-2 px-1">
                                    <RangeCalendar.NavButton slot="previous">
                                        <ChevronLeft className="h-4 w-4" />
                                    </RangeCalendar.NavButton>
                                    <RangeCalendar.Heading className="text-[13px] font-bold" />
                                    <RangeCalendar.NavButton slot="next">
                                        <ChevronRight className="h-4 w-4" />
                                    </RangeCalendar.NavButton>
                                </RangeCalendar.Header>
                                <RangeCalendar.Grid className="w-full border-collapse">
                                    <RangeCalendar.GridHeader>
                                        {(day) => (
                                            <RangeCalendar.HeaderCell className="h-8 w-9 text-center text-[11px] font-semibold text-zinc-400">
                                                {day}
                                            </RangeCalendar.HeaderCell>
                                        )}
                                    </RangeCalendar.GridHeader>
                                    <RangeCalendar.GridBody>
                                        {(date) => (
                                            <RangeCalendar.Cell
                                                date={date}
                                                className="mx-auto flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-[13px]"
                                            />
                                        )}
                                    </RangeCalendar.GridBody>
                                </RangeCalendar.Grid>
                            </RangeCalendar>
                        </Popover.Dialog>
                    </I18nProvider>
                </Popover.Content>
            </Popover>

            {value && (
                <Button
                    isIconOnly
                    variant="outline"
                    size="sm"
                    onPress={() => onChange(null)}
                    aria-label="Clear date range"
                    className="h-[38px] w-[38px] flex-none rounded-[11px] border-black/10 bg-zinc-50 text-zinc-500"
                >
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}

/**
 * Generic multi-select category pills. Driven by `options` (value/label/colour)
 * so it works with any category set; a chip is highlighted when its value is in
 * the `selected` set.
 */
export function CategoryChips({
    options,
    selected,
    onToggle,
}: {
    options: { value: string; label: string; color: string }[];
    selected: Set<string>;
    onToggle: (value: string) => void;
}) {
    return (
        <div className="flex flex-wrap items-center gap-[7px]">
            {options.map((o) => {
                const on = selected.has(o.value);

                return (
                    <Button
                        key={o.value}
                        size="sm"
                        variant="outline"
                        onPress={() => onToggle(o.value)}
                        aria-pressed={on}
                        className="rounded-full px-3 text-xs font-bold"
                        style={{
                            borderColor: on ? o.color : 'rgba(0,0,0,.12)',
                            background: on ? o.color : '#fff',
                            color: on ? '#fff' : '#71717a',
                        }}
                    >
                        <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: on ? '#fff' : o.color }}
                        />
                        {o.label}
                    </Button>
                );
            })}
        </div>
    );
}

/** Min/max price range filter (two numeric HeroUI inputs). */
export function PriceFilter({
    min,
    max,
    onChange,
}: {
    min: string;
    max: string;
    onChange: (next: { min?: string; max?: string }) => void;
}) {
    return (
        <div className="flex items-center gap-2">
            <TextField
                aria-label="Minimum price"
                value={min}
                onChange={(v) => onChange({ min: v })}
                className="flex-1"
            >
                <Input
                    type="number"
                    min={0}
                    inputMode="decimal"
                    placeholder="Min $"
                    className="w-full placeholder:text-zinc-500"
                />
            </TextField>
            <span className="text-[13px] font-semibold text-zinc-400">–</span>
            <TextField
                aria-label="Maximum price"
                value={max}
                onChange={(v) => onChange({ max: v })}
                className="flex-1"
            >
                <Input
                    type="number"
                    min={0}
                    inputMode="decimal"
                    placeholder="Max $"
                    className="w-full placeholder:text-zinc-500"
                />
            </TextField>
        </div>
    );
}

/**
 * Registration modal (HeroUI Modal + TextField/Input + Button).
 *
 * Opens whenever `event` is set; UI-only — on submit it reports the registered
 * id back to the parent (which persists it to localStorage).
 */
export function RegisterModal({
    event,
    onClose,
    onRegistered,
}: {
    event: RegisterableEvent | null;
    onClose: () => void;
    onRegistered: (id: string) => void;
}) {
    const state = useOverlayState({
        isOpen: !!event,
        onOpenChange: (open) => !open && onClose(),
    });

    const [submitted, setSubmitted] = useState(false);
    const [form, setForm] = useState({ name: '', email: '' });
    const [error, setError] = useState('');
    const [tried, setTried] = useState(false);

    // Reset the form each time a different event opens the modal.
    useEffect(() => {
        if (event) {
            setSubmitted(false);
            setForm({ name: '', email: '' });
            setError('');
            setTried(false);
        }
    }, [event?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    function submit() {
        setTried(true);
        const name = form.name.trim();
        const email = form.email.trim();

        if (!name) {
            return setError('Please enter your name.');
        }

        if (!EMAIL_RE.test(email)) {
            return setError('Please enter a valid email.');
        }

        if (!event) {
            return;
        }

        onRegistered(event.id);
        setError('');
        setSubmitted(true);
    }

    const nameInvalid = tried && !form.name.trim();
    const emailInvalid = tried && !EMAIL_RE.test(form.email.trim());

    // `isDismissable` is disabled because the click that opens the modal would
    // otherwise propagate and be read as an outside-press, closing it instantly.
    // Backdrop clicks are handled manually below; Esc still closes.
    return (
        <Modal state={state}>
            <Modal.Backdrop
                isDismissable={false}
                // z-index above Leaflet's panes/controls (which go up to 1000),
                // otherwise the map tiles paint over the dialog.
                className="z-[2000] bg-zinc-900/50 backdrop-blur-sm"
                onClick={(e) => {
                    const dialog = (
                        e.currentTarget as HTMLElement
                    ).querySelector('[data-slot="modal-dialog"]');

                    if (dialog && !dialog.contains(e.target as Node)) {
                        onClose();
                    }
                }}
            >
                <Modal.Container placement="center">
                    <Modal.Dialog className="evt-pop w-[420px] max-w-full overflow-hidden rounded-[22px] bg-white p-0 shadow-2xl">
                        {event && submitted ? (
                            <div className="px-8 py-11 text-center">
                                <div className="evt-ring mx-auto mb-[18px] flex h-[66px] w-[66px] items-center justify-center rounded-full bg-green-100">
                                    <Check className="h-[34px] w-[34px] text-green-600" />
                                </div>
                                <h2 className="mb-2 text-[23px] font-extrabold tracking-tight">
                                    You're on the list!
                                </h2>
                                <p className="mb-5 text-[14.5px] leading-relaxed font-medium text-zinc-500">
                                    We'll email{' '}
                                    <b className="text-zinc-900">
                                        {form.email}
                                    </b>{' '}
                                    with tickets &amp; updates for{' '}
                                    <b className="text-zinc-900">
                                        {event.title}
                                    </b>
                                    .
                                </p>
                                <Button
                                    variant="primary"
                                    fullWidth
                                    onPress={onClose}
                                    className="h-[46px] rounded-[13px] bg-zinc-900 font-extrabold text-white"
                                >
                                    Done
                                </Button>
                            </div>
                        ) : (
                            event && (
                                <div>
                                    <div
                                        className="relative h-[90px]"
                                        style={{ background: event.covers[0] }}
                                    >
                                        <Button
                                            isIconOnly
                                            variant="ghost"
                                            onPress={onClose}
                                            aria-label="Close"
                                            className="absolute top-3 right-3 h-[30px] w-[30px] rounded-full bg-black/30 text-white backdrop-blur-sm"
                                        >
                                            <X className="h-[15px] w-[15px]" />
                                        </Button>
                                    </div>
                                    <div className="px-[26px] pt-[22px] pb-[26px]">
                                        <div className="mb-1 text-xs font-extrabold tracking-wider text-sky-500 uppercase">
                                            Register interest
                                        </div>
                                        <h2 className="mb-1 text-[21px] leading-tight font-extrabold tracking-tight">
                                            {event.title}
                                        </h2>
                                        <p className="mb-5 text-[13px] font-semibold text-zinc-400">
                                            {fmtShort(event.date)} ·{' '}
                                            {[event.city, event.country]
                                                .filter(Boolean)
                                                .join(', ') || 'Location TBC'}
                                        </p>

                                        <TextField
                                            value={form.name}
                                            onChange={(v) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    name: v,
                                                }))
                                            }
                                            isInvalid={nameInvalid}
                                            className="mb-3.5 w-full"
                                        >
                                            <Label className="mb-1.5 block text-[13px] font-bold">
                                                Full name
                                            </Label>
                                            <Input
                                                placeholder="Ada Lovelace"
                                                className="w-full"
                                            />
                                        </TextField>

                                        <TextField
                                            value={form.email}
                                            onChange={(v) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    email: v,
                                                }))
                                            }
                                            isInvalid={emailInvalid}
                                            className="w-full"
                                        >
                                            <Label className="mb-1.5 block text-[13px] font-bold">
                                                Email address
                                            </Label>
                                            <Input
                                                type="email"
                                                placeholder="ada@example.com"
                                                className="w-full"
                                            />
                                        </TextField>

                                        <div className="mt-1.5 mb-1.5 h-[18px] text-xs font-semibold text-red-500">
                                            {error}
                                        </div>

                                        <Button
                                            variant="primary"
                                            fullWidth
                                            onPress={submit}
                                            className="h-12 rounded-[13px] bg-sky-500 text-[15px] font-extrabold text-white shadow-lg shadow-sky-500/30"
                                        >
                                            Join the list
                                        </Button>
                                        <p className="mt-3 text-center text-[11.5px] font-medium text-zinc-400">
                                            No spam. One reminder before the
                                            event, that's it.
                                        </p>
                                    </div>
                                </div>
                            )
                        )}
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}
