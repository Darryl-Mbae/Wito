import { useState } from "react";

export function useMailtrap() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    async function sendEmail<T extends Record<string, string>>(
        recipientEmail: string,
        templateUuid: string,
        variables: T
    ) {
        setIsLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const response = await fetch("https://mailtrap.darrylmbae01.workers.dev/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    recipientEmail,
                    templateUuid,
                    variables,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Mailtrap error: ${response.statusText}`);
            }

            setSuccess(true);
            return data;
        } catch (err: any) {
            const errorMessage = err.message || "Failed to send email execution";
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }

    return { sendEmail, isLoading, error, success };
}