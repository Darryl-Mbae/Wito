import React, { useState, useEffect } from "react";
import { Trash2, Coins, Bell, Megaphone, CreditCard } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import type { DashboardContextType } from "./Dashboard";
import {
    getFirestore,
    collection,
    query,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc,
    addDoc,
    serverTimestamp,
} from "firebase/firestore";
import app from "../config/firebase";

type NotifCategory = "subscription" | "update" | "announcement" | "sale";

interface Notification {
    id: string;
    category: NotifCategory;
    from: string;
    subject: string;
    preview: string;
    time: string;
    read: boolean;
}

// ─── Category meta ────────────────────────────────────────────────────────────

const CATEGORY_META: Record<NotifCategory, { label: string; color: string; icon: React.ReactNode }> = {
    subscription: { label: "Plans & Billing", color: "text-[#7877C6]", icon: <CreditCard size={12} /> },
    update:       { label: "What's new",      color: "text-[#1D9E75]", icon: <Bell size={12} /> },
    announcement: { label: "Announcement",    color: "text-gray-400",  icon: <Megaphone size={12} /> },
    sale:         { label: "Sale",            color: "text-amber-500", icon: <Coins size={12} /> },
};

const FROM_COLOR: Record<string, string> = {
    Billing:       "bg-[#7877C6]",
    System:        "bg-slate-400",
    "What's new":  "bg-[#1D9E75]",
    Marketplace:   "bg-amber-400",
};

function fromColor(from: string) {
    return FROM_COLOR[from] ?? "bg-gray-300";
}

function formatTime(raw: string): string {
    try {
        const d = new Date(raw);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffDays = Math.floor(diffMs / 86_400_000);
        if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        if (diffDays < 7)  return d.toLocaleDateString([], { weekday: "short" });
        return d.toLocaleDateString([], { month: "short", day: "numeric" });
    } catch {
        return raw;
    }
}

// ─── Seed helper (dev / first-run) ────────────────────────────────────────────

const SEED: Omit<Notification, "id">[] = [
    {
        category: "subscription",
        from: "Billing",
        subject: "Pro plan is now available",
        preview: "Unlock unlimited members, advanced analytics, and priority support for your organizations.",
        time: new Date().toISOString(),
        read: false,
    },
    {
        category: "announcement",
        from: "System",
        subject: "Scheduled maintenance — June 12",
        preview: "The platform will be unavailable for approximately 30 minutes starting at 02:00 UTC.",
        time: new Date(Date.now() - 3_600_000).toISOString(),
        read: false,
    },
    {
        category: "update",
        from: "What's new",
        subject: "Event check-in is here",
        preview: "Members can now check in to events using a QR code. Generate codes from your event detail page.",
        time: new Date(Date.now() - 86_400_000 * 3).toISOString(),
        read: true,
    },
];

