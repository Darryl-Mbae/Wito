import React, { useState, useRef, useEffect, useMemo } from "react";
import { X, Sparkles, AlertCircle, Loader2, Eye, SlidersHorizontal, Code2, RefreshCw, Plus, Calendar } from "lucide-react";
import Editor from "@monaco-editor/react";
import type { SavedTemplate, TemplateVariable } from "./TemplateEditor";
import { LAYOUT_PRESETS } from "./TemplateEditor";
import type { Flyer } from "./FlyersSection";
import {
    getFirestore,
    collection,
    addDoc,
    serverTimestamp,
} from "firebase/firestore";
import app from "../config/firebase";
import { isImageField } from "../lib/orgAssets";
import ImageFieldInput from "./ImageFieldInput";

// ─── Types ────────────────────────────────────────────────────────────────────

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
    template: SavedTemplate & { layoutPreset?: string };
    orgId: string;
    workerUrl: string;
    onClose: () => void;
    onSaved: (flyer: Flyer) => void;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function buildPreviewHtml(htmlCode: string, initialJsonData: string): string {
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
    if (withBody !== trimmed) return injected + "\n" + trimmed;
    return injected + "\n" + trimmed;
}

function inferInputType(key: string, value: unknown): "date" | "time" | "textarea" | "text" {
    if (key.toLowerCase().includes("date")) return "date";
    if (key.toLowerCase().includes("time")) return "text";
    if (typeof value === "string" && value.length > 80) return "textarea";
    return "text";
}

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
    variables: TemplateVariable[];
    orgId?: string;
    onChange: (v: string) => void;
};

const ScalarInput: React.FC<{
    fieldKey: string;
    value: unknown;
    label: string;
    varType?: TemplateVariable["type"];
    orgId?: string;
    onChange: (v: string) => void;
}> = ({ fieldKey, value, label, varType, orgId, onChange }) => {
    if (orgId && isImageField(fieldKey, value, varType)) {
        return (
            <ImageFieldInput
                label={label}
                value={String(value ?? "")}
                orgId={orgId}
                onChange={onChange}
            />
        );
    }

    const type = inferInputType(fieldKey, value);
    const cls = "w-full px-3.5 py-2 text-[13px] font-medium rounded-xl border border-gray-200 bg-transparent focus:outline-none focus:border-[#7877C6] focus:ring-4 focus:ring-[#7877C6]/10 placeholder:text-gray-400 text-gray-800 transition-all";
    return (
        <div className="space-y-1.5">
            <label className="block text-[11px] uppercase tracking-wider font-semibold text-gray-500">{label}</label>
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
                    placeholder={`Enter ${label.toLowerCase()}…`}
                />
            )}
        </div>
    );
};

// ─── ArrayRowEditor (dynamic keys + max cap) ─────────────────────────────────

