import React, { useState, useEffect } from "react";
import { useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import {
    getFirestore,
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    doc,
    serverTimestamp,
    query,
    orderBy,
} from "firebase/firestore";
import app from "../../config/firebase";
import { getAuth, type User } from "firebase/auth";
import { type DashboardContextType } from "../Dashboard";

import TemplatesSection from "../../components/TemplatesSection";
import type { SavedTemplate } from "../../components/TemplateEditor";
import TemplateEditor from "../../components/TemplateEditor";
import FlyersSection, { type Flyer } from "../../components/FlyersSection";
import MediaLibrarySection from "../../components/MediaLibrarySection";
import { Store } from "lucide-react";

type Tab = "templates" | "flyers" | "media" | "store";

const TABS: { id: Tab; label: string }[] = [
    { id: "templates", label: "Templates" },
    { id: "flyers", label: "Flyers" },
    { id: "media", label: "Media" },
    // { id: "store", label: "Store" },
];

const db = getFirestore(app);
const auth = getAuth(app);

function templatesCol(orgId: string) { return collection(db, "organizations", orgId, "templates"); }
function flyersCol(orgId: string) { return collection(db, "organizations", orgId, "flyers"); }

function stripUndefined<T extends object>(obj: T): Partial<T> {
    return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

async function fetchTemplates(orgId: string): Promise<SavedTemplate[]> {
    const snap = await getDocs(query(templatesCol(orgId), orderBy("createdAt", "desc")));
    return snap.docs.map((d) => {
        const data = d.data();
        return {
            id: d.id, name: data.name, method: data.method,
            htmlCode: data.htmlCode, canvaDesignId: data.canvaDesignId,
            placidTemplateId: data.placidTemplateId,
            variables: data.variables ?? [], jsonData: data.jsonData,
            layoutPreset: data.layoutPreset,
            createdAt: data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
        } as SavedTemplate & { layoutPreset?: string };
    });
}

async function fetchFlyers(orgId: string): Promise<Flyer[]> {
    const snap = await getDocs(query(flyersCol(orgId), orderBy("createdAt", "desc")));
    return snap.docs.map((d) => {
        const data = d.data();
        return {
            id: d.id,
            eventName: data.eventName,
            templateName: data.templateName,
            previewUrl: data.previewUrl,
            exportUrl: data.exportUrl,
            height: data.height,
            width: data.width,
            createdAt: data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
        } as Flyer;
    });
}

async function createTemplate(orgId: string, uid: string, data: Omit<SavedTemplate, "id" | "createdAt">): Promise<SavedTemplate> {
    const payload = { ...stripUndefined(data), createdBy: uid, createdAt: serverTimestamp() };
    const ref = await addDoc(templatesCol(orgId), payload);
    return { id: ref.id, createdAt: new Date().toISOString(), ...data };
}

async function updateTemplate(orgId: string, templateId: string, data: Omit<SavedTemplate, "id" | "createdAt">): Promise<void> {
    await updateDoc(doc(db, "organizations", orgId, "templates", templateId), { ...stripUndefined(data), updatedAt: serverTimestamp() });
}

async function removeTemplate(orgId: string, templateId: string): Promise<void> {
    await deleteDoc(doc(db, "organizations", orgId, "templates", templateId));
}

async function removeFlyer(orgId: string, flyerId: string): Promise<void> {
    await deleteDoc(doc(db, "organizations", orgId, "flyers", flyerId));
}

const DesignPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { activeOrg } = useOutletContext<DashboardContextType>();
    const [user, setUser] = useState<User | null>(null);
    useEffect(() => { const unsub = auth.onAuthStateChanged(setUser); return unsub; }, []);

    const orgId = activeOrg?.id || null;
    const tabParam = searchParams.get("tab") as Tab | null;
    const [activeTab, setActiveTab] = useState<Tab>(tabParam && ["templates", "flyers", "media"].includes(tabParam) ? tabParam : "templates");
    const [templates, setTemplates] = useState<SavedTemplate[]>([]);
    const [flyers, setFlyers] = useState<Flyer[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editorTarget, setEditorTarget] = useState<string | "new" | null>(null);

    useEffect(() => {
        if (tabParam && ["templates", "flyers", "media"].includes(tabParam)) {
            setActiveTab(tabParam as Tab);
        }
    }, [tabParam]);

    useEffect(() => {
        if (!orgId) return;
        setLoading(true);
        Promise.all([fetchTemplates(orgId), fetchFlyers(orgId)])
            .then(([t, f]) => { setTemplates(t); setFlyers(f); })
            .catch(() => setError("Failed to load data."))
            .finally(() => setLoading(false));
    }, [orgId]);

    const handleSaveTemplate = async (data: Omit<SavedTemplate, "id" | "createdAt">) => {
        if (!orgId || !user) return;
        try {
            if (editorTarget === "new") {
                const saved = await createTemplate(orgId, user.uid, data);
                setTemplates((prev) => [saved, ...prev]);
            } else if (editorTarget) {
                await updateTemplate(orgId, editorTarget, data);
                setTemplates((prev) => prev.map((t) => t.id === editorTarget ? { ...t, ...data } : t));
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            setError(`Failed to save template: ${msg}`);
        }
        setEditorTarget(null);
    };

    const handleDeleteTemplate = async (id: string) => {
        if (!orgId) return;
        try {
            await removeTemplate(orgId, id);
            setTemplates((prev) => prev.filter((t) => t.id !== id));
        } catch {
            setError("Failed to delete template.");
        }
    };

    const handleDeleteFlyer = async (id: string) => {
        if (!orgId) return;
        try {
            await removeFlyer(orgId, id);
            setFlyers((prev) => prev.filter((f) => f.id !== id));
        } catch {
            setError("Failed to delete flyer.");
        }
    };

    const initialTemplate = editorTarget && editorTarget !== "new" ? templates.find((t) => t.id === editorTarget) : undefined;
    const showEditor = activeTab === "templates" && editorTarget !== null;

    return (
        <div className="flex flex-col gap-6 h-full">
            {!showEditor && (
                <div className="flex items-center justify-between shrink-0">
                    <h1 className="text-xl font-semibold text-gray-900">Design</h1>
                    <button
                        onClick={() => navigate("/dashboard/design/marketplace")}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 text-[12px] font-semibold text-gray-600 hover:border-[#7877C6]/40 hover:text-[#7877C6] hover:bg-[#7877C6]/4 transition cursor-pointer"
                    >
                        <Store size={14} />
                        Store
                    </button>
                </div>
            )}

            {!showEditor && (
                <div className="flex gap-5 border-b border-gray-100 shrink-0 w-fit overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                if (tab.id === "store") {
                                    navigate("/dashboard/design/marketplace");
                                } else {
                                    setActiveTab(tab.id);
                                }
                            }}
                            className={`flex items-center gap-2 pb-2.5 text-sm font-medium border-b-2 -mb-px transition cursor-pointer whitespace-nowrap
                                ${activeTab === tab.id
                                    ? "border-[#7877C6] text-[#7877C6]"
                                    : "border-transparent text-gray-500 hover:text-gray-900"
                                }`}
                        >
                            {tab.label}
                            {tab.id === "flyers" && flyers.length > 0 && (
                                <span className={`text-xs h-5 w-5 flex justify-center items-center rounded-full
                                    ${activeTab === tab.id ? "bg-[#7877C6] text-white" : "bg-gray-100 text-gray-400"}`}>
                                    {flyers.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}

            {error && (
                <div className="shrink-0 px-4 py-2.5 rounded-xl bg-red-50 border border-red-100 text-xs text-red-600 flex items-center justify-between">
                    {error}
                    <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-4 cursor-pointer">✕</button>
                </div>
            )}

            <div className="flex-1 min-h-0 overflow-y-auto">
                {showEditor ? (
                    <TemplateEditor
                        onBack={() => setEditorTarget(null)}
                        onSave={handleSaveTemplate}
                        connectedIntegrations={[]}
                        initialTemplate={initialTemplate}
                        orgId={orgId ?? undefined}
                        userId={user?.uid}
                    />
                ) : activeTab === "templates" ? (
                    loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="h-5 w-5 rounded-full border-2 border-[#7877C6] border-t-transparent animate-spin" />
                        </div>
                    ) : (
                        <TemplatesSection
                            templates={templates}
                            onAddNew={() => setEditorTarget("new")}
                            onEdit={(id) => setEditorTarget(id)}
                            onDelete={handleDeleteTemplate}
                            onMakeFlyer={(id) => navigate(`/dashboard/design/flyer?templateId=${id}`)}
                        />
                    )
                ) : activeTab === "media" ? (
                    orgId ? (
                        <MediaLibrarySection orgId={orgId} />
                    ) : (
                        <p className="text-sm text-gray-400 py-10 text-center">Select an organisation to manage media.</p>
                    )
                ) : (
                    <FlyersSection
                        flyers={flyers}
                        orgId={orgId!}
                        onDelete={handleDeleteFlyer}
                        onSwitchToTemplates={() => setActiveTab("templates")}
                    />
                )}
            </div>
        </div>
    );
};

export default DesignPage;
