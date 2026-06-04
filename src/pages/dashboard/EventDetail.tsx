import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import {
    getFirestore,
    doc,
    onSnapshot,
    updateDoc,
} from "firebase/firestore";
import app from "../../config/firebase";
import { type DashboardContextType } from "../Dashboard";
import {
    ArrowLeft,
    Calendar,
    Clock,
    MapPin,
    Video,
    Ticket,
    Users,
    CheckCircle2,
    Clock3,
    UserCheck,
    Search,
    Check,
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

type StatCardProps = {
    label: string;
    value: number;
    icon: React.ReactNode;
    color: string;
};

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color }) => (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
        </div>
    </div>
);

const EventDetail: React.FC = () => {
    const { eventId } = useParams<{ eventId: string }>();
    const { activeOrg } = useOutletContext<DashboardContextType>();
    const navigate = useNavigate();

    const [event, setEvent] = useState<(Event & { registered?: Registrant[] }) | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"all" | "paid" | "pending" | "attended">("all");

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

    const togglePaid = async (email: string, current: string) => {
        if (!eventId || !event?.registered) return;
        const db = getFirestore(app);
        const updated = event.registered.map((r) =>
            r.email === email
                ? { ...r, paymentStatus: current === "paid" ? "pending" : "paid" }
                : r
        );
        await updateDoc(doc(db, "events", eventId), { registered: updated });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin h-6 w-6 border-2 border-gray-200 border-t-[#7877C6] rounded-full" />
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
    const paid = registered.filter((r) => r.paymentStatus === "paid").length;
    const pending = registered.filter((r) => r.paymentStatus === "pending").length;
    const attended = registered.filter((r) => r.attended).length;

    const virtual = isVirtualLink(event.location);
    const meet = isGoogleMeet(event.location);

    const filtered = registered.filter((r) => {
        const matchSearch =
            r.name.toLowerCase().includes(search.toLowerCase()) ||
            r.email.toLowerCase().includes(search.toLowerCase());
        const matchFilter =
            filter === "all" ||
            (filter === "paid" && r.paymentStatus === "paid") ||
            (filter === "pending" && r.paymentStatus === "pending") ||
            (filter === "attended" && r.attended);
        return matchSearch && matchFilter;
    });

    return (
        <div className="space-y-6">

            {/* Back */}
            <button
                onClick={() => navigate("/dashboard/events")}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition cursor-pointer"
            >
                <ArrowLeft size={15} />
                Back to events
            </button>

            {/* Event header */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {event.imageUrl && (
                    <div className="h-40 w-full overflow-hidden">
                        <img
                            src={event.imageUrl}
                            alt={event.name}
                            className="h-full w-full object-cover"
                        />
                    </div>
                )}
                <div className="p-5">
                    <h1 className="text-lg font-semibold text-gray-900">{event.name}</h1>
                    <div className="flex flex-wrap gap-4 mt-3">
                        <span className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Calendar size={11} className="text-gray-300" />
                            {formatDate(event.date)}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Clock size={11} className="text-gray-300" />
                            {formatTime(event.time)}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-gray-500">
                            {virtual ? (
                                <Video size={11} className="text-gray-300" />
                            ) : (
                                <MapPin size={11} className="text-gray-300" />
                            )}
                            {virtual
                                ? meet
                                    ? "Google Meet"
                                    : "Online"
                                : event.location}
                        </span>
                        {event.fee && (
                            <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                <Ticket size={11} className="text-gray-300" />
                                {event.fee}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard
                    label="Registered"
                    value={registered.length}
                    icon={<Users size={18} className="text-[#7877C6]" />}
                    color="bg-[#7877C6]/10"
                />
                <StatCard
                    label="Paid"
                    value={paid}
                    icon={<CheckCircle2 size={18} className="text-emerald-500" />}
                    color="bg-emerald-50"
                />
                <StatCard
                    label="Pending payment"
                    value={pending}
                    icon={<Clock3 size={18} className="text-amber-500" />}
                    color="bg-amber-50"
                />
                <StatCard
                    label="Attended"
                    value={attended}
                    icon={<UserCheck size={18} className="text-blue-500" />}
                    color="bg-blue-50"
                />
            </div>

            {/* Registrants table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

                {/* Table toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-gray-100">
                    <div className="relative flex-1 max-w-xs">
                        <Search
                            size={13}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name or email..."
                            className="w-full rounded-[8px] border border-gray-200 bg-white pl-8 pr-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-[#7877C6]/20 transition placeholder:text-gray-400 text-gray-900"
                        />
                    </div>

                    {/* Filter tabs */}
                    <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
                        {(["all", "paid", "pending", "attended"] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer capitalize ${filter === f
                                        ? "bg-white text-gray-900"
                                        : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="py-16 text-center">
                        <Users size={28} className="text-gray-200 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">
                            {registered.length === 0
                                ? "No registrations yet."
                                : "No results match your search."}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 text-xs">
                                <tr>
                                    <th className="px-5 py-3 font-medium">Name</th>
                                    <th className="px-5 py-3 font-medium">Email</th>
                                    <th className="px-5 py-3 font-medium hidden md:table-cell">Phone</th>
                                    <th className="px-5 py-3 font-medium hidden lg:table-cell">Type</th>
                                    <th className="px-5 py-3 font-medium">Payment</th>
                                    <th className="px-5 py-3 font-medium">Attended</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map((r) => (
                                    <tr key={r.email} className="hover:bg-gray-50/50 transition">
                                        <td className="px-5 py-3.5">
                                            <div>
                                                <p className="font-medium text-gray-900 text-sm">{r.name}</p>
                                                {r.clubName && (
                                                    <p className="text-xs text-gray-400 mt-0.5">{r.clubName}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-xs text-gray-500">{r.email}</td>
                                        <td className="px-5 py-3.5 text-xs text-gray-500 hidden md:table-cell">
                                            {r.phone}
                                        </td>
                                        <td className="px-5 py-3.5 hidden lg:table-cell">
                                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${r.type === "club"
                                                    ? "bg-[#7877C6]/10 text-[#7877C6]"
                                                    : "bg-gray-100 text-gray-500"
                                                }`}>
                                                {r.type === "club" ? "Club" : "Guest"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <button
                                                onClick={() => togglePaid(r.email, r.paymentStatus)}
                                                className={`text-[11px] font-medium px-2 py-0.5 rounded-full cursor-pointer transition ${r.paymentStatus === "paid"
                                                        ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                                        : "bg-amber-50 text-amber-600 hover:bg-amber-100"
                                                    }`}
                                            >
                                                {r.paymentStatus === "paid" ? "Paid" : "Pending"}
                                            </button>
                                        </td>
                                        <td className="px-5 py-3.5">
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
    );
};

export default EventDetail;