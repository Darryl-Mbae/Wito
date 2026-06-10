import React, { useState, useRef, useEffect, useMemo } from "react";
import { X, Sparkles, AlertCircle, Loader2 } from "lucide-react";
import type { SavedTemplate } from "./TemplateEditor";
import { LAYOUT_PRESETS } from "./TemplateEditor";
import type { Flyer } from "./FlyersSection";
import {
    getFirestore,
    collection,
    addDoc,
    serverTimestamp,
} from "firebase/firestore";
import app from "../config/firebase";

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
    template: SavedTemplate & { layoutPreset?: string };
    orgId: string;
    workerUrl: string; // e.g. https://your-worker.workers.dev
    onClose: () => void;
    onSaved: (flyer: Flyer) => void;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildPreviewHtml(htmlCode: string, jsonData: string): string {
    let parsed: unknown = null;
    try { parsed = JSON.parse(jsonData); } catch { /* ignore */ }
    const dataScript = `<script>window.__data__ = ${JSON.stringify(parsed ?? null)};<\/script>`;
    const trimmed = htmlCode.trimStart();
    const withHead = trimmed.replace(/(<head[^>]*>)/i, `$1\n${dataScript}`);
    if (withHead !== trimmed) return withHead;
    const withBody = trimmed.replace(/(<body[^>]*>)/i, `${dataScript}\n$1`);
    if (withBody !== trimmed) return withBody;
    return dataScript + "\n" + trimmed;
}

// ─── Scaled iframe preview ────────────────────────────────────────────────────

const ScaledPreview = React.forwardRef<
    HTMLIFrameElement,
    { src: string; canvasWidth: number; canvasHeight: number }
>(({ src, canvasWidth, canvasHeight }, iframeRef) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const el = wrapperRef.current;
        if (!el) return;
        const update = () =>
            setScale(Math.min(el.clientWidth / canvasWidth, el.clientHeight / canvasHeight, 1));
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, [canvasWidth, canvasHeight]);

    return (
        <div ref={wrapperRef} className="w-full h-full flex items-center justify-center">
            <div style={{
                width: canvasWidth * scale, height: canvasHeight * scale,
                borderRadius: 10, overflow: "hidden", flexShrink: 0,
                boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
            }}>
                <iframe
                    ref={iframeRef}
                    src={src}
                    style={{
                        border: "none", width: canvasWidth, height: canvasHeight,
                        transformOrigin: "top left", transform: `scale(${scale})`,
                        pointerEvents: "none",
                    }}
                    sandbox="allow-scripts"
                    title="Flyer preview"
                />
            </div>
        </div>
    );
});
ScaledPreview.displayName = "ScaledPreview";

// ─── Modal ────────────────────────────────────────────────────────────────────

