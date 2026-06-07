import React, { useState } from "react";
import { Trash2 } from "lucide-react";

type NotifCategory = "subscription" | "update" | "announcement";

interface Notification {
    id: string;
    category: NotifCategory;
    from: string;
    subject: string;
    preview: string;
    time: string;
    read: boolean;
}

const MOCK: Notification[] = [
    {
        id: "1",
        category: "subscription",
        from: "Billing",
        subject: "Pro plan is now available",
        preview: "Unlock unlimited members, advanced analytics, and priority support for your organizations.",
        time: "9:41 AM",
        read: false,
    },
    {
        id: "2",
        category: "announcement",
        from: "System",
        subject: "Scheduled maintenance — June 12",
        preview: "The platform will be unavailable for approximately 30 minutes starting at 02:00 UTC.",
        time: "8:02 AM",
        read: false,
    },
    {
        id: "3",
        category: "update",
        from: "What's new",
        subject: "Event check-in is here",
        preview: "Members can now check in to events using a QR code. Generate codes from your event detail page.",
        time: "Jun 5",
        read: false,
    },
    {
        id: "4",
        category: "subscription",
        from: "Billing",
        subject: "Your trial ends in 3 days",
        preview: "Add a payment method to keep access to all features after your trial period ends.",
        time: "Jun 4",
        read: true,
    },
    {
        id: "5",
        category: "update",
        from: "What's new",
        subject: "Redesigned member profiles",
        preview: "Member profiles now show roles, joined date, and event attendance in a cleaner layout.",
        time: "Jun 1",
        read: true,
    },
    {
        id: "6",
        category: "announcement",
        from: "System",
        subject: "New data export options",
        preview: "You can now export member lists and event attendance as CSV or PDF from your dashboard.",
        time: "May 28",
        read: true,
    },
];

const fromColor: Record<string, string> = {
    Billing: "bg-[#7877C6]",
    System: "bg-slate-400",
    "What's new": "bg-[#1D9E75]",
};

export function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>(MOCK);
    const [selected, setSelected] = useState<string | null>(null);

    const unread = notifications.filter((n) => !n.read).length;

    const open = (id: string) => {
        setSelected(id);
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
    };

    const dismiss = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        if (selected === id) setSelected(null);
    };

    const selectedNotif = notifications.find((n) => n.id === selected) ?? null;

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
                            className={`group relative flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors ${selected === n.id
                                ? "bg-[rgba(120,119,198,0.06)]"
                                : "hover:bg-gray-50/70"
                                }`}
                        >
                            {/* Unread dot */}
                            {!n.read && (
                                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-[#7877C6]" />
                            )}

                            {/* Avatar */}
                            <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white mt-0.5 ${fromColor[n.from] ?? "bg-gray-300"}`}>
                                {n.from[0]}
                            </div>

                            {/* Text */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                    <span className={`text-[13px] truncate ${n.read ? "font-normal text-gray-600" : "font-semibold text-gray-900"}`}>
                                        {n.from}
                                    </span>
                                    <span className="text-[11.5px] text-gray-400 flex-shrink-0">{n.time}</span>
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
                {selectedNotif && (
                    <div className="flex-1 flex flex-col px-8 py-6 min-w-0">
                        <p className={`text-[11px] font-semibold uppercase tracking-widest mb-4 ${selectedNotif.category === "subscription"
                            ? "text-[#7877C6]"
                            : selectedNotif.category === "update"
                                ? "text-[#1D9E75]"
                                : "text-gray-400"
                            }`}>
                            {selectedNotif.category === "subscription" ? "Plans & Billing" : selectedNotif.category === "update" ? "What's new" : "Announcement"}
                        </p>
                        <h3 className="text-[17px] font-semibold text-gray-900 leading-snug mb-1">
                            {selectedNotif.subject}
                        </h3>
                        <p className="text-[12px] text-gray-400 mb-6">
                            From <span className="text-gray-600 font-medium">{selectedNotif.from}</span> · {selectedNotif.time}
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