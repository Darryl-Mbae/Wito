import React from "react";
import { Calendar, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

type Props = {
    checked: boolean;
    connecting: boolean;
    error: string | null;
    disabled: boolean;
    onToggle: () => void;
    className?: string;
};

const GoogleCalendarSyncToggle: React.FC<Props> = ({
    checked,
    connecting,
    error,
    disabled,
    onToggle,
    className = "",
}) => {
    return (
        <div
            className={`rounded-[8px] border p-3 transition ${
                checked ? "border-[#7877C6]/30 bg-[#7877C6]/5" : "border-gray-200"
            } ${className}`}
        >
            <button
                type="button"
                onClick={onToggle}
                disabled={disabled || connecting}
                className="w-full flex items-center justify-between gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Calendar size={14} className="text-gray-400" />
                    Sync to Google Calendar
                </span>

                <span
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition shrink-0 ${
                        checked ? "bg-[#7877C6]" : "bg-gray-200"
                    }`}
                >
                    <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition ${
                            checked ? "translate-x-[18px]" : "translate-x-[2px]"
                        }`}
                    />
                </span>
            </button>

            {disabled && !checked && (
                <p className="mt-1.5 text-xs text-gray-400">
                    Enter your email above to enable calendar sync.
                </p>
            )}

            {connecting && (
                <p className="mt-1.5 text-xs text-gray-400 flex items-center gap-1">
                    <Loader2 size={11} className="animate-spin" />
                    Connecting to Google...
                </p>
            )}

            {checked && !connecting && !error && (
                <p className="mt-1.5 text-xs text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={11} />
                    Connected — this event will be added on registration.
                </p>
            )}

            {error && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle size={11} />
                    {error}
                </p>
            )}
        </div>
    );
};

export default GoogleCalendarSyncToggle;