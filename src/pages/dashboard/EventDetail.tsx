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
    QrCode,
    Loader2,
    DownloadIcon,
} from "lucide-react";
import {
    formatDate,
    formatTime,
    isVirtualLink,
    isGoogleMeet,
    type Event,
} from "../../components/EventCard";
import { PremiumFeature } from "../../components/PremiumFeature";
import { useActiveOrg } from "../../contexts/ActiveOrgContext";

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
    const { activeOrg } = useActiveOrg();

    const [event, setEvent] = useState<(Event & { registered?: Registrant[] }) | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"all" | "attended" | "absent">("all");
    const [showQRGenerator, setShowQRGenerator] = useState(false);
    const [downloadingQR, setDownloadingQR] = useState(false);

    useEffect(() => {
        if (!eventId) return;
        const db = getFirestore(app);
        const unsub = onSnapshot(doc(db, "events", eventId), (snap) => {
            if (snap.exists()) {
                const eventData = { id: snap.id, ...snap.data() } as Event & { registered?: Registrant[] };
                
                // Check if event belongs to the active organization
                if (activeOrg && eventData.orgId !== activeOrg.id) {
                    navigate("/dashboard/events", { replace: true });
                    return;
                }
                
                setEvent(eventData);
            }
            setLoading(false);
        });
        return () => unsub();
    }, [eventId, activeOrg, navigate]);

    const toggleAttended = async (email: string, current: boolean) => {
        if (!eventId || !event?.registered) return;
        const db = getFirestore(app);
        const updated = event.registered.map((r) =>
            r.email === email ? { ...r, attended: !current } : r
        );
        await updateDoc(doc(db, "events", eventId), { registered: updated });
    };

    const exportToCSV = () => {
        if (!event?.registered || event.registered.length === 0) return;

        // CSV headers
        const headers = ["Name", "Email", "Phone", "Type", "Club Name", "Payment Status", "Attended", "Registered At"];

        // CSV rows
        const rows = event.registered.map((r) => [
            r.name,
            r.email,
            r.phone,
            r.type,
            r.clubName || "",
            r.paymentStatus,
            r.attended ? "Yes" : "No",
            r.registeredAt ? new Date(r.registeredAt).toLocaleString() : "",
        ]);

        // Combine headers and rows
        const csvContent = [
            headers.join(","),
            ...rows.map((row) =>
                row
                    .map((val) => {
                        const escaped = String(val).replace(/"/g, '""');
                        return `"${escaped}"`;
                    })
                    .join(",")
            ),
        ].join("\n");

        // Create blob and trigger download
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);

        // Create clean file name based on event name
        const safeEventName = event.name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
        link.setAttribute("download", `${safeEventName}_registered_list.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                        <div>
                            <div className="flex flex-row items-center justify-between w-full">
                                <h1 className="text-sm font-semibold text-gray-900 leading-snug">{event.name}</h1>
                                <PremiumFeature
                                    isPremium={true}
                                    description="Generate scannable QR codes for your events to track check-ins and eliminate manual entry lines."
                                    tooltipPosition="bottom"
                                >
                                    {/* Generate QR Code Button */}
                                    <button
                                        onClick={() => setShowQRGenerator(!showQRGenerator)}
                                        className="w-10 flex items-center justify-center gap-2 px-2 py-2 rounded-lg border border-[#7877C6]/30 bg-[#7877C6]/5 text-[#7877C6] text-xs font-medium hover:bg-[#7877C6]/10 transition cursor-pointer"
                                    >
                                        <QrCode size={14} />
                                    </button>
                                </PremiumFeature>


                            </div>
                            {event.description && (
                                <p className="text-xs text-gray-500 mt-2 leading-relaxed">{event.description}</p>
                            )}
                        </div>



                        {/* QR Code Display */}
                        {showQRGenerator && eventId && (
                            <div className="pt-3 border-t border-gray-100 space-y-3">
                                <p className="text-[11px] text-gray-500 font-medium">Scan this code at check-in:</p>
                                <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-center">
                                    <img
                                        id="qr-code-img"
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${window.location.origin}/event/${eventId}/checkin`}
                                        alt="Attendance QR Code"
                                        className="w-32 h-32"
                                    />
                                </div>
                                <div className="flex gap-2">

                                    <button
                                        onClick={async () => {
                                            try {
                                                setDownloadingQR(true);
                                                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${window.location.origin}/event/${eventId}/checkin`;
                                                const response = await fetch(qrUrl);
                                                const blob = await response.blob();
                                                const url = URL.createObjectURL(blob);
                                                const link = document.createElement('a');
                                                link.href = url;
                                                link.download = `${event.name}-qr-code.png`;
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                                URL.revokeObjectURL(url);
                                            } catch (err) {
                                                console.error('Failed to download QR code:', err);
                                            } finally {
                                                setDownloadingQR(false);
                                            }
                                        }}
                                        disabled={downloadingQR}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition disabled:opacity-60 cursor-pointer"
                                    >
                                        {downloadingQR ? <Loader2 size={12} className="animate-spin" /> : <DownloadIcon size={12} />}
                                        {downloadingQR ? "Downloading..." : "Download QR"}
                                    </button>
                                    {/* <button
                                        onClick={() => {
                                            setDownloadingQR(true);
                                            setTimeout(() => window.open(`/event/${eventId}/checkin`, '_blank'), 500);
                                            setTimeout(() => setDownloadingQR(false), 1000);
                                        }}
                                        disabled={downloadingQR}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 text-xs font-medium hover:bg-blue-100 transition disabled:opacity-60 cursor-pointer"
                                    >
                                        {downloadingQR && <Loader2 size={12} className="animate-spin" />}
                                        {downloadingQR ? "Opening..." : "Open Check-in"}
                                    </button> */}
                                </div>
                            </div>
                        )}

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
                        <div className="flex flex-row items-center gap-4">
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
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value as typeof filter)}
                                className="sm:hidden rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-[#7877C6]/20 cursor-pointer capitalize"
                            >
                                {(["all", "attended", "absent"] as const).map((f) => (
                                    <option key={f} value={f} className="capitalize">{f}</option>
                                ))}
                            </select>
                            {/* <div className="sm:mt-2 md:mt-0 flex flex-row gap-4 items-center">
                                <PremiumFeature
                                    isPremium={true}
                                    description="Send a custom email to all registrants — a thank you, a reminder, or anything else you want to say."
                                    tooltipPosition="bottom"
                                >
                                    <button
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#7877C6]/30 bg-[#7877C6]/5 text-[#7877C6] text-xs font-medium cursor-pointer hover:bg-[#7877C6]/10 transition"
                                    >
                                        <Gem size={12} className="text-[#7877C6]" />
                                        Send custom email
                                    </button>
                                </PremiumFeature>
                            </div> */}
                            <PremiumFeature
                                isPremium={true}
                                description="Export your full registrant list as a CSV file for your own records or reporting."
                                tooltipPosition="bottom"
                            >
                                <button
                                    onClick={exportToCSV}
                                    disabled={registered.length === 0}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#7877C6]/30 bg-[#7877C6]/5 text-[#7877C6] text-xs font-medium cursor-pointer hover:bg-[#7877C6]/10 transition"
                                >
                                    <Gem size={12} className="text-[#7877C6]" />
                                    {/* <Download size={12} className="text-gray-400" /> */}
                                    Export list

                                </button>
                            </PremiumFeature>

                            {/* Filter — tabs on desktop, dropdown on mobile */}
                            <div className="hidden sm:flex gap-1 bg-gray-100 rounded-xl p-1">
                                {(["all", "attended", "absent"] as const).map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`px-3 py-1 rounded-lg text-sm font-medium transition cursor-pointer capitalize ${filter === f
                                            ? "bg-white text-gray-900 shadow-sm"
                                            : "text-gray-500 hover:text-gray-700"
                                            }`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>


                        </div>
                    </div>

                    {filtered.length === 0 ? (
                        <div className="py-16 text-center">
                            <Users size={24} className="text-gray-200 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">
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
        </div >
    );
};

export default EventDetail;