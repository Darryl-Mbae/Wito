import React, { useState, useRef, useEffect, useMemo } from "react";
import { X, Sparkles, AlertCircle, Loader2, Eye, SlidersHorizontal, Code2, RefreshCw } from "lucide-react";
import Editor from "@monaco-editor/react";
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
    workerUrl: string;
    onClose: () => void;
    onSaved: (flyer: Flyer) => void;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Builds the iframe's initial document. Beyond seeding `window.__data__`, this injects:
//   1. A `message` listener that patches `window.__data__` whenever the parent posts
//      { type: "__FLYER_DATA__", payload }.
//   2. A `dataupdate` CustomEvent, fired both on initial load and on every subsequent
//      postMessage update, so templates can use a single render path:
//        window.addEventListener("dataupdate", (e) => render(e.detail));
// This lets the parent push new data into an already-loaded iframe via postMessage
// instead of re-encoding the whole document and reloading the `src`.
function buildPreviewHtml(htmlCode: string, initialJsonData: string): string {
    let parsed: unknown = null;
    try { parsed = JSON.parse(initialJsonData); } catch { /* ignore */ }

    const injected = `<script>
window.__data__ = ${JSON.stringify(parsed ?? null)};
(function () {
    function dispatchUpdate() {
        window.dispatchEvent(new CustomEvent("dataupdate", { detail: window.__data__ }));
    }
    window.addEventListener("message", function (e) {
        if (e && e.data && e.data.type === "__FLYER_DATA__") {
            window.__data__ = e.data.payload;
            dispatchUpdate();
        }
    });
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", dispatchUpdate);
    } else {
        dispatchUpdate();
    }
})();
<\/script>`;

    const trimmed = htmlCode.trimStart();
    const withHead = trimmed.replace(/(<head[^>]*>)/i, `$1\n${injected}`);
    if (withHead !== trimmed) return withHead;
    const withBody = trimmed.replace(/(<body[^>]*>)/i, `${injected}\n$1`);
    if (withBody !== trimmed) return withBody;
    return injected + "\n" + trimmed;
}

// Detect what input type a key/value should get
function inferInputType(key: string, value: unknown): "date" | "time" | "textarea" | "text" {
    if (key.toLowerCase().includes("date")) return "date";
    if (key.toLowerCase().includes("time")) return "time";
    if (typeof value === "string" && value.length > 80) return "textarea";
    return "text";
}

