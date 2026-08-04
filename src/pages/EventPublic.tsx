import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
    getFirestore,
    doc,
    getDoc,
    updateDoc,
    arrayUnion,
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
    Phone,
    Users,
} from "lucide-react";
import AddToCalendar from "../components/AddToCalendar";
import GoogleCalendarSyncToggle from "../components/GoogleCalendarSyncToggle";
import { sendTemplatedEmail } from "../lib/emails/sendEmail";
import { EMAIL_TEMPLATES } from "../lib/emails/templates";
import { buildGoogleCalendarUrl } from "../utils/calendarLinks";
import {
    requestCalendarAccess,
    isTokenValid,
    type CalendarAuthResult,
} from "../utils/GoogleCalendarAuth";
import { insertGoogleCalendarEvent } from "../utils/googleCalendarApi";
import appConfig from "../config/app";

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

const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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
    registered?: RegisteredEntry[];
};

type RegisteredEntry = {
    email: string;
};

type AttendeeType = "club" | "guest";

type RegistrationForm = {
    name: string;
    email: string;
    phone: string;
    type: AttendeeType;
    clubName: string;
};

const EMPTY_FORM: RegistrationForm = {
    name: "",
    email: "",
    phone: "",
    type: "club",
    clubName: "",
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

const EventPublic: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    const [event, setEvent] = useState<EventData | null>(null);
    const [loadingEvent, setLoadingEvent] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [alreadyRegistered, setAlreadyRegistered] = useState(false);

    const [form, setForm] = useState<RegistrationForm>(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Google Calendar sync state
    const [calendarSync, setCalendarSync] = useState(false);
    const [calendarConnecting, setCalendarConnecting] = useState(false);
    const [calendarAuth, setCalendarAuth] = useState<CalendarAuthResult | null>(null);
    const [calendarError, setCalendarError] = useState<string | null>(null);
    const [calendarSynced, setCalendarSynced] = useState(false);

    const emailValid = validateEmail(form.email);

    useEffect(() => {
        if (!id) return;
        const db = getFirestore(app);
        getDoc(doc(db, "events", id)).then((snap) => {
            if (!snap.exists()) {
                setNotFound(true);
            } else {
                setEvent(snap.data() as EventData);
            }
            setLoadingEvent(false);
        });
    }, [id]);

    useEffect(() => {
        if (!event) return;

        // Dynamic tab title
        document.title = `${event.name} — Rada Events`;

        const updateMeta = (selector: string, attribute: string, value: string) => {
            let el = document.querySelector(selector);
            if (!el) {
                el = document.createElement("meta");
                if (selector.startsWith("meta[name=")) {
                    const name = selector.split("'")[1];
                    el.setAttribute("name", name);
                } else if (selector.startsWith("meta[property=")) {
                    const prop = selector.split("'")[1];
                    el.setAttribute("property", prop);
                }
                document.head.appendChild(el);
            }
            el.setAttribute(attribute, value);
        };

        const desc = event.description || `Register for ${event.name} via Rada.`;
        const img = event.imageUrl || "/images/logo.png";

        // Primary descriptions
        updateMeta("meta[name='description']", "content", desc);

        // Open Graph
        updateMeta("meta[property='og:title']", "content", `${event.name} — Rada Events`);
        updateMeta("meta[property='og:description']", "content", desc);
        updateMeta("meta[property='og:image']", "content", img);

        // Twitter
        updateMeta("meta[name='twitter:title']", "content", `${event.name} — Rada Events`);
        updateMeta("meta[name='twitter:description']", "content", desc);
        updateMeta("meta[name='twitter:image']", "content", img);
    }, [event]);

    // Check duplicate when email changes
    const checkDuplicate = (email: string) => {
        if (!event?.registered) return;
        const exists = event.registered.some(
            (r) => r.email === email.trim().toLowerCase()
        );
        setAlreadyRegistered(exists);
    };

    const setField = (field: keyof RegistrationForm) =>
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            setForm((f) => ({ ...f, [field]: value }));
            if (field === "email") {
                checkDuplicate(value);
                // If email becomes invalid again, drop any calendar auth we were holding
                if (!validateEmail(value) && calendarSync) {
                    setCalendarSync(false);
                    setCalendarAuth(null);
                    setCalendarError(null);
                }
            }
        };

    const handleToggleCalendarSync = async () => {
        if (!emailValid) return;

        if (calendarSync) {
            setCalendarSync(false);
            setCalendarAuth(null);
            setCalendarError(null);
            return;
        }

        setCalendarError(null);
        setCalendarConnecting(true);
        try {
            const result = await requestCalendarAccess();
            setCalendarAuth(result);
            setCalendarSync(true);
        } catch (err: any) {
            console.error("Google Calendar auth failed:", err);
            setCalendarError("Couldn't connect to Google Calendar. Please try again.");
            setCalendarSync(false);
        } finally {
            setCalendarConnecting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!form.name.trim()) { setError("Please enter your name."); return; }
        if (!validateEmail(form.email)) { setError("Please enter a valid email."); return; }
        if (!form.phone.trim()) { setError("Please enter your phone number."); return; }
        if (form.type === "club" && !form.clubName.trim()) {
            setError("Please enter your club name.");
            return;
        }
        if (alreadyRegistered) {
            setError("This email is already registered for this event.");
            return;
        }
        if (!id) return;

        setSubmitting(true);
        try {
            const db = getFirestore(app);
            await updateDoc(doc(db, "events", id), {
                registered: arrayUnion({
                    name: form.name.trim(),
                    email: form.email.trim().toLowerCase(),
                    phone: form.phone.trim(),
                    type: form.type,
                    clubName: form.type === "club" ? form.clubName.trim() : null,
                    attended: false,
                    registeredAt: new Date().toISOString(),
                }),
            });

            if (event) {
                const baseUrl = window.location.origin;
                const eventUrl = `${baseUrl}/event/${id}`;
                const optionalDetails = [
                    event.fee ? `<p style="margin:0 0 8px 0;font-size:14px;color:#4a4a6a;"><strong>Entry fee:</strong> ${event.fee}</p>` : "",
                    event.dresscode ? `<p style="margin:0;font-size:14px;color:#4a4a6a;"><strong>Dress code:</strong> ${event.dresscode}</p>` : "",
                ].join("");

                sendTemplatedEmail(
                    form.email.trim().toLowerCase(),
                    EMAIL_TEMPLATES.registrationConfirmation.id,
                    {
                        attendee_name: form.name.trim(),
                        event_name: event.name,
                        date: formatDate(event.date),
                        time: formatTime(event.time),
                        location: isVirtualLink(event.location)
                            ? (isGoogleMeet(event.location) ? "Google Meet (online)" : "Online")
                            : event.location,
                        optional_details: optionalDetails,
                        google_calendar_url: buildGoogleCalendarUrl({
                            id,
                            name: event.name,
                            date: event.date,
                            time: event.time,
                            location: event.location,
                            description: event.description,
                        }),
                        event_url: eventUrl,
                        company_name: appConfig.name,
                        base_url: baseUrl,
                    }
                ).catch((err) => console.error("Registration confirmation email failed:", err));
            }

            // Auto-sync to the registrant's Google Calendar if they opted in
            if (event && calendarSync && isTokenValid(calendarAuth)) {
                try {
                    await insertGoogleCalendarEvent(calendarAuth!.accessToken, {
                        name: event.name,
                        date: event.date,
                        time: event.time,
                        location: event.location,
                        description: event.description,
                    });
                    setCalendarSynced(true);
                } catch (err) {
                    console.error("Google Calendar sync failed:", err);
                    setCalendarSynced(false);
                }
            }

            setSubmitted(true);
        } catch (err) {
            console.error("Registration error:", err);
            setError("Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const virtual = event ? isVirtualLink(event.location) : false;
    const meet = event ? isGoogleMeet(event.location) : false;
    const hasFee = !!(event?.fee);

    const inputCls =
        "mt-1 w-full rounded-[8px] border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#7877C6]/20 transition placeholder:text-gray-400 text-gray-900";

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
    if (submitted) {
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
                                    You're registered!
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
                            {form.type === "club" && form.clubName && (
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Users size={11} className="text-gray-300 shrink-0" />
                                    {form.clubName}
                                </div>
                            )}
                            {hasFee && (
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Ticket size={11} className="text-gray-300 shrink-0" />
                                    {event.fee}
                                </div>
                            )}
                        </div>

                        <AddToCalendar
                            event={{
                                id: id || undefined,
                                name: event.name,
                                date: event.date,
                                time: event.time,
                                location: event.location,
                                description: event.description,
                            }}
                        />

                        {calendarSync && (
                            <p
                                className={`text-xs text-center flex items-center justify-center gap-1 ${calendarSynced ? "text-emerald-600" : "text-gray-400"
                                    }`}
                            >
                                {calendarSynced
                                    ? "✓ Added to your Google Calendar"
                                    : "Couldn't auto-add to Google Calendar — use the button above instead."}
                            </p>
                        )}

                        {/* Name summary */}
                        <p className="text-xs text-center text-gray-400">
                            Registered as{" "}
                            <span className="font-medium text-gray-600">{form.name}</span> ·{" "}
                            {form.email}
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

                <div className="h-52 md:h-64 w-full overflow-hidden rounded-2xl mb-6">
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

                            {/* Desktop-only calendar sync toggle, gated on a valid email */}
                            {/* <GoogleCalendarSyncToggle
                                className="hidden lg:block"
                                checked={calendarSync}
                                connecting={calendarConnecting}
                                error={calendarError}
                                disabled={!emailValid}
                                onToggle={handleToggleCalendarSync}
                            /> */}
                        </div>
                    </div>

                    {/* ── Right: Registration form ── */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">
                                Register
                            </h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Fill in your details to secure your spot.
                            </p>
                        </div>

                        {error && (
                            <div className="p-3 text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-[8px]">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">

                            {/* Name */}
                            <div>
                                <label className={labelCls}>
                                    Full name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={setField("name")}
                                    placeholder="Jane Doe"
                                    className={inputCls}
                                    required
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className={labelCls}>
                                    Email <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={setField("email")}
                                    placeholder="jane@example.com"
                                    className={`${inputCls} ${alreadyRegistered
                                        ? "border-red-300 focus:ring-red-500/20"
                                        : ""
                                        }`}
                                    required
                                />
                                {alreadyRegistered && (
                                    <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                                        <AlertCircle size={11} />
                                        This email is already registered for this event.
                                    </p>
                                )}


                            </div>

                            {/* Phone */}
                            <div>
                                <label className={labelCls}>
                                    Phone number <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <Phone
                                        size={13}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 mt-0.5 text-gray-400 pointer-events-none"
                                    />
                                    <input
                                        type="tel"
                                        value={form.phone}
                                        onChange={setField("phone")}
                                        placeholder="+254 700 000 000"
                                        className={`${inputCls} pl-9`}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Attending as */}
                            <div>
                                <label className={labelCls}>Attending as</label>
                                <div className="flex gap-2 mt-1">
                                    {(["club", "guest"] as AttendeeType[]).map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() =>
                                                setForm((f) => ({ ...f, type: t, clubName: "" }))
                                            }
                                            className={`flex-1 py-2.5 rounded-[8px] text-sm font-medium border transition cursor-pointer ${form.type === t
                                                ? "bg-[#7877C6] border-[#7877C6] text-white"
                                                : "border-gray-200 text-gray-500 hover:bg-gray-50"
                                                }`}
                                        >
                                            {t === "club" ? "Club member" : "Guest"}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Club name */}
                            {form.type === "club" && (
                                <div>
                                    <label className={labelCls}>
                                        Club name <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.clubName}
                                        onChange={setField("clubName")}
                                        placeholder="e.g. Rotaract Club of Kitengela"
                                        className={inputCls}
                                        required
                                    />
                                </div>
                            )}
                            {/* Mobile-only calendar sync toggle, appears right under email */}
                            {/* <GoogleCalendarSyncToggle
                                className="lg:hidden mt-3"
                                checked={calendarSync}
                                connecting={calendarConnecting}
                                error={calendarError}
                                disabled={!emailValid}
                                onToggle={handleToggleCalendarSync}
                            /> */}
                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={submitting || alreadyRegistered}
                                className="w-full flex items-center justify-center gap-2 rounded-[8px] bg-[#7877C6] py-2.5 text-sm font-medium text-white hover:bg-[#7877C6]/90 transition disabled:opacity-60 cursor-pointer"
                            >
                                {submitting && (
                                    <Loader2 size={15} className="animate-spin" />
                                )}
                                {submitting ? "Submitting..." : "Register"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventPublic;