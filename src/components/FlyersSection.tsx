import React, { useState } from "react";
import { Download, Trash2, ExternalLink, X } from "lucide-react";

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

const getFilterType = (
    width?: number,
    height?: number
): FilterType => {
    if (!width || !height) return "post";

    const ratio = width / height;

    // Instagram portrait 4:5
    if (Math.abs(ratio - 0.8) < 0.1) return "post";

    // Story 9:16
    if (Math.abs(ratio - (9 / 16)) < 0.1) return "story";

    return "flyer";
};

const ASPECT: Record<FilterType, string> = {
    post: "4 / 5",
    story: "9 / 16",
    flyer: "794 / 1123",
};

const FILTER_LABELS: { id: FilterType; label: string }[] = [
    { id: "post", label: "Post" },
    { id: "story", label: "Story" },
    { id: "flyer", label: "Flyer" },
];

const WORKER_BASE_URL = "https://mailtrap.darrylmbae01.workers.dev";

// ─── Lightbox ─────────────────────────────────────────────────────────────────

const Lightbox: React.FC<{
    flyer: Flyer;
    blobUrl: string;
    orgId: string;
    onClose: () => void;
    onDelete: () => void;
}> = ({ flyer, blobUrl, orgId, onClose, onDelete }) => {
    const previewUrl = flyer.previewUrl || `${WORKER_BASE_URL}/flyer-preview?orgId=${orgId}&flyerId=${flyer.id}`;

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
        // Backdrop — tap outside image to close
        <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4"
            onClick={onClose}
        >
            {/* Top bar */}
            <div
                className="w-full max-w-lg flex items-center justify-between mb-3 px-1"
                onClick={(e) => e.stopPropagation()}
            >
                <p className="text-white text-sm font-medium truncate max-w-[70%]">{flyer.eventName}</p>
                <button
                    onClick={onClose}
                    className="h-8 w-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition"
                >
                    <X size={15} className="text-white" />
                </button>
            </div>

            {/* Image */}
            <div
                className="w-full max-w-lg max-h-[70vh] flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
            >
                <img
                    src={blobUrl}
                    className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl"
                    alt={flyer.eventName}
                />
            </div>

            {/* Bottom actions */}
            <div
                className="flex gap-3 mt-4"
                onClick={(e) => e.stopPropagation()}
            >
                <a
                    href={flyer.exportUrl || previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition"
                >
                    <ExternalLink size={13} />
                    Open
                </a>
                <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition"
                >
                    <Download size={13} />
                    Download
                </button>
                <button
                    onClick={() => { onDelete(); onClose(); }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/30 hover:bg-red-500/50 text-white text-xs font-medium transition"
                >
                    <Trash2 size={13} />
                    Delete
                </button>
            </div>
        </div>
    );
};

// ─── Flyer Card ───────────────────────────────────────────────────────────────

const FlyerCard: React.FC<{
    flyer: Flyer;
    orgId: string;
    onDelete: () => void;
    filterType: FilterType;
    onOpen: (blobUrl: string) => void;
}> = ({ flyer, orgId, filterType, onOpen }) => {
    const previewUrl = `${WORKER_BASE_URL}/flyer-preview?orgId=${orgId}&flyerId=${flyer.id}`;
    const [preview, setPreview] = useState<{ status: "loading" | "ok" | "error"; blobUrl?: string }>({ status: "loading" });


    React.useEffect(() => {
        if (flyer.previewUrl) {
            setPreview({ status: "ok", blobUrl: flyer.previewUrl })
        }
        else {

            fetch(previewUrl)
                .then(async res => {
                    if (!res.ok) {
                        const text = await res.text();
                        console.error("Preview fetch failed:", res.status, text);
                        setPreview({ status: "error" });
                        return;
                    }
                    const blob = await res.blob();
                    setPreview({ status: "ok", blobUrl: URL.createObjectURL(blob) });
                })
                .catch((e) => {
                    console.error("Preview fetch error:", e);
                    setPreview({ status: "error" });
                });
        }
    }, [previewUrl]);

    return (
        <div
            className="relative rounded-2xl border border-gray-100 overflow-hidden bg-white hover:shadow-md transition-shadow cursor-pointer active:scale-[0.97] transition-transform"
            onClick={() => preview.blobUrl && onOpen(preview.blobUrl)}
        >
            <div className="relative w-full overflow-hidden" style={{ aspectRatio: ASPECT[filterType] }}>
                {preview.status === "loading" && (
                    <div className="absolute inset-0 bg-gray-50 animate-pulse" />
                )}
                {preview.status === "ok" && (
                    <img src={preview.blobUrl} className="h-full w-full object-cover" alt={flyer.eventName} />
                )}
                {preview.status === "error" && (
                    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                        <span className="text-[10px] text-gray-400">Failed to load</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Section ──────────────────────────────────────────────────────────────────

const FlyersSection: React.FC<{
    flyers: Flyer[];
    orgId: string;
    onDelete: (id: string) => void;
    onCreateFlyer: () => void;
}> = ({ flyers, orgId, onDelete, onCreateFlyer }) => {
    const [activeFilter, setActiveFilter] = useState<FilterType>("post");
    const [lightbox, setLightbox] = useState<{ flyer: Flyer; blobUrl: string } | null>(null);

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
                            className={`text-[11px] font-medium px-3 py-1.5 rounded-full border transition ${activeFilter === f.id
                                ? "bg-[#7877C6] text-white border-[#7877C6]"
                                : "bg-white text-gray-500 border-gray-200"
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {visible.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {visible.map((flyer) => (
                        <FlyerCard
                            key={flyer.id}
                            flyer={flyer}
                            orgId={orgId}
                            onDelete={() => onDelete(flyer.id)}
                            filterType={activeFilter}
                            onOpen={(blobUrl) => setLightbox({ flyer, blobUrl })}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-2xl">
                    <p className="text-xs text-gray-400 mb-4">No {activeFilter}s found.</p>
                    <button onClick={onCreateFlyer} className="text-xs text-[#7877C6] font-medium hover:underline">
                        Create one now
                    </button>
                </div>
            )}

            {/* Lightbox */}
            {lightbox && (
                <Lightbox
                    flyer={lightbox.flyer}
                    blobUrl={lightbox.blobUrl}
                    orgId={orgId}
                    onClose={() => setLightbox(null)}
                    onDelete={() => { onDelete(lightbox.flyer.id); setLightbox(null); }}
                />
            )}
        </div>
    );
};

export default FlyersSection;