export function NotificationsPage() {
    const { activeOrg } = useOutletContext<DashboardContextType>();
    const orgId = activeOrg?.id;

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [selected, setSelected] = useState<string | null>(null);
    const [seeded, setSeeded] = useState(false);

    // ── Real-time listener ──────────────────────────────────────────────────
    useEffect(() => {
        if (!orgId) return;
        const db = getFirestore(app);
        const q = query(
            collection(db, "organizations", orgId, "notifications"),
            orderBy("createdAt", "desc")
        );
        const unsub = onSnapshot(q, async (snap) => {
            if (snap.empty && !seeded) {
                // Seed starter notifications on first load
                setSeeded(true);
                for (const n of SEED) {
                    await addDoc(collection(db, "organizations", orgId, "notifications"), {
                        ...n,
                        createdAt: serverTimestamp(),
                    });
                }
                return;
            }
            setNotifications(
                snap.docs.map((d) => {
                    const data = d.data();
                    return {
                        id: d.id,
                        category: data.category ?? "announcement",
                        from: data.from ?? "System",
                        subject: data.subject ?? "",
                        preview: data.preview ?? "",
                        time: data.createdAt?.toDate?.()?.toISOString?.() ?? data.time ?? "",
                        read: data.read ?? false,
                    } as Notification;
                })
            );
        });
        return () => unsub();
    }, [orgId, seeded]);

    const unread = notifications.filter((n) => !n.read).length;

    const open = async (id: string) => {
        setSelected(id);
        const notif = notifications.find((n) => n.id === id);
        if (!notif || notif.read || !orgId) return;
        const db = getFirestore(app);
        await updateDoc(doc(db, "organizations", orgId, "notifications", id), { read: true });
    };

    const dismiss = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (selected === id) setSelected(null);
        if (!orgId) return;
        const db = getFirestore(app);
        await deleteDoc(doc(db, "organizations", orgId, "notifications", id));
    };

    const selectedNotif = notifications.find((n) => n.id === selected) ?? null;
    const meta = selectedNotif ? CATEGORY_META[selectedNotif.category] : null;

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                    <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
                    {unread > 0 && (
                        <span className="text-[11px] font-semibold bg-[#7877C6] text-white px-1.5 py-0.5 rounded-full">
                            {unread}
                        </span>
                    )}
                </div>
            </div>

            {/* Two-pane layout */}
            <div className="flex gap-0 rounded-2xl overflow-hidden bg-white" style={{ minHeight: 480 }}>

                {/* Left — list */}
                <div className={`flex flex-col divide-y divide-gray-50 ${selectedNotif ? "w-[42%] border-r border-gray-100" : "w-full"}`}>
                    {notifications.length === 0 && (
                        <div className="flex-1 flex items-center justify-center py-20 text-[13px] text-gray-400">
                            No notifications
                        </div>
                    )}
                    {notifications.map((n) => (
                        <div
                            key={n.id}
                            onClick={() => open(n.id)}
                            className={`group relative flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors ${
                                selected === n.id ? "bg-[rgba(120,119,198,0.06)]" : "hover:bg-gray-50/70"
                            }`}
                        >
                            {/* Unread dot */}
                            {!n.read && (
                                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-[#7877C6]" />
                            )}

                            {/* Avatar */}
                            <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white mt-0.5 ${fromColor(n.from)}`}>
                                {n.category === "sale" ? <Coins size={14} /> : n.from[0]}
                            </div>

                            {/* Text */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                    <span className={`text-[13px] truncate ${n.read ? "font-normal text-gray-600" : "font-semibold text-gray-900"}`}>
                                        {n.from}
                                    </span>
                                    <span className="text-[11.5px] text-gray-400 flex-shrink-0">{formatTime(n.time)}</span>
                                </div>
                                <p className={`text-[12.5px] truncate ${n.read ? "text-gray-400" : "text-gray-700"}`}>
                                    {n.subject}
                                </p>
                                {!selectedNotif && (
                                    <p className="text-[12px] text-gray-400 truncate mt-0.5">{n.preview}</p>
                                )}
                            </div>

                            {/* Trash on hover */}
                            <button
                                onClick={(e) => dismiss(e, n.id)}
                                className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition text-gray-300 hover:text-red-400 cursor-pointer p-0.5 mt-1"
                            >
                                <Trash2 size={13} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Right — reading pane */}
                {selectedNotif && meta && (
                    <div className="flex-1 flex flex-col px-8 py-6 min-w-0">
                        <p className={`text-[11px] font-semibold uppercase tracking-widest mb-4 flex items-center gap-1.5 ${meta.color}`}>
                            {meta.icon}
                            {meta.label}
                        </p>
                        <h3 className="text-[17px] font-semibold text-gray-900 leading-snug mb-1">
                            {selectedNotif.subject}
                        </h3>
                        <p className="text-[12px] text-gray-400 mb-6">
                            From <span className="text-gray-600 font-medium">{selectedNotif.from}</span> · {formatTime(selectedNotif.time)}
                        </p>
                        <p className="text-[13.5px] text-gray-600 leading-relaxed">
                            {selectedNotif.preview}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}