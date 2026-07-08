import { Calendar } from "lucide-react";
import type { CalendarEventInput } from "../utils/calendarLinks";
import { openGoogleCalendar, addToAppleCalendar } from "../utils/calendarLinks";

type Props = {
  event: CalendarEventInput;
  compact?: boolean;
  className?: string;
};

export default function AddToCalendar({ event, compact = false, className = "" }: Props) {
  if (compact) {
    return (
      <div className={`flex gap-2 ${className}`}>
        <button
          type="button"
          onClick={() => openGoogleCalendar(event)}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2 text-[11px] font-semibold text-gray-700 hover:border-[#7877C6]/30 hover:text-[#7877C6] transition cursor-pointer"
        >
          <Calendar size={12} />
          Google
        </button>
        <button
          type="button"
          onClick={() => addToAppleCalendar(event)}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2 text-[11px] font-semibold text-gray-700 hover:border-[#7877C6]/30 hover:text-[#7877C6] transition cursor-pointer"
        >
          <Calendar size={12} />
          Apple
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Add to calendar</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={() => openGoogleCalendar(event)}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-xs font-semibold text-gray-700 hover:border-[#7877C6]/30 hover:bg-[#7877C6]/5 hover:text-[#7877C6] transition cursor-pointer"
        >
          <Calendar size={14} />
          Google Calendar
        </button>
        <button
          type="button"
          onClick={() => addToAppleCalendar(event)}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-xs font-semibold text-gray-700 hover:border-[#7877C6]/30 hover:bg-[#7877C6]/5 hover:text-[#7877C6] transition cursor-pointer"
        >
          <Calendar size={14} />
          Apple Calendar
        </button>
      </div>
    </div>
  );
}
