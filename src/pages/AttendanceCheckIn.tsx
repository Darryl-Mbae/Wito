import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import {
    getFirestore,
    doc,
    getDoc,
    updateDoc,
} from "firebase/firestore";
import app from "../config/firebase";
import {
    Calendar,
    Clock,
    MapPin,
    Video,
    Ticket,
    Shirt,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Users,
    Search,
    Check,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    });

const formatTime = (t: string) => {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
};

const isVirtualLink = (loc: string) =>
    loc?.startsWith("http://") || loc?.startsWith("https://");

const isGoogleMeet = (loc: string) =>
    loc?.toLowerCase().includes("meet.google") ||
    loc?.toLowerCase().includes("google meet");

// ── Types ─────────────────────────────────────────────────────────────────────

type EventData = {
    name: string;
    date: string;
    time: string;
    location: string;
    fee?: string | null;
    dresscode?: string | null;
    description?: string | null;
    imageUrl?: string | null;
    orgId: string;
    registered?: Registrant[];
};

type Registrant = {
    name: string;
    email: string;
    phone: string;
    type: "club" | "guest";
    clubName?: string | null;
    attended: boolean;
    registeredAt: string;
};

// ── Detail row ────────────────────────────────────────────────────────────────

const DetailRow: React.FC<{
    icon: React.ReactNode;
    label: string;
    children: React.ReactNode;
}> = ({ icon, label, children }) => (
    <div className="flex items-center gap-3 text-sm text-gray-600">
        <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
            {icon}
        </div>
        <div>
            <p className="text-xs text-gray-400 mb-0.5">{label}</p>
            {children}
        </div>
    </div>
);

// ── Page ──────────────────────────────────────────────────────────────────────

const AttendanceCheckIn: React.FC = () => {
    const { eventId } = useParams<{ eventId: string }>();

    const [event, setEvent] = useState<EventData | null>(null);
    const [loadingEvent, setLoadingEvent] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [searchFilter, setSearchFilter] = useState("");
    const [marking, setMarking] = useState(false);
    const [marked, setMarked] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Load event data
    useEffect(() => {
        if (!eventId) return;
        const db = getFirestore(app);
        getDoc(doc(db, "events", eventId)).then((snap) => {
            if (!snap.exists()) {
                setNotFound(true);
            } else {
                setEvent(snap.data() as EventData);
            }
            setLoadingEvent(false);
        });
    }, [eventId]);

    // Close dropdown when clicking outside
    useEffect(() => {
        if (!dropdownOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownOpen]);

    const registered = event?.registered || [];
    const notAttended = registered.filter((r) => !r.attended);

    // Filter attendees by search
    const filtered = notAttended.filter((r) =>
        r.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (r.clubName ?? "").toLowerCase().includes(searchFilter.toLowerCase())
    );

    const selectedAttendee = selectedEmail
        ? registered.find((r) => r.email === selectedEmail)
        : null;

    const handleMarkAttended = async () => {
        if (!eventId || !selectedEmail || !event?.registered) return;

        setMarking(true);
        setError(null);

        try {
            const db = getFirestore(app);
            const updated = event.registered.map((r) =>
                r.email === selectedEmail ? { ...r, attended: true } : r
            );

            await updateDoc(doc(db, "events", eventId), { registered: updated });

            setMarked(true);
            setSelectedEmail(null);
            setSearchFilter("");

            // Reset after 2 seconds
            setTimeout(() => {
                setMarked(false);
                setEvent((prev) =>
                    prev
                        ? {
                            ...prev,
                            registered: updated,
                        }
                        : null
                );
            }, 2000);
        } catch (err) {
            console.error("Mark attended failed:", err);
            setError("Failed to mark attendance. Please try again.");
        } finally {
            setMarking(false);
        }
    };

    const virtual = event ? isVirtualLink(event.location) : false;
    const meet = event ? isGoogleMeet(event.location) : false;
    const hasFee = !!(event?.fee);

    const inputCls =
        "mt-1 w-full rounded-[8px] border border-gray-200 bg-white px-4 py-2.5 text-[16px] sm:text-sm outline-none focus:ring-1 focus:ring-[#7877C6]/20 transition placeholder:text-gray-400 text-gray-900";

    const labelCls = "text-sm font-medium text-gray-700";

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loadingEvent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
                <div className="text-center space-y-3">
                    <div className="animate-spin h-6 w-6 border-2 border-gray-200 border-t-[#7877C6] rounded-full mx-auto" />
                    <p className="text-sm text-gray-400">Loading event...</p>
                </div>
            </div>
        );
    }

    // ── Not found ─────────────────────────────────────────────────────────────
    if (notFound || !event) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
                <div className="text-center space-y-2">
                    <AlertCircle size={36} className="text-gray-300 mx-auto" />
                    <p className="text-gray-600 font-medium">Event not found</p>
                    <p className="text-sm text-gray-400">
                        This link may be invalid or the event has been removed.
                    </p>
                </div>
            </div>
        );
    }

    // ── Success ───────────────────────────────────────────────────────────────
    if (marked && selectedAttendee) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden max-w-sm w-full">
                    {/* Image */}
                    <div className="h-44 w-full overflow-hidden">
                        <img
                            src={event.imageUrl ? event.imageUrl : "/images/imageurl.jpg"}
                            alt={event.name}
                            className="h-full w-full object-cover"
                        />
                    </div>

                    <div className="p-6 space-y-5">
                        {/* Icon + heading */}
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                                <CheckCircle2 size={22} className="text-emerald-500" />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-gray-900">
                                    {selectedAttendee.name} checked in!
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    See you at{" "}
                                    <span className="font-medium text-gray-600">
                                        {event.name}
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Calendar size={11} className="text-gray-300 shrink-0" />
                                {formatDate(event.date)}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Clock size={11} className="text-gray-300 shrink-0" />
                                {formatTime(event.time)}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                {virtual ? (
                                    <Video size={11} className="text-gray-300 shrink-0" />
                                ) : (
                                    <MapPin size={11} className="text-gray-300 shrink-0" />
                                )}
                                <span>
                                    {virtual
                                        ? meet
                                            ? "Google Meet"
                                            : "Online"
                                        : event.location}
                                </span>
                            </div>
                            {selectedAttendee.type === "club" && selectedAttendee.clubName && (
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Users size={11} className="text-gray-300 shrink-0" />
                                    {selectedAttendee.clubName}
                                </div>
                            )}
                            {hasFee && (
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Ticket size={11} className="text-gray-300 shrink-0" />
                                    {event.fee}
                                </div>
                            )}
                        </div>

                        {/* Name summary */}
                        <p className="text-xs text-center text-gray-400">
                            Checked in as{" "}
                            <span className="font-medium text-gray-600">{selectedAttendee.name}</span> · Ready for next!
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ── Main ──────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#f8fafc] py-10 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Cover image — full width on desktop */}
                <div className={`${event.imageUrl ? 'h-auto' : 'h-52' } md:h-64 w-full overflow-hidden rounded-2xl mb-6`}>
                    <img
                        src={event.imageUrl ? event.imageUrl : "/images/imageurl.jpg"}
                        alt={event.name}
                        className="h-full w-full object-cover"
                    />
                </div>

                {/* Two-column on desktop, single on mobile */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

                    {/* ── Left: Event details ── */}
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        <div className="p-6 space-y-5">
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">
                                    {event.name}
                                </h1>
                                {event.description && (
                                    <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                                        {event.description}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-3">
                                <DetailRow
                                    icon={<Calendar size={14} className="text-gray-300" />}
                                    label="Date"
                                >
                                    {formatDate(event.date)}
                                </DetailRow>

                                <DetailRow
                                    icon={<Clock size={14} className="text-gray-300" />}
                                    label="Time"
                                >
                                    {formatTime(event.time)}
                                </DetailRow>

                                <DetailRow
                                    icon={
                                        virtual ? (
                                            <Video size={14} className="text-gray-300" />
                                        ) : (
                                            <MapPin size={14} className="text-gray-300" />
                                        )
                                    }
                                    label="Location"
                                >
                                    {virtual ? (
                                        <a
                                            href={event.location}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[#7877C6] underline underline-offset-2"
                                        >
                                            {meet ? "Join Google Meet" : "Join Online"}
                                        </a>
                                    ) : (
                                        event.location
                                    )}
                                </DetailRow>

                                {event.dresscode && (
                                    <DetailRow
                                        icon={<Shirt size={14} className="text-gray-300" />}
                                        label="Dress code"
                                    >
                                        {event.dresscode}
                                    </DetailRow>
                                )}

                                {hasFee && (
                                    <DetailRow
                                        icon={<Ticket size={14} className="text-gray-300" />}
                                        label="Entry fee"
                                    >
                                        {event.fee}
                                    </DetailRow>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Right: Check-in form ── */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">
                                Check In
                            </h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Search and select yourself to check in.
                            </p>
                        </div>

                        {error && (
                            <div className="p-3 text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg">
                                {error}
                            </div>
                        )}

                        {notAttended.length === 0 ? (
                            <div className="py-8 text-center space-y-2">
                                <Check size={32} className="text-emerald-500 mx-auto" />
                                <p className="text-sm font-medium text-gray-900">All checked in!</p>
                                <p className="text-xs text-gray-400">
                                    Everyone has been marked as attended.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Search input */}
                                <div>
                                    <label className={labelCls}>
                                        Search your name <span className="text-red-400">*</span>
                                    </label>
                                    <div className="relative mt-1">
                                        <Search
                                            size={14}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                        />
                                        <input
                                            type="text"
                                            value={searchFilter}
                                            onChange={(e) => {
                                                setSearchFilter(e.target.value);
                                                setDropdownOpen(true);
                                            }}
                                            onFocus={() => setDropdownOpen(true)}
                                            placeholder="Jane Doe or Club Name"
                                            className={`${inputCls} pl-9`}
                                        />
                                    </div>
                                </div>

                                {/* Dropdown - show filtered results */}
                                {dropdownOpen && searchFilter && (
                                    <div
                                        ref={dropdownRef}
                                        className="border border-gray-200 rounded-lg bg-white shadow-lg max-h-64 overflow-y-auto z-10"
                                    >
                                        {filtered.length > 0 ? (
                                            filtered.map((attendee) => (
                                                <button
                                                    key={attendee.email}
                                                    onClick={() => {
                                                        setSelectedEmail(attendee.email);
                                                        setSearchFilter("");
                                                        setDropdownOpen(false);
                                                    }}
                                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition cursor-pointer"
                                                >
                                                    <p className="text-sm font-medium text-gray-900">{attendee.name}</p>
                                                    {attendee.clubName && (
                                                        <p className="text-xs text-gray-400 mt-0.5">{attendee.clubName}</p>
                                                    )}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-4 py-3 text-xs text-gray-500">
                                                No matching attendees found
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Selected attendee card */}
                                {selectedAttendee && (
                                    <div className="bg-gradient-to-br from-[#7877C6]/10 to-[#a5a4e0]/10 rounded-xl p-4 border border-[#7877C6]/20 space-y-3">
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium">SELECTED</p>
                                            <h3 className="text-base font-semibold text-gray-900 mt-1">
                                                {selectedAttendee.name}
                                            </h3>
                                            {selectedAttendee.clubName && (
                                                <p className="text-xs text-gray-500 mt-1">{selectedAttendee.clubName}</p>
                                            )}
                                        </div>

                                        {/* Check in button */}
                                        <button
                                            onClick={handleMarkAttended}
                                            disabled={marking}
                                            className="w-full flex items-center justify-center gap-2 mt-3 px-4 py-2.5 rounded-lg bg-[#7877C6] text-white text-sm font-medium hover:bg-[#7877C6]/90 transition disabled:opacity-60 cursor-pointer"
                                        >
                                            {marking && <Loader2 size={14} className="animate-spin" />}
                                            {marking ? "Checking in..." : "Check In"}
                                        </button>

                                        {/* Clear selection */}
                                        <button
                                            onClick={() => {
                                                setSelectedEmail(null);
                                                setSearchFilter("");
                                            }}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition cursor-pointer"
                                        >
                                            Clear Selection
                                        </button>
                                    </div>
                                )}

                                {/* Not registered card */}
                                {searchFilter && filtered.length === 0 && notAttended.length > 0 && !selectedAttendee && (
                                    <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-3">
                                        <div>
                                            <p className="text-xs text-primary font-medium">Not finding yourself?</p>
                                            <p className="text-sm text-gray-400 mt-1">
                                                You may not be registered for this event yet.
                                            </p>
                                        </div>
                                        <a
                                            href={`/event/${eventId}`}
                                            className="w-full flex items-center justify-center px-4 py-2.5 rounded-lg bg-primary/95 text-white text-sm font-medium hover:bg-primary transition cursor-pointer"
                                        >
                                            Register Now
                                        </a>
                                    </div>
                                )}


                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceCheckIn;
