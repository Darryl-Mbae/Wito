import type { EmailTemplateId } from "./html-templates";

const WORKER_BASE_URL =
  import.meta.env.VITE_WORKER_URL ?? "https://mailtrap.darrylmbae01.workers.dev";

export async function sendTemplatedEmail(
  recipientEmail: string,
  templateId: EmailTemplateId,
  variables: Record<string, string>
) {
  const response = await fetch(`${WORKER_BASE_URL}/send-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipientEmail, templateId, variables }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error((data as { error?: string }).error ?? `Email error: ${response.statusText}`);
  }

  return data;
}