const MakeFlyerModal: React.FC<Props> = ({ template, orgId, workerUrl, onClose, onSaved }) => {
    const preset = LAYOUT_PRESETS.find((p) => p.id === template.layoutPreset);
    const canvasWidth  = preset?.width  ?? 1080;
    const canvasHeight = preset?.height ?? 1080;

    const [jsonData, setJsonData]   = useState(template.jsonData ?? "{}");
    const [jsonError, setJsonError] = useState<string | null>(null);
    const [isSaving, setIsSaving]   = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // Validate JSON
    useEffect(() => {
        if (!jsonData.trim()) { setJsonError(null); return; }
        try { JSON.parse(jsonData); setJsonError(null); }
        catch (e) { setJsonError(e instanceof SyntaxError ? e.message : "Invalid JSON"); }
    }, [jsonData]);

    // Close on Escape
    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === "Escape" && !isSaving) onClose(); };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [onClose, isSaving]);

    const previewSrc = useMemo(() => {
        if (!template.htmlCode?.trim()) return null;
        return `data:text/html;charset=utf-8,${encodeURIComponent(
            buildPreviewHtml(template.htmlCode, jsonData)
        )}`;
    }, [template.htmlCode, jsonData]);

    const derivedEventName = useMemo(() => {
        try {
            const p = JSON.parse(jsonData);
            if (p && typeof p === "object" && !Array.isArray(p))
                return p.event_name ?? p.name ?? p.title ?? template.name;
        } catch { /* ignore */ }
        return template.name;
    }, [jsonData, template.name]);

    // ── Generate & Save ───────────────────────────────────────────────────────
    const handleGenerate = async () => {
        if (jsonError || !template.htmlCode) return;
        setIsSaving(true);
        setSaveError(null);

        try {
            // Compile final markup structure to persist straight to Firestore
            const compiledHtml = buildPreviewHtml(template.htmlCode, jsonData);

            // 1. Instantly save configuration document to Firestore
            const db = getFirestore(app);
            const docRef = await addDoc(
                collection(db, "organizations", orgId, "flyers"),
                {
                    eventName: derivedEventName,
                    templateId: template.id,
                    templateName: template.name,
                    layoutPreset: template.layoutPreset ?? null,
                    jsonData,
                    compiledHtml, // Cached asset raw html source for Worker retrieval
                    width: canvasWidth,
                    height: canvasHeight,
                    createdAt: serverTimestamp(),
                }
            );

            // 2. Derive dynamic preview route matching the Worker configuration blueprint
            const dynamicPreviewUrl = `${workerUrl}/flyer-preview?orgId=${orgId}&flyerId=${docRef.id}`;

            const flyer: Flyer = {
                id: docRef.id,
                eventName: derivedEventName,
                templateName: template.name,
                createdAt: new Date().toISOString(),
                // Both standard view and high-res export target our dynamic Cloudflare route!
                previewUrl: dynamicPreviewUrl,
                exportUrl: dynamicPreviewUrl,
            };

            onSaved(flyer);
            onClose(); // Cleanly exit the flow immediately on save completion!

        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error("MakeFlyerModal error:", msg, e);
            setSaveError(msg);
            setIsSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget && !isSaving) onClose(); }}
        >
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden"
                style={{ maxHeight: "92vh" }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900">Make flyer</h2>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                            {template.name} · {canvasWidth} × {canvasHeight}px
                        </p>
                    </div>
                    <button
                        onClick={onClose} disabled={isSaving}
                        className="h-8 w-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition cursor-pointer disabled:opacity-40"
                    >
                        <X size={14} className="text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">

                    {/* Left — JSON editor */}
                    <div
                        className="md:w-72 shrink-0 flex flex-col gap-4 p-5 border-b md:border-b-0 md:border-r border-gray-100 overflow-y-auto"
                        style={{ scrollbarWidth: "none" } as React.CSSProperties}
                    >
                        <div>
                            <p className="text-[11px] font-semibold text-gray-700 mb-1">Event data</p>
                            <p className="text-[10px] text-gray-400 leading-relaxed">
                                Edit values below — preview updates live. Keys must match{" "}
                                <code className="font-mono text-[#7877C6]">window.__data__</code> in your template.
                            </p>
                        </div>

                        <div className={`flex flex-col rounded-xl border overflow-hidden flex-1
                            ${jsonError ? "border-red-200 bg-red-50/30" : "border-gray-200 bg-gray-50/50"}`}
                        >
                            <textarea
                                value={jsonData}
                                onChange={(e) => setJsonData(e.target.value)}
                                disabled={isSaving}
                                spellCheck={false}
                                className="flex-1 w-full px-3 py-2.5 text-[11px] font-mono text-gray-700 focus:outline-none resize-none leading-relaxed bg-transparent placeholder-gray-300 disabled:opacity-50"
                                style={{ minHeight: 200, scrollbarWidth: "none" } as React.CSSProperties}
                                placeholder={'{\n  "event_name": "Annual Gala",\n  "date": "July 12, 2025"\n}'}
                            />
                            {jsonError && (
                                <div className="flex items-center gap-1.5 px-3 py-2 border-t border-red-100 bg-red-50/50 shrink-0">
                                    <AlertCircle size={10} className="text-red-400 shrink-0" />
                                    <p className="text-[10px] text-red-500 font-mono leading-tight">{jsonError}</p>
                                </div>
                            )}
                        </div>

                        {saveError && (
                            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-100 shrink-0">
                                <AlertCircle size={12} className="text-red-400 mt-0.5 shrink-0" />
                                <p className="text-[11px] text-red-600 leading-relaxed break-all">{saveError}</p>
                            </div>
                        )}
                    </div>

                    {/* Right — live preview */}
                    <div className="flex-1 min-h-0 flex flex-col bg-[#f7f7f9]">
                        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 bg-white shrink-0">
                            <div className={`h-1.5 w-1.5 rounded-full transition-colors ${isSaving ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
                            <span className="text-[10px] text-gray-400 font-medium">
                                {isSaving ? "Saving structure data..." : "Live preview"}
                            </span>
                        </div>
                        <div className="flex-1 min-h-0 p-5 flex items-center justify-center">
                            {previewSrc ? (
                                <ScaledPreview
                                    src={previewSrc}
                                    canvasWidth={canvasWidth}
                                    canvasHeight={canvasHeight}
                                />
                            ) : (
                                <p className="text-xs text-gray-400">No HTML template attached.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-white shrink-0">
                    <p className="text-[10px] text-gray-400">
                        Rendered instantly via Cloudflare Worker global edge optimization logic.
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose} disabled={isSaving}
                            className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer disabled:opacity-40"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleGenerate}
                            disabled={!!jsonError || isSaving || !template.htmlCode}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7877C6] hover:bg-[#6665b5] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium transition cursor-pointer min-w-[130px] justify-center"
                        >
                            {isSaving ? (
                                <><Loader2 size={12} className="animate-spin" />Saving...</>
                            ) : (
                                <><Sparkles size={12} />Save flyer</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MakeFlyerModal;