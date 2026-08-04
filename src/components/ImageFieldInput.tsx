import React, { useRef, useState } from "react";
import { ImageIcon, Loader2, Upload, FolderOpen, X } from "lucide-react";
import { getAuth } from "firebase/auth";
import app from "../config/firebase";
import { uploadOrgAsset } from "../lib/orgAssets";
import AssetPickerModal from "./AssetPickerModal";

type Props = {
  label: string;
  value: string;
  orgId: string;
  onChange: (url: string) => void;
};

const ImageFieldInput: React.FC<Props> = ({ label, value, orgId, onChange }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const uid = getAuth(app).currentUser?.uid;
    if (!uid) {
      setError("You must be signed in to upload.");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const asset = await uploadOrgAsset(orgId, uid, file);
      onChange(asset.url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] uppercase tracking-wider font-semibold text-gray-500">
        {label}
      </label>

      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-[4/3]">
          <img src={value} alt={label} className="w-full h-full object-contain" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 h-7 w-7 rounded-lg bg-white/90 hover:bg-white shadow-sm flex items-center justify-center transition cursor-pointer"
            title="Remove photo"
          >
            <X size={13} className="text-gray-600" />
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-200 bg-transparent aspect-[4/3] flex flex-col items-center justify-center gap-1.5 text-gray-400">
          <ImageIcon size={22} className="opacity-40" />
          <span className="text-[11px] font-medium">No photo selected</span>
        </div>
      )}

      <div className="flex gap-2 pt-0.5">
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-[11px] font-semibold text-gray-600 hover:border-[#7877C6]/40 hover:text-[#7877C6] transition cursor-pointer disabled:opacity-50"
        >
          {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
          {uploading ? "Uploading…" : "Upload"}
        </button>
        <button
          type="button"
          disabled={uploading}
          onClick={() => setPickerOpen(true)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-[11px] font-semibold text-gray-600 hover:border-[#7877C6]/40 hover:text-[#7877C6] transition cursor-pointer disabled:opacity-50"
        >
          <FolderOpen size={12} />
          Library
        </button>
      </div>

      {error && <p className="text-[11px] text-red-500">{error}</p>}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />

      {pickerOpen && (
        <AssetPickerModal
          orgId={orgId}
          onClose={() => setPickerOpen(false)}
          onSelect={(asset) => {
            onChange(asset.url);
            setPickerOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default ImageFieldInput;
