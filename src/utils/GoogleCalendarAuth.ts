declare global {
    interface Window {
        google?: any;
    }
}

const GIS_SRC = "https://accounts.google.com/gsi/client";
const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

let gisLoadingPromise: Promise<void> | null = null;

export const loadGoogleIdentityServices = (): Promise<void> => {
    if (window.google?.accounts?.oauth2) return Promise.resolve();
    if (gisLoadingPromise) return gisLoadingPromise;

    gisLoadingPromise = new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${GIS_SRC}"]`);
        if (existing) {
            existing.addEventListener("load", () => resolve());
            return;
        }
        const script = document.createElement("script");
        script.src = GIS_SRC;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
        document.head.appendChild(script);
    });

    return gisLoadingPromise;
};

export type CalendarAuthResult = {
    accessToken: string;
    expiresAt: number; // epoch ms
};

export const requestCalendarAccess = async (): Promise<CalendarAuthResult> => {
    if (!GOOGLE_CLIENT_ID) {
        throw new Error("Missing VITE_GOOGLE_CLIENT_ID env var");
    }

    await loadGoogleIdentityServices();

    if (!window.google?.accounts?.oauth2) {
        throw new Error("Google Identity Services unavailable");
    }

    return new Promise((resolve, reject) => {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: CALENDAR_SCOPE,
            prompt: "consent",
            callback: (resp: any) => {
                if (resp.error) {
                    reject(new Error(resp.error));
                    return;
                }
                resolve({
                    accessToken: resp.access_token,
                    expiresAt: Date.now() + Number(resp.expires_in || 3600) * 1000,
                });
            },
            error_callback: (err: any) => {
                reject(new Error(err?.message || "Google sign-in was cancelled or failed."));
            },
        });

        tokenClient.requestAccessToken();
    });
};

export const isTokenValid = (result: CalendarAuthResult | null): boolean =>
    !!result && result.expiresAt - Date.now() > 30_000; // 30s safety buffer