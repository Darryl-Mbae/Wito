import React, { useEffect, useState } from "react";
import { X, ImageIcon, Loader2 } from "lucide-react";
import { listOrgAssets, type OrgAsset } from "../lib/orgAssets";
import { EmptyState } from "./EmptyState";

type Props = {
  orgId: string;
  onSelect: (asset: OrgAsset) => void;
  onClose: () => void;
};

const AssetPickerModal: React.FC<Props> = ({ orgId, onSelect, onClose }) => {
  const [assets, setAssets] = useState<OrgAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listOrgAssets(orgId)
      .then((list) => {
        if (!cancelled) setAssets(list);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load photos.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white sm:rounded-2xl rounded-t-2xl w-full sm:max-w-lg max-h-[80vh] flex flex-col overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Pick from library</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Photos saved to this organisation</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition cursor-pointer"
          >
            <X size={15} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={20} className="animate-spin text-[#7877C6]" />
            </div>
          ) : error ? (
            <p className="text-xs text-red-500 text-center py-10">{error}</p>
          ) : assets.length === 0 ? (
            <EmptyState
              icon={ImageIcon}
              title="No photos yet"
              description="Upload photos in Design → Media to reuse them here"
            />
          ) : (
            <div className="grid grid-cols-3 gap-2.5">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => onSelect(asset)}
                  className="group relative aspect-square rounded-xl overflow-hidden border border-gray-100 hover:border-[#7877C6]/50 transition cursor-pointer bg-gray-50"
                  title={asset.name}
                >
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5 opacity-0 group-hover:opacity-100 transition">
                    <p className="text-[10px] text-white font-medium truncate">{asset.name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssetPickerModal;
