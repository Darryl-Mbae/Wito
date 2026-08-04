import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams, useOutletContext } from "react-router-dom";
import {
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Loader2,
  Eye,
  SlidersHorizontal,
  RefreshCw,
  FileText,
} from "lucide-react";
import { EmptyState } from "../../components/EmptyState";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import app from "../../config/firebase";
import type { DashboardContextType } from "../Dashboard";
import type { SavedTemplate } from "../../components/TemplateEditor";
import { LAYOUT_PRESETS } from "../../components/TemplateEditor";
import {
  buildPreviewHtml,
  FriendlyFields,
  ScaledPreview,
} from "../../components/MakeFlyerModal";

type MobileTab = "fields" | "preview";

const MakeFlyerPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get("templateId");
  const { activeOrg } = useOutletContext<DashboardContextType>();

  const orgId = activeOrg?.id;
  const [templates, setTemplates] = useState<SavedTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState<SavedTemplate | null>(null);

  const [jsonData, setJsonData] = useState("{}");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("fields");

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewData, setPreviewData] = useState("{}");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load templates ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!orgId) return;
    const db = getFirestore(app);
    getDocs(collection(db, "organizations", orgId, "templates"))
      .then((snap) => {
        setTemplates(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              name: data.name,
              method: data.method,
              htmlCode: data.htmlCode,
              variables: data.variables ?? [],
              jsonData: data.jsonData,
              layoutPreset: data.layoutPreset,
              createdAt: data.createdAt?.toDate?.()?.toISOString() ?? "",
            } as SavedTemplate;
          })
        );
      })
      .finally(() => setLoading(false));
  }, [orgId]);

  // ── Select template from URL param ──────────────────────────────────────────
  useEffect(() => {
    if (!templateId || !orgId) return;
    const found = templates.find((t) => t.id === templateId);
    if (found) {
      setTemplate(found);
      setJsonData(found.jsonData ?? "{}");
      setPreviewData(found.jsonData ?? "{}");
    }
  }, [templateId, templates, orgId]);

  const preset = LAYOUT_PRESETS.find((p) => p.id === template?.layoutPreset);
  const canvasWidth = preset?.width ?? 1080;
  const canvasHeight = preset?.height ?? 1080;

  const hasJsonError = useMemo(() => {
    try { JSON.parse(jsonData); return false; } catch { return true; }
  }, [jsonData]);

  // ── Debounced preview sync ──────────────────────────────────────────────────
  useEffect(() => {
    if (hasJsonError) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setPreviewData(jsonData), 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [jsonData, hasJsonError]);

  const previewSrc = useMemo(() => {
    if (!template?.htmlCode?.trim()) return null;
    return `data:text/html;charset=utf-8,${encodeURIComponent(
      buildPreviewHtml(template.htmlCode, previewData)
    )}`;
  }, [template?.htmlCode, previewData]);

  const derivedEventName = useMemo(() => {
    try {
      const p = JSON.parse(jsonData);
      if (p && typeof p === "object" && !Array.isArray(p))
        return p.event_name ?? p.name ?? p.title ?? template?.name;
    } catch { /* ignore */ }
    return template?.name ?? "Flyer";
  }, [jsonData, template?.name]);

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!template || !orgId || hasJsonError || !template.htmlCode) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const compiledHtml = buildPreviewHtml(template.htmlCode, jsonData);
      const db = getFirestore(app);
      const docRef = await addDoc(collection(db, "organizations", orgId, "flyers"), {
        eventName: derivedEventName,
        templateId: template.id,
        templateName: template.name,
        layoutPreset: template.layoutPreset ?? null,
        jsonData,
        compiledHtml,
        width: canvasWidth,
        height: canvasHeight,
        createdAt: serverTimestamp(),
      });
      navigate(`/dashboard/design?tab=flyers&flyer=${docRef.id}`);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : String(e));
      setIsSaving(false);
    }
  };

  if (!orgId) return null;

  // ── No templateId — show picker ─────────────────────────────────────────────
  if (!templateId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard/design")}
            className="p-2 rounded-xl hover:bg-gray-100 transition cursor-pointer"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Create flyer</h1>
            <p className="text-sm text-gray-500 mt-0.5">Pick a template to get started</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-6 w-6 rounded-full border-2 border-[#7877C6] border-t-transparent animate-spin" />
          </div>
        ) : templates.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No templates yet"
            description="Create your first template to get started"
            action={{ label: "Create template", onClick: () => navigate("/dashboard/design") }}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => navigate(`/dashboard/design/flyer?templateId=${t.id}`)}
                className="group rounded-2xl border border-gray-100 overflow-hidden text-left hover:border-[#7877C6]/30 hover:shadow-md transition cursor-pointer"
              >
                <div className="aspect-[4/5] bg-gradient-to-br from-[#7877C6]/15 to-[#a5a4e0]/25 flex items-center justify-center p-4">
                  <p className="text-xs font-bold text-[#7877C6] text-center">{t.name}</p>
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-gray-900 truncate">{t.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 capitalize">
                    {t.layoutPreset?.replace("-", " ") || "Template"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Template not yet resolved — spinner ─────────────────────────────────────
  if (!template) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-6 w-6 rounded-full border-2 border-[#7877C6] border-t-transparent animate-spin" />
      </div>
    );
  }

  // ── Editor ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-auto lg:h-full min-h-[calc(100vh-8rem)] -m-4 md:-m-8">
      {/* Top bar */}
      <div className="flex flex-row lg:items-center justify-between px-4 md:px-8 py-4 border-b border-gray-100 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard/design")}
            className="p-2 rounded-xl hover:bg-gray-100 transition cursor-pointer"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <div className="flex flex-col lg:flex-row lg:gap-4 items-baseline">
            <h1 className="text-base font-bold text-gray-900">Make flyer</h1>
            <p className="text-[12px] text-gray-400">
              {template.name} · <br className="md:hidden"/>{canvasWidth} × {canvasHeight}px
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={hasJsonError || isSaving || !template.htmlCode}
          className="max-h-10 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7877C6] hover:bg-[#6665b5] disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer"
        >
          {isSaving
            ? <><Loader2 size={14} className="animate-spin" />Saving…</>
            : <><Sparkles size={14} />Save flyer</>
          }
        </button>
      </div>

      {/* Mobile tab bar */}
      <div className="flex sm:hidden border-b border-gray-100 px-4 bg-white shrink-0">
        {([
          { id: "fields" as MobileTab, label: "Details", icon: <SlidersHorizontal size={12} /> },
          { id: "preview" as MobileTab, label: "Preview", icon: <Eye size={12} /> },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMobileTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-bold border-b-2 transition cursor-pointer mr-2 ${
              mobileTab === tab.id
                ? "border-[#7877C6] text-[#7877C6]"
                : "border-transparent text-gray-400"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex flex-col sm:flex-row flex-1 min-h-0 overflow-hidden">
        {/* Left — fields */}
        <div
          className={`sm:flex sm:w-96 shrink-0 flex-col min-h-0 border-b sm:border-b-0 sm:border-r border-gray-100 bg-white overflow-hidden ${
            mobileTab === "fields" ? "flex" : "hidden"
          }`}
        >
          <FriendlyFields
            jsonData={jsonData}
            variables={template.variables ?? []}
            orgId={orgId}
            onChange={setJsonData}
          />

          {saveError && (
            <div className="mx-4 mb-4 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-100 shrink-0">
              <AlertCircle size={14} className="text-red-500 shrink-0" />
              <p className="text-[12px] text-red-600">{saveError}</p>
            </div>
          )}
        </div>

        {/* Right — preview */}
        <div
          className={`sm:flex flex-1 min-h-0 flex-col bg-[#f8fafc] ${
            mobileTab === "preview" ? "flex" : "hidden"
          }`}
        >
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-white shrink-0">
            <span className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">
              Live preview
            </span>
            <button
              onClick={() => { if (!hasJsonError) setPreviewData(jsonData); }}
              disabled={hasJsonError}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-[11px] font-bold text-gray-500 hover:text-[#7877C6] transition cursor-pointer disabled:opacity-30"
            >
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
          <div className="flex-1 min-h-0 p-6 flex items-center justify-center">
            {previewSrc ? (
              <ScaledPreview
                ref={iframeRef}
                src={previewSrc}
                canvasWidth={canvasWidth}
                canvasHeight={canvasHeight}
              />
            ) : (
              <p className="text-sm text-gray-400">No template HTML attached.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MakeFlyerPage;
