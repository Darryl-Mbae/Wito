import React, { useState, useRef, useEffect, useMemo } from "react";
import { ArrowLeft, Code2, Eye, Save, ChevronDown, Check, Braces, AlertCircle, Store, Tag, Upload, Loader2, Gem } from "lucide-react";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import app from "../config/firebase";
import Editor from "@monaco-editor/react";
import { PremiumFeature } from "./PremiumFeature";

export type TemplateMethod = "html";
export type TemplateVariable = {
    key: string;
    label: string;
    type?: "text" | "image" | "date" | "textarea";
    maxItems?: number;
};

export type SavedTemplate = {
    id: string; name: string; method: TemplateMethod;
    htmlCode?: string;
    variables: TemplateVariable[];
    jsonData?: string;
    layoutPreset?: string;
    fontPreset?: string;
    customFontUrl?: string;
    customFontFamily?: string;
    createdAt: string;
    isForSale?: boolean;
    salePrice?: number;
    sellerId?: string;
};
type Props = {
    onBack: () => void;
    onSave: (template: Omit<SavedTemplate, "id" | "createdAt">) => void;
    connectedIntegrations?: never[];
    initialTemplate?: SavedTemplate;
    orgId?: string;
    userId?: string;
};

// ─── Layout presets ───────────────────────────────────────────────────────────

