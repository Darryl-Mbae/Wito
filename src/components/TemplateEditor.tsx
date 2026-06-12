import React, { useState, useRef, useEffect, useMemo } from "react";
import { ArrowLeft, Code2, Palette, Zap, Eye, Save, ChevronDown, Check, Braces, AlertCircle } from "lucide-react";
import type { Integration } from "./IntergrationsSection";
import Editor from "@monaco-editor/react";

export type TemplateMethod = "html" | "canva" | "placid";
export type TemplateVariable = { key: string; label: string; };

export type SavedTemplate = {
    id: string; name: string; method: TemplateMethod;
    htmlCode?: string; canvaDesignId?: string; placidTemplateId?: string;
    variables: TemplateVariable[];
    jsonData?: string;
    layoutPreset?: string;   // ← add this
    createdAt: string;
};
type Props = {
    onBack: () => void;
    onSave: (template: Omit<SavedTemplate, "id" | "createdAt">) => void;
    connectedIntegrations: Integration[];
    initialTemplate?: SavedTemplate;
};

const METHOD_META: Record<TemplateMethod, { label: string; icon: React.ReactNode }> = {
    html: { label: "HTML / CSS", icon: <Code2 size={12} /> },
    canva: { label: "Canva", icon: <Palette size={12} /> },
    placid: { label: "Placid", icon: <Zap size={12} /> },
};

// export type LayoutPreset = {
//     id: string; label: string;
//     width: number; height: number;
//     html: string;
//     sampleJson: string;
// };



