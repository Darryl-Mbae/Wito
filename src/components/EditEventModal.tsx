import { useState } from "react";
import { X, Loader2, Check, Video, Save } from "lucide-react";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import app from '../config/firebase';
import { type Event } from "./EventCard";

const isVirtualLink = (loc: string) =>
  loc?.startsWith("http://") || loc?.startsWith("https://");

interface Props {
  event: Event;
  onClose: () => void;
  onSaved: () => void;
}

const EditEventModal: React.FC<Props> = ({ event, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: event.name,
    date: event.date,
    time: event.time,
    location: event.location,
    fee: event.fee || "",
    dresscode: event.dresscode || "",
    description: event.description || "",
  });

  const [toggles, setToggles] = useState({
    fee: !!event.fee,
    dresscode: !!event.dresscode,
    description: !!event.description,
  });

  const [saving, setSaving] = useState(false);

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const toggle = (field: keyof typeof toggles) =>
    setToggles((t) => ({ ...t, [field]: !t[field] }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.date || !form.time || !form.location) return;
    setSaving(true);
    try {
      const db = getFirestore(app);
      await updateDoc(doc(db, "events", event.id), {
        name: form.name,
        date: form.date,
        time: form.time,
        location: form.location,
        fee: toggles.fee ? form.fee || null : null,
        dresscode: toggles.dresscode ? form.dresscode || null : null,
        description: toggles.description ? form.description || null : null,
      });
      onSaved();
      onClose();
    } catch (err) {
      console.error("Error updating event:", err);
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "mt-1 w-full rounded-[8px] border border-gray-200 bg-white/70 px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-[#7877C6]/20 transition placeholder:text-gray-400 text-gray-900";

  const labelCls = "text-sm font-medium text-gray-700";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-gray-100 rounded-t-2xl">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Edit event</h2>
            <p className="text-xs text-gray-400 mt-0.5">Changes are saved immediately</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* Name */}
          <div>
            <label className={labelCls}>Event name</label>
            <input type="text" value={form.name} onChange={set("name")} className={inputCls} required />
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Date</label>
              <input type="date" value={form.date} onChange={set("date")} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Time</label>
              <input type="time" value={form.time} onChange={set("time")} className={inputCls} required />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className={labelCls}>Location</label>
            <input
              type="text"
              value={form.location}
              onChange={set("location")}
              className={inputCls}
              required
            />
            {isVirtualLink(form.location) && (
              <p className="mt-1.5 text-[11px] text-[#7877C6] flex items-center gap-1">
                <Video size={11} /> Virtual link detected
              </p>
            )}
          </div>


          {/* Optional toggles */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-700">Optional details</p>

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
                <textarea value={form.description} onChange={set("description")} placeholder="What's this event about?" rows={3} className={`${inputCls} mt-2 resize-none`} />
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
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 rounded-[8px] bg-[#7877C6] py-2.5 text-sm font-medium text-white hover:bg-[#7877C6]/90 transition disabled:opacity-60 cursor-pointer"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEventModal;