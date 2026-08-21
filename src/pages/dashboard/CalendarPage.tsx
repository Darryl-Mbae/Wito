import React, { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { EmptyState } from "../../components/EmptyState";
import AssignedTasksWidget from "../../components/AssignedTasksWidget";
import {
    getFirestore,
    collection,
    query,
    where,
    onSnapshot,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import app from "../../config/firebase";
import { type DashboardContextType } from "../Dashboard";
import {
    ChevronLeft,
    ChevronRight,
    X,
    MapPin,
    Clock,
    Calendar,
    Link2,
    Copy,
    Check,
    Users,
    Video,
    Plus,
    PanelRightOpen,
    PanelRightClose,
    Sparkles,
    CheckSquare,
    MoreVertical,
} from "lucide-react";
import { getAssigneeColor } from "../../utils/userColors";
import AddToCalendar from "../../components/AddToCalendar";

// ─── Types ───────────────────────────────────────────────────────────────────

type CalEvent = {
    id: string;
    name: string;
    date: string;
    time: string;
    location?: string;
    fee?: string;
    description?: string;
    dresscode?: string;
    imageUrl?: string;
    orgId?: string;
    registered?: unknown[];
    isTask?: boolean;
    status?: "todo" | "done";
    assignee?: string;
    visibility?: "public" | "private";
    createdBy?: string;
    dueDate?: string | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
    const d = new Date(year, month, 1).getDay();
    return (d + 6) % 7;
}
function toYMD(year: number, month: number, day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function isVirtual(loc?: string) {
    if (!loc) return false;
    return loc.startsWith("http") || loc.toLowerCase().includes("meet") || loc.toLowerCase().includes("zoom");
}
function formatTime(t: string) {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}
function formatDateLong(dateStr: string) {
    const [y, mo, d] = dateStr.split("-").map(Number);
    return new Date(y, mo - 1, d).toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
}


const EVENT_COLORS = [
    { pill: "bg-[#7877C6]/12 text-[#7877C6] border-l-[3px] border-[#7877C6]", dot: "bg-[#7877C6]" },
    { pill: "bg-emerald-50 text-emerald-700 border-l-[3px] border-emerald-400", dot: "bg-emerald-400" },
    { pill: "bg-amber-50 text-amber-700 border-l-[3px] border-amber-400", dot: "bg-amber-400" },
    { pill: "bg-rose-50 text-rose-700 border-l-[3px] border-rose-400", dot: "bg-rose-400" },
    { pill: "bg-sky-50 text-sky-700 border-l-[3px] border-sky-400", dot: "bg-sky-400" },
];
function eventColor(idx: number) {
    return EVENT_COLORS[idx % EVENT_COLORS.length];
}

// ─── Mini Calendar ────────────────────────────────────────────────────────────

const MiniCalendar: React.FC<{
    year: number;
    month: number;
    selectedDate: string | null;
    eventDates: Set<string>;
    onSelect: (d: string) => void;
    onNavigate: (y: number, m: number) => void;
}> = ({ year, month, selectedDate, eventDates, onSelect, onNavigate }) => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const today = new Date();
    const todayStr = toYMD(today.getFullYear(), today.getMonth(), today.getDate());

    const cells: (number | null)[] = [
        ...Array(firstDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 select-none">
            <div className="flex items-center justify-between mb-3">
                <button
                    onClick={() => month === 0 ? onNavigate(year - 1, 11) : onNavigate(year, month - 1)}
                    className="p-1 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                >
                    <ChevronLeft size={13} className="text-gray-400" />
                </button>
                <span className="text-[11px] font-semibold text-gray-700">
                    {MONTHS[month].slice(0, 3)} {year}
                </span>
                <button
                    onClick={() => month === 11 ? onNavigate(year + 1, 0) : onNavigate(year, month + 1)}
                    className="p-1 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                >
                    <ChevronRight size={13} className="text-gray-400" />
                </button>
            </div>

            <div className="grid grid-cols-7 mb-1">
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                    <div key={i} className="text-center text-[9px] font-medium text-gray-300 py-0.5">{d}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-y-2.5">
                {cells.map((day, i) => {
                    if (!day) return <div key={i} />;
                    const ymd = toYMD(year, month, day);
                    const isToday = ymd === todayStr;
                    const isSelected = ymd === selectedDate;
                    const hasEvent = eventDates.has(ymd);
                    return (
                        <button
                            key={i}
                            onClick={() => onSelect(ymd)}
                            className={`relative h-10 w-full flex items-center justify-center rounded-lg text-[11px] font-medium transition cursor-pointer 
                                ${isSelected ? "bg-[#7877C6] text-white" : isToday ? "bg-[#7877C6]/10 text-[#7877C6]" : "hover:bg-gray-100 text-gray-600"}`}
                        >
                            {day}
                            {hasEvent && !isSelected && (
                                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-[3px] w-[3px] rounded-full bg-[#7877C6]/50" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// ─── Event Detail Panel ───────────────────────────────────────────────────────

const EventPanel: React.FC<{
    event: CalEvent | null;
    colorClass: string;
    onClose: () => void;
}> = ({ event, colorClass, onClose }) => {
    const navigate = useNavigate();
    const [copied, setCopied] = useState(false);
    const shareLink = event ? `${window.location.origin}/event/${event.id}` : "";

    const copyLink = () => {
        navigator.clipboard.writeText(shareLink).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };


    return (
        <div className={`fixed inset-y-0 right-0 z-60 w-full sm:w-[360px] bg-white border-l border-gray-100 shadow-xl flex flex-col
            transition-transform duration-300 ease-out ${event ? "translate-x-0" : "translate-x-full"}`}
        >
            {event && (
                <>
                    {/* Image or color bar */}
                    {event.imageUrl ? (
                        <div className="relative h-32 w-full shrink-0">
                            <img src={event.imageUrl} alt={event.name} className="h-full w-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/40" />
                            <button
                                onClick={onClose}
                                className="absolute top-3 right-3 p-1.5 rounded-xl bg-black/20 hover:bg-black/30 transition cursor-pointer"
                            >
                                <X size={14} className="text-white" />
                            </button>
                        </div>
                    ) : (
                        <div className={`h-1.5 w-full shrink-0 ${colorClass.split(" ").find(c => c.startsWith("border-l")) ? "" : ""}`}
                            style={{ background: "#7877C6" }}
                        />
                    )}

                    {/* Header */}
                    <div className="flex items-start justify-between p-5 border-b border-gray-100">
                        <div className="flex-1 pr-3">
                            <p className="text-[10px] font-semibold text-[#7877C6] uppercase tracking-widest mb-1">{event.isTask ? "Task" : "Event"}</p>
                            <h2 className={`text-sm font-semibold text-gray-900 leading-snug ${event.isTask && event.status === 'done' ? 'line-through text-gray-500' : ''}`}>{event.name}</h2>
                            {event.isTask && (
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-xs font-medium ${event.status === 'done' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                        {event.status === 'done' ? 'Completed' : 'To Do'}
                                    </span>
                                    {event.assignee && (() => {
                                        const colors = getAssigneeColor(event.assignee);
                                        return (
                                            <span className={`text-[10px] ${colors.text} ${colors.bg} border ${colors.border} px-1.5 py-0.5 rounded-full`}>
                                                @{event.assignee}
                                            </span>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                        {!event.imageUrl && (
                            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 transition cursor-pointer shrink-0">
                                <X size={14} className="text-gray-400" />
                            </button>
                        )}
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-4">
                        <div className="space-y-2.5">
                            {[
                                {
                                    icon: <Calendar size={12} className="text-[#7877C6]" />,
                                    value: formatDateLong(event.date),
                                },
                                {
                                    icon: <Clock size={12} className="text-[#7877C6]" />,
                                    value: formatTime(event.time),
                                },
                                event.location && {
                                    icon: isVirtual(event.location)
                                        ? <Video size={12} className="text-[#7877C6]" />
                                        : <MapPin size={12} className="text-[#7877C6]" />,
                                    value: isVirtual(event.location)
                                        ? (event.location.toLowerCase().includes("meet") ? "Google Meet" : "Online")
                                        : event.location,
                                },
                                event.fee && {
                                    icon: <span className="text-[10px] font-bold text-[#7877C6]">KES</span>,
                                    value: `${event.fee} entry fee`,
                                },
                                (event.registered !== undefined) && {
                                    icon: <Users size={12} className="text-[#7877C6]" />,
                                    value: `${event.registered?.length ?? 0} registered`,
                                },
                            ].filter(Boolean).map((item: any, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="h-6 w-6 rounded-lg bg-[#7877C6]/8 flex items-center justify-center shrink-0">
                                        {item.icon}
                                    </div>
                                    <p className="text-xs text-gray-700">{item.value}</p>
                                </div>
                            ))}
                        </div>

                        {event.description && (
                            <div className="bg-gray-50 rounded-xl p-3.5">
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">About</p>
                                <p className="text-xs text-gray-600 leading-relaxed">{event.description}</p>
                            </div>
                        )}

                        {event.dresscode && (
                            <div className="bg-gray-50 rounded-xl p-3.5">
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Dress code</p>
                                <p className="text-xs text-gray-600">{event.dresscode}</p>
                            </div>
                        )}

                        {/* Share */}

                        {!event.isTask &&
                            <div>
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Share</p>
                                <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                                    <Link2 size={11} className="text-gray-400 shrink-0" />
                                    <p className="text-[11px] text-gray-500 flex-1 truncate">{shareLink}</p>
                                    <button
                                        onClick={copyLink}
                                        className="shrink-0 flex items-center gap-1 text-[11px] font-medium text-[#7877C6] hover:text-[#6665b5] transition cursor-pointer"
                                    >
                                        {copied ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
                                    </button>
                                </div>
                            </div>
                        }

                        {!event.isTask && (
                            <AddToCalendar
                                compact
                                event={{
                                    id: event.id,
                                    name: event.name,
                                    date: event.date,
                                    time: event.time,
                                    location: event.location || "",
                                    description: event.description,
                                }}
                            />
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-100">
                        {event.isTask ? (
                            <button
                                onClick={() => navigate("/dashboard/tasks")}
                                className="flex items-center justify-center w-full py-2.5 rounded-xl border border-[#7877C6] text-[#7877C6] text-xs font-medium hover:bg-[#7877C6]/5 transition cursor-pointer"
                            >
                                Go to tasks
                            </button>
                        ) : (
                            <div className="space-y-2">
                                <button
                                    onClick={() => navigate(`/dashboard/design?eventId=${event.id}`)}
                                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-[#7877C6] text-[#7877C6] text-xs font-medium hover:bg-[#7877C6]/5 transition cursor-pointer"
                                >
                                    <Sparkles size={12} />
                                    Create flyer
                                </button>
                                <button
                                    onClick={() => navigate(`/dashboard/events/${event.id}`)}
                                    className="flex items-center justify-center w-full py-2.5 rounded-xl bg-[#7877C6] text-white text-xs font-medium hover:bg-[#6665b5] transition cursor-pointer"
                                >
                                    View full details
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

// ─── Calendar Page ────────────────────────────────────────────────────────────

const CalendarPage: React.FC = () => {
    const { activeOrg } = useOutletContext<DashboardContextType>();
    const navigate = useNavigate();

    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [events, setEvents] = useState<CalEvent[]>([]);
    const [tasks, setTasks] = useState<CalEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Fetch real events from Firestore
    useEffect(() => {
        if (!activeOrg?.id) return;
        const db = getFirestore(app);
        const q = query(collection(db, "events"), where("orgId", "==", activeOrg.id));
        const unsub = onSnapshot(q, (snap) => {
            setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CalEvent)));
            setLoading(false);
        });
        return () => unsub();
    }, [activeOrg?.id]);
    // Fetch tasks
    useEffect(() => {
        const auth = getAuth(app);
        const currentUser = auth.currentUser;
        if (!activeOrg?.id || !currentUser) return;

        const db = getFirestore(app);
        const q = query(collection(db, "tasks"), where("orgId", "==", activeOrg.id));

        const unsub = onSnapshot(q, (snap) => {
            const fetchedTasks: CalEvent[] = [];
            snap.docs.forEach((d) => {
                const data = d.data();

                // Filter tasks based on visibility and permissions
                if (data.visibility === "private") {
                    // Private tasks are only visible to creator and assignee
                    if (data.createdBy !== currentUser.uid && data.assigneeUid !== currentUser.uid) {
                        return;
                    }
                }

                let dateStr = "";
                let timeStr = "";
                if (data.dueDate) {
                    dateStr = data.dueDate;
                    timeStr = "12:00";
                } else if (data.createdAt && data.createdAt.toDate) {
                    const dObj = data.createdAt.toDate();
                    dateStr = toYMD(dObj.getFullYear(), dObj.getMonth(), dObj.getDate());
                    timeStr = `${String(dObj.getHours()).padStart(2, "0")}:${String(dObj.getMinutes()).padStart(2, "0")}`;
                } else {
                    const t = new Date();
                    dateStr = toYMD(t.getFullYear(), t.getMonth(), t.getDate());
                    timeStr = "12:00";
                }

                fetchedTasks.push({
                    id: d.id,
                    name: data.title,
                    date: dateStr,
                    time: timeStr,
                    isTask: true,
                    status: data.status,
                    assignee: data.assignee,
                    visibility: data.visibility,
                    createdBy: data.createdBy,
                    dueDate: data.dueDate || null,
                });
            });
            setTasks(fetchedTasks);
        });
        return () => unsub();
    }, [activeOrg?.id]);
    const todayStr = toYMD(today.getFullYear(), today.getMonth(), today.getDate());

    const combinedEvents = [...events, ...tasks];

    const eventsByDate = combinedEvents.reduce<Record<string, CalEvent[]>>((acc, e) => {
        acc[e.date] = acc[e.date] ? [...acc[e.date], e] : [e];
        return acc;
    }, {});

    const eventDates = new Set(combinedEvents.map((e) => e.date));

    const colorMap = combinedEvents.reduce<Record<string, (typeof EVENT_COLORS)[0]>>((acc, e, i) => {
        acc[e.id] = eventColor(i);
        return acc;
    }, {});

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const cells: (number | null)[] = [
        ...Array(firstDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    const prevMonth = () => month === 0 ? (setYear(y => y - 1), setMonth(11)) : setMonth(m => m - 1);
    const nextMonth = () => month === 11 ? (setYear(y => y + 1), setMonth(0)) : setMonth(m => m + 1);
    const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); };

    return (
        <div className="flex gap-5 h-full min-h-0">

            {/* ── Main calendar ── */}
            <div className="flex-1 flex flex-col gap-4 min-w-0">

                {/* Header */}
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-semibold text-gray-900 mr-auto">
                        {MONTHS[month]} <span className="text-gray-400 font-normal">{year}</span>
                    </h1>

                    {/* Desktop: individual buttons */}
                    <button
                        onClick={() => navigate("/dashboard/events", { state: { openCreateModal: true, date: selectedDate || todayStr } })}
                        className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#7877C6] text-white text-xs font-medium hover:bg-[#6665b5] transition cursor-pointer"
                    >
                        <Plus size={13} />
                        New event
                    </button>
                    <button
                        onClick={() => navigate("/dashboard/tasks")}
                        className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition cursor-pointer"
                    >
                        <Plus size={13} />
                        Add task
                    </button>

                    <button
                        onClick={goToday}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                    >
                        Today
                    </button>
                    <div className="flex">
                        <button onClick={prevMonth} className="p-1.5 rounded-l-lg border border-gray-200 hover:bg-gray-50 transition cursor-pointer">
                            <ChevronLeft size={13} className="text-gray-500" />
                        </button>
                        <button onClick={nextMonth} className="p-1.5 rounded-r-lg border-y border-r border-gray-200 hover:bg-gray-50 transition cursor-pointer">
                            <ChevronRight size={13} className="text-gray-500" />
                        </button>
                    </div>

                    {/* Desktop: sidebar toggle */}
                    <button
                        onClick={() => setSidebarOpen(o => !o)}
                        className="hidden lg:flex p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition cursor-pointer"
                        title={sidebarOpen ? "Hide panel" : "Show panel"}
                    >
                        {sidebarOpen
                            ? <PanelRightClose size={14} className="text-gray-500" />
                            : <PanelRightOpen size={14} className="text-gray-500" />}
                    </button>

                    {/* Mobile: three-dots menu */}
                    <div className="relative lg:hidden">
                        <button
                            onClick={() => setMenuOpen(o => !o)}
                            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition cursor-pointer"
                            aria-label="More options"
                        >
                            <MoreVertical size={15} className="text-gray-500" />
                        </button>
                        {menuOpen && (
                            <>
                                {/* Backdrop to close */}
                                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                                <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden min-w-[150px]">
                                    <button
                                        onClick={() => { navigate("/dashboard/events", { state: { openCreateModal: true, date: selectedDate || todayStr } }); setMenuOpen(false); }}
                                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition"
                                    >
                                        <Plus size={13} className="text-[#7877C6]" />
                                        New event
                                    </button>
                                    <div className="h-px bg-gray-100" />
                                    <button
                                        onClick={() => { navigate("/dashboard/tasks"); setMenuOpen(false); }}
                                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition"
                                    >
                                        <Plus size={13} className="text-[#7877C6]" />
                                        Add task
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {isMobile ? (
                    <div className="flex flex-col gap-4">

                        {/* Assigned Tasks Widget */}
                        {/* <AssignedTasksWidget orgId={activeOrg?.id} /> */}

                        {/* Mini calendar */}
                        <MiniCalendar
                            year={year}
                            month={month}
                            selectedDate={selectedDate}
                            eventDates={eventDates}
                            onSelect={(d) => setSelectedDate(prev => prev === d ? null : d)}
                            onNavigate={(y, m) => { setYear(y); setMonth(m); }}
                        />

                        {/* ── This month's events (mirrors desktop sidebar) ── */}
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-gray-700">
                                        {MONTHS[month]} {year}
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                        {Object.values(eventsByDate)
                                            .flat()
                                            .filter(e => e.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`))
                                            .length} events this month
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate(selectedEvent && !selectedEvent.isTask
                                        ? `/dashboard/design?eventId=${selectedEvent.id}`
                                        : "/dashboard/design")}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#7877C6] text-white text-[10px] font-semibold hover:bg-[#6665b5] transition cursor-pointer"
                                >
                                    <Sparkles size={10} />
                                    Make flyer
                                </button>
                            </div>

                            <div className="divide-y divide-gray-50">
                                {Array.from({ length: getDaysInMonth(year, month) }, (_, i) => i + 1)
                                    .flatMap(day => {
                                        const ymd = toYMD(year, month, day);
                                        return (eventsByDate[ymd] || []).map(e => ({ ...e, _day: day }));
                                    })
                                    .map(e => (
                                        <button key={e.id} onClick={() => setSelectedEvent(e)}
                                            className="w-full text-left px-4 py-3 hover:bg-gray-50 transition flex gap-3 items-start">
                                            <div className="w-8 text-center shrink-0">
                                                <p className="text-sm font-bold text-[#7877C6] leading-none">{e._day}</p>
                                                <p className="text-[9px] text-gray-400 uppercase mt-0.5">
                                                    {new Date(year, month, e._day).toLocaleDateString('en', { weekday: 'short' })}
                                                </p>
                                            </div>
                                            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${colorMap[e.id]?.dot}`} />
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-xs font-medium truncate ${e.isTask && e.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                                    {e.name}
                                                </p>
                                                <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                                                    {e.isTask && (e.status === 'done' ? <Check size={8} className="text-gray-400" /> : <CheckSquare size={8} className="text-[#7877C6]" />)}
                                                    {formatTime(e.time)}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                {Array.from({ length: getDaysInMonth(year, month) }, (_, i) => i + 1)
                                    .flatMap(day => eventsByDate[toYMD(year, month, day)] || [])
                                    .length === 0 && (
                                        <div className="p-8">
                                            <EmptyState
                                              icon={Calendar}
                                              title="No events this month"
                                              description="Create an event to get started"
                                            />
                                        </div>
                                    )}
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex-1 flex flex-col min-h-0">
                        {/* Day headers */}
                        <div className="grid grid-cols-7 border-b border-gray-100 shrink-0">
                            {DAYS.map((d) => (
                                <div key={d} className="py-2.5 text-center text-[11px] font-medium text-gray-400">{d}</div>
                            ))}
                        </div>

                        {/* Cells */}
                        {loading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="animate-spin h-5 w-5 border-2 border-gray-200 border-t-[#7877C6] rounded-full" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-7 flex-1 min-h-0" style={{ gridAutoRows: "1fr" }}>
                                {cells.map((day, i) => {
                                    if (!day) return (
                                        <div key={i} className={`border-b border-r border-gray-50 bg-gray-50/40 ${i % 7 === 6 ? "border-r-0" : ""}`} />
                                    );

                                    const ymd = toYMD(year, month, day);
                                    const dayEvents = eventsByDate[ymd] || [];
                                    const isToday = ymd === todayStr;
                                    const isSelected = ymd === selectedDate;

                                    return (
                                        <div
                                            key={i}
                                            onClick={() => {
                                                setSelectedDate(prev => prev === ymd ? null : ymd);
                                                if (!sidebarOpen) setSidebarOpen(true);
                                            }}
                                            className={`border-b border-r border-gray-100 p-1.5 flex flex-col gap-0.5 cursor-pointer transition
                                                ${i % 7 === 6 ? "border-r-0" : ""}
                                                ${isSelected ? "bg-[#7877C6]/5" : "hover:bg-gray-50/70"}`}
                                        >
                                            <div className={`h-5 w-5 flex items-center justify-center rounded-full text-[10px] font-semibold self-start mb-0.5
                                                ${isToday ? "bg-[#7877C6] text-white" : "text-gray-400"}`}>
                                                {day}
                                            </div>
                                            {dayEvents.slice(0, 2).map((e) => (
                                                <button
                                                    key={e.id}
                                                    onClick={(ev) => { ev.stopPropagation(); setSelectedEvent(e); }}
                                                    className={`w-full text-left text-[9px] sm:text-[10px] font-medium px-1.5 py-0.5 rounded truncate transition hover:opacity-75 cursor-pointer leading-tight flex items-center gap-1 ${e.isTask ? (e.status === 'done' ? 'bg-gray-100 text-gray-500 line-through' : 'bg-gray-50 text-gray-700 border border-gray-200') : colorMap[e.id]?.pill}`}
                                                >
                                                    {e.isTask && (e.status === 'done' ? <Check size={8} /> : <CheckSquare size={8} />)}
                                                    <span className="hidden sm:inline">{formatTime(e.time)} </span>{e.name}
                                                </button>
                                            ))}
                                            {dayEvents.length > 2 && (
                                                <button
                                                    onClick={(ev) => { ev.stopPropagation(); setSelectedDate(ymd); setSidebarOpen(true); }}
                                                    className="text-[9px] text-gray-400 hover:text-[#7877C6] text-left px-1 cursor-pointer"
                                                >
                                                    +{dayEvents.length - 2} more
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

            </div>

            {/* ── Right sidebar (desktop only) ── */}
            {sidebarOpen && !isMobile && (
                <div className="hidden lg:flex flex-col gap-3 w-70 shrink-0">
                    {/* Assigned Tasks Widget */}
                    <AssignedTasksWidget orgId={activeOrg?.id} />

                    <MiniCalendar
                        year={year}
                        month={month}
                        selectedDate={selectedDate}
                        eventDates={eventDates}
                        onSelect={(d) => setSelectedDate(prev => prev === d ? null : d)}
                        onNavigate={(y, m) => { setYear(y); setMonth(m); }}
                    />

                    <div className="bg-white rounded-2xl border border-gray-100 flex-1 overflow-hidden flex flex-col min-h-0">
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-700">
                                    {MONTHS[month]} {year}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                    {Object.values(eventsByDate)
                                        .flat()
                                        .filter(e => e.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`))
                                        .length} events this month
                                </p>
                            </div>
                            <button
                                onClick={() => navigate(selectedEvent && !selectedEvent.isTask
                                    ? `/dashboard/design?eventId=${selectedEvent.id}`
                                    : "/dashboard/design")}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#7877C6] text-white text-[10px] font-semibold hover:bg-[#6665b5] transition cursor-pointer"
                            >
                                <Sparkles size={10} />
                                Make flyer
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto divide-y divide-gray-50 no-scrollbar">
                            {Array.from({ length: getDaysInMonth(year, month) }, (_, i) => i + 1)
                                .flatMap(day => {
                                    const ymd = toYMD(year, month, day);
                                    return (eventsByDate[ymd] || []).map(e => ({ ...e, _day: day }));
                                })
                                .map(e => (
                                    <button key={e.id} onClick={() => setSelectedEvent(e)}
                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition flex gap-3 items-start">
                                        <div className="w-8 text-center shrink-0">
                                            <p className="text-sm font-bold text-[#7877C6] leading-none">{e._day}</p>
                                            <p className="text-[9px] text-gray-400 uppercase mt-0.5">
                                                {new Date(year, month, e._day).toLocaleDateString('en', { weekday: 'short' })}
                                            </p>
                                        </div>
                                        {/* <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${colorMap[e.id]?.dot}`} /> */}
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs font-medium truncate ${e.isTask && e.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                                {e.name}
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                                                {e.isTask && (e.status === 'done' ? <Check size={8} className="text-gray-400" /> : <CheckSquare size={8} className="text-[#7877C6]" />)}
                                                {formatTime(e.time)}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Backdrop ── */}
            {selectedEvent && (
                <div className="fixed inset-0 z-55 bg-black/10" onClick={() => setSelectedEvent(null)} />
            )}

            {/* ── Event panel ── */}
            <EventPanel
                event={selectedEvent}
                colorClass={selectedEvent ? (colorMap[selectedEvent.id]?.pill ?? "") : ""}
                onClose={() => setSelectedEvent(null)}
            />
        </div>
    );
};

export default CalendarPage;