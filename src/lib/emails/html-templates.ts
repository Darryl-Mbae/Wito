// HTML email templates — {{variable}} placeholders replaced at send time

export type EmailTemplateId =
  | "userInvitation"
  | "passwordReset"
  | "welcomeEmail"
  | "eventCalendarInvite"
  | "registrationConfirmation";

const BASE_STYLES = `
  margin:0;padding:0;background-color:#f4f4f8;
  font-family:'Satoshi','DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif;
`;

const FONT_LINK = `<link href="https://api.fontshare.com/v2/css?f[]=satoshi@300,400,401,700,900&display=swap" rel="stylesheet">`;

function wrapEmail(title: string, preheader: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
  ${FONT_LINK}
</head>
<body style="${BASE_STYLES}">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f8;min-height:100vh;">
    <tr>
      <td align="center" style="padding:48px 16px;">
        ${body}
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function card(inner: string): string {
  return `<table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid rgba(120,119,198,0.15);">
    <tr><td style="height:3px;background:linear-gradient(90deg,#7877C6 0%,rgba(120,119,198,0.25) 60%,transparent 100%);"></td></tr>
    ${inner}
  </table>`;
}

function footer(companyName: string, baseUrl: string): string {
  return `<tr>
    <td style="padding:22px 48px;background-color:#fafafa;border-top:1px solid #f0eff8;">
      <p style="margin:0 0 6px 0;font-size:12px;color:#b0b0c8;">© Wito · All rights reserved</p>
      <p style="margin:0;font-size:12px;color:#b0b0c8;">
        <a href="${baseUrl}/unsubscribe" style="color:#7877C6;text-decoration:none;font-weight:500;">Unsubscribe</a>
        &nbsp;·&nbsp;
        <a href="${baseUrl}/privacy-policy" style="color:#7877C6;text-decoration:none;font-weight:500;">Privacy Policy</a>
      </p>
    </td>
  </tr>`;
}

const TEMPLATES: Record<EmailTemplateId, string> = {
  userInvitation: wrapEmail(
    "You're Invited",
    "{{company_name}} has invited you to join their workspace.",
    card(`
      <tr>
        <td style="padding:36px 48px 0 48px;" align="left">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="vertical-align:middle;padding-right:10px;">
                <img src="{{logo_url}}" alt="Wito" width="32" height="32" style="display:block;border-radius:6px;width:32px;height:32px;object-fit:contain;" />
              </td>
              <td style="vertical-align:middle;">
                <span style="font-size:15px;font-weight:700;color:#1a1a2e;letter-spacing:-0.01em;">Wito</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:32px 48px 0 48px;">
          <h1 style="margin:0 0 14px 0;font-size:32px;font-weight:700;line-height:1.2;color:#1a1a2e;letter-spacing:-0.02em;">
            You've been<br/><span style="color:#7877C6;">invited.</span>
          </h1>
          <p style="margin:0 0 8px 0;font-size:15px;line-height:1.65;color:#4a4a6a;">
            <strong style="color:#1a1a2e;">{{company_name}}</strong> has invited
            <strong><span style="color:#1a1a2e;text-decoration:none;">{{email}}</span></strong>
            to join their workspace.
          </p>
          <p style="margin:0;font-size:15px;line-height:1.65;color:#7a7a9a;">
            Accept the invitation to get started and collaborate with your team.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:32px 48px;">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="background-color:#7877C6;border-radius:8px;">
                <a href="{{base_url}}/accept-invite?token={{token}}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Accept Invitation →</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr><td style="padding:0 48px;"><div style="height:1px;background:#f0eff8;"></div></td></tr>
      <tr>
        <td style="padding:0 48px 36px 48px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(120,119,198,0.05);border:1px solid rgba(120,119,198,0.15);border-radius:8px;">
            <tr>
              <td style="padding:14px 18px;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#7a7a9a;">
                  This invitation was sent only to <strong><span style="color:#7877C6;">{{email}}</span></strong>.
                  If you weren't expecting this, you can safely ignore it.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      ${footer("{{company_name}}", "{{base_url}}")}
    `)
  ),

  passwordReset: wrapEmail(
    "Reset Your Password",
    "Reset your password using the link below.",
    card(`
       <tr>
        <td style="padding:36px 48px 0 48px;" align="left">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="vertical-align:middle;padding-right:10px;">
                <img src="https://mailsend-email-assets.mailtrap.io/kl16ph2ym0mefaeun66ubgn1et6k.png" 
                alt="Wito" width="32" height="32" style="display:block;border-radius:6px;width:32px;height:32px;object-fit:contain;" />
              </td>
              <td style="vertical-align:middle;">
                <span style="font-size:15px;font-weight:700;color:#1a1a2e;letter-spacing:-0.01em;">Wito</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:36px 48px 0 48px;">
          <h1 style="margin:0 0 14px 0;font-size:28px;font-weight:700;line-height:1.2;color:#1a1a2e;">
            Reset your <span style="color:#7877C6;">password</span>
          </h1>
          <p style="margin:0;font-size:15px;line-height:1.65;color:#4a4a6a;">
            We received a request to reset the password for <strong>{{email}}</strong>.
            Click the button below to choose a new one.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:32px 48px;">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="background-color:#7877C6;border-radius:8px;">
                <a href="{{base_url}}/reset-password-confirm?token={{token}}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Reset Password →</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:0 48px 36px 48px;">
          <p style="margin:0;font-size:12px;line-height:1.6;color:#7a7a9a;">
            If you didn't request this, you can safely ignore this email. The link expires in 1 hour.
          </p>
        </td>
      </tr>
      ${footer("{{company_name}}", "{{base_url}}")}
    `)
  ),

  welcomeEmail: wrapEmail(
    "Welcome",
    "Welcome aboard — your account is ready.",
    card(`
      <tr>
        <td style="padding:36px 48px 0 48px;" align="left">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="vertical-align:middle;padding-right:10px;">
                <img src="https://mailsend-email-assets.mailtrap.io/kl16ph2ym0mefaeun66ubgn1et6k.png" 
                alt="Wito" width="32" height="32" style="display:block;border-radius:6px;width:32px;height:32px;object-fit:contain;" />
              </td>
              <td style="vertical-align:middle;">
                <span style="font-size:15px;font-weight:700;color:#1a1a2e;letter-spacing:-0.01em;">Wito</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:36px 48px 0 48px;">
          <h1 style="margin:0 0 14px 0;font-size:28px;font-weight:700;line-height:1.2;color:#1a1a2e;">
            Welcome to <span style="color:#7877C6;">{{company_name}}</span>
          </h1>
          <p style="margin:0;font-size:15px;line-height:1.65;color:#4a4a6a;">
            Hi <strong>{{email}}</strong>, your account is all set. Head to your dashboard to get started.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:32px 48px;">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="background-color:#7877C6;border-radius:8px;">
                <a href="{{base_url}}/dashboard" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Go to Dashboard →</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      ${footer("{{company_name}}", "{{base_url}}")}
    `)
  ),

  eventCalendarInvite: wrapEmail(
    "New Event",
    "You've been invited to a new event on the calendar.",
    card(`
      <tr>
        <td style="padding:36px 48px 0 48px;">
          <h1 style="margin:0 0 14px 0;font-size:28px;font-weight:700;line-height:1.2;color:#1a1a2e;">
            New event: <span style="color:#7877C6;">{{event_name}}</span>
          </h1>
          <p style="margin:0 0 8px 0;font-size:15px;line-height:1.65;color:#4a4a6a;">
            <strong>{{date}}</strong> at <strong>{{time}}</strong>
          </p>
          <p style="margin:0;font-size:15px;line-height:1.65;color:#4a4a6a;">{{location}}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:32px 48px;">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="background-color:#7877C6;border-radius:8px;">
                <a href="{{google_calendar_url}}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Add to Google Calendar</a>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0;font-size:13px;color:#8888a8;">Or open this link on your phone to add to Apple Calendar: <a href="{{event_url}}" style="color:#7877C6;">View event</a></p>
        </td>
      </tr>
      ${footer("{{company_name}}", "{{base_url}}")}
    `)
  ),

  registrationConfirmation: wrapEmail(
    "Registration Confirmed",
    "Thank you for registering for {{event_name}}.",
    card(`
      <tr>
        <td style="padding:36px 48px 0 48px;">
          <h1 style="margin:0 0 14px 0;font-size:28px;font-weight:700;line-height:1.2;color:#1a1a2e;">
            You're <span style="color:#7877C6;">registered!</span>
          </h1>
          <p style="margin:0 0 20px 0;font-size:15px;line-height:1.65;color:#4a4a6a;">
            Hi <strong>{{attendee_name}}</strong>, thank you for registering. Here are your event details:
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;border-radius:12px;border:1px solid #f0eff8;">
            <tr>
              <td style="padding:20px 24px;">
                <p style="margin:0 0 4px 0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#7877C6;">Event</p>
                <p style="margin:0 0 16px 0;font-size:18px;font-weight:700;color:#1a1a2e;">{{event_name}}</p>
                <p style="margin:0 0 8px 0;font-size:14px;color:#4a4a6a;"><strong>Date:</strong> {{date}}</p>
                <p style="margin:0 0 8px 0;font-size:14px;color:#4a4a6a;"><strong>Time:</strong> {{time}}</p>
                <p style="margin:0 0 8px 0;font-size:14px;color:#4a4a6a;"><strong>Location:</strong> {{location}}</p>
                {{optional_details}}
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:32px 48px;">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="background-color:#7877C6;border-radius:8px;">
                <a href="{{google_calendar_url}}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Add to Google Calendar</a>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0;font-size:13px;color:#8888a8;">
            <a href="{{event_url}}" style="color:#7877C6;text-decoration:none;font-weight:500;">View event page →</a>
          </p>
        </td>
      </tr>
      ${footer("{{company_name}}", "{{base_url}}")}
    `)
  ),
};

export const EMAIL_SUBJECTS: Record<EmailTemplateId, string> = {
  userInvitation: "{{company_name}} invited you to join their workspace",
  passwordReset: "Reset your password",
  welcomeEmail: "Welcome to {{company_name}}",
  eventCalendarInvite: "New event: {{event_name}}",
  registrationConfirmation: "You're registered for {{event_name}}",
};

export function renderEmailTemplate(
  templateId: EmailTemplateId,
  variables: Record<string, string>
): { html: string; subject: string } {
  const raw = TEMPLATES[templateId];
  const subjectRaw = EMAIL_SUBJECTS[templateId];

  if (!raw || !subjectRaw) {
    throw new Error(`Unknown email template: ${templateId}`);
  }

  const interpolate = (text: string) =>
    text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => variables[key] ?? "");

  return {
    html: interpolate(raw),
    subject: interpolate(subjectRaw),
  };
}
