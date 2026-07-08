import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useOutletContext, useLocation } from "react-router-dom";
import {
  Plus,
  CalendarX,
  Search,
  LayoutGrid,
  List,
  CheckSquare,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { EmptyState } from "../../components/EmptyState";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  deleteDoc,
  doc,
  writeBatch,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import app from "../../config/firebase";
import { type DashboardContextType } from "../Dashboard";
import EventCard, {
  isPast,
  type Event,
  type ViewMode,
} from "../../components/EventCard";
import CreateEventModal, {
  type EventForm,
} from "../../components/CreateEventModal";
import EditEventModal from "../../components/EditEventModal";

type Tab = "All" | "Mine";

const Events: React.FC = () => {
  const { activeOrg } = useOutletContext<DashboardContextType>();
  const auth = getAuth(app);
  const currentUser = auth.currentUser;

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("All");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [initialDate, setInitialDate] = useState("");

  useEffect(() => {
    if (location.state && (location.state as any).openCreateModal) {
      const stateData = location.state as any;
      if (stateData.date) {
        setInitialDate(stateData.date);
      }
      setShowModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);


  // ── Multi-select ──
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [confirmBulk, setConfirmBulk] = useState(false);

  useEffect(() => {
    if (!activeOrg) {
      setEvents([]);
      setLoading(false);
      return;
    }
    setTab("All");
    const db = getFirestore(app);
    const q = query(
      collection(db, "events"),
      where("orgId", "==", activeOrg.id)
    );
    setLoading(true);
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Event));
      data.sort((a, b) => {
        const aP = isPast(a.date);
        const bP = isPast(b.date);
        if (aP !== bP) return aP ? 1 : -1;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
      setEvents(data);
      setLoading(false);
    });
    return () => unsub();
  }, [activeOrg]);

  const handleCreate = async (form: EventForm) => {
    if (!activeOrg || !currentUser) return;
    setSaving(true);
    try {
      const db = getFirestore(app);
      const ref = await addDoc(collection(db, "events"), {
        name: form.name,
        date: form.date,
        time: form.time,
        location: form.location,
        fee: form.fee || null,
        dresscode: form.dresscode || null,
        description: form.description || null,
        imageUrl: form.imageURL,
        orgId: activeOrg.id,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
      });

      const calendarEvent = {
        id: ref.id,
        name: form.name,
        date: form.date,
        time: form.time,
        location: form.location,
        description: form.description || null,
      };

      const { openGoogleCalendar, addToAppleCalendar } = await import("../../utils/calendarLinks");
      if (form.addToGoogleCalendar) openGoogleCalendar(calendarEvent);
      if (form.addToAppleCalendar) addToAppleCalendar(calendarEvent);
      if (form.inviteDirectorsToCalendar) {
        const { inviteDirectorsToEventCalendar } = await import("../../utils/directorCalendarInvite");
        await inviteDirectorsToEventCalendar(activeOrg.id, calendarEvent);
      }

      setShowModal(false);
    } catch (err) {
      console.error("Error creating event:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (event: Event) => {
    try {
      const db = getFirestore(app);
      await deleteDoc(doc(db, "events", event.id));
    } catch (err) {
      console.error("Error deleting event:", err);
    } finally {
      setDeletingEvent(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    setBulkDeleting(true);
    try {
      const db = getFirestore(app);
      const batch = writeBatch(db);
      selected.forEach((id) => batch.delete(doc(db, "events", id)));
      await batch.commit();
      setSelected(new Set());
      setSelectMode(false);
      setConfirmBulk(false);
    } catch (err) {
      console.error("Error bulk deleting:", err);
    } finally {
      setBulkDeleting(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((e) => e.id)));
    }
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  const isOrgOwner = activeOrg?.createdBy === currentUser?.uid;
  const canManage = (event: Event) =>
    isOrgOwner || event.createdBy === currentUser?.uid;

  const filtered = useMemo(() => {
    let list =
      tab === "Mine"
        ? events.filter((e) => e.createdBy === currentUser?.uid)
        : events;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q)
      );
    }
    return list;
  }, [events, tab, search, currentUser]);

  // const mineCount = events.filter(
  //   (e) => e.createdBy === currentUser?.uid
  // ).length;

  const allSelected =
    filtered.length > 0 && selected.size === filtered.length;

  if (!activeOrg) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <p className="text-gray-500 text-sm">
          Select an organization to view events.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Events</h1>
          <div className="flex items-center gap-2">
            {/* Select toggle — only for owners/managers */}
            {(isOrgOwner || events.some((e) => e.createdBy === currentUser?.uid)) && (
              <button
                onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
                className={`flex items-center gap-2 rounded-[8px] border px-4 py-2 text-sm font-medium transition cursor-pointer ${selectMode
                  ? "border-[#7877C6] text-[#7877C6] bg-[#7877C6]/5"
                  : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
              >
                <CheckSquare size={15} />
                {selectMode ? "Cancel" : "Select"}
              </button>
            )}
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 rounded-[8px] bg-[#7877C6] px-4 py-2 text-sm font-medium text-white hover:bg-[#7877C6]/90 transition cursor-pointer"
            >
              <Plus size={15} />
              New event
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Tabs */}
          {/* <div className="flex gap-4 border-b border-gray-100 shrink-0 w-fit" style={{ scrollbarWidth: "none" }}>
            {(["All", "Mine"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex items-center gap-2 pb-2.5 text-sm font-medium border-b-2 -mb-[1px] transition cursor-pointer whitespace-nowrap ${tab === t
                  ? "border-[#7877C6] text-[#7877C6]"
                  : "border-transparent text-gray-500 hover:text-gray-900"
                  }`}
              >
                {t === "Mine" ? "Created by me" : "All events"}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t
                    ? "bg-[#7877C6]/10 text-[#7877C6]"
                    : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
                    }`}
                >
                  {t === "All" ? events.length : events.filter((e) => e.createdBy === currentUser?.uid).length}
                </span>
              </button>
            ))}
          </div> */}
          <div className="w-full flex flex-row items-center gap-3 justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events..."
                className="w-full rounded-[8px] border border-gray-200 bg-white pl-8 pr-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-[#7877C6]/20 transition placeholder:text-gray-400 text-gray-900"
              />
            </div>

            {/* View toggle */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 ml-auto shrink-0">
              <button
                onClick={() => setViewMode("grid")}
                title="Grid view"
                className={`p-1.5 rounded-lg transition cursor-pointer ${viewMode === "grid"
                  ? "bg-white text-gray-900"
                  : "text-gray-400 hover:text-gray-600"
                  }`}
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                title="List view"
                className={`p-1.5 rounded-lg transition cursor-pointer ${viewMode === "list"
                  ? "bg-white text-gray-900"
                  : "text-gray-400 hover:text-gray-600"
                  }`}
              >
                <List size={15} />
              </button>
            </div>
          </div>

        </div>

        {/* Select mode bar */}
        {selectMode && (
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition cursor-pointer"
            >
              {allSelected ? (
                <CheckSquare size={15} className="text-[#7877C6]" />
              ) : (
                <Square size={15} className="text-gray-400" />
              )}
              {allSelected ? "Deselect all" : "Select all"}
            </button>
            <span className="text-xs text-gray-400">
              {selected.size > 0
                ? `${selected.size} selected`
                : "Click events to select"}
            </span>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-3">
              <div className="animate-spin h-6 w-6 border-2 border-gray-200 border-t-[#7877C6] rounded-full mx-auto" />
              <p className="text-sm text-gray-400">Loading events...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={CalendarX}
            title={search ? "No events match your search" : tab === "Mine" ? "No events yet" : "No events for this organization"}
            description={search ? "Try a different keyword" : tab === "Mine" ? "Create your first event to get started" : ""}
            action={tab === "Mine" && !search ? { label: "Create event", onClick: () => setShowModal(true) } : undefined}
          />
        ) : viewMode === "grid" ? (
          <div className="pb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((event) => (
              <div
                key={event.id}
                className="relative"
                onClick={selectMode ? () => toggleSelect(event.id) : undefined}
              >
                {/* Selection overlay */}
                {selectMode && (
                  <div
                    className={`w-[90%] mx-auto md:w-full absolute inset-0 z-10 rounded-2xl border-2 transition pointer-events-none ${selected.has(event.id)
                      ? "border-[#7877C6] bg-[#7877C6]/5"
                      : "border-transparent"
                      }`}
                  >
                    <div className="absolute top-2 right-2">
                      {selected.has(event.id) ? (
                        <div className="h-5 w-5 rounded-full bg-[#7877C6] flex items-center justify-center">
                          <X size={10} className="text-white" strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-white bg-black/20" />
                      )}
                    </div>
                  </div>
                )}
                <EventCard
                  event={event}
                  isMine={event.createdBy === currentUser?.uid}
                  canManage={!selectMode && canManage(event)}
                  viewMode="grid"
                  onCardClick={selectMode ? undefined : () => navigate(`/dashboard/events/${event.id}`)}
                  onEdit={selectMode ? undefined : setEditingEvent}
                  onDelete={selectMode ? undefined : setDeletingEvent}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col pb-5">
            {filtered.map((event) => (
              <div
                key={event.id}
                className="relative"
                onClick={selectMode ? () => toggleSelect(event.id) : undefined}
              >
                {/* Selection indicator for list */}
                {selectMode && (
                  <div className="absolute left-0 top-0 bottom-0 flex items-center pl-2 z-10">
                    {selected.has(event.id) ? (
                      <CheckSquare size={16} className="text-[#7877C6]" />
                    ) : (
                      <Square size={16} className="text-gray-300" />
                    )}
                  </div>
                )}
                <div className={selectMode ? "border-primary" : ""}>
                  <EventCard
                    event={event}
                    onCardClick={selectMode ? undefined : () => navigate(`/dashboard/events/${event.id}`)}
                    isMine={event.createdBy === currentUser?.uid}
                    canManage={!selectMode && canManage(event)}
                    viewMode="list"
                    onEdit={selectMode ? undefined : setEditingEvent}
                    onDelete={selectMode ? undefined : setDeletingEvent}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Floating bulk delete bar ── */}
      {selectMode && selected.size > 0 && (
        <div className="w-70 fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl">
          <span className="text-sm font-medium">
            {selected.size} event{selected.size > 1 ? "s" : ""} selected
          </span>
          <div className="h-4 w-px bg-white/20" />
          <button
            onClick={() => setConfirmBulk(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-red-400 hover:text-red-300 transition cursor-pointer"
          >
            <Trash2 size={14} />
            Delete
          </button>
          <button
            onClick={exitSelectMode}
            className="flex items-center text-gray-400 hover:text-white transition cursor-pointer p-0.5"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <CreateEventModal
          onClose={() => {
            setShowModal(false);
            setInitialDate("");
          }}
          onSubmit={async (form) => {
            await handleCreate(form);
            setInitialDate("");
          }}
          saving={saving}
          initialDate={initialDate}
        />
      )}

      {/* Edit modal */}
      {editingEvent && (
        <EditEventModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSaved={() => setEditingEvent(null)}
        />
      )}

      {/* Single delete confirm */}
      {deletingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setDeletingEvent(null)}
          />
          <div className="relative bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                Delete event?
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                <span className="font-medium text-gray-600">
                  {deletingEvent.name}
                </span>{" "}
                will be permanently deleted and cannot be recovered.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingEvent(null)}
                className="flex-1 rounded-[8px] border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingEvent)}
                className="flex-1 rounded-[8px] bg-red-500 py-2.5 text-sm font-medium text-white hover:bg-red-600 transition cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk delete confirm */}
      {confirmBulk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setConfirmBulk(false)}
          />
          <div className="relative bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                Delete {selected.size} event{selected.size > 1 ? "s" : ""}?
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                This action is permanent and cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmBulk(false)}
                disabled={bulkDeleting}
                className="flex-1 rounded-[8px] border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="flex-1 flex items-center justify-center gap-2 rounded-[8px] bg-red-500 py-2.5 text-sm font-medium text-white hover:bg-red-600 transition cursor-pointer disabled:opacity-60"
              >
                {bulkDeleting ? (
                  <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                {bulkDeleting ? "Deleting..." : "Delete all"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Events;