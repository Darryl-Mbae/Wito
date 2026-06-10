import React, { useState } from "react";
import { Download, Trash2, ExternalLink } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Flyer = {
    id: string;
    eventName: string;
    templateName: string;
    createdAt: string;
    previewUrl?: string;
    previewBg?: string;
    exportUrl?: string;
    width?: number;
    height?: number;
};

type FilterType = "post" | "story" | "flyer";

const getFilterType = (width?: number, height?: number): FilterType => {
    if (!width || !height) return "post";
    const ratio = width / height;
    if (Math.abs(ratio - 1) < 0.1) return "post";
    if (ratio < 1) return "story";
    return "flyer";
};

const ASPECT: Record<FilterType, string> = {
    post: "1 / 1",
    story: "9 / 16",
    flyer: "794 / 1123",
};

const FILTER_LABELS: { id: FilterType; label: string }[] = [
    { id: "post", label: "Post" },
    { id: "story", label: "Story" },
    { id: "flyer", label: "Flyer" },
];

const WORKER_BASE_URL = "https://mailtrap.darrylmbae01.workers.dev";

// ─── Flyer Card ─────────────────────────────────────────────────────────────

const FlyerCard: React.FC<{
    flyer: Flyer;
    orgId: string;
    onDelete: () => void;
    filterType: FilterType;
}> = ({ flyer, orgId, onDelete, filterType }) => {
    const [preview, setPreview] = useState<{ status: "loading" | "ok" | "error"; blobUrl?: string }>({ status: "loading" });
    const previewUrl = flyer.previewUrl || `${WORKER_BASE_URL}/flyer-preview?orgId=${orgId}&flyerId=${flyer.id}`;

    React.useEffect(() => {
        fetch(previewUrl).then(res => res.blob()).then(blob => {
            setPreview({ status: "ok", blobUrl: URL.createObjectURL(blob) });
        }).catch(() => setPreview({ status: "error" }));
    }, [previewUrl]);

    const handleDownload = async () => {
        const res = await fetch(flyer.exportUrl || previewUrl);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${flyer.eventName.replace(/\s+/g, "_")}.png`;
        a.click();
    };

    return (
        <div className="relative group rounded-2xl border border-gray-100 overflow-hidden bg-white hover:shadow-md transition-shadow">
            <div className="relative w-full overflow-hidden" style={{ aspectRatio: ASPECT[filterType] }}>
                {preview.status === "loading" && <div className="absolute inset-0 bg-gray-50 animate-pulse" />}
                {preview.status === "ok" && <img src={preview.blobUrl} className="h-full w-full object-cover" />}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-[#141228]/60 opacity-0 group-hover:opacity-100 transition flex flex-col justify-between p-3">
                    <p className="text-white text-xs font-medium truncate">{flyer.eventName}</p>
                    <div className="flex justify-end gap-1.5">
                        <a
                            href={flyer.exportUrl || previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-7 w-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
                        >
                            <ExternalLink size={12} />
                        </a>
                        <button onClick={handleDownload} className="h-7 w-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white">
                            <Download size={12} />
                        </button>
                        <button onClick={onDelete} className="h-7 w-7 rounded-lg bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center text-white">
                            <Trash2 size={12} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Section ──────────────────────────────────────────────────────────────────

const FlyersSection: React.FC<{ flyers: Flyer[]; orgId: string; onDelete: (id: string) => void; onCreateFlyer: () => void }> = ({ flyers, orgId, onDelete, onCreateFlyer }) => {
    const [activeFilter, setActiveFilter] = useState<FilterType>("post");
    const visible = flyers.filter((f) => getFilterType(f.width, f.height) === activeFilter);

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Flyers</h2>
                <div className="flex gap-1.5">
                    {FILTER_LABELS.map((f) => (
                        <button
                            key={f.id}
                            onClick={() => setActiveFilter(f.id)}
                            className={`text-[11px] font-medium px-3 py-1.5 rounded-full border transition ${activeFilter === f.id ? "bg-[#7877C6] text-white border-[#7877C6]" : "bg-white text-gray-500 border-gray-200"}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {visible.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {visible.map((flyer) => (
                        <FlyerCard key={flyer.id} flyer={flyer} orgId={orgId} onDelete={() => onDelete(flyer.id)} filterType={activeFilter} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-2xl">
                    <p className="text-xs text-gray-400 mb-4">No {activeFilter}s found.</p>
                    <button onClick={onCreateFlyer} className="text-xs text-[#7877C6] font-medium hover:underline">Create one now</button>
                </div>
            )}
        </div>
    );
};

export default FlyersSection;