const ArrayRowEditor: React.FC<{
    arrayKey: string;
    label: string;
    rows: Record<string, unknown>[];
    labelMap: Record<string, string>;
    maxItems?: number;                          // ← new optional prop
    onChangeRows: (rows: Record<string, unknown>[]) => void;
}> = ({ arrayKey: _arrayKey, label, rows, labelMap, maxItems, onChangeRows }) => {

    // Derive keys dynamically from the first row that has content.
    // Falls back to checking labelMap keys so we still show fields
    // even when the array is currently empty.
    const subKeys: string[] = useMemo(() => {
        const fromRow = rows.find((r) => Object.keys(r).length > 0);
        if (fromRow) return Object.keys(fromRow);
        // Fallback: use labelMap keys (these come from template variables)
        return Object.keys(labelMap).length ? Object.keys(labelMap) : [];
    }, [rows, labelMap]);

    const atMax = maxItems !== undefined && rows.length >= maxItems;

    const updateCell = (rowIdx: number, subKey: string, value: string) => {
        onChangeRows(rows.map((row, i) =>
            i === rowIdx ? { ...row, [subKey]: value } : row
        ));
    };

    const addRow = () => {
        if (atMax) return;
        const empty = Object.fromEntries(subKeys.map((k) => [k, ""]));
        onChangeRows([...rows, empty]);
    };

    const removeRow = (idx: number) => onChangeRows(rows.filter((_, i) => i !== idx));

    const baseInputCls =
        "w-full px-3 py-2 text-[13px] font-medium rounded-lg border border-gray-200 bg-transparent " +
        "placeholder:text-gray-400 text-gray-800 focus:outline-none focus:border-[#7877C6] " +
        "focus:ring-2 focus:ring-[#7877C6]/10 transition-all";

    // Which keys are "short" (render side-by-side in a 2-col grid)?
    // Heuristic: keys whose label is ≤ 8 chars, or keys named day/month/weekday/time
    const SHORT_KEY_RE = /^(day|month|weekday|time|date|num|no|id)$/i;
    const shortKeys = subKeys.filter(
        (k) => SHORT_KEY_RE.test(k)
    );
    const longKeys = subKeys.filter((k) => !shortKeys.includes(k));

    return (
        <div className="space-y-3">
            {/* Header row */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <p className="text-[12px] uppercase tracking-wider font-bold text-gray-700">{label}</p>
                <button
                    type="button"
                    onClick={addRow}
                    disabled={atMax}
                    title={atMax ? `Maximum of ${maxItems} items` : undefined}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#7877C6] text-white
                               text-[11px] font-semibold hover:bg-[#6665b5] transition active:scale-95
                               cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <Plus size={12} strokeWidth={2.5} />
                    {atMax ? `Max ${maxItems}` : "Add item"}
                </button>
            </div>

            {/* Row cards */}
            <div className="space-y-3.5">
                {rows.map((row, rowIdx) => (
                    <div
                        key={rowIdx}
                        className="relative bg-transparent rounded-2xl p-3 border border-gray-200
                                   flex flex-col gap-2.5 group"
                    >
                        {/* Card header */}
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] border border-gray-200 text-gray-600
                                             font-bold px-2 py-0.5 rounded-full">
                                #{rowIdx + 1}
                            </span>
                            <button
                                type="button"
                                onClick={() => removeRow(rowIdx)}
                                className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50
                                           transition opacity-100 sm:opacity-0 group-hover:opacity-100 cursor-pointer"
                                title="Remove"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* Short keys → 2-col grid */}
                        {shortKeys.length > 0 && (
                            <div
                                className="grid gap-2"
                                style={{ gridTemplateColumns: `repeat(${Math.min(shortKeys.length, 3)}, 1fr)` }}
                            >
                                {shortKeys.map((k) => (
                                    <div key={k}>
                                        <label className="block text-[9px] font-bold text-gray-400
                                                          uppercase mb-0.5 ml-1">
                                            {labelMap[k] ?? keyToLabel(k)}
                                        </label>
                                        <input
                                            type="text"
                                            value={String(row[k] ?? "")}
                                            onChange={(e) => updateCell(rowIdx, k, e.target.value)}
                                            className={`${baseInputCls} text-center`}
                                            placeholder={labelMap[k] ?? keyToLabel(k)}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Long keys → full width, stacked */}
                        {longKeys.map((k) => (
                            <div key={k}>
                                <label className="block text-[9px] font-bold text-gray-400
                                                  uppercase mb-0.5 ml-1">
                                    {labelMap[k] ?? keyToLabel(k)}
                                </label>
                                <input
                                    type="text"
                                    value={String(row[k] ?? "")}
                                    onChange={(e) => updateCell(rowIdx, k, e.target.value)}
                                    className={`${baseInputCls} text-left px-3`}
                                    placeholder={`Enter ${(labelMap[k] ?? keyToLabel(k)).toLowerCase()}…`}
                                />
                            </div>
                        ))}
                    </div>
                ))}

                {rows.length === 0 && (
                    <div className="text-center py-6 border-2 border-dashed border-gray-200
                                    rounded-2xl bg-transparent">
                        <Calendar size={24} className="mx-auto text-gray-300 mb-1.5" />
                        <p className="text-[12px] text-gray-400 font-medium">
                            No entries yet.
                        </p>
                        <button
                            onClick={addRow}
                            disabled={atMax}
                            className="mt-2 text-[12px] font-semibold text-[#7877C6]
                                       hover:underline cursor-pointer disabled:opacity-40"
                        >
                            Add your first item
                        </button>
                    </div>
                )}
            </div>

            {/* Cap hint */}
            {atMax && (
                <p className="text-[11px] text-gray-400 text-right">
                    Maximum of {maxItems} items reached.
                </p>
            )}
        </div>
    );
};

export const FriendlyFields: React.FC<FriendlyFieldsProps> = ({ jsonData, variables, orgId, onChange }) => {
    const [mode, setMode] = useState<FieldsMode>("friendly");
    const [jsonError, setJsonError] = useState<string | null>(null);

    const labelMap = useMemo(() =>
        Object.fromEntries(variables.map((v) => [v.key, v.label])),
        [variables]
    );

    const typeMap = useMemo(() =>
        Object.fromEntries(variables.filter((v) => v.type).map((v) => [v.key, v.type!])),
        [variables]
    );

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

    const handleScalarChange = (key: string, value: unknown) => {
        if (!parsed) return;
        onChange(JSON.stringify({ ...parsed, [key]: value }, null, 2));
    };

    const handleArrayChange = (key: string, rows: Record<string, unknown>[]) => {
        if (!parsed) return;
        onChange(JSON.stringify({ ...parsed, [key]: rows }, null, 2));
    };

    return (
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto bg-transparent">
            <div className="flex items-center gap-1 px-4 pt-4 pb-2 shrink-0 bg-transparent border-b border-gray-100">
                <button
                    onClick={() => setMode("friendly")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition cursor-pointer
                        ${mode === "friendly" ? "bg-white text-[#7877C6] border border-gray-200" : "text-gray-400 hover:text-gray-600"}`}
                >
                    <SlidersHorizontal size={11} /> Fields
                </button>
                <button
                    onClick={() => { setMode("json"); setJsonError(null); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition cursor-pointer
                        ${mode === "json" ? "bg-white text-[#7877C6] border border-gray-200" : "text-gray-400 hover:text-gray-600"}`}
                >
                    <Code2 size={11} /> JSON
                </button>
            </div>

            {mode === "friendly" ? (
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5" style={{ scrollbarWidth: "none" }}>
                    {parsed && !isRootArray ? (
                        Object.entries(parsed).map(([key, value]) => {
                            const label = labelMap[key] ?? keyToLabel(key);

                            if (value && typeof value === "object" && !Array.isArray(value) && "src" in (value as Record<string, unknown>)) {
                                return (
                                    <div key={key}>
                                        <ScalarInput
                                            fieldKey={key}
                                            value={(value as { src?: string }).src ?? ""}
                                            label={label}
                                            varType="image"
                                            orgId={orgId}
                                            onChange={(v) => handleScalarChange(key, { ...(value as object), src: v })}
                                        />
                                    </div>
                                );
                            }
                            if (
                                Array.isArray(value) &&
                                (value.length === 0 || (typeof value[0] === "object" && value[0] !== null && !Array.isArray(value[0])))
                            ) {
                                // Pull maxItems from the matching variable definition, if present
                                const varDef = variables.find((v) => v.key === key) as
                                    | (typeof variables[number] & { maxItems?: number })
                                    | undefined;

                                return (
                                    <div key={key} className="pt-2">
                                        <ArrayRowEditor
                                            arrayKey={key}
                                            label={label}
                                            rows={value as Record<string, unknown>[]}
                                            labelMap={labelMap}
                                            maxItems={varDef?.maxItems}        // ← wire it up
                                            onChangeRows={(rows) => handleArrayChange(key, rows)}
                                        />
                                    </div>
                                );
                            }
                            return (
                                <div key={key}>
                                    <ScalarInput
                                        fieldKey={key}
                                        value={value}
                                        label={label}
                                        varType={typeMap[key]}
                                        orgId={orgId}
                                        onChange={(v) => handleScalarChange(key, v)}
                                    />
                                </div>
                            );
                        })
                    ) : isRootArray ? (
                        <div className="space-y-2 pt-1">
                            <p className="text-[12px] text-gray-500 leading-relaxed">
                                This template uses a top-level array. Switch to <strong>JSON</strong> to edit entries directly.
                            </p>
                            <button
                                onClick={() => setMode("json")}
                                className="text-[12px] font-semibold text-[#7877C6] hover:underline cursor-pointer"
                            >
                                Open JSON editor →
                            </button>
                        </div>
                    ) : (
                        <p className="text-[12px] text-gray-400 pt-1">No editable fields found.</p>
                    )}
                </div>
            ) : (
                <div className="flex flex-col flex-1 overflow-y-auto pt-2">
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
                            <AlertCircle size={12} className="text-red-500 shrink-0" />
                            <p className="text-[11px] text-red-600 font-mono leading-snug">{jsonError}</p>
                        </div>
                    )}
                    <p className="px-4 py-2.5 text-[11px] text-gray-400 shrink-0 leading-relaxed">
                        Available as <code className="font-mono text-[#7877C6]">window.__data__</code> in your template.
                    </p>
                </div>
            )}
        </div>
    );
};

// ─── Scaled iframe preview ────────────────────────────────────────────────────

export const ScaledPreview = React.forwardRef<
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
                borderRadius: 16, overflow: "hidden", flexShrink: 0,
                border: "1px solid #e2e8f0",
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

    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [iframeReady, setIframeReady] = useState(false);
    const handlePreviewLoad = () => setIframeReady(true);

    const hasJsonError = useMemo(() => {
        if (!jsonData.trim()) return false;
        try { JSON.parse(jsonData); return false; }
        catch { return true; }
    }, [jsonData]);

    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === "Escape" && !isSaving) onClose(); };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [onClose, isSaving]);

    const [previewData, setPreviewData] = useState(template.jsonData ?? "{}");
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    const previewSrc = useMemo(() => {
        if (!template.htmlCode?.trim()) return null;
        return `data:text/html;charset=utf-8,${encodeURIComponent(
            buildPreviewHtml(template.htmlCode, previewData)
        )}`;
    }, [template.htmlCode, previewData]);

    useEffect(() => { setIframeReady(false); }, [previewSrc]);

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
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/40 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget && !isSaving) onClose(); }}
        >
            <div className="bg-white sm:rounded-3xl rounded-t-3xl w-full sm:max-w-5xl flex flex-col overflow-hidden h-[94vh] sm:h-[94vh]"
                style={{ maxHeight: "94vh" }}
            >
                {/* Header */}
                <div className=" flex items-center justify-between px-6 py-4.5 border-b border-gray-100 shrink-0 lg:pt-9">
                    <div className="flex flex-row items-center" >
                        <h2 className="text-base font-bold text-gray-900">Make flyer</h2>
                        <p className="text-[12px] font-medium text-gray-400 mt-0.5">
                            {template.name} · {canvasWidth} × {canvasHeight}px
                        </p>
                    </div>
                    <button
                        onClick={onClose} disabled={isSaving}
                        className="h-9 w-9 rounded-xl hover:bg-gray-100 flex items-center justify-center transition cursor-pointer disabled:opacity-40"
                    >
                        <X size={16} className="text-gray-500" />
                    </button>
                </div>

                {/* Mobile Tab Bar */}
                <div className="flex sm:hidden shrink-0 border-b border-gray-100 px-4 pt-2 bg-transparent">
                    {([
                        { id: "fields" as MobileTab, label: "Details", icon: <SlidersHorizontal size={12} /> },
                        { id: "preview" as MobileTab, label: "Preview", icon: <Eye size={12} /> },
                    ]).map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setMobileTab(tab.id)}
                            className={`flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-bold border-b-2 transition cursor-pointer mr-2
                                ${mobileTab === tab.id
                                    ? "border-[#7877C6] text-[#7877C6]"
                                    : "border-transparent text-gray-400 hover:text-gray-600"}`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Main Content Layout Block */}
                <div className="flex flex-col sm:flex-row flex-1 min-h-0 overflow-y-auto sm:overflow-hidden">
                    {/* Left Details Configuration Frame */}
                    <div className={`sm:flex sm:w-86 shrink-0 flex-col min-h-0 border-b sm:border-b-0 sm:border-r border-gray-100 h-full overflow-y-auto
                        ${mobileTab === "fields" ? "flex" : "hidden"}`}
                    >
                        <FriendlyFields
                            jsonData={jsonData}
                            variables={template.variables ?? []}
                            orgId={orgId}
                            onChange={setJsonData}
                        />

                        {saveError && (
                            <div className="mx-4 mb-4 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-100 shrink-0">
                                <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                                <p className="text-[12px] text-red-600 font-medium leading-relaxed break-all">{saveError}</p>
                            </div>
                        )}
                    </div>

                    {/* Right Live Visual Render Area */}
                    <div className={`sm:flex flex-1 min-h-0 flex-col bg-transparent h-full overflow-y-auto
                        ${mobileTab === "preview" ? "flex" : "hidden"}`}
                    >
                        <div className="flex items-center justify-between gap-2 px-5 py-3 border-b border-gray-100 bg-white shrink-0">
                            <div className="flex items-center gap-2">
                                <div className={`h-2 w-2 rounded-full transition-colors ${isSaving || previewPending ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
                                <span className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">
                                    {isSaving ? "Saving…" : previewPending ? "Updating…" : "Live preview"}
                                </span>
                            </div>
                            <button
                                onClick={handleRefreshPreview}
                                disabled={hasJsonError}
                                title="Refresh preview"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-[11px] font-bold text-gray-500 hover:text-[#7877C6] hover:border-[#7877C6]/30 hover:bg-[#7877C6]/5 transition cursor-pointer disabled:opacity-30"
                            >
                                <RefreshCw size={12} /> Refresh
                            </button>
                        </div>
                        <div className="flex-1 min-h-0 p-6 flex items-center justify-center">
                            {previewSrc ? (
                                <ScaledPreview
                                    ref={iframeRef}
                                    src={previewSrc}
                                    canvasWidth={canvasWidth}
                                    canvasHeight={canvasHeight}
                                    onLoad={handlePreviewLoad}
                                />
                            ) : (
                                <p className="text-sm text-gray-400">No HTML template attached.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Controls Container */}
                <div className="flex items-center justify-end gap-3 px-6 py-4.5 border-t border-gray-100 bg-white shrink-0">
                    <button
                        onClick={onClose} disabled={isSaving}
                        className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer disabled:opacity-40"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={hasJsonError || isSaving || !template.htmlCode}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7877C6] hover:bg-[#6665b5] disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer min-w-[130px] justify-center active:scale-98"
                    >
                        {isSaving ? (
                            <><Loader2 size={14} className="animate-spin" />Saving…</>
                        ) : (
                            <><Sparkles size={14} />Save flyer</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MakeFlyerModal;