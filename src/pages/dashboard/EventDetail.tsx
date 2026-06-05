import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    getFirestore,
    doc,
    onSnapshot,
    updateDoc,
} from "firebase/firestore";
import app from "../../config/firebase";
import {
    ArrowLeft,
    Calendar,
    Clock,
    MapPin,
    Video,
    Ticket,
    Users,
    UserCheck,
    Search,
    Check,
    Gem,
} from "lucide-react";
import {
    formatDate,
    formatTime,
    isVirtualLink,
    isGoogleMeet,
    type Event,
} from "../../components/EventCard";

type Registrant = {
    name: string;
    email: string;
    phone: string;
    type: "club" | "guest";
    clubName?: string | null;
    paymentStatus: "paid" | "pending";
    attended: boolean;
    registeredAt: string;
};

const EventDetail: React.FC = () => {
    const { eventId } = useParams<{ eventId: string }>();
    const navigate = useNavigate();

    const [event, setEvent] = useState<(Event & { registered?: Registrant[] }) | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"all" | "attended" | "absent">("all");

    useEffect(() => {
        if (!eventId) return;
        const db = getFirestore(app);
        const unsub = onSnapshot(doc(db, "events", eventId), (snap) => {
            if (snap.exists()) {
                setEvent({ id: snap.id, ...snap.data() } as Event & { registered?: Registrant[] });
            }
            setLoading(false);
        });
        return () => unsub();
    }, [eventId]);

    const toggleAttended = async (email: string, current: boolean) => {
        if (!eventId || !event?.registered) return;
        const db = getFirestore(app);
        const updated = event.registered.map((r) =>
            r.email === email ? { ...r, attended: !current } : r
        );
        await updateDoc(doc(db, "events", eventId), { registered: updated });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin h-5 w-5 border-2 border-gray-200 border-t-[#7877C6] rounded-full" />
            </div>
        );
    }

    if (!event) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-gray-400 text-sm">Event not found.</p>
            </div>
        );
    }

    const registered = event.registered || [];
    const attended = registered.filter((r) => r.attended).length;
    const virtual = isVirtualLink(event.location);
    const meet = isGoogleMeet(event.location);

    const filtered = registered.filter((r) => {
        const matchSearch =
            r.name.toLowerCase().includes(search.toLowerCase()) ||
            (r.clubName ?? "").toLowerCase().includes(search.toLowerCase());
        const matchFilter =
            filter === "all" ||
            (filter === "attended" && r.attended) ||
            (filter === "absent" && !r.attended);
        return matchSearch && matchFilter;
    });

    return (
        <div className="space-y-4">

            {/* Back */}
            <button
                onClick={() => navigate("/dashboard/events")}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition cursor-pointer"
            >
                <ArrowLeft size={13} />
                Back to events
            </button>

            {/* Main layout */}
            <div className="flex flex-col lg:flex-row gap-4 items-start">

                {/* ── Left: Event details sidebar ── */}
                <div className="w-full lg:w-64 shrink-0 space-y-3">

                    {/* Event info card */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                        <h1 className="text-sm font-semibold text-gray-900 leading-snug">{event.name}</h1>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Calendar size={11} className="text-gray-300 shrink-0" />
                                {formatDate(event.date)}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Clock size={11} className="text-gray-300 shrink-0" />
                                {formatTime(event.time)}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                {virtual
                                    ? <Video size={11} className="text-gray-300 shrink-0" />
                                    : <MapPin size={11} className="text-gray-300 shrink-0" />
                                }
                                {virtual ? (meet ? "Google Meet" : "Online") : event.location}
                            </div>
                            {event.fee && (
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Ticket size={11} className="text-gray-300 shrink-0" />
                                    {event.fee}
                                </div>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-100" />

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-xl font-semibold text-gray-900">{registered.length}</p>
                                <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                                    <Users size={10} className="text-gray-300" /> Registered
                                </p>
                            </div>
                            <div>
                                <p className="text-xl font-semibold text-gray-900">{attended}</p>
                                <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                                    <UserCheck size={10} className="text-gray-300" /> Attended
                                </p>
                            </div>
                        </div>

                        {/* Attendance bar */}
                        {registered.length > 0 && (
                            <div>
                                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#7877C6] rounded-full transition-all"
                                        style={{ width: `${Math.round((attended / registered.length) * 100)}%` }}
                                    />
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">
                                    {Math.round((attended / registered.length) * 100)}% attendance rate
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Right: Attendance table ── */}
                <div className="flex-1 bg-white rounded-2xl border border-gray-100 overflow-hidden min-w-0">

                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-4 border-b border-gray-100">
                        <div className="relative flex-1 max-w-xs">
                            <Search
                                size={12}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                            />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search name or club…"
                                className="w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#7877C6]/20 transition placeholder:text-gray-400 text-gray-900"
                            />
                        </div>

                        <div className="relative group">
                            <button
                                disabled
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#7877C6]/30 bg-[#7877C6]/5 text-[#7877C6] text-xs font-medium cursor-not-allowed select-none"
                            >
                                <Gem size={12} className="text-[#7877C6]" />
                                Send attendance email {/* Fixed typo here too! */}
                            </button>

                            {/* Tooltip - Adjusted position to top-full (below the button) and left-0 */}
                            <div className="z-40 absolute top-full left-0 mt-2 w-56 hidden group-hover:block">
                                <div className="bg-gray-900 text-white text-[11px] rounded-lg px-3 py-2 leading-relaxed shadow-lg relative">
                                    <p className="font-medium mb-0.5 flex items-center gap-1">
                                        <Gem size={10} className="text-[#7877C6]" /> Premium feature
                                    </p>
                                    <p className="text-gray-400">Automatically email all registrants to confirm their attendance with one click.</p>

                                    {/* Arrow - Adjusted to point upwards at the top-left */}
                                    <div className="absolute bottom-full left-4 border-4 border-transparent border-b-gray-900" />
                                </div>

                            </div>
                        </div>
                        {/* Filter — tabs on desktop, dropdown on mobile */}
                        <div className="hidden sm:flex gap-1 bg-gray-100 rounded-xl p-1">
                            {(["all", "attended", "absent"] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer capitalize ${filter === f
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as typeof filter)}
                            className="sm:hidden rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-[#7877C6]/20 cursor-pointer capitalize"
                        >
                            {(["all", "attended", "absent"] as const).map((f) => (
                                <option key={f} value={f} className="capitalize">{f}</option>
                            ))}
                        </select>
                    </div>

                    {filtered.length === 0 ? (
                        <div className="py-16 text-center">
                            <Users size={24} className="text-gray-200 mx-auto mb-2" />
                            <p className="text-xs text-gray-400">
                                {registered.length === 0
                                    ? "No registrations yet."
                                    : "No results match your search."}
                            </p>
                        </div>
                    ) : (
                        <div>
                            <table className="w-full text-left text-sm table-fixed">
                                <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 text-[11px]">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Name</th>
                                        <th className="px-4 py-3 font-medium hidden sm:table-cell">Email</th>
                                        <th className="px-4 py-3 font-medium hidden md:table-cell">Phone</th>
                                        <th className="px-4 py-3 font-medium w-24">Attended</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filtered.map((r) => (
                                        <tr key={r.email} className="hover:bg-gray-50/50 transition">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div>
                                                        <p className="font-medium text-gray-900 text-xs">{r.name}</p>
                                                        {r.clubName && (
                                                            <p className="text-[11px] text-gray-400 mt-0.5">{r.clubName}</p>
                                                        )}
                                                    </div>
                                                    {r.type === "guest" && (
                                                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 shrink-0">
                                                            Guest
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-500 hidden sm:table-cell">
                                                <span className="break-all">{r.email}</span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">
                                                {r.phone}
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => toggleAttended(r.email, r.attended)}
                                                    className={`h-5 w-5 rounded border flex items-center justify-center transition cursor-pointer ${r.attended
                                                        ? "bg-[#7877C6] border-[#7877C6]"
                                                        : "border-gray-300 hover:border-[#7877C6]"
                                                        }`}
                                                >
                                                    {r.attended && <Check size={11} className="text-white" />}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventDetail;