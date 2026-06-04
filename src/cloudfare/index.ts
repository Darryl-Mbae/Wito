export interface Env {
    MAILTRAP_API_KEY: string;
    SENDER_EMAIL: string;
    SENDER_NAME: string;
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        };

        // Handle CORS preflight
        if (request.method === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }

        if (request.method !== "POST") {
            return new Response("Method not allowed", {
                status: 405,
                headers: corsHeaders,
            });
        }

        try {
            const body = await request.json();
            const { recipientEmail, templateUuid, variables } = body as any;

            // 🔍 DEBUG LOGS
            console.log("SENDER_EMAIL:", env.SENDER_EMAIL);
            console.log("SENDER_NAME:", env.SENDER_NAME);
            console.log("API_KEY:", env.MAILTRAP_API_KEY);
            console.log("Recipient Email:", recipientEmail);
            console.log("Template UUID:", templateUuid);
            console.log("Variables:", variables);
            console.log("KEY:", env.MAILTRAP_API_KEY?.slice(0, 8));
            // 🚀 Mailtrap request
            const response = await fetch("https://send.api.mailtrap.io/api/send", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${env.MAILTRAP_API_KEY}`,
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                body: JSON.stringify({
                    from: {
                        email: env.SENDER_EMAIL,
                        name: env.SENDER_NAME,
                    },
                    to: [
                        {
                            email: recipientEmail,
                        },
                    ],
                    template_uuid: templateUuid,
                    template_variables: variables,
                }),
            });

            // 🔥 IMPORTANT: read raw response (THIS fixes your debugging issue)
            const text = await response.text();

            console.log("Mailtrap status:", response.status);
            console.log("Mailtrap response:", text);

            return new Response(text, {
                status: response.status,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                },
            });
        } catch (err: any) {
            console.error("Worker error:", err);

            return new Response(
                JSON.stringify({
                    error: err.message,
                }),
                {
                    status: 500,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                }
            );
        }
    },
};