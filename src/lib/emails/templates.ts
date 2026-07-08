import type { EmailTemplateId } from "./html-templates";

export const EMAIL_TEMPLATES = {
  userInvitation: {
    id: "userInvitation" as EmailTemplateId,
    variables: {} as {
      company_name: string;
      logo_url: string;
      email: string;
      base_url: string;
      token: string;
    },
  },
  passwordReset: {
    id: "passwordReset" as EmailTemplateId,
    variables: {} as {
      company_name: string;
      email: string;
      base_url: string;
      token: string;
    },
  },
  welcomeEmail: {
    id: "welcomeEmail" as EmailTemplateId,
    variables: {} as {
      email: string;
      company_name: string;
      base_url: string;
    },
  },
  eventCalendarInvite: {
    id: "eventCalendarInvite" as EmailTemplateId,
    variables: {} as {
      event_name: string;
      date: string;
      time: string;
      location: string;
      google_calendar_url: string;
      event_url: string;
      company_name: string;
      base_url: string;
    },
  },
  registrationConfirmation: {
    id: "registrationConfirmation" as EmailTemplateId,
    variables: {} as {
      attendee_name: string;
      event_name: string;
      date: string;
      time: string;
      location: string;
      optional_details: string;
      google_calendar_url: string;
      event_url: string;
      company_name: string;
      base_url: string;
    },
  },
} as const;
