import React, { useEffect, useRef, useState } from "react";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { getAuth } from "firebase/auth";
import app from "../config/firebase";
import {
  deleteOrgAsset,
  listOrgAssets,
  uploadOrgAsset,
  type OrgAsset,
} from "../lib/orgAssets";
import { EmptyState } from "./EmptyState";

type Props = {
  orgId: string;
};

const MediaLibrarySection: React.FC<Props> = ({ orgId }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [assets, setAssets] = useState<OrgAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const uid = getAuth(app).currentUser?.uid;
    if (!uid) {
      setError("You must be signed in to upload.");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const uploaded: OrgAsset[] = [];
      for (const file of files) {
        uploaded.push(await uploadOrgAsset(orgId, uid, file));
      }
      setAssets((prev) => [...uploaded, ...prev]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (asset: OrgAsset) => {
    if (!confirm(`Remove "${asset.name}" from the library?`)) return;
    setDeletingId(asset.id);
    setError(null);
    try {
      await deleteOrgAsset(orgId, asset.id);
      setAssets((prev) => prev.filter((a) => a.id !== asset.id));
    } catch {
      setError("Failed to delete photo.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-800">Photo library</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Upload once and reuse across flyers and templates
          </p>
        </div>
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#7877C6] hover:bg-[#6665b5] text-white text-[12px] font-semibold transition cursor-pointer disabled:opacity-50 shrink-0"
        >
          {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
          {uploading ? "Uploading…" : "Upload"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {error && (
        <div className="px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-100 text-xs text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-5 w-5 rounded-full border-2 border-[#7877C6] border-t-transparent animate-spin" />
        </div>
      ) : assets.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="No photos yet"
          description="Upload team photos, logos, or venue shots to reuse when making flyers"
          action={{ label: "Upload a photo", onClick: () => fileRef.current?.click() }}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="group relative rounded-2xl overflow-hidden border border-gray-100 bg-white"
            >
              <div className="aspect-square bg-gray-50">
                <img
                  src={asset.url}
                  alt={asset.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="px-3 py-2.5 flex items-center justify-between gap-2">
                <p className="text-[12px] font-medium text-gray-700 truncate">{asset.name}</p>
                <button
                  type="button"
                  disabled={deletingId === asset.id}
                  onClick={() => handleDelete(asset)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer disabled:opacity-40 shrink-0"
                  title="Remove"
                >
                  {deletingId === asset.id ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Trash2 size={13} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaLibrarySection;
