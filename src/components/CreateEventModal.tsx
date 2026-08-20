import { useState, useRef } from "react";
import { X, Plus, Loader2, Check, Video, ImageIcon} from "lucide-react";

type EventForm = {
  name: string;
  date: string;
  time: string;
  location: string;
  fee: string;
  dresscode: string;
  description: string;
  imageURL: string;

};

const EMPTY_FORM: EventForm = {
  name: "",
  date: "",
  time: "",
  location: "",
  fee: "",
  dresscode: "",
  description: "",
  imageURL: "",
};

const isVirtualLink = (loc: string) =>
  loc?.startsWith("http://") || loc?.startsWith("https://");

export type { EventForm };

// ← point this at your Cloudflare worker URL
const WORKER_URL = import.meta.env.VITE_WORKER_URL as string;

interface Props {
  onClose: () => void;
  onSubmit: (form: EventForm) => Promise<void>;
  saving: boolean;
  initialDate?: string;
}

const CreateEventModal: React.FC<Props> = ({ onClose, onSubmit, saving, initialDate }) => {
  const [form, setForm] = useState<EventForm>({
    ...EMPTY_FORM,
    date: initialDate || "",
  });
  const [toggles, setToggles] = useState({
    fee: false,
    dresscode: false,
    description: false,
    imageURL: false,
  });


  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = (field: keyof EventForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const toggle = (field: keyof typeof toggles) => {
    setToggles((t) => {
      const nextState = { ...t, [field]: !t[field] };
      if (field === "imageURL" && !nextState.imageURL) {
        setSelectedFile(null);
        setUploadError("");
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl("");
        setForm((f) => ({ ...f, imageURL: "" }));
      }
      return nextState;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setUploadError("");

    // Show local preview immediately
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));

    // Upload to R2 via worker
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "events");

      const res = await fetch(`${WORKER_URL}/upload`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const err = await res.json() as { error: string };
        throw new Error(err.error ?? "Upload failed");
      }

      const { url } = await res.json() as { url: string };
      setForm((f) => ({ ...f, imageURL: url }));
    } catch (err: any) {
      setUploadError(err.message ?? "Upload failed");
      setSelectedFile(null);
      setPreviewUrl("");
      setForm((f) => ({ ...f, imageURL: "" }));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.date || !form.time || !form.location) return;
    if (toggles.imageURL && uploading) return; // wait for upload

    await onSubmit({
      ...form,
      fee: toggles.fee ? form.fee : "",
      dresscode: toggles.dresscode ? form.dresscode : "",
      description: toggles.description ? form.description : "",
      imageURL: toggles.imageURL ? form.imageURL : "",
    });
  };

  const inputCls =
    "mt-1 w-full rounded-[8px] border border-gray-200 bg-white/70 px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-[#7877C6]/20 transition placeholder:text-gray-400 text-gray-900";

  const labelCls = "text-sm font-medium text-gray-700";

  return (

    <div className=" fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-xl w-full lg:min-w-2xl sm:max-w-lg max-h-[92vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-gray-100 rounded-t-2xl">
          <div>
            <h2 className="text-base font-semibold text-gray-900">New event</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Fields marked <span className="text-red-400">*</span> are required
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* Name */}
          <div>
            <label className={labelCls}>
              Event name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={set("name")}
              placeholder="Rotaract Installation"
              className={inputCls}
              required
            />
          </div>

          {/* Date + Time */}
          <div className="grid lg:grid-cols-2 grid-cols-1 gap-3">
            <div>
              <label className={labelCls}>
                Date <span className="text-red-400">*</span>
              </label>
              <input type="date" value={form.date} onChange={set("date")} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>
                Time <span className="text-red-400">*</span>
              </label>
              <input type="time" value={form.time} onChange={set("time")} className={inputCls} required />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className={labelCls}>
              Location <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.location}
              onChange={set("location")}
              placeholder="Nairobi Convention Centre or https://meet.google.com/..."
              className={inputCls}
              required
            />
            {isVirtualLink(form.location) && (
              <p className="mt-1.5 text-[11px] text-[#7877C6] flex items-center gap-1">
                <Video size={11} /> Virtual link detected — will show as online event
              </p>
            )}
          </div>

          {/* Optional toggles */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-700">Optional details</p>

            {/* Event Poster */}
            <div>
              <button
                type="button"
                onClick={() => toggle("imageURL")}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition cursor-pointer"
              >
                <span className={`w-4 h-4 rounded border flex items-center justify-center transition ${toggles.imageURL ? "bg-[#7877C6] border-[#7877C6]" : "border-gray-300"}`}>
                  {toggles.imageURL && <Check size={10} className="text-white" />}
                </span>
                Event poster
              </button>

              {toggles.imageURL && (
                <div className="mt-2 space-y-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />

                  {/* Preview */}
                  {/* {previewUrl && (
                    <div className="relative w-full h-36 rounded-[8px] overflow-hidden border border-gray-200 bg-gray-50">
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      {uploading && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center gap-2">
                          <Loader2 size={16} className="animate-spin text-[#7877C6]" />
                          <span className="text-xs font-medium text-[#7877C6]">Uploading…</span>
                        </div>
                      )}
                      {!uploading && form.imageURL && (
                        <div className="absolute bottom-2 right-2 bg-emerald-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check size={9} /> Uploaded
                        </div>
                      )}
                    </div>
                  )} */}

                  {/* Upload button */}
                  <div className="flex items-center justify-between px-3 py-2 border border-gray-200 rounded-[8px] bg-white/60">
                    <div className="flex items-center gap-2 min-w-0">
                      <ImageIcon size={14} className="text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-600 truncate">
                        {selectedFile ? selectedFile.name : "No file selected"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="text-sm font-medium text-[#7877C6] hover:underline disabled:opacity-50 shrink-0 ml-2"
                    >
                      {selectedFile ? "Change" : "Upload"}
                    </button>
                  </div>

                  {uploadError && (
                    <p className="text-xs text-red-500">{uploadError}</p>
                  )}
                </div>
              )}
            </div>

            {/* Fee */}
            <div>
              <button
                type="button"
                onClick={() => toggle("fee")}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition cursor-pointer"
              >
                <span className={`w-4 h-4 rounded border flex items-center justify-center transition ${toggles.fee ? "bg-[#7877C6] border-[#7877C6]" : "border-gray-300"}`}>
                  {toggles.fee && <Check size={10} className="text-white" />}
                </span>
                Entry fee
              </button>
              {toggles.fee && (
                <input type="text" value={form.fee} onChange={set("fee")} placeholder="KES 500 / Free" className={`${inputCls} mt-2`} />
              )}
            </div>

            {/* Dresscode */}
            <div>
              <button
                type="button"
                onClick={() => toggle("dresscode")}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition cursor-pointer"
              >
                <span className={`w-4 h-4 rounded border flex items-center justify-center transition ${toggles.dresscode ? "bg-[#7877C6] border-[#7877C6]" : "border-gray-300"}`}>
                  {toggles.dresscode && <Check size={10} className="text-white" />}
                </span>
                Dress code
              </button>
              {toggles.dresscode && (
                <input type="text" value={form.dresscode} onChange={set("dresscode")} placeholder="Smart Casual" className={`${inputCls} mt-2`} />
              )}
            </div>

            {/* Description */}
            <div>
              <button
                type="button"
                onClick={() => toggle("description")}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition cursor-pointer"
              >
                <span className={`w-4 h-4 rounded border flex items-center justify-center transition ${toggles.description ? "bg-[#7877C6] border-[#7877C6]" : "border-gray-300"}`}>
                  {toggles.description && <Check size={10} className="text-white" />}
                </span>
                Description
              </button>
              {toggles.description && (
                <textarea
                  value={form.description}
                  onChange={set("description")}
                  placeholder="What's this event about?"
                  rows={3}
                  className={`${inputCls} mt-2 resize-none`}
                />
              )}
            </div>
          </div>



          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-[8px] border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex-1 flex items-center justify-center gap-2 rounded-[8px] bg-[#7877C6] py-2.5 text-sm font-medium text-white hover:bg-[#7877C6]/90 transition disabled:opacity-60 cursor-pointer"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : uploading ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              {saving ? "Creating..." : uploading ? "Uploading image..." : "Create event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModal;