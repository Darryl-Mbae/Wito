import { useState, useRef, useEffect } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Ticket,
  Link,
  Check,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";

export type Event = {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  fee?: string | null;
  dresscode?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  createdBy: string;
  orgId: string;
};

export type ViewMode = "grid" | "list";

export const isPast = (iso: string) => !!iso && new Date(iso) < new Date();
export const isVirtualLink = (loc: string) =>
  loc?.startsWith("http://") || loc?.startsWith("https://");
export const isGoogleMeet = (loc: string) =>
  loc?.toLowerCase().includes("meet.google") ||
  loc?.toLowerCase().includes("google meet");

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export const formatTime = (t: string) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
};

const DEFAULT_IMAGE = "/images/event-default.jpg";

interface Props {
  event: Event;
  isMine: boolean;
  canManage: boolean; // true if current user is owner OR created the event
  viewMode: ViewMode;
  onEdit?: (event: Event) => void;
  onDelete?: (event: Event) => void;
  onCardClick?: () => void;

}

// ── 3-dot dropdown menu ───────────────────────────────────────────────────────
const EventMenu: React.FC<{
  event: Event;
  onEdit?: (e: Event) => void;
  onDelete?: (e: Event) => void;
  align?: "right" | "left";
}> = ({ event, onEdit, onDelete, align = "right" }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="text-white bg-[#7877C6] transition cursor-pointer p-0.5 rounded-full"
        title="More options"
      >
        <MoreHorizontal size={15} />
      </button>

      {open && (
        <div
          className={`absolute z-30 top-6 ${align === "right" ? "right-0" : "left-0"} w-36 bg-white border border-gray-100 rounded-xl shadow-lg py-1 overflow-hidden`}
        >
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(event); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition cursor-pointer"
            >
              <Pencil size={13} className="text-gray-400" />
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(event); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition cursor-pointer"
            >
              <Trash2 size={13} />
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ── Card ──────────────────────────────────────────────────────────────────────
const EventCard: React.FC<Props> = ({
  event,
  isMine,
  canManage,
  viewMode,
  onEdit,
  onDelete,
  onCardClick
}) => {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  const past = isPast(event.date);
  const virtual = isVirtualLink(event.location);
  const meet = isGoogleMeet(event.location);

  const handleShare = async () => {
    const url = `${window.location.origin}/event/${event.id}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  // ── List row ────────────────────────────────────────────────────────────
  if (viewMode === "list") {
    return (
      <div className={`hover:ml-2 transition-all ease-out duration-300 flex items-center gap-4 px-4 py-3 border-b border-gray-100 bg-white  hover:bg-gray-50/50 ${past ? "opacity-55" : ""
        }`}
      >
        {/* Thumbnail */}
        <div
          onClick={onCardClick}
          className="cursor-pointer h-10 w-10 rounded-lg overflow-hidden shrink-0 bg-gray-100">
          <img
            src={event.imageUrl || DEFAULT_IMAGE}
            alt={event.name}
            className="h-full w-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
          />
        </div>

        {/* Name + badges */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p onClick={onCardClick}
              className="cursor-pointer text-sm font-medium text-gray-900 truncate">{event.name}</p>
            {isMine && (
              <span className="text-[10px] font-semibold bg-[#7877C6]/10 text-[#7877C6] px-1.5 py-0.5 rounded-full shrink-0">
                Mine
              </span>
            )}
            {past && (
              <span className="text-[10px] font-semibold bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full shrink-0">
                Past
              </span>
            )}
            {virtual && (
              <span className="text-[10px] font-semibold bg-[#7877C6]/10 text-[#7877C6] px-1.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                <Video size={9} />
                {meet ? "Google Meet" : "Online"}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatDate(event.date)} · {formatTime(event.time)}
          </p>
        </div>

        {/* Location */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-400 min-w-0 max-w-[180px]">
          {virtual ? <Video size={11} className="shrink-0" /> : <MapPin size={11} className="shrink-0" />}
          {virtual ? (
            <a
              href={event.location}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#7877C6] underline underline-offset-2 truncate"
            >
              {meet ? "Join Google Meet" : "Join Online"}
            </a>
          ) : (
            <span className="truncate">{event.location}</span>
          )}
        </div>

        {/* Fee */}
        {event.fee && (
          <div className="hidden lg:flex items-center gap-1 text-xs text-gray-400 shrink-0">
            <Ticket size={11} />
            {event.fee}
          </div>
        )}
        <button
          onClick={handleShare}
          title="Copy event link"
          className="text-gray-300 hover:text-[#7877C6] transition cursor-pointer p-1"
        >
          {copied ? <Check size={14} className="text-emerald-500" /> : <Link size={14} />}
        </button>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">

          {canManage && (
            <EventMenu
              event={event}
              onEdit={onEdit}
              onDelete={onDelete}
              align="right"
            />
          )}
        </div>
      </div>
    );
  }

  // ── Grid card ───────────────────────────────────────────────────────────
  return (
    <div
      className={`w-[90%] mx-auto md:w-full transition-all ease-out duration-300 relative rounded-2xl border border-gray-100 bg-white overflow-hidden flex flex-col hover:border-gray-200 ${past ? "opacity-55" : ""
        }`}
    >
      {/* Image */}
      <div
        onClick={onCardClick}
        className="cursor-pointer h-46 w-full overflow-hidden shrink-0 bg-gray-100 relative">
        <img
          src={event.imageUrl || DEFAULT_IMAGE}
          alt={event.name}
          className="h-full w-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
        />

        {/* Top-left: Mine + Virtual */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
          {isMine && (
            <span className="text-[10px] font-semibold bg-[#7877C6] text-white px-2 py-0.5 rounded-full">
              Mine
            </span>
          )}
          {virtual && (
            <span className="text-[10px] font-semibold bg-white/90 text-[#7877C6] px-2 py-0.5 rounded-full flex items-center gap-1">
              <Video size={9} />
              {meet ? "Google Meet" : "Online"}
            </span>
          )}
        </div>

        {/* Top-right: Fee + Past */}
        <div className="absolute top-2.5 right-2.5 flex flex-wrap gap-1 items-start justify-end">
          {event.fee && (
            <span className="text-[10px] font-semibold bg-white/90 text-gray-700 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Ticket size={9} />
              {event.fee}
            </span>
          )}
          {past && (
            <span className="text-[10px] font-semibold bg-black/60 text-white px-2 py-0.5 rounded-full">
              Past
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1 space-y-3">
        {/* Title + actions */}
        <div className="flex items-start justify-between gap-2">
          <h3
            onClick={onCardClick}
            className="cursor-pointer font-semibold text-gray-900 text-sm leading-snug line-clamp-1">
            {event.name}
          </h3>
          <div className="flex items-center gap-1 shrink-0">

            {canManage && (
              <EventMenu
                event={event}
                onEdit={onEdit}
                onDelete={onDelete}
                align="right"
              />
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar size={11} className="text-gray-300 shrink-0" />
            <span>{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock size={11} className="text-gray-300 shrink-0" />
            <span>{formatTime(event.time)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {virtual ? (
              <Video size={11} className="text-gray-300 shrink-0" />
            ) : (
              <MapPin size={11} className="text-gray-300 shrink-0" />
            )}
            {virtual ? (
              <a
                href={event.location}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#7877C6] underline underline-offset-2 truncate"
              >
                {meet ? "Join Google Meet" : "Join Online"}
              </a>
            ) : (
              <span className="line-clamp-1">{event.location}</span>
            )}
          </div>
        </div>
      </div>
      <button
        onClick={handleShare}
        title="Copy event link"
        className="z-50 absolute bottom-4 right-3 text-gray-400 hover:text-[#7877C6] transition cursor-pointer p-0.5"
      >
        {copied ? <Check size={14} className="text-emerald-500" /> : <Link size={14} />}
      </button>
    </div>
  );
};

export default EventCard;