const IG_PORTRAIT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:1080px; height:1350px; overflow:hidden; font-family:var(--flyer-font-family, 'Inter'), sans-serif; }
    body {
      background: linear-gradient(135deg,var(--flyer-primary-color, #7877C6) 0%,var(--flyer-secondary-color, #a5a4e0) 100%);
      display:flex; flex-direction:column;
      align-items:center; justify-content:center;
      color:var(--flyer-text-color, white); padding:64px; text-align:center;
    }
    .photo {
      width:280px; height:280px; border-radius:24px; object-fit:cover;
      margin:0 0 36px; border:4px solid rgba(255,255,255,.35);
      display:none; background:rgba(255,255,255,.12);
    }
    .photo.is-visible { display:block; }
    .label { font-size:11px; letter-spacing:.15em; text-transform:uppercase; opacity:.65; margin:0 0 16px; }
    h1 { font-size:48px; font-weight:700; margin:0 0 20px; line-height:1.1; }
    .meta { font-size:18px; opacity:.8; margin:0 0 8px; }
    .location { font-size:14px; opacity:.6; }
  </style>
</head>
<body>
  <img class="photo" id="photo" alt="" />
  <p class="label">You're invited</p>
  <h1 id="event_name"></h1>
  <p class="meta" id="datetime"></p>
  <p class="location" id="location"></p>
  <script>
    var d = window.__data__ || {};
    var photo = document.getElementById('photo');
    if (d.image_url) {
      photo.src = d.image_url;
      photo.classList.add('is-visible');
    }
    document.getElementById('event_name').textContent = d.event_name || '';
    document.getElementById('datetime').textContent = (d.date || '') + (d.time ? ' · ' + d.time : '');
    document.getElementById('location').textContent = d.location || '';
  </script>
</body>
</html>`;

const IG_SQUARE_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:1080px; height:1080px; overflow:hidden; font-family:var(--flyer-font-family, 'Inter'), sans-serif; }
    body {
      background: linear-gradient(135deg,var(--flyer-primary-color, #7877C6) 0%,var(--flyer-secondary-color, #a5a4e0) 100%);
      display:flex; flex-direction:column;
      align-items:center; justify-content:center;
      color:var(--flyer-text-color, white); padding:64px; text-align:center;
    }
    .photo {
      width:280px; height:280px; border-radius:24px; object-fit:cover;
      margin:0 0 36px; border:4px solid rgba(255,255,255,.35);
      display:none; background:rgba(255,255,255,.12);
    }
    .photo.is-visible { display:block; }
    .label { font-size:11px; letter-spacing:.15em; text-transform:uppercase; opacity:.65; margin:0 0 16px; }
    h1 { font-size:48px; font-weight:700; margin:0 0 20px; line-height:1.1; }
    .meta { font-size:18px; opacity:.8; margin:0 0 8px; }
    .location { font-size:14px; opacity:.6; }
  </style>
</head>
<body>
  <img class="photo" id="photo" alt="" />
  <p class="label">You're invited</p>
  <h1 id="event_name"></h1>
  <p class="meta" id="datetime"></p>
  <p class="location" id="location"></p>
  <script>
    var d = window.__data__ || {};
    var photo = document.getElementById('photo');
    if (d.image_url) {
      photo.src = d.image_url;
      photo.classList.add('is-visible');
    }
    document.getElementById('event_name').textContent = d.event_name || '';
    document.getElementById('datetime').textContent = (d.date || '') + (d.time ? ' · ' + d.time : '');
    document.getElementById('location').textContent = d.location || '';
  </script>
</body>
</html>
`;

const IG_STORY_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:1080px; height:1920px; overflow:hidden; font-family:var(--flyer-font-family, 'Inter'), sans-serif; }
    body {
      background: linear-gradient(180deg,var(--flyer-text-color, #1a1a2e) 0%,var(--flyer-primary-color, #7877C6) 60%,var(--flyer-secondary-color, #f7c59f) 100%);
      display:flex; flex-direction:column;
      align-items:center; justify-content:flex-end;
      color:var(--flyer-text-color, white); padding:80px 48px; text-align:center;
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
        sampleJson: JSON.stringify({ event_name: "Annual Gala", date: "July 12, 2025", time: "7:00 PM", location: "Nairobi Serena Hotel", image_url: "" }, null, 2),
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
        label: "Square",
        width: 1080,
        height: 1080,
        sampleJson: JSON.stringify([
            { name: "Annual Gala", date: "July 12", time: "7:00 PM", location: "Serena Hotel" },
            { name: "Tech Summit", date: "Aug 3", time: "9:00 AM", location: "iHub Nairobi" },
            { name: "Art Exhibition", date: "Aug 17", time: "2:00 PM", location: "GoDown Arts" },
            { name: "Fundraiser Dinner", date: "Sept 5", time: "6:30 PM", location: "Sankara Hotel" },
        ], null, 2),
        html: IG_SQUARE_HTML,
    },
];

// ─── Font presets ─────────────────────────────────────────────────────────────

export type FontPreset = {
    id: string;
    label: string;
    family: string;
    googleFontUrl: string;
};

export const FONT_PRESETS: FontPreset[] = [
    { id: "inter", label: "Inter", family: "Inter", googleFontUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" },
    { id: "poppins", label: "Poppins", family: "Poppins", googleFontUrl: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" },
    { id: "dm-serif", label: "DM Serif Display", family: "DM Serif Display", googleFontUrl: "https://fonts.googleapis.com/css2?family=DM+Serif+Display&display=swap" },
    { id: "playfair", label: "Playfair Display", family: "Playfair Display", googleFontUrl: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&display=swap" },
    { id: "open sans", label: "Open Sans", family: "Open Sans", googleFontUrl: "https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap" },
    { id: "custom", label: "Custom URL…", family: "", googleFontUrl: "" },
];

function injectFont(template: string, googleFontUrl: string, fontFamily: string): string {
    if (!googleFontUrl && !fontFamily) return template;
    const linkTag = googleFontUrl ? `<link href="${googleFontUrl}" rel="stylesheet">` : "";
    const varStyle = fontFamily ? `<style>:root{--flyer-font-family:'${fontFamily}';}</style>` : "";
    const inject = `${linkTag}\n${varStyle}`;
    const trimmed = template.trimStart();
    const withHead = trimmed.replace(/(<head[^>]*>)/i, `$1\n${inject}`);
    if (withHead !== trimmed) return withHead;
    const withBody = trimmed.replace(/(<body[^>]*>)/i, `${inject}\n$1`);
    if (withBody !== trimmed) return withBody;
    return inject + "\n" + trimmed;
}

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

// ─── Build preview ────────────────────────────────────────────────────────────

function buildPreviewHtml(template: string, parsedValue: unknown): string {
    const dataScript = `<script>window.__data__ = ${JSON.stringify(parsedValue ?? null)};<\/script>`;
    const trimmed = template.trimStart();
    const withHead = trimmed.replace(/(<head[^>]*>)/i, `$1\n${dataScript}`);
    if (withHead !== trimmed) return withHead;
    const withBody = trimmed.replace(/(<body[^>]*>)/i, `${dataScript}\n$1`);
    if (withBody !== trimmed) return withBody;
    return dataScript + "\n" + trimmed;
}

// ─── Data Panel ───────────────────────────────────────────────────────────────

type DataPanelProps = {
    jsonData: string;
    parseResult: ParseResult;
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
    stretch: boolean;
    onChange: (v: string) => void;
};

const DataPanel: React.FC<DataPanelProps> = ({ jsonData, parseResult, stretch, onChange }) => (
    <div className={`flex flex-col gap-3 ${stretch ? "flex-1 min-h-0 overflow-hidden" : ""}`}>
        <div className={`flex flex-col overflow-hidden transition ${stretch ? "flex-1 min-h-0" : ""} ${parseResult.kind === "error" ? "border-red-200 bg-red-50/30" : "border-gray-200 bg-white"}`}>
            <div className={`w-full pt-5 ${stretch ? "flex-1 min-h-0" : ""}`} style={stretch ? undefined : { minHeight: "220px", maxHeight: "340px" }}>
                <Editor language="json" value={jsonData} onChange={(value) => onChange(value || "")} theme="vs-light" height="70vh" options={{ minimap: { enabled: false }, fontSize: 12, tabSize: 2, wordWrap: "on", automaticLayout: true, formatOnPaste: true, formatOnType: true, scrollBeyondLastLine: false, lineNumbers: "on", folding: true, glyphMargin: false, renderLineHighlight: "line" }} />
            </div>
            {parseResult.kind === "error" && <div className="flex items-center gap-1.5 px-3 py-2 border-t border-red-100 bg-red-50/50 shrink-0"><AlertCircle size={10} className="text-red-400 shrink-0" /><p className="text-[10px] text-red-500 font-mono">{parseResult.error}</p></div>}
        </div>
        <p className="px-5 py-3 text-[10px] text-gray-400 shrink-0 leading-relaxed">Available as <code className="font-mono text-[#7877C6]">window.__data__</code> in your template&apos;s <code className="font-mono text-gray-500">{"<script>"}</code>. Use <code className="font-mono text-[#7877C6]">{"{ }"}</code> for single-event or <code className="font-mono text-[#7877C6]">{"[ ]"}</code> for multi-event flyers.</p>
    </div>
);

// ─── Code Panel ───────────────────────────────────────────────────────────────

type CodePanelProps = { htmlCode: string; textareaRef: React.RefObject<HTMLTextAreaElement | null>; onChange: (v: string) => void; };
const CodePanel: React.FC<CodePanelProps> = ({ htmlCode, onChange }) => (
    <div className="flex-1 min-h-0 overflow-hidden">
        <Editor height="100%" defaultLanguage="html" value={htmlCode} onChange={(value) => onChange(value || "")} theme="vs-light" options={{ minimap: { enabled: false }, fontSize: 13, wordWrap: "on", automaticLayout: true, tabSize: 2, formatOnPaste: true, formatOnType: true, scrollBeyondLastLine: false, roundedSelection: true, autoClosingBrackets: "always", autoClosingQuotes: "always", autoIndent: "full", suggestOnTriggerCharacters: true, quickSuggestions: true, padding: { top: 12, bottom: 12 } }} />
    </div>
);

// ─── Layout Dropdown ──────────────────────────────────────────────────────────

const LayoutDropdown: React.FC<{ selected: string; onSelect: (id: string) => void; }> = ({ selected, onSelect }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const current = LAYOUT_PRESETS.find((p) => p.id === selected)!;
    useEffect(() => {
        const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);
    return (
        <div ref={ref} className="relative">
            <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-left hover:border-gray-300 transition cursor-pointer">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[11px] font-medium text-gray-700 truncate">{current.label}</span>
                    <span className="text-[10px] text-gray-400 shrink-0">{current.width} × {current.height}</span>
                </div>
                <ChevronDown size={11} className={`text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
                    {LAYOUT_PRESETS.map((p) => (
                        <button key={p.id} onClick={() => { onSelect(p.id); setOpen(false); }} className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-gray-50 transition cursor-pointer ${p.id === selected ? "bg-[#7877C6]/5" : ""}`}>
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

// ─── Font Dropdown ────────────────────────────────────────────────────────────

type FontDropdownProps = {
    selectedFontId: string;
    customFontUrl: string;
    customFontFamily: string;
    onSelectPreset: (id: string) => void;
    onCustomUrlChange: (v: string) => void;
    onCustomFamilyChange: (v: string) => void;
};

const FontDropdown: React.FC<FontDropdownProps> = ({
    selectedFontId, customFontFamily,
    onSelectPreset
}) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const current = FONT_PRESETS.find((f) => f.id === selectedFontId) ?? FONT_PRESETS[0];
    const isCustom = selectedFontId === "custom";

    useEffect(() => {
        const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div ref={ref} className="relative ">
            <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-left hover:border-gray-300 transition cursor-pointer">
                <span className="text-[11px] font-medium text-gray-700 truncate">
                    {isCustom ? (customFontFamily || "Custom font…") : current.label}
                </span>
                <ChevronDown size={11} className={`text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>


            {open && (
                <div className="lg:min-w-60 absolute top-full right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
                    {FONT_PRESETS.map((f) =>
                        f.id === "custom" ? (
                            <PremiumFeature
                                key={f.id}
                                isPremium={true}
                                description="Upload your own custom font by URL for a fully on-brand flyer."
                                tooltipPosition="bottom-left"
                                className="w-full"
                            >
                                <button
                                    onClick={() => { onSelectPreset(f.id); }}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition cursor-pointer ${f.id === selectedFontId ? "bg-[#7877C6]/5" : ""}`}
                                >
                                    {f.id === selectedFontId ? <Check size={10} className="text-[#7877C6] shrink-0" /> : <div className="w-2.5 shrink-0" />}
                                    <span className={`text-[11px] font-medium truncate flex items-center gap-1 ${f.id === selectedFontId ? "text-[#7877C6]" : "text-gray-700"}`}>
                                        {f.label}
                                        <Gem size={9} className="text-[#7877C6]" />
                                    </span>
                                </button>
                            </PremiumFeature>
                        ) : (
                            <button
                                key={f.id}
                                onClick={() => { onSelectPreset(f.id); setOpen(false); }}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition cursor-pointer ${f.id === selectedFontId ? "bg-[#7877C6]/5" : ""}`}
                            >
                                {f.id === selectedFontId ? <Check size={10} className="text-[#7877C6] shrink-0" /> : <div className="w-2.5 shrink-0" />}
                                <span className={`text-[11px] font-medium truncate ${f.id === selectedFontId ? "text-[#7877C6]" : "text-gray-700"}`}>{f.label}</span>
                            </button>
                        )
                    )}

                    {isCustom && (
                        <div className="p-3 border-t border-gray-100 space-y-2">
                            {/* unchanged */}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Scaled Preview ───────────────────────────────────────────────────────────

const ScaledPreview: React.FC<{ src: string; canvasWidth: number; canvasHeight: number; containerClass?: string; }> = ({ src, canvasWidth, canvasHeight, containerClass = "" }) => {
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
                <iframe src={src} style={{ border: "none", width: canvasWidth, height: canvasHeight, transformOrigin: "top left", transform: `scale(${scale})`, pointerEvents: "none" }} sandbox="allow-scripts" title="Template preview" />
            </div>
        </div>
    );
};

// ─── Tab types ────────────────────────────────────────────────────────────────

type DesktopLeftTab = "data" | "code";
type MobileTab = "data" | "code" | "preview";

// ─── Main component ───────────────────────────────────────────────────────────

const TemplateEditor: React.FC<Props> = ({ onBack, onSave, initialTemplate, orgId, userId }) => {
    const [name, setName] = useState(initialTemplate?.name ?? "");
    const [htmlCode, setHtmlCode] = useState(initialTemplate?.htmlCode ?? LAYOUT_PRESETS[0].html);
    const [jsonData, setJsonData] = useState<string>(initialTemplate?.jsonData ?? LAYOUT_PRESETS[0].sampleJson);
    const [previewSrc, setPreviewSrc] = useState("");
    const [selectedLayout, setSelectedLayout] = useState<string>(initialTemplate?.layoutPreset ?? LAYOUT_PRESETS[0].id);
    const [desktopTab, setDesktopTab] = useState<DesktopLeftTab>("data");
    const [mobileTab, setMobileTab] = useState<MobileTab>("data");
    const [isForSale, setIsForSale] = useState(initialTemplate?.isForSale ?? false);
    const [salePrice, setSalePrice] = useState(initialTemplate?.salePrice ?? 0);
    const [sellPopoverOpen, setSellPopoverOpen] = useState(false);
    const [publishingToStore, setPublishingToStore] = useState(false);
    const sellPopoverRef = useRef<HTMLDivElement>(null);

    const jsonTextareaRef = useRef<HTMLTextAreaElement>(null);
    const codeTextareaRef = useRef<HTMLTextAreaElement>(null);
    const parseResult = useMemo(() => parseJsonData(jsonData), [jsonData]);

    const [selectedFontId, setSelectedFontId] = useState<string>(initialTemplate?.fontPreset ?? "inter");
    const [customFontUrl, setCustomFontUrl] = useState<string>(initialTemplate?.customFontUrl ?? "");
    const [customFontFamily, setCustomFontFamily] = useState<string>(initialTemplate?.customFontFamily ?? "");

    const activeFont = useMemo(() => {
        if (selectedFontId === "custom") {
            return { googleFontUrl: customFontUrl.trim(), family: customFontFamily.trim() };
        }
        const preset = FONT_PRESETS.find((f) => f.id === selectedFontId);
        return { googleFontUrl: preset?.googleFontUrl ?? "", family: preset?.family ?? "" };
    }, [selectedFontId, customFontUrl, customFontFamily]);

    useEffect(() => {
        const value = parseResult.kind === "ok" ? parseResult.value : null;
        const withData = buildPreviewHtml(htmlCode, value);
        const withFont = injectFont(withData, activeFont.googleFontUrl, activeFont.family);
        setPreviewSrc(`data:text/html;charset=utf-8,${encodeURIComponent(withFont)}`);
    }, [htmlCode, parseResult, activeFont]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (!sellPopoverRef.current?.contains(e.target as Node)) setSellPopoverOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

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
            name: name.trim(),
            method: "html",
            htmlCode,
            variables: [],
            jsonData,
            layoutPreset: selectedLayout,
            fontPreset: selectedFontId,
            customFontUrl: selectedFontId === "custom" ? customFontUrl.trim() : undefined,
            customFontFamily: selectedFontId === "custom" ? customFontFamily.trim() : undefined,
            isForSale,
            salePrice: isForSale ? salePrice : undefined,
        });
    };

    const handlePublishToStore = async () => {
        if (!isForSale || !orgId || !userId || salePrice <= 0) return;
        setPublishingToStore(true);
        try {
            const workerUrl = import.meta.env.VITE_WORKER_URL;

            // Build preview HTML with actual data (not template code)
            const dataValue = parseResult.kind === "ok" ? parseResult.value : null;
            const withData = buildPreviewHtml(htmlCode, dataValue);
            const compiledHtml = injectFont(withData, activeFont.googleFontUrl, activeFont.family);

            // Generate preview image
            const previewRes = await fetch(
                `${workerUrl}/screenshot`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        html: compiledHtml,
                        width: currentPreset.width,
                        height: currentPreset.height,
                    }),
                }
            );

            if (!previewRes.ok) {
                throw new Error("Failed to generate preview");
            }

            const previewBlob = await previewRes.blob();
            const formData = new FormData();
            formData.append("file", previewBlob, `preview-${Date.now()}.png`);
            formData.append("folder", "marketplace-previews");

            const uploadRes = await fetch(
                `${workerUrl}/upload`,
                { method: "POST", body: formData }
            );

            if (!uploadRes.ok) {
                throw new Error("Failed to upload preview");
            }
            const inferCategory = (layoutPreset: string): "post" | "story" | "flyer" => {
                if (layoutPreset === "ig-story") return "story";
                if (layoutPreset === "calendar-a4") return "flyer"; // or whatever your flyer presets are
                return "post";
            };

        
            const uploadData = await uploadRes.json() as { url: string };
            const previewUrl = uploadData.url;

            const db = getFirestore(app);
            await addDoc(collection(db, "marketplaceTemplates"), {
                name: name.trim(),
                description: `Template by ${orgId}`,
                layoutPreset: selectedLayout,
                tags: [],
                category: inferCategory(selectedLayout),
                price: salePrice,
                isPremium: salePrice > 0,
                previewUrl,
                previewGradient: "from-[#7877C6]/30 to-[#a5a4e0]/40",
                sellerId: orgId,
                isUserGenerated: true,
                createdAt: serverTimestamp(),
                createdBy: userId,
                // Store template data for purchase
                templateData: {
                    htmlCode,
                    jsonData,
                    variables: [],
                    fontPreset: selectedFontId,
                    customFontUrl: selectedFontId === "custom" ? customFontUrl.trim() : null,
                    customFontFamily: selectedFontId === "custom" ? customFontFamily.trim() : null,
                },
            });
            setSellPopoverOpen(false);
            alert("Template published to store!");
        } catch (err) {
            console.error("Failed to publish:", err);
            alert("Failed to publish template");
        } finally {
            setPublishingToStore(false);
        }
    };

    const dataPanelProps = { jsonData, parseResult, textareaRef: jsonTextareaRef, onChange: setJsonData, stretch: false };
    const currentPreset = LAYOUT_PRESETS.find((p) => p.id === selectedLayout)!;

    return (
        <div className="flex flex-col gap-4 h-full min-h-0 overflow-hidden">
            {/* Top bar */}
            <div className="flex items-center gap-2 shrink-0">
                <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition cursor-pointer shrink-0">
                    <ArrowLeft size={13} />
                    <span className="hidden sm:inline">Templates</span>
                </button>
                <span className="text-gray-200 hidden sm:inline">/</span>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Template name…" className="flex-1 min-w-0 text-sm font-semibold text-gray-900 bg-transparent focus:outline-none placeholder-gray-300" />

                {/* Sell in store button + popover */}
                <div className="relative" ref={sellPopoverRef}>
                    <button onClick={() => setSellPopoverOpen(!sellPopoverOpen)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-medium transition cursor-pointer ${isForSale ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                        <Store size={12} />
                        <span className="hidden sm:inline">Sell</span>
                    </button>

                    {sellPopoverOpen && (
                        <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 p-4 z-50 w-64">
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={isForSale} onChange={(e) => { setIsForSale(e.target.checked); if (!e.target.checked) setSalePrice(0); }} className="w-4 h-4 rounded border-gray-300 text-[#7877C6] focus:ring-[#7877C6]" />
                                    <span className="text-sm font-medium text-gray-700">List for sale</span>
                                </label>

                                {isForSale && (
                                    <div className="space-y-2 border-t border-gray-100 pt-3">
                                        <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
                                            <Tag size={12} className="inline mr-1 text-gray-400" />
                                            Price (KES)
                                        </label>
                                        <input type="number" min="0" step="10" value={salePrice} onChange={(e) => setSalePrice(Number(e.target.value))} placeholder="0" className="w-full px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 focus:outline-none focus:border-[#7877C6] focus:ring-1 focus:ring-[#7877C6]/20" />
                                        <p className="text-[10px] text-gray-500 leading-relaxed">
                                            You earn <span className="font-semibold text-[#7877C6]">80%</span> of every sale as credits.
                                        </p>
                                        <button
                                            onClick={handlePublishToStore}
                                            disabled={publishingToStore || salePrice <= 0}
                                            className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold hover:bg-amber-100 disabled:opacity-50 transition cursor-pointer"
                                        >
                                            {publishingToStore ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                                            {publishingToStore ? "Publishing..." : "Publish to store"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <button onClick={handleSave} disabled={!canSave} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#7877C6] text-white text-xs font-medium hover:bg-[#6665b5] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shrink-0">
                    <Save size={12} /><span className="hidden sm:inline">Save</span>
                </button>
            </div>

            {/* HTML editor */}
            <>
                {/* Desktop */}
                <div className="hidden md:grid flex-1 min-h-0 grid-cols-2 gap-4 overflow-hidden">
                    <div className="flex flex-col min-h-0 overflow-hidden bg-white rounded-2xl border border-gray-100">
                        <div className="flex items-center border-b border-gray-100 shrink-0 px-1 pt-1">
                            {([
                                { id: "data" as DesktopLeftTab, label: "Data", icon: <Braces size={11} /> },
                                { id: "code" as DesktopLeftTab, label: "Code", icon: <Code2 size={11} /> },
                            ]).map((tab) => (
                                <button key={tab.id} onClick={() => setDesktopTab(tab.id)} className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium rounded-t-lg transition cursor-pointer border-b-2 ${desktopTab === tab.id ? "text-[#7877C6] border-[#7877C6] bg-[#7877C6]/4" : "text-gray-400 border-transparent hover:text-gray-600 hover:bg-gray-50"}`}>
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
                        <div className="flex flex-row gap-2">
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

                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[11px] font-semibold text-gray-500 shrink-0 pl-[15px]">Font</span>
                                <div className="flex-1 min-w-40">
                                    <FontDropdown
                                        selectedFontId={selectedFontId}
                                        customFontUrl={customFontUrl}
                                        customFontFamily={customFontFamily}
                                        onSelectPreset={setSelectedFontId}
                                        onCustomUrlChange={setCustomFontUrl}
                                        onCustomFamilyChange={setCustomFontFamily}
                                    />
                                </div>
                            </div>
                        </div>

                        <ScaledPreview src={previewSrc} canvasWidth={currentPreset.width} canvasHeight={currentPreset.height} containerClass="flex-1 min-h-0 overflow-hidden rounded-2xl p-3" />
                    </div>
                </div>

                {/* Mobile */}
                <div className="flex md:hidden flex-col flex-1 min-h-0 overflow-hidden gap-3">
                    <div className="flex bg-gray-100 rounded-xl p-1 shrink-0">
                        {([
                            { id: "data" as MobileTab, label: "Data", icon: <Braces size={11} /> },
                            { id: "code" as MobileTab, label: "Code", icon: <Code2 size={11} /> },
                            { id: "preview" as MobileTab, label: "Preview", icon: <Eye size={11} /> },
                        ]).map((tab) => (
                            <button key={tab.id} onClick={() => setMobileTab(tab.id)} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium transition cursor-pointer ${mobileTab === tab.id ? "bg-white text-[#7877C6] shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
                                {tab.icon}{tab.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                        {mobileTab === "data" && (
                            <div className="flex flex-col gap-3 pb-4">
                                <div className="flex flex-col gap-2">
                                    <div>
                                        <p className="text-[11px] font-semibold text-gray-500 mb-1.5">Layout</p>
                                        <LayoutDropdown selected={selectedLayout} onSelect={applyLayout} />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-semibold text-gray-500 mb-1.5 min-w-60">Font</p>
                                        <FontDropdown
                                            selectedFontId={selectedFontId}
                                            customFontUrl={customFontUrl}
                                            customFontFamily={customFontFamily}
                                            onSelectPreset={setSelectedFontId}
                                            onCustomUrlChange={setCustomFontUrl}
                                            onCustomFamilyChange={setCustomFontFamily}
                                        />
                                    </div>
                                </div>
                                <DataPanel {...dataPanelProps} stretch={false} />
                            </div>
                        )}
                        {mobileTab === "code" && (
                            <div className="bg-white rounded-2xl border border-gray-100 flex flex-col" style={{ minHeight: "400px" }}>
                                <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center gap-2 rounded-t-2xl shrink-0">
                                    <Code2 size={11} className="text-gray-400" />
                                    <span className="text-[10px] text-gray-400 font-mono">template.html</span>
                                </div>
                                <div className="flex-1 min-h-[360px] pt-4">
                                    <Editor language="html" value={htmlCode} onChange={(value) => setHtmlCode(value || "")} theme="vs-light" height="70vh" options={{ minimap: { enabled: false }, fontSize: 13, wordWrap: "on", automaticLayout: true, scrollBeyondLastLine: false }} />
                                </div>
                            </div>
                        )}
                        {mobileTab === "preview" && (
                            <ScaledPreview src={previewSrc} canvasWidth={currentPreset.width} canvasHeight={currentPreset.height} containerClass="p-3 min-h-[300px]" />
                        )}
                    </div>
                </div>
            </>
        </div>
    );
};

export default TemplateEditor;