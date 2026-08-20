type CalendarEventInput = {
    name: string;
    date: string; // ISO date, e.g. "2026-08-10"
    time: string; // "HH:MM"
    location: string;
    description?: string | null;
};

const toRFC3339 = (date: string, time: string) => {
    const [h, m] = time.split(":").map(Number);
    const d = new Date(date);
    d.setHours(h, m || 0, 0, 0);
    return d.toISOString();
};

const addMinutes = (iso: string, minutes: number) =>
    new Date(new Date(iso).getTime() + minutes * 60000).toISOString();

type GoogleApiErrorBody = {
    error?: {
        message?: string;
        code?: number;
        status?: string;
    };
};

export const insertGoogleCalendarEvent = async (
    accessToken: string,
    event: CalendarEventInput
) => {
    const start = toRFC3339(event.date, event.time);
    const end = addMinutes(start, 120); // default 2hr duration — adjust as needed

    const body = {
        summary: event.name,
        description: event.description || undefined,
        location: event.location,
        start: { dateTime: start },
        end: { dateTime: end },
    };

    const res = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        }
    );

    if (!res.ok) {
        const errBody = (await res.json().catch(() => null)) as GoogleApiErrorBody | null;
        throw new Error(
            errBody?.error?.message || `Calendar API error (${res.status})`
        );
    }

    return res.json();
};