const IG_PORTRAIT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:1080px; height:1350px; overflow:hidden; font-family:'Inter',sans-serif; }
    body {
      background: linear-gradient(135deg,#7877C6 0%,#a5a4e0 100%);
      display:flex; flex-direction:column;
      align-items:center; justify-content:center;
      color:white; padding:64px; text-align:center;
    }
    .label { font-size:11px; letter-spacing:.15em; text-transform:uppercase; opacity:.65; margin:0 0 16px; }
    h1 { font-size:48px; font-weight:700; margin:0 0 20px; line-height:1.1; }
    .meta { font-size:18px; opacity:.8; margin:0 0 8px; }
    .location { font-size:14px; opacity:.6; }
  </style>
</head>
<body>
  <p class="label">You're invited</p>
  <h1 id="event_name"></h1>
  <p class="meta" id="datetime"></p>
  <p class="location" id="location"></p>
  <script>
    var d = window.__data__ || {};
    document.getElementById('event_name').textContent = d.event_name || '';
    document.getElementById('datetime').textContent = (d.date || '') + (d.time ? ' · ' + d.time : '');
    document.getElementById('location').textContent = d.location || '';
  </script>
</body>
</html>`;

const CALENDAR_A4_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:794px; height:1123px; overflow:hidden; font-family:'Inter',sans-serif; color:#1a1a1a; }
    body { background:#fafafa; display:flex; flex-direction:column; }
    .header { background:linear-gradient(135deg,#7877C6,#a5a4e0); padding:52px 56px 44px; color:white; }
    .header .label { font-size:10px; letter-spacing:.2em; text-transform:uppercase; opacity:.7; margin:0 0 10px; }
    .header h1 { font-size:36px; font-weight:800; line-height:1.1; }
    #events { padding:32px 56px; flex:1; display:flex; flex-direction:column; overflow:hidden; }
    .row { display:flex; align-items:flex-start; gap:20px; padding:18px 0; border-top:1px solid #eee; }
    .row:first-child { border-top:none; }
    .badge { min-width:64px; text-align:center; background:#7877C6; border-radius:10px; padding:8px; color:white; font-size:11px; font-weight:700; line-height:1.3; }
    .info { flex:1; }
    .info .name { font-size:15px; font-weight:700; margin:0 0 3px; }
    .info .meta { font-size:12px; color:#666; }
  </style>
</head>
<body>
  <div class="header">
    <p class="label">Upcoming Events</p>
    <h1>What's On</h1>
  </div>
  <div id="events"></div>
  <script>
    var events = window.__data__ || [];
    var container = document.getElementById('events');
    events.forEach(function(e) {
      var row = document.createElement('div');
      row.className = 'row';
      row.innerHTML =
        '<div class="badge">' + e.date + '</div>' +
        '<div class="info">' +
          '<p class="name">' + e.name + '</p>' +
          '<p class="meta">' + e.time + ' &nbsp;·&nbsp; ' + e.location + '</p>' +
        '</div>';
      container.appendChild(row);
    });
  </script>
</body>
</html>`;


const IG_STORY_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:1080px; height:1920px; overflow:hidden; font-family:'Inter',sans-serif; }
    body {
      background: linear-gradient(180deg,#1a1a2e 0%,#7877C6 60%,#f7c59f 100%);
      display:flex; flex-direction:column;
      align-items:center; justify-content:flex-end;
      color:white; padding:80px 48px; text-align:center;
    }
    .tagline { font-size:12px; letter-spacing:.2em; text-transform:uppercase; opacity:.6; margin:0 0 24px; }
    h1 { font-size:52px; font-weight:800; margin:0 0 24px; line-height:1.05; }
    .divider { width:40px; height:2px; background:rgba(255,255,255,.4); margin:0 0 24px; }
    .date { font-size:16px; opacity:.75; }
  </style>
</head>
<body>
  <p class="tagline" id="tagline"></p>
  <h1 id="event_name"></h1>
  <div class="divider"></div>
  <p class="date" id="date"></p>
  <script>
    var d = window.__data__ || {};
    document.getElementById('tagline').textContent = d.tagline || '';
    document.getElementById('event_name').textContent = d.event_name || '';
    document.getElementById('date').textContent = d.date || '';
  </script>
</body>
</html>`;



export const LAYOUT_PRESETS = [

    {
        id: "ig-portrait",
        label: "Instagram Post (Portrait)",
        width: 1080,
        height: 1350,
        sampleJson: JSON.stringify({ event_name: "Annual Gala", date: "July 12, 2025", time: "7:00 PM", location: "Nairobi Serena Hotel" }, null, 2),
        html: IG_PORTRAIT_HTML,
    },
    {
        id: "ig-story",
        label: "Instagram Story",
        width: 1080,
        height: 1920,
        sampleJson: JSON.stringify({ event_name: "Annual Gala", date: "July 12, 2025", time: "7:00 PM", location: "Nairobi Serena Hotel", description: "Join us for an evening of networking and celebration." }, null, 2),
        html: IG_STORY_HTML,
    },

    {
        id: "calendar-a4",
        label: "Event Calendar (A4)",
        width: 794,
        height: 1123,
        sampleJson: JSON.stringify([
            { name: "Annual Gala", date: "July 12", time: "7:00 PM", location: "Serena Hotel" },
            { name: "Tech Summit", date: "Aug 3", time: "9:00 AM", location: "iHub Nairobi" },
            { name: "Art Exhibition", date: "Aug 17", time: "2:00 PM", location: "GoDown Arts" },
            { name: "Fundraiser Dinner", date: "Sept 5", time: "6:30 PM", location: "Sankara Hotel" },
        ], null, 2),
        html: CALENDAR_A4_HTML,
    },
];
// ─── Parse JSON ───────────────────────────────────────────────────────────────

type ParseResult =
    | { kind: "ok"; value: unknown; error: null }
    | { kind: "error"; error: string };

function parseJsonData(raw: string): ParseResult {
    if (!raw.trim()) return { kind: "ok", value: null, error: null };
    try {
        return { kind: "ok", value: JSON.parse(raw), error: null };
    } catch (e: unknown) {
        return { kind: "error", error: e instanceof SyntaxError ? e.message : "Invalid JSON" };
    }
}

// ─── Build preview: inject window.__data__ then render as-is ─────────────────

function buildPreviewHtml(template: string, parsedValue: unknown): string {
    const dataScript = `<script>window.__data__ = ${JSON.stringify(parsedValue ?? null)};<\/script>`;
    const trimmed = template.trimStart();

    // Inject as first child of <head>
    const withHead = trimmed.replace(/(<head[^>]*>)/i, `$1\n${dataScript}`);
    if (withHead !== trimmed) return withHead;

    // Fallback: inject before <body>
    const withBody = trimmed.replace(/(<body[^>]*>)/i, `${dataScript}\n$1`);
    if (withBody !== trimmed) return withBody;

    // No recognisable structure — just prepend
    return dataScript + "\n" + trimmed;
}

// ─── JSON Data Panel ──────────────────────────────────────────────────────────

type DataPanelProps = {
    jsonData: string;
    parseResult: ParseResult;
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
    stretch: boolean;
    onChange: (v: string) => void;
};

const DataPanel: React.FC<DataPanelProps> = ({ jsonData, parseResult, stretch, onChange }) => (
    <div className={`flex flex-col gap-3 ${stretch ? "flex-1 min-h-0 overflow-hidden" : ""}`}>
        <div className={`flex flex-col  overflow-hidden transition
            ${stretch ? "flex-1 min-h-0" : ""}
            ${parseResult.kind === "error" ? "border-red-200 bg-red-50/30" : "border-gray-200 bg-white"}`}
        >
            <div
                className={`w-full pt-5 ${stretch ? "flex-1 min-h-0" : ""
                    }`}
                style={
                    stretch
                        ? undefined
                        : { minHeight: "220px", maxHeight: "340px" }
                }
            >
                <Editor
                    language="json"
                    value={jsonData}
                    onChange={(value) => onChange(value || "")}
                    theme="vs-light"
                    height="70vh"
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
                    }}
                />
            </div>
            {parseResult.kind === "error" && (
                <div className="flex items-center gap-1.5 px-3 py-2 border-t border-red-100 bg-red-50/50 shrink-0">
                    <AlertCircle size={10} className="text-red-400 shrink-0" />
                    <p className="text-[10px] text-red-500 font-mono">{parseResult.error}</p>
                </div>
            )}
        </div>
        <p className="px-5 py-3 text-[10px] text-gray-400 shrink-0 leading-relaxed">
            Available as <code className="font-mono text-[#7877C6]">window.__data__</code> in your template's <code className="font-mono text-gray-500">{"<script>"}</code>.
            Use a <code className="font-mono text-[#7877C6]">{"{ }"}</code> for single-event or <code className="font-mono text-[#7877C6]">{"[ ]"}</code> array for multi-event flyers.
        </p>
    </div>
);

// ─── Code panel ───────────────────────────────────────────────────────────────

type CodePanelProps = {
    htmlCode: string;
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
    onChange: (v: string) => void;
};
const CodePanel: React.FC<CodePanelProps> = ({
    htmlCode,
    onChange,
}) => (
    <div className="flex-1 min-h-0 overflow-hidden">
        <Editor
            height="100%"
            defaultLanguage="html"
            value={htmlCode}
            onChange={(value) => onChange(value || "")}
            theme="vs-light"
            options={{
                minimap: { enabled: false },
                fontSize: 13,
                wordWrap: "on",
                automaticLayout: true,
                tabSize: 2,
                formatOnPaste: true,
                formatOnType: true,
                scrollBeyondLastLine: false,
                roundedSelection: true,
                autoClosingBrackets: "always",
                autoClosingQuotes: "always",
                autoIndent: "full",
                suggestOnTriggerCharacters: true,
                quickSuggestions: true,
                padding: {
                    top: 12,
                    bottom: 12,
                },
            }}
        />
    </div>
);

// ─── Layout dropdown ──────────────────────────────────────────────────────────

const LayoutDropdown: React.FC<{
    selected: string;
    onSelect: (id: string) => void;
}> = ({ selected, onSelect }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const current = LAYOUT_PRESETS.find((p) => p.id === selected)!;

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div ref={ref} className="relative">
            <button onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-left hover:border-gray-300 transition cursor-pointer"
            >
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[11px] font-medium text-gray-700 truncate">{current.label}</span>
                    <span className="text-[10px] text-gray-400 shrink-0">{current.width} × {current.height}</span>
                </div>
                <ChevronDown size={11} className={`text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
                    {LAYOUT_PRESETS.map((p) => (
                        <button key={p.id} onClick={() => { onSelect(p.id); setOpen(false); }}
                            className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-gray-50 transition cursor-pointer ${p.id === selected ? "bg-[#7877C6]/5" : ""}`}
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                {p.id === selected ? <Check size={10} className="text-[#7877C6] shrink-0" /> : <div className="w-2.5 shrink-0" />}
                                <span className={`text-[11px] font-medium truncate ${p.id === selected ? "text-[#7877C6]" : "text-gray-700"}`}>{p.label}</span>
                            </div>
                            <span className="text-[10px] text-gray-400 shrink-0">{p.width} × {p.height}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── Scaled preview ───────────────────────────────────────────────────────────

const ScaledPreview: React.FC<{
    src: string; canvasWidth: number; canvasHeight: number; containerClass?: string;
}> = ({ src, canvasWidth, canvasHeight, containerClass = "" }) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const el = wrapperRef.current;
        if (!el) return;
        const update = () => setScale(Math.min(el.clientWidth / canvasWidth, el.clientHeight / canvasHeight, 1));
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, [canvasWidth, canvasHeight]);

    return (
        <div ref={wrapperRef} className={`flex items-center justify-center ${containerClass}`}>
            <div style={{ width: canvasWidth * scale, height: canvasHeight * scale, position: "relative", borderRadius: 12, overflow: "hidden", flexShrink: 0 }}>
                <iframe src={src}
                    style={{ border: "none", width: canvasWidth, height: canvasHeight, transformOrigin: "top left", transform: `scale(${scale})`, pointerEvents: "none" }}
                    sandbox="allow-scripts"
                    title="Template preview"
                />
            </div>
        </div>
    );
};

// ─── Tab types ────────────────────────────────────────────────────────────────

type DesktopLeftTab = "data" | "code";
type MobileTab = "data" | "code" | "preview";

// ─── Main component ───────────────────────────────────────────────────────────

const TemplateEditor: React.FC<Props> = ({ onBack, onSave, connectedIntegrations, initialTemplate }) => {
    const [name, setName] = useState(initialTemplate?.name ?? "");
    const [method, setMethod] = useState<TemplateMethod>(initialTemplate?.method ?? "html");
    const [htmlCode, setHtmlCode] = useState(initialTemplate?.htmlCode ?? LAYOUT_PRESETS[0].html);
    const [canvaId, setCanvaId] = useState(initialTemplate?.canvaDesignId ?? "");
    const [placidId, setPlacidId] = useState(initialTemplate?.placidTemplateId ?? "");
    const [jsonData, setJsonData] = useState<string>(initialTemplate?.jsonData ?? LAYOUT_PRESETS[0].sampleJson);
    const [previewSrc, setPreviewSrc] = useState("");
    const [selectedLayout, setSelectedLayout] = useState<string>(
        initialTemplate?.layoutPreset ?? LAYOUT_PRESETS[0].id  // ← was just LAYOUT_PRESETS[0].id
    );
    const [desktopTab, setDesktopTab] = useState<DesktopLeftTab>("data");
    const [mobileTab, setMobileTab] = useState<MobileTab>("data");

    const jsonTextareaRef = useRef<HTMLTextAreaElement>(null);
    const codeTextareaRef = useRef<HTMLTextAreaElement>(null);

    const parseResult = useMemo(() => parseJsonData(jsonData), [jsonData]);

    useEffect(() => {
        if (method !== "html") return;
        const value = parseResult.kind === "ok" ? parseResult.value : null;
        setPreviewSrc(`data:text/html;charset=utf-8,${encodeURIComponent(buildPreviewHtml(htmlCode, value))}`);
    }, [htmlCode, parseResult, method]);

    // const insertJsonKey = useCallback((key: string) => {
    //     const snippet = `"${key}": ""`;
    //     const ta = jsonTextareaRef.current;
    //     if (!ta) return;
    //     const s = ta.selectionStart, e = ta.selectionEnd;
    //     const next = jsonData.slice(0, s) + snippet + jsonData.slice(e);
    //     setJsonData(next);
    //     const cursor = s + snippet.length - 1;
    //     setTimeout(() => { ta.focus(); ta.setSelectionRange(cursor, cursor); }, 0);
    // }, [jsonData]);

    const applyLayout = (presetId: string) => {
        const preset = LAYOUT_PRESETS.find((p) => p.id === presetId);
        if (!preset) return;
        setSelectedLayout(preset.id);
        setHtmlCode(preset.html);
        setJsonData(preset.sampleJson);
    };

    const canSave = name.trim().length > 0;
    const handleSave = () => {
        if (!canSave) return;
        onSave({
            name: name.trim(), method,
            htmlCode: method === "html" ? htmlCode : undefined,
            canvaDesignId: method === "canva" ? canvaId : undefined,
            placidTemplateId: method === "placid" ? placidId : undefined,
            variables: [],
            jsonData,
            layoutPreset: selectedLayout,   // ← add this
        });
    };

    const canvaConnected = connectedIntegrations.some((i) => i.id === "canva" && i.connected);
    const placidConnected = connectedIntegrations.some((i) => i.id === "placid" && i.connected);
    const currentPreset = LAYOUT_PRESETS.find((p) => p.id === selectedLayout)!;

    const dataPanelProps = { jsonData, parseResult, textareaRef: jsonTextareaRef, onChange: setJsonData, stretch: false };

    return (
        <div className="flex flex-col gap-4 h-full min-h-0 overflow-hidden">

            {/* Top bar */}
            <div className="flex items-center gap-2 shrink-0">
                <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition cursor-pointer shrink-0">
                    <ArrowLeft size={13} />
                    <span className="hidden sm:inline">Templates</span>
                </button>
                <span className="text-gray-200 hidden sm:inline">/</span>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Template name…"
                    className="flex-1 min-w-0 text-sm font-semibold text-gray-900 bg-transparent focus:outline-none placeholder-gray-300"
                />
                <div className="flex gap-1">
                    {(["html", "canva", "placid"] as TemplateMethod[]).map((m) => {
                        const meta = METHOD_META[m];
                        const locked = (m === "canva" && !canvaConnected) || (m === "placid" && !placidConnected);
                        return (
                            <button key={m} onClick={() => !locked && setMethod(m)}
                                title={locked ? `Connect ${m} in Integrations to unlock` : meta.label}
                                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border text-[11px] font-medium transition
                                    ${locked ? "border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed"
                                        : method === m ? "border-[#7877C6] bg-[#7877C6]/8 text-[#7877C6] cursor-pointer"
                                            : "border-gray-200 text-gray-500 hover:bg-gray-50 cursor-pointer"}`}
                            >
                                {meta.icon}<span className="hidden sm:inline">{meta.label}</span>
                            </button>
                        );
                    })}
                </div>
                <button onClick={handleSave} disabled={!canSave}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#7877C6] text-white text-xs font-medium hover:bg-[#6665b5] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shrink-0"
                >
                    <Save size={12} /><span className="hidden sm:inline">Save</span>
                </button>
            </div>

            {/* HTML editor */}
            {method === "html" && (
                <>
                    {/* ── DESKTOP ──────────────────────────────────────────── */}
                    <div className="hidden md:grid flex-1 min-h-0 grid-cols-2 gap-4 overflow-hidden">
                        <div className="flex flex-col min-h-0 overflow-hidden bg-white rounded-2xl border border-gray-100">
                            <div className="flex items-center border-b border-gray-100 shrink-0 px-1 pt-1">
                                {([
                                    { id: "data" as DesktopLeftTab, label: "Data", icon: <Braces size={11} /> },
                                    { id: "code" as DesktopLeftTab, label: "Code", icon: <Code2 size={11} /> },
                                ]).map((tab) => (
                                    <button key={tab.id} onClick={() => setDesktopTab(tab.id)}
                                        className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium rounded-t-lg transition cursor-pointer border-b-2
                                            ${desktopTab === tab.id ? "text-[#7877C6] border-[#7877C6] bg-[#7877C6]/4" : "text-gray-400 border-transparent hover:text-gray-600 hover:bg-gray-50"}`}
                                    >
                                        {tab.icon}{tab.label}
                                    </button>
                                ))}
                            </div>
                            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                                {desktopTab === "data" && <DataPanel {...dataPanelProps} stretch={true} />}
                                {desktopTab === "code" && <CodePanel htmlCode={htmlCode} textareaRef={codeTextareaRef} onChange={setHtmlCode} />}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 min-h-0 overflow-hidden">
                            <div className="flex items-center gap-2 shrink-0">
                                <Eye size={11} className="text-gray-400 shrink-0" />
                                <span className="text-[11px] font-semibold text-gray-500 shrink-0">Layout</span>
                                <div className="flex-1 min-w-0">
                                    <LayoutDropdown selected={selectedLayout} onSelect={applyLayout} />
                                </div>
                                <span className="text-[10px] text-gray-400 shrink-0 tabular-nums">
                                    {currentPreset.width} × {currentPreset.height}px
                                </span>
                            </div>
                            <ScaledPreview src={previewSrc} canvasWidth={currentPreset.width} canvasHeight={currentPreset.height}
                                containerClass="flex-1 min-h-0 overflow-hidden rounded-2xl p-3"
                            />
                        </div>
                    </div>

                    {/* ── MOBILE ───────────────────────────────────────────── */}
                    <div className="flex md:hidden flex-col flex-1 min-h-0 overflow-hidden gap-3">
                        <div className="flex bg-gray-100 rounded-xl p-1 shrink-0">
                            {([
                                { id: "data" as MobileTab, label: "Data", icon: <Braces size={11} /> },
                                { id: "code" as MobileTab, label: "Code", icon: <Code2 size={11} /> },
                                { id: "preview" as MobileTab, label: "Preview", icon: <Eye size={11} /> },
                            ]).map((tab) => (
                                <button key={tab.id} onClick={() => setMobileTab(tab.id)}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium transition cursor-pointer
                                        ${mobileTab === tab.id ? "bg-white text-[#7877C6] shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                                >
                                    {tab.icon}{tab.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex-1 min-h-0 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                            {mobileTab === "data" && (
                                <div className="flex flex-col gap-3 pb-4">
                                    <div>
                                        <p className="text-[11px] font-semibold text-gray-500 mb-1.5">Layout</p>
                                        <LayoutDropdown selected={selectedLayout} onSelect={applyLayout} />
                                    </div>
                                    <DataPanel {...dataPanelProps} stretch={false} />
                                </div>
                            )}
                            {mobileTab === "code" && (
                                <div
                                    className="bg-white rounded-2xl border border-gray-100 flex flex-col"
                                    style={{ minHeight: "400px" }}
                                >
                                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center gap-2 rounded-t-2xl shrink-0">
                                        <Code2 size={11} className="text-gray-400" />
                                        <span className="text-[10px] text-gray-400 font-mono">
                                            template.html
                                        </span>
                                    </div>

                                    <div className="flex-1 min-h-[360px] pt-4">
                                        <Editor
                                            language="html"
                                            value={htmlCode}
                                            onChange={(value) => setHtmlCode(value || "")}
                                            theme="vs-light"
                                            height="70vh"
                                            options={{
                                                minimap: { enabled: false },
                                                fontSize: 13,
                                                wordWrap: "on",
                                                automaticLayout: true,
                                                scrollBeyondLastLine: false,
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                            {mobileTab === "preview" && (
                                <ScaledPreview src={previewSrc} canvasWidth={currentPreset.width} canvasHeight={currentPreset.height}
                                    containerClass="p-3 min-h-[300px]"
                                />
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Canva / Placid */}
            {(method === "canva" || method === "placid") && (
                <div className="flex-1 flex items-start justify-center pt-8 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 w-full max-w-lg space-y-5">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: method === "canva" ? "linear-gradient(135deg,#00C4CC,#7B2FF7)" : "#f59e0b" }}
                            >
                                {METHOD_META[method].icon}
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900">
                                    {method === "canva" ? "Canva Design ID" : "Placid Template ID"}
                                </h3>
                                <p className="text-[11px] text-gray-400 leading-relaxed mt-0.5">
                                    {method === "canva"
                                        ? "Create a design in Canva with text layers named after your JSON keys."
                                        : "Build a template in Placid and paste its ID. JSON keys map to template layers."}
                                </p>
                            </div>
                        </div>
                        <input value={method === "canva" ? canvaId : placidId}
                            onChange={(e) => method === "canva" ? setCanvaId(e.target.value) : setPlacidId(e.target.value)}
                            placeholder={method === "canva" ? "DAFxyz1234…" : "abc123"}
                            className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#7877C6]/30 placeholder-gray-300"
                        />
                        <div>
                            <p className="text-[11px] font-semibold text-gray-700 mb-2">Template Data (JSON)</p>
                            <DataPanel {...dataPanelProps} stretch={false} />
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                * { scrollbar-width: none; -ms-overflow-style: none; }
                *::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    );
};


export default TemplateEditor;
