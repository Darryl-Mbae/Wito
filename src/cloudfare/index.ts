import puppeteer from "@cloudflare/puppeteer";

// ─── Env ──────────────────────────────────────────────────────────────────────

export interface Env {
    MAILTRAP_API_KEY: string;
    SENDER_EMAIL: string;
    SENDER_NAME: string;
    BROWSER: any; // Cloudflare Browser Rendering binding
}

// ─── CORS ─────────────────────────────────────────────────────────────────────

const CORS: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

function jsonRes(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...CORS, "Content-Type": "application/json" },
    });
}

function errRes(message: string, status = 500): Response {
    return jsonRes({ error: message }, status);
}

// ─── /email (POST) ────────────────────────────────────────────────────────────

async function handleEmail(request: Request, env: Env): Promise<Response> {
    const { recipientEmail, templateUuid, variables } = await request.json() as any;

    const response = await fetch("https://send.api.mailtrap.io/api/send", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${env.MAILTRAP_API_KEY}`,
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        body: JSON.stringify({
            from: { email: env.SENDER_EMAIL, name: env.SENDER_NAME },
            to: [{ email: recipientEmail }],
            template_uuid: templateUuid,
            template_variables: variables,
        }),
    });

    return new Response(await response.text(), {
        status: response.status,
        headers: { ...CORS, "Content-Type": "application/json" },
    });
}

// ─── /screenshot (POST) ───────────────────────────────────────────────────────
// Explicit ad-hoc screenshots if needed by other components

async function handleScreenshot(request: Request, env: Env): Promise<Response> {
    const { html, width, height } = await request.json() as {
        html: string;
        width: number;
        height: number;
    };

    if (!html || !width || !height) {
        return errRes("Missing required fields: html, width, height", 400);
    }

    let browser = null;
    try {
        browser = await puppeteer.launch(env.BROWSER);
        const page = await browser.newPage();
        await page.setViewport({ width, height, deviceScaleFactor: 1 });
        await page.setContent(html, { waitUntil: "networkidle0" });
        await page.evaluateHandle("document.fonts.ready");

        const screenshot = await page.screenshot({
            type: "png",
            clip: { x: 0, y: 0, width, height },
            omitBackground: false,
        });

        return new Response(new Uint8Array(screenshot), {
            status: 200,
            headers: {
                ...CORS,
                "Content-Type": "image/png",
            },
        });
    } catch (e: any) {
        console.error("Screenshot error:", e);
        return errRes(e?.message ?? "Screenshot failed");
    } finally {
        if (browser) await browser.close();
    }
}

// ─── /flyer-preview (GET) ─────────────────────────────────────────────────────
// Invoked natively by <img> tags. Fetches from Firestore, renders, and caches.

async function handleFlyerPreview(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const orgId = url.searchParams.get("orgId");
    const flyerId = url.searchParams.get("flyerId");

    if (!orgId || !flyerId) {
        return errRes("Missing required parameters: orgId, flyerId", 400);
    }

    // 1. Fetch document directly via Firebase REST API
    // TODO: Replace 'YOUR_FIREBASE_PROJECT_ID' with your real project ID string
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/rada-b60ad/databases/(default)/documents/organizations/${orgId}/flyers/${flyerId}`;

    const docResponse = await fetch(firestoreUrl);
    if (!docResponse.ok) {
        return errRes(`Flyer data not found in database: ${docResponse.statusText}`, 404);
    }

    const docData = await docResponse.json() as any;

    // Parse out fields from Firestore's nested string/integer format
    const html = docData.fields?.compiledHtml?.stringValue;
    const width = parseInt(docData.fields?.width?.integerValue ?? "800", 10);
    const height = parseInt(docData.fields?.height?.integerValue ?? "1000", 10);

    if (!html) {
        return errRes("Flyer config is missing compiled HTML structure data", 400);
    }

    let browser = null;
    try {
        browser = await puppeteer.launch(env.BROWSER);
        const page = await browser.newPage();
        await page.setViewport({ width, height, deviceScaleFactor: 1 });

        // Render raw markup string and wait for resource completion
        await page.setContent(html, { waitUntil: "networkidle0" });
        await page.evaluateHandle("document.fonts.ready");

        const screenshot = await page.screenshot({
            type: "png",
            clip: { x: 0, y: 0, width, height },
            omitBackground: false,
        });

        return new Response(new Uint8Array(screenshot), {
            status: 200,
            headers: {
                ...CORS,
                "Content-Type": "image/png",
                // Instruct Cloudflare to save this image context on its global edge cache
                // Max age is set to 7 days (604800 seconds) since flyer designs rarely change
                "Cache-Control": "public, max-age=604800, s-maxage=604800, immutable",
            },
        });
    } catch (e: any) {
        console.error("Dynamic preview generation error:", e);
        return errRes(e?.message ?? "Dynamic preview generation failed");
    } finally {
        if (browser) await browser.close();
    }
}

// ─── Router ───────────────────────────────────────────────────────────────────

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        if (request.method === "OPTIONS") {
            return new Response(null, { headers: CORS });
        }

        const url = new URL(request.url);
        const pathname = url.pathname.replace(/\/$/, "");

        try {
            if (pathname === "/email" && request.method === "POST") {
                return await handleEmail(request, env);
            }
            if (pathname === "/screenshot" && request.method === "POST") {
                return await handleScreenshot(request, env);
            }
            if (pathname === "/flyer-preview" && request.method === "GET") {
                return await handleFlyerPreview(request, env);
            }

            return errRes("Not found", 404);
        } catch (e: any) {
            console.error("Worker root level error:", e);
            return errRes(e?.message ?? "Internal server error");
        }
    },
};