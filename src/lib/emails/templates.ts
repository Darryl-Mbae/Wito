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
} as const;
