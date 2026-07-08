export type CalendarEventInput = {
  name: string;
  date: string;
  time: string;
  location: string;
  description?: string | null;
  id?: string;
};

function parseDateTime(date: string, time: string): { start: Date; end: Date } {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = (time || "12:00").split(":").map(Number);
  const start = new Date(y, mo - 1, d, h, mi);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  return { start, end };
}

function toGoogleDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function buildGoogleCalendarUrl(event: CalendarEventInput): string {
  const { start, end } = parseDateTime(event.date, event.time);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.name,
    dates: `${toGoogleDate(start)}/${toGoogleDate(end)}`,
    details: event.description || "",
    location: event.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function formatIcsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function buildIcsContent(event: CalendarEventInput): string {
  const { start, end } = parseDateTime(event.date, event.time);
  const uid = event.id ? `rada-event-${event.id}@rada.app` : `rada-event-${Date.now()}@rada.app`;
  const desc = (event.description || "").replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Rada//Event//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:${event.name}`,
    `LOCATION:${event.location}`,
    `DESCRIPTION:${desc}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadIcsFile(event: CalendarEventInput, filename?: string) {
  const blob = new Blob([buildIcsContent(event)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `${event.name.replace(/\s+/g, "-").toLowerCase()}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function openGoogleCalendar(event: CalendarEventInput) {
  window.open(buildGoogleCalendarUrl(event), "_blank", "noopener,noreferrer");
}

export function addToAppleCalendar(event: CalendarEventInput, filename?: string) {
  downloadIcsFile(event, filename);
}
