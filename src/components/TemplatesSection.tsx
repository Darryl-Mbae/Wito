import React, { useState, useRef, useEffect } from "react";
import { Plus, Pencil, Trash2, Sparkles, ShoppingBag } from "lucide-react";
import type { SavedTemplate, TemplateMethod } from "./TemplateEditor";
import { LAYOUT_PRESETS } from "./TemplateEditor";

export type { SavedTemplate, TemplateMethod };

// ─── Layout preset → filter category ─────────────────────────────────────────

type FilterType = "post" | "story" | "flyer";
type ActiveFilter = "all" | FilterType;

const PRESET_FILTER: Record<string, FilterType> = {
    "ig-portrait": "post",
    "ig-story": "story",
    "flyer-a4": "flyer",
    "calendar-a4": "flyer",
};

const ASPECT: Record<FilterType, string> = {
    post: "4 / 5",
    story: "9 / 16",
    flyer: "1",
};

const FILTER_LABELS: { id: ActiveFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "post", label: "Post" },
    { id: "story", label: "Story" },
    { id: "flyer", label: "Square" },
];

function getTemplateFilterType(template: SavedTemplate): FilterType {
    const preset = (template as any).layoutPreset as string | undefined;
    return preset ? (PRESET_FILTER[preset] ?? "flyer") : "post";
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
    templates: SavedTemplate[];
    onAddNew: () => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onMakeFlyer: (id: string) => void;
};

// ─── Scaled iframe preview ────────────────────────────────────────────────────

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

const ScaledPreview: React.FC<{
    src: string;
    canvasWidth: number;
    canvasHeight: number;
}> = ({ src, canvasWidth, canvasHeight }) => {
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
        <div ref={wrapperRef} className="absolute inset-0 flex items-center justify-center overflow-hidden">
            <div style={{
                width: canvasWidth * scale,
                height: canvasHeight * scale,
                position: "relative",
                overflow: "hidden",
                flexShrink: 0,
            }}>
                <iframe
                    src={src}
                    style={{
                        border: "none",
                        width: canvasWidth,
                        height: canvasHeight,
                        transformOrigin: "top left",
                        transform: `scale(${scale})`,
                        pointerEvents: "none",
                    }}
                    sandbox="allow-scripts"
                    title="Template preview"
                />
            </div>
        </div>
    );
};

// ─── Template card ─────────────────────────────────────────────────────────────

const TemplateCard: React.FC<{
    template: SavedTemplate;
    filterType: FilterType;
    onEdit: () => void;
    onDelete: () => void;
    onMakeFlyer: () => void;
}> = ({ template, filterType, onEdit, onDelete, onMakeFlyer }) => {
    const [hovered, setHovered] = useState(false);

    const preset = LAYOUT_PRESETS.find((p) => p.id === (template as any).layoutPreset);
    const canvasWidth = preset?.width ?? 1080;
    const canvasHeight = preset?.height ?? 1080;

    const previewSrc = template.htmlCode?.trim()
        ? `data:text/html;charset=utf-8,${encodeURIComponent(buildPreviewHtml(template.htmlCode, template.jsonData ?? ""))}`
        : null;

    return (
        <div
            className="flex flex-col rounded-2xl border border-gray-100 overflow-hidden bg-white hover:shadow-md transition-shadow group cursor-pointer"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Preview — true aspect ratio */}
            <div
                className="relative w-full"
                style={{ aspectRatio: ASPECT[filterType] }}
            >
                {previewSrc ? (
                    <ScaledPreview src={previewSrc} canvasWidth={canvasWidth} canvasHeight={canvasHeight} />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#7877C6] to-[#a5a4e0] flex items-center justify-center">
                        <span className="text-white/40 text-[10px] font-medium tracking-widest uppercase">
                            {template.method}
                        </span>
                    </div>
                )}

                {/* Sale badge */}
                {template.isForSale && (
                    <div className="absolute top-2 left-2 bg-[#7877C6] text-white px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                        <ShoppingBag size={10} />
                        KES {template.salePrice || 0}
                    </div>
                )}

                {/* Hover overlay */}
                <div className={`absolute inset-0 bg-[#141228]/55 flex flex-col justify-between p-2.5 transition-opacity duration-200 ${hovered ? "opacity-100" : "opacity-0"}`}>
                    {/* Edit / Delete top-right */}
                    <div className="flex justify-end gap-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(); }}
                            className="h-7 w-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition cursor-pointer"
                        >
                            <Pencil size={11} className="text-white" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            className="h-7 w-7 rounded-lg bg-white/15 hover:bg-red-500/60 flex items-center justify-center transition cursor-pointer"
                        >
                            <Trash2 size={11} className="text-white" />
                        </button>
                    </div>

                    {/* Make flyer bottom */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onMakeFlyer(); }}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#7877C6] hover:bg-[#6665b5] text-white text-xs font-medium transition cursor-pointer"
                    >
                        <Sparkles size={12} />
                        Make flyer
                    </button>
                </div>
            </div>


        </div>
    );
};

// ─── Section ──────────────────────────────────────────────────────────────────

const TemplatesSection: React.FC<Props> = ({ templates, onAddNew, onEdit, onDelete, onMakeFlyer }) => {
    const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");

    const filtered = activeFilter === "all"
        ? templates
        : templates.filter((t) => getTemplateFilterType(t) === activeFilter);

    // Add card aspect matches current filter so it lines up naturally in the grid.
    // Under "All" there's no single shape to match, so default to square.
    const addCardAspect = activeFilter === "all" ? ASPECT.flyer : ASPECT[activeFilter];

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-sm font-semibold text-gray-900">Templates</h2>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                        {templates.length === 0
                            ? "Create your first template."
                            : `${templates.length} template${templates.length !== 1 ? "s" : ""}`}
                    </p>
                </div>

                {/* Filter pills */}
                <div className="flex gap-1.5">
                    {FILTER_LABELS.map((f) => (
                        <button
                            key={f.id}
                            onClick={() => setActiveFilter(f.id)}
                            className={`text-[11px] font-medium px-3 py-1.5 rounded-full border transition cursor-pointer
                                ${activeFilter === f.id
                                    ? "bg-[#7877C6] text-white border-[#7877C6]"
                                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid — align-items: start so tall story cards don't stretch short post cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-start">
                {filtered.map((t) => (
                    <TemplateCard
                        key={t.id}
                        template={t}
                        filterType={activeFilter === "all" ? getTemplateFilterType(t) : activeFilter}
                        onEdit={() => onEdit(t.id)}
                        onDelete={() => onDelete(t.id)}
                        onMakeFlyer={() => onMakeFlyer(t.id)}
                    />
                ))}

                {/* Dotted add card — same aspect ratio as current filter */}
                <button
                    onClick={onAddNew}
                    style={{ aspectRatio: addCardAspect }}
                    className="w-full rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#7877C6]/50 hover:bg-[#7877C6]/4 transition group flex flex-col items-center justify-center gap-2 cursor-pointer"
                >
                    <div className="h-8 w-8 rounded-xl bg-gray-100 group-hover:bg-[#7877C6]/10 flex items-center justify-center transition">
                        <Plus size={15} className="text-gray-400 group-hover:text-[#7877C6] transition" />
                    </div>
                    <p className="text-xs font-medium text-gray-400 group-hover:text-[#7877C6] transition">Add template</p>
                </button>
            </div>
        </div>
    );
};

export default TemplatesSection;