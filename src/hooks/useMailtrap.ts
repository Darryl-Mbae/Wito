import { useState } from "react";
import type { EmailTemplateId } from "../lib/emails/html-templates";
import { sendTemplatedEmail } from "../lib/emails/sendEmail";

export function useMailtrap() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    async function sendEmail(
        recipientEmail: string,
        templateId: EmailTemplateId,
        variables: Record<string, string>
    ) {
        setIsLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const data = await sendTemplatedEmail(recipientEmail, templateId, variables);
            setSuccess(true);
            return data;
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Failed to send email";
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }

    return { sendEmail, isLoading, error, success };
}
