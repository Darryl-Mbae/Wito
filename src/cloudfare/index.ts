/// <reference types="@cloudflare/workers-types" />

import puppeteer from "@cloudflare/puppeteer";

export interface Env {
    MAILTRAP_API_KEY: string;
    SENDER_EMAIL: string;
    SENDER_NAME: string;
    BROWSER: any;
    FLYER_BUCKET: R2Bucket;
    R2_PUBLIC_URL: string;
}

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

// ─── /email ───────────────────────────────────────────────────────────────────

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

// ─── /upload ──────────────────────────────────────────────────────────────────

async function handleUpload(request: Request, env: Env): Promise<Response> {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) ?? "uploads";

    if (!file) return errRes("No file provided", 400);

    // Validate it's an image
    if (!file.type.startsWith("image/")) {
        return errRes("Only image files are allowed", 400);
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
        return errRes("File too large (max 10MB)", 400);
    }

    const ext = file.name.split(".").pop() ?? "jpg";
    const key = `${folder}/${crypto.randomUUID()}.${ext}`;

    const bytes = await file.arrayBuffer();

    await env.FLYER_BUCKET.put(key, bytes, {
        httpMetadata: { contentType: file.type },
    });

    const publicUrl = `${env.R2_PUBLIC_URL}/${key}`;

    return jsonRes({ url: publicUrl });
}

// ─── /screenshot ──────────────────────────────────────────────────────────────

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

        return new Response((new Uint8Array(screenshot)).buffer as ArrayBuffer, {
            status: 200,
            headers: { ...CORS, "Content-Type": "image/png" },
        });
    } catch (e: any) {
        return errRes(e?.message ?? "Screenshot failed");
    } finally {
        if (browser) await browser.close();
    }
}

// ─── /flyer-preview ───────────────────────────────────────────────────────────

async function handleFlyerPreview(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const orgId = url.searchParams.get("orgId");
    const flyerId = url.searchParams.get("flyerId");

    if (!orgId || !flyerId) return errRes("Missing orgId or flyerId", 400);

    const BASE = `https://firestore.googleapis.com/v1/projects/rada-b60ad/databases/(default)/documents`;

    const r2Key = `${orgId}/${flyerId}.png`;
    const cached = await env.FLYER_BUCKET.get(r2Key);
    if (cached) {
        return new Response(cached.body, {
            status: 200,
            headers: {
                ...CORS,
                "Content-Type": "image/png",
                "Cache-Control": "public, max-age=604800",
            },
        });
    }

    const flyerRes = await fetch(`${BASE}/organizations/${orgId}/flyers/${flyerId}`);
    if (!flyerRes.ok) {
        const body = await flyerRes.text();
        return errRes(`Firestore fetch failed ${flyerRes.status}: ${body}`, 404);
    }

    const flyerDoc = await flyerRes.json() as any;
    const f = flyerDoc.fields ?? {};

    const html = f.compiledHtml?.stringValue;
    const width = parseInt(f.width?.integerValue ?? "1080", 10);
    const height = parseInt(f.height?.integerValue ?? "1080", 10);

    if (!html) {
        return errRes(`compiledHtml missing. Fields found: ${Object.keys(f).join(", ")}`, 400);
    }

    let browser = null;
    let pngBytes: Uint8Array;
    try {
        browser = await puppeteer.launch(env.BROWSER);
        const page = await browser.newPage();
        await page.setViewport({ width, height, deviceScaleFactor: 1 });
        await page.setContent(html, { waitUntil: "networkidle0" });
        await page.evaluateHandle("document.fonts.ready");
        const buf = await page.screenshot({
            type: "png",
            clip: { x: 0, y: 0, width, height },
            omitBackground: false,
        });
        pngBytes = new Uint8Array(buf);
    } catch (e: any) {
        return errRes(e?.message ?? "Screenshot failed");
    } finally {
        if (browser) await browser.close();
    }

    await env.FLYER_BUCKET.put(r2Key, pngBytes.buffer as ArrayBuffer, {
        httpMetadata: { contentType: "image/png" },
    });

    const publicUrl = `${env.R2_PUBLIC_URL}/${r2Key}`;

    await fetch(
        `${BASE}/organizations/${orgId}/flyers/${flyerId}?updateMask.fieldPaths=previewUrl`,
        {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                fields: { previewUrl: { stringValue: publicUrl } },
            }),
        }
    ).catch(() => {/* non-fatal */ });

    return new Response(pngBytes.buffer as ArrayBuffer, {
        status: 200,
        headers: {
            ...CORS,
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=604800",
        },
    });
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
            if (pathname === "/email" && request.method === "POST") return await handleEmail(request, env);
            if (pathname === "/upload" && request.method === "POST") return await handleUpload(request, env);
            if (pathname === "/screenshot" && request.method === "POST") return await handleScreenshot(request, env);
            if (pathname === "/flyer-preview" && request.method === "GET") return await handleFlyerPreview(request, env);
            return errRes("Not found", 404);
        } catch (e: any) {
            return errRes(e?.message ?? "Internal server error");
        }
    },
};