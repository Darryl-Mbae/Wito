import type { CalendarEventInput } from "./calendarLinks";

export type EventFlyerSource = CalendarEventInput & {
  fee?: string | null;
  dresscode?: string | null;
  imageUrl?: string | null;
};

export function eventToFlyerJson(event: EventFlyerSource): string {
  const datetime =
    event.date && event.time
      ? `${event.date} · ${event.time}`
      : event.date || "";

  const data: Record<string, unknown> = {
    event_name: event.name,
    name: event.name,
    title: event.name,
    date: event.date,
    time: event.time,
    datetime,
    location: event.location,
    description: event.description || "",
    dresscode: event.dresscode || "",
    fee: event.fee || "",
    image_url: event.imageUrl || "",
  };

  return JSON.stringify(data, null, 2);
}

export function mergeEventIntoJson(existingJson: string, event: EventFlyerSource): string {
  let base: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(existingJson);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      base = parsed as Record<string, unknown>;
    }
  } catch {
    /* use empty */
  }

  const eventData = JSON.parse(eventToFlyerJson(event)) as Record<string, unknown>;
  return JSON.stringify({ ...base, ...eventData }, null, 2);
}
