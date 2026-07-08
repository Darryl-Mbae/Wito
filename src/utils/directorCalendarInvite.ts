import { getFirestore, doc, getDoc } from "firebase/firestore";
import app from "../config/firebase";
import appConfig from "../config/app";
import { sendTemplatedEmail } from "../lib/emails/sendEmail";
import { buildGoogleCalendarUrl, type CalendarEventInput } from "./calendarLinks";

export async function inviteDirectorsToEventCalendar(
  orgId: string,
  event: CalendarEventInput & { id: string }
) {
  const db = getFirestore(app);
  const orgSnap = await getDoc(doc(db, "organizations", orgId));
  if (!orgSnap.exists()) return;

  const orgData = orgSnap.data();
  const orgName = orgData.name || appConfig.name;
  const invited: { email: string }[] = orgData.invitedDirectors ?? [];

  const ownerSnap = await getDoc(doc(db, "users", orgData.createdBy));
  const ownerEmail = ownerSnap.exists() ? ownerSnap.data().email : null;

  const emails = new Set<string>();
  invited.forEach((d) => { if (d.email) emails.add(d.email); });
  if (ownerEmail) emails.delete(ownerEmail);

  const baseUrl = window.location.origin;
  const googleUrl = buildGoogleCalendarUrl(event);
  const eventUrl = `${baseUrl}/event/${event.id}`;

  const sends = Array.from(emails).map((email) =>
    sendTemplatedEmail(email, "eventCalendarInvite", {
      event_name: event.name,
      date: event.date,
      time: event.time,
      location: event.location,
      google_calendar_url: googleUrl,
      event_url: eventUrl,
      company_name: orgName,
      base_url: baseUrl,
    }).catch((err) => console.error("Calendar invite failed for", email, err))
  );

  await Promise.all(sends);
}