// Fallback: turn snake_case / camelCase into a readable label when variables[] has no entry
function keyToLabel(key: string): string {
    return key
        .replace(/_/g, " ")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Friendly fields panel ────────────────────────────────────────────────────

type FieldsMode = "friendly" | "json";

type FriendlyFieldsProps = {
    jsonData: string;
    variables: { key: string; label: string }[];
    onChange: (v: string) => void;
};

// A single scalar input (text / date / time / textarea)
const ScalarInput: React.FC<{
    fieldKey: string;
    value: unknown;
    label: string;
    onChange: (v: string) => void;
}> = ({ fieldKey, value, label, onChange }) => {
    const type = inferInputType(fieldKey, value);
    const cls = "w-full px-3 py-2 text-[12px] rounded-[8px] border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#7877C6]/30 placeholder:text-gray-300 text-gray-800";
    return (
        <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">{label}</label>
            {type === "textarea" ? (
                <textarea
                    value={String(value ?? "")}
                    onChange={(e) => onChange(e.target.value)}
                    rows={3}
                    className={`${cls} resize-none`}
                    placeholder={`Enter ${label.toLowerCase()}…`}
                />
            ) : (
                <input
                    type={type}
                    value={String(value ?? "")}
                    onChange={(e) => onChange(e.target.value)}
                    className={cls}
                    placeholder={type === "text" ? `Enter ${label.toLowerCase()}…` : undefined}
                />
            )}
        </div>
    );
};

// A repeatable row editor for an array-of-objects field
const ArrayRowEditor: React.FC<{
    arrayKey: string;
    label: string;
    rows: Record<string, unknown>[];
    labelMap: Record<string, string>;
    onChangeRows: (rows: Record<string, unknown>[]) => void;
}> = ({ arrayKey: _arrayKey, label, rows, labelMap, onChangeRows }) => {
    // Derive the sub-keys from the first row (these are the "constants" / template variables)
    const subKeys: string[] = rows.length > 0 ? Object.keys(rows[0]) : [];

    const updateCell = (rowIdx: number, subKey: string, value: string) => {
        const next = rows.map((row, i) =>
            i === rowIdx ? { ...row, [subKey]: value } : row
        );
        onChangeRows(next);
    };

    const addRow = () => {
        const empty = Object.fromEntries(subKeys.map((k) => [k, ""]));
        onChangeRows([...rows, empty]);
    };

    const removeRow = (idx: number) => {
        onChangeRows(rows.filter((_, i) => i !== idx));
    };

    const inputCls = "w-full px-2 py-1.5 text-[11px] rounded-[6px] border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#7877C6]/30 placeholder:text-gray-300 text-gray-800";

    return (
        <div>
            {/* Section header */}
            <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-semibold text-gray-700">{label}</p>
                <button
                    type="button"
                    onClick={addRow}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#7877C6]/10 text-[#7877C6] text-[10px] font-medium hover:bg-[#7877C6]/20 transition cursor-pointer"
                >
                    <span className="text-base leading-none">+</span> Add row
                </button>
            </div>

            {/* Column headers — derived from template variable labels */}
            {subKeys.length > 0 && (
                <div
                    className="grid gap-1.5 mb-1 px-1"
                    style={{ gridTemplateColumns: `repeat(${subKeys.length}, minmax(0,1fr)) 24px` }}
                >
                    {subKeys.map((k) => (
                        <p key={k} className="text-[10px] font-medium text-gray-400 truncate">
                            {labelMap[k] ?? keyToLabel(k)}
                        </p>
                    ))}
                    <span />
                </div>
            )}

            {/* Rows */}
            <div className="space-y-1.5">
                {rows.map((row, rowIdx) => (
                    <div
                        key={rowIdx}
                        className="grid gap-1.5 items-center"
                        style={{ gridTemplateColumns: `repeat(${subKeys.length}, minmax(0,1fr)) 24px` }}
                    >
                        {subKeys.map((k) => (
                            <input
                                key={k}
                                type={inferInputType(k, row[k])}
                                value={String(row[k] ?? "")}
                                onChange={(e) => updateCell(rowIdx, k, e.target.value)}
                                className={inputCls}
                                placeholder={labelMap[k] ?? keyToLabel(k)}
                            />
                        ))}
                        <button
                            type="button"
                            onClick={() => removeRow(rowIdx)}
                            className="w-6 h-6 flex items-center justify-center rounded-md text-gray-300 hover:text-red-400 hover:bg-red-50 transition cursor-pointer shrink-0"
                            title="Remove row"
                        >
                            <X size={11} />
                        </button>
                    </div>
                ))}
                {rows.length === 0 && (
                    <p className="text-[11px] text-gray-400 py-2 text-center">
                        No entries yet —{" "}
                        <button onClick={addRow} className="text-[#7877C6] hover:underline cursor-pointer">
                            add one
                        </button>
                    </p>
                )}
            </div>
        </div>
    );
};

const FriendlyFields: React.FC<FriendlyFieldsProps> = ({ jsonData, variables, onChange }) => {
    const [mode, setMode] = useState<FieldsMode>("friendly");
    const [jsonError, setJsonError] = useState<string | null>(null);

    // key → label from template.variables (covers both top-level and sub-keys)
    const labelMap = useMemo(() =>
        Object.fromEntries(variables.map((v) => [v.key, v.label])),
        [variables]
    );

    // The root parsed object (only when root is an object, not an array)
    const parsed = useMemo(() => {
        try {
            const p = JSON.parse(jsonData);
            if (p && typeof p === "object" && !Array.isArray(p)) return p as Record<string, unknown>;
        } catch { /* ignore */ }
        return null;
    }, [jsonData]);

    const isRootArray = useMemo(() => {
        try { return Array.isArray(JSON.parse(jsonData)); } catch { return false; }
    }, [jsonData]);

    // Update a single scalar key on the root object
    const handleScalarChange = (key: string, value: string) => {
        if (!parsed) return;
        onChange(JSON.stringify({ ...parsed, [key]: value }, null, 2));
    };

    // Update an array field on the root object
    const handleArrayChange = (key: string, rows: Record<string, unknown>[]) => {
        if (!parsed) return;
        onChange(JSON.stringify({ ...parsed, [key]: rows }, null, 2));
    };

    return (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Mode toggle */}
            <div className="flex items-center gap-1 px-4 pt-3 pb-2 shrink-0">
                <button
                    onClick={() => setMode("friendly")}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer
                        ${mode === "friendly" ? "bg-[#7877C6]/10 text-[#7877C6]" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"}`}
                >
                    <SlidersHorizontal size={11} /> Fields
                </button>
                <button
                    onClick={() => { setMode("json"); setJsonError(null); }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer
                        ${mode === "json" ? "bg-[#7877C6]/10 text-[#7877C6]" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"}`}
                >
                    <Code2 size={11} /> JSON
                </button>
            </div>

            {mode === "friendly" ? (
                <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 space-y-4" style={{ scrollbarWidth: "none" }}>
                    {parsed && !isRootArray ? (
                        Object.entries(parsed).map(([key, value]) => {
                            const label = labelMap[key] ?? keyToLabel(key);

                            // Array of objects → repeatable row editor
                            if (
                                Array.isArray(value) &&
                                (value.length === 0 || (typeof value[0] === "object" && value[0] !== null && !Array.isArray(value[0])))
                            ) {
                                return (
                                    <div key={key} className="pt-3 border-t border-gray-100 first:border-t-0 first:pt-0">
                                        <ArrayRowEditor
                                            arrayKey={key}
                                            label={label}
                                            rows={value as Record<string, unknown>[]}
                                            labelMap={labelMap}
                                            onChangeRows={(rows) => handleArrayChange(key, rows)}
                                        />
                                    </div>
                                );
                            }

                            // Scalar field
                            return (
                                <div key={key} className="pt-3 border-t border-gray-100 first:border-t-0 first:pt-0">
                                    <ScalarInput
                                        fieldKey={key}
                                        value={value}
                                        label={label}
                                        onChange={(v) => handleScalarChange(key, v)}
                                    />
                                </div>
                            );
                        })
                    ) : isRootArray ? (
                        <div className="space-y-2 pt-1">
                            <p className="text-[11px] text-gray-500 leading-relaxed">
                                This template uses a top-level array. Switch to <strong>JSON</strong> to edit entries directly.
                            </p>
                            <button
                                onClick={() => setMode("json")}
                                className="text-[11px] text-[#7877C6] hover:underline cursor-pointer"
                            >
                                Open JSON editor →
                            </button>
                        </div>
                    ) : (
                        <p className="text-[11px] text-gray-400 pt-1">No editable fields found.</p>
                    )}
                </div>
            ) : (
                /* JSON tab — Monaco, explicit min-height so it works on mobile too */
                <div className="flex flex-col flex-1 min-h-0 overflow-hidden pt-2">
                    <div
                        className={`flex-1 border-y ${jsonError ? "border-red-200" : "border-gray-100"}`}
                        style={{ minHeight: 460 }}
                    >
                        <Editor
                            language="json"
                            value={jsonData}
                            onChange={(value) => {
                                const raw = value ?? "";
                                onChange(raw);
                                try { JSON.parse(raw); setJsonError(null); }
                                catch (e) { setJsonError(e instanceof SyntaxError ? e.message : "Invalid JSON"); }
                            }}
                            theme="vs-light"
                            height="100%"
                            options={{
                                minimap: { enabled: false },
                                fontSize: 12,
                                tabSize: 2,
                                wordWrap: "on",
                                automaticLayout: true,
                                formatOnPaste: true,
                                formatOnType: true,
                                scrollBeyondLastLine: false,
                                lineNumbers: "on",
                                folding: true,
                                glyphMargin: false,
                                renderLineHighlight: "line",
                                padding: { top: 8, bottom: 8 },
                            }}
                        />
                    </div>
                    {jsonError && (
                        <div className="flex items-center gap-1.5 px-4 py-2 bg-red-50/60 shrink-0">
                            <AlertCircle size={10} className="text-red-400 shrink-0" />
                            <p className="text-[10px] text-red-500 font-mono leading-snug">{jsonError}</p>
                        </div>
                    )}
                    <p className="px-4 py-2.5 text-[10px] text-gray-400 shrink-0 leading-relaxed">
                        Available as <code className="font-mono text-[#7877C6]">window.__data__</code> in your template.
                    </p>
                </div>
            )}
        </div>
    );
};

// ─── Scaled iframe preview ────────────────────────────────────────────────────

const ScaledPreview = React.forwardRef<
    HTMLIFrameElement,
    { src: string; canvasWidth: number; canvasHeight: number; onLoad?: () => void }
>(({ src, canvasWidth, canvasHeight, onLoad }, iframeRef) => {
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
                    onLoad={onLoad}
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

// ─── Mobile tab type ──────────────────────────────────────────────────────────

type MobileTab = "fields" | "preview";

// ─── Modal ────────────────────────────────────────────────────────────────────

const MakeFlyerModal: React.FC<Props> = ({ template, orgId, workerUrl, onClose, onSaved }) => {
    const preset = LAYOUT_PRESETS.find((p) => p.id === template.layoutPreset);
    const canvasWidth = preset?.width ?? 1080;
    const canvasHeight = preset?.height ?? 1080;

    const [jsonData, setJsonData] = useState(template.jsonData ?? "{}");
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [mobileTab, setMobileTab] = useState<MobileTab>("fields");

    // Iframe ref + readiness — used to push live data updates via postMessage
    // instead of re-encoding the document and reloading `src` on every keystroke.
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [iframeReady, setIframeReady] = useState(false);
    const handlePreviewLoad = () => setIframeReady(true);

    const hasJsonError = useMemo(() => {
        if (!jsonData.trim()) return false;
        try { JSON.parse(jsonData); return false; }
        catch { return true; }
    }, [jsonData]);

    // Close on Escape
    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === "Escape" && !isSaving) onClose(); };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [onClose, isSaving]);

    // `previewData` is the JSON snapshot the iframe document is actually built from.
    // It only changes via the debounced auto-refresh below or a manual "Refresh
    // preview" click — both of which trigger a full (but infrequent) iframe reload.
    // This is the guaranteed fallback for templates that don't implement the
    // `dataupdate` listener used by the postMessage live-update path.
    const [previewData, setPreviewData] = useState(template.jsonData ?? "{}");
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Auto-refresh the preview ~800ms after the user stops typing.
    useEffect(() => {
        if (hasJsonError) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setPreviewData(jsonData);
        }, 800);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [jsonData, hasJsonError]);

    const handleRefreshPreview = () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!hasJsonError) setPreviewData(jsonData);
    };

    const previewPending = !hasJsonError && jsonData !== previewData;

    // `src` is rebuilt whenever `previewData` changes (debounced/manual refresh only —
    // NOT on every keystroke).
    const previewSrc = useMemo(() => {
        if (!template.htmlCode?.trim()) return null;
        return `data:text/html;charset=utf-8,${encodeURIComponent(
            buildPreviewHtml(template.htmlCode, previewData)
        )}`;
    }, [template.htmlCode, previewData]);

    // Reset readiness whenever the underlying document changes/reloads.
    useEffect(() => { setIframeReady(false); }, [previewSrc]);

    // Best-effort: also push live edits into the already-loaded iframe via postMessage,
    // for templates whose own code listens for `dataupdate` and re-renders without a
    // reload. Harmless no-op for templates that don't.
    useEffect(() => {
        if (!iframeReady || hasJsonError) return;
        let parsed: unknown = null;
        try { parsed = JSON.parse(jsonData); } catch { return; }
        iframeRef.current?.contentWindow?.postMessage(
            { type: "__FLYER_DATA__", payload: parsed },
            "*"
        );
    }, [jsonData, hasJsonError, iframeReady]);

    const derivedEventName = useMemo(() => {
        try {
            const p = JSON.parse(jsonData);
            if (p && typeof p === "object" && !Array.isArray(p))
                return p.event_name ?? p.name ?? p.title ?? template.name;
        } catch { /* ignore */ }
        return template.name;
    }, [jsonData, template.name]);

    const handleGenerate = async () => {
        if (hasJsonError || !template.htmlCode) return;
        setIsSaving(true);
        setSaveError(null);

        try {
            const compiledHtml = buildPreviewHtml(template.htmlCode, jsonData);
            const db = getFirestore(app);
            const docRef = await addDoc(
                collection(db, "organizations", orgId, "flyers"),
                {
                    eventName: derivedEventName,
                    templateId: template.id,
                    templateName: template.name,
                    layoutPreset: template.layoutPreset ?? null,
                    jsonData,
                    compiledHtml,
                    width: canvasWidth,
                    height: canvasHeight,
                    createdAt: serverTimestamp(),
                }
            );

            const dynamicPreviewUrl = `${workerUrl}/flyer-preview?orgId=${orgId}&flyerId=${docRef.id}`;
            const flyer: Flyer = {
                id: docRef.id,
                eventName: derivedEventName,
                templateName: template.name,
                createdAt: new Date().toISOString(),
                previewUrl: dynamicPreviewUrl,
                exportUrl: dynamicPreviewUrl,
            };

            onSaved(flyer);
            onClose();
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error("MakeFlyerModal error:", msg, e);
            setSaveError(msg);
            setIsSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget && !isSaving) onClose(); }}
        >
            <div className="bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl w-full sm:max-w-4xl flex flex-col overflow-hidden"
                style={{ maxHeight: "94vh", height: "94vh" }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
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

                {/* ── Mobile tab bar ───────────────────────────────────────── */}
                <div className="flex sm:hidden shrink-0 border-b border-gray-100 px-4 pt-2">
                    {([
                        { id: "fields" as MobileTab, label: "Details", icon: <SlidersHorizontal size={12} /> },
                        { id: "preview" as MobileTab, label: "Preview", icon: <Eye size={12} /> },
                    ]).map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setMobileTab(tab.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium border-b-2 transition cursor-pointer mr-2
                                ${mobileTab === tab.id
                                    ? "border-[#7877C6] text-[#7877C6]"
                                    : "border-transparent text-gray-400 hover:text-gray-600"}`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div className="flex flex-col sm:flex-row flex-1 min-h-0 overflow-hidden">

                    {/* Left — fields (desktop always visible; mobile only on "fields" tab) */}
                    <div className={`sm:flex sm:w-72 shrink-0 flex-col min-h-0 border-b sm:border-b-0 sm:border-r border-gray-100
                        ${mobileTab === "fields" ? "flex" : "hidden"}`}
                    >
                        <FriendlyFields
                            jsonData={jsonData}
                            variables={template.variables ?? []}
                            onChange={setJsonData}
                        />

                        {saveError && (
                            <div className="mx-4 mb-3 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-100 shrink-0">
                                <AlertCircle size={12} className="text-red-400 mt-0.5 shrink-0" />
                                <p className="text-[11px] text-red-600 leading-relaxed break-all">{saveError}</p>
                            </div>
                        )}
                    </div>

                    {/* Right — preview (desktop always visible; mobile only on "preview" tab) */}
                    <div className={`sm:flex flex-1 min-h-0 flex-col bg-[#f7f7f9]
                        ${mobileTab === "preview" ? "flex" : "hidden"}`}
                    >
                        <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-gray-100 bg-white shrink-0">
                            <div className="flex items-center gap-2">
                                <div className={`h-1.5 w-1.5 rounded-full transition-colors ${isSaving ? "bg-amber-400 animate-pulse" : previewPending ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
                                <span className="text-[10px] text-gray-400 font-medium">
                                    {isSaving ? "Saving…" : previewPending ? "Updating…" : "Live preview"}
                                </span>
                            </div>
                            <button
                                onClick={handleRefreshPreview}
                                disabled={hasJsonError}
                                title="Refresh preview"
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-gray-400 hover:text-[#7877C6] hover:bg-[#7877C6]/10 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <RefreshCw size={11} /> Refresh
                            </button>
                        </div>
                        <div className="flex-1 min-h-0 p-5 flex items-center justify-center">
                            {previewSrc ? (
                                <ScaledPreview
                                    ref={iframeRef}
                                    src={previewSrc}
                                    canvasWidth={canvasWidth}
                                    canvasHeight={canvasHeight}
                                    onLoad={handlePreviewLoad}
                                />
                            ) : (
                                <p className="text-xs text-gray-400">No HTML template attached.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 bg-white shrink-0">
                    <button
                        onClick={onClose} disabled={isSaving}
                        className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer disabled:opacity-40"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={hasJsonError || isSaving || !template.htmlCode}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7877C6] hover:bg-[#6665b5] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium transition cursor-pointer min-w-[120px] justify-center"
                    >
                        {isSaving ? (
                            <><Loader2 size={12} className="animate-spin" />Saving…</>
                        ) : (
                            <><Sparkles size={12} />Save flyer</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MakeFlyerModal;