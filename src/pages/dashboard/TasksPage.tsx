import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Plus, Trash2, CheckCircle2, Circle, Globe, Lock, Gem, Calendar } from "lucide-react";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import app from "../../config/firebase";
import { PremiumFeature } from "../../components/PremiumFeature";
import { type DashboardContextType } from "../Dashboard";
import { getAssigneeColor } from "../../utils/userColors";

type TaskStatus = "todo" | "done";

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  assignee: string;
  orgId: string;
  createdBy: string;
  createdAt: any;
  visibility?: "public" | "private";
  dueDate?: string;
}

const TasksPage: React.FC = () => {
  const { activeOrg } = useOutletContext<DashboardContextType>();
  const auth = getAuth(app);
  const currentUser = auth.currentUser;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskVisibility, setNewTaskVisibility] = useState<"public" | "private">("public");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [activeTab, setActiveTab] = useState<TaskStatus>("todo");
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false);
  const [directors, setDirectors] = useState<any[]>([]);

  useEffect(() => {
    if (!activeOrg) {
      setTasks([]);
      setLoading(false);
      setDirectors([]);
      return;
    }

    const db = getFirestore(app);
    const q = query(collection(db, "tasks"), where("orgId", "==", activeOrg.id));

    setLoading(true);
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task));
      data.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
        return timeB - timeA;
      });
      setTasks(data);
      setLoading(false);
    });

    const orgRef = doc(db, "organizations", activeOrg.id);
    const unsubOrg = onSnapshot(orgRef, async (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const { getDoc, collection, getDocs, query, where } = await import("firebase/firestore");

      const ownerRef = doc(db, "users", data.createdBy);
      const ownerSnap = await getDoc(ownerRef);
      let owner = { name: "Owner", email: "" };
      if (ownerSnap.exists()) {
        const u = ownerSnap.data();
        owner = { name: u.name || "Owner", email: u.email || "" };
      }

      const formattedDirectors: any[] = [{ email: owner.email, name: owner.name }];

      if (data.invitedDirectors && Array.isArray(data.invitedDirectors)) {
        const invitedEmails = data.invitedDirectors.map((i: any) => i.email);
        const emailToName: Record<string, string> = {};

        if (invitedEmails.length > 0) {
          const chunkSize = 30;
          for (let i = 0; i < invitedEmails.length; i += chunkSize) {
            const chunk = invitedEmails.slice(i, i + chunkSize);
            const usersRef = collection(db, "users");
            const qUsers = query(usersRef, where("email", "in", chunk));
            const usersSnap = await getDocs(qUsers);
            usersSnap.forEach((uDoc) => {
              const u = uDoc.data();
              if (u.email) emailToName[u.email] = u.name || u.displayName || u.email;
            });
          }
        }

        data.invitedDirectors.forEach((invite: any) => {
          formattedDirectors.push({
            email: invite.email,
            name: emailToName[invite.email] || invite.email,
          });
        });
      }

      setDirectors(formattedDirectors);
    });

    return () => {
      unsub();
      unsubOrg();
    };
  }, [activeOrg]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !activeOrg || !currentUser) return;

    try {
      const db = getFirestore(app);
      let finalAssignee = newTaskAssignee.trim();
      if (!finalAssignee) {
        finalAssignee = currentUser.displayName || currentUser.email?.split("@")[0] || "Me";
      }

      await addDoc(collection(db, "tasks"), {
        title: newTaskTitle.trim(),
        assignee: finalAssignee,
        status: "todo",
        orgId: activeOrg.id,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        visibility: newTaskVisibility,
        dueDate: newTaskDueDate || null,
      });
      setNewTaskTitle("");
      setNewTaskAssignee("");
      setNewTaskVisibility("public");
      setNewTaskDueDate("");
      setShowAssigneeDropdown(false);
      setShowVisibilityDropdown(false);
    } catch (err) {
      console.error("Error creating task:", err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const db = getFirestore(app);
      await deleteDoc(doc(db, "tasks", taskId));
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: TaskStatus) => {
    try {
      const db = getFirestore(app);
      const newStatus = currentStatus === "todo" ? "done" : "todo";
      await updateDoc(doc(db, "tasks", taskId), { status: newStatus });
    } catch (err) {
      console.error("Error toggling task:", err);
    }
  };

  if (!activeOrg) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <p className="text-gray-500 text-sm">Select an organization to view tasks.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin h-6 w-6 border-2 border-gray-200 border-t-[#7877C6] rounded-full" />
      </div>
    );
  }

  const todoTasks = tasks.filter((t) => t.status === "todo");
  const doneTasks = tasks.filter((t) => t.status === "done");
  const displayedTasks = activeTab === "todo" ? todoTasks : doneTasks;

  const formatDueDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(dateStr);
    taskDate.setHours(0, 0, 0, 0);

    const diffTime = taskDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined
    });
  };

  const isOverdue = (dateStr: string, status: TaskStatus) => {
    if (status === "done") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(dateStr);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() < today.getTime();
  };

  return (
    <div className="w-full lg:w-[70%] h-full flex flex-col pb-12 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Tasks</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-100 shrink-0">
        {(["todo", "done"] as TaskStatus[]).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex items-center gap-2 pb-2.5 text-sm font-medium border-b-2 -mb-[1px] transition cursor-pointer whitespace-nowrap ${activeTab === t
              ? "border-[#7877C6] text-[#7877C6]"
              : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
          >
            {t === "todo" ? "To Do" : "Completed"}
            <span
              className={`text-xs h-5 w-5 flex items-center justify-center rounded-full ${activeTab === t
                ? "bg-[#7877C6] text-white"
                : "bg-gray-100 text-gray-400"
                }`}
            >
              {t === "todo" ? todoTasks.length : doneTasks.length}
            </span>
          </button>
        ))}
      </div>

      {/* Add Task Form — stacked on mobile */}
      {activeTab === "todo" && (
        <form onSubmit={handleCreateTask} className="bg-white rounded-xl border border-gray-200 p-3 flex flex-col gap-3 hover:border-[#7877C6]/40 transition-all">
          {/* Title input — full width */}
          <div className="flex items-center gap-2">
            <Plus size={16} className="text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Add a new task..."
              className="flex-1 bg-transparent  font-medium text-gray-900 placeholder:text-gray-400 outline-none"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
            />
          </div>

          {/* Bottom row — assignee + visibility + submit */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Assignee */}
            <div className="relative">
              {newTaskAssignee ? (
                (() => {
                  const colors = getAssigneeColor(newTaskAssignee);
                  return (
                    <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100">
                      <div className={`h-4 w-4 rounded-full ${colors.bg} flex items-center justify-center shrink-0`}>
                        <span className={`text-[9px] font-bold ${colors.text}`}>
                          {newTaskAssignee.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-gray-600 max-w-[80px] truncate">{newTaskAssignee}</span>
                      <button
                        type="button"
                        onClick={() => setNewTaskAssignee("")}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  );
                })()
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowAssigneeDropdown((v) => !v);
                    setShowVisibilityDropdown(false);
                  }}
                  className="flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs font-medium text-gray-500 bg-gray-50 border border-gray-100 hover:bg-[#7877C6]/10 hover:text-[#7877C6] transition cursor-pointer"
                >
                  <span className="font-semibold">@</span> Assign
                </button>
              )}

              {showAssigneeDropdown && !newTaskAssignee && (
                <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-30 overflow-hidden">
                  <div className="p-2 border-b border-gray-50 bg-gray-50/50">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Assign to</p>
                  </div>
                  <div className="max-h-48 overflow-y-auto p-1">
                    {directors.map((director: any, idx: number) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setNewTaskAssignee(director.name || director.email.split("@")[0]);
                          setShowAssigneeDropdown(false);
                        }}
                        className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition"
                      >
                        {(() => {
                          const dirName = director.name || director.email;
                          const colors = getAssigneeColor(dirName);
                          return (
                            <div className={`h-5 w-5 rounded-full ${colors.bg} flex items-center justify-center shrink-0`}>
                              <span className={`text-[10px] font-bold ${colors.text}`}>
                                {dirName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          );
                        })()}
                        <span className="truncate">{director.name || director.email}</span>
                      </button>
                    ))}
                    {directors.length === 0 && (
                      <div className="px-3 py-4 text-center text-xs text-gray-400">No directors found</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Visibility toggle */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowVisibilityDropdown((v) => !v);
                  setShowAssigneeDropdown(false);
                }}
                className={`flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium border transition cursor-pointer ${newTaskVisibility === "private"
                  ? "bg-amber-50 border-amber-100 text-amber-600"
                  : "bg-gray-50 border-gray-100 text-gray-500 hover:bg-[#7877C6]/10 hover:text-[#7877C6]"
                  }`}
              >
                {newTaskVisibility === "private" ? (
                  <Lock size={12} />
                ) : (
                  <Globe size={12} />
                )}
                <span className="capitalize">{newTaskVisibility}</span>
              </button>

              {showVisibilityDropdown && (
                <div className="absolute left-0 top-full mt-1 w-32 bg-white border border-gray-100 rounded-xl shadow-lg z-30 overflow-hidden">
                  <div className="p-1">
                    <button
                      type="button"
                      onClick={() => { setNewTaskVisibility("public"); setShowVisibilityDropdown(false); }}
                      className={`w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition ${newTaskVisibility === "public" ? "bg-gray-50 text-gray-900" : "text-gray-500 hover:bg-gray-50"}`}
                    >
                      {/* <Globe size={12} className={newTaskVisibility === "public" ? "text-[#7877C6]" : "text-gray-400"} /> */}
                      Public
                    </button>

                    <PremiumFeature
                      isPremium={true}
                      description="Create private tasks, hide them from public listings, and keep your work confidential."
                      tooltipPosition="bottom"
                    >
                      <button
                        type="button"
                        onClick={() => { setNewTaskVisibility("private"); setShowVisibilityDropdown(false); }}
                        className={`w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition ${newTaskVisibility === "private" ? "bg-amber-50 text-amber-700" : "text-gray-500 hover:bg-gray-50"}`}
                      >

                        {/* <Lock size={12} className={newTaskVisibility === "private" ? "text-amber-500" : "text-gray-400"} /> */}
                        <Gem size={12} className="text-[#7877C6]" />
                        Private
                      </button>
                    </PremiumFeature>

                  </div>
                </div>
              )}
            </div>

            {/* Due Date Picker */}
            <div className="relative flex items-center">
              <Calendar size={12} className="absolute left-2.5 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                className="pl-8 pr-2.5 h-8 rounded-lg text-xs font-medium text-gray-500 bg-gray-50 border border-gray-100 hover:bg-[#7877C6]/10 hover:text-[#7877C6] transition outline-none cursor-pointer"
              />
            </div>

            {/* Spacer + Submit */}
            <button
              type="submit"
              disabled={!newTaskTitle.trim()}
              className="ml-auto h-8 px-4 rounded-xl bg-[#7877C6] text-white text-xs font-semibold hover:bg-[#6b6ab3] disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer shrink-0"
            >
              Add
            </button>
          </div>
        </form>
      )}

      {/* Task List */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        <div className="flex flex-col gap-2">
          {displayedTasks.length === 0 ? (
            <div className="bg-white  p-12 flex flex-col items-center justify-center text-center mt-4">
              <div className="h-12 w-12 rounded-2xl bg-[#7877C6]/8 flex items-center justify-center mb-3">
                {activeTab === "todo" ? (
                  <CheckCircle2 size={20} className="text-[#7877C6]" />
                ) : (
                  <Circle size={20} className="text-[#7877C6]" />
                )}
              </div>
              <p className="text-sm font-semibold text-gray-800 mb-1">
                {activeTab === "todo" ? "All caught up!" : "No completed tasks yet"}
              </p>
              <p className="text-xs text-gray-400 max-w-xs">
                {activeTab === "todo"
                  ? "You have no pending tasks. Enjoy your free time or add a new task above."
                  : "Tasks you complete will appear here for your records."}
              </p>
            </div>
          ) : (
            displayedTasks.map((task) => (
              <div
                key={task.id}
                className="group flex items-start gap-3 p-4 rounded-xl bg-white border border-gray-100 hover:border-[#7877C6]/30 transition"
              >
                {/* Toggle button */}
                <button
                  onClick={() => handleToggleTask(task.id, task.status)}
                  className={`mt-0.5 transition cursor-pointer shrink-0 ${task.status === "done"
                    ? "text-emerald-500 hover:text-gray-400"
                    : "text-gray-300 hover:text-[#7877C6]"
                    }`}
                >
                  {task.status === "done" ? (
                    <CheckCircle2 size={20} strokeWidth={2.5} />
                  ) : (
                    <Circle size={20} strokeWidth={2} />
                  )}
                </button>

                {/* Content — stacks vertically */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-1.5">
                    <p className={`text-sm font-medium break-words ${task.status === "done" ? "text-gray-400 line-through" : "text-gray-800"
                      }`}>
                      {task.title}
                    </p>
                    {task.visibility === "private" && (
                      <Lock size={11} className="text-amber-400 shrink-0 mt-1" />
                    )}
                  </div>

                  {/* Assignee & Due Date row */}
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {task.assignee && (() => {
                      return (
                        <div className={`inline-flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 ${task.status === "done" ? "opacity-50" : ""
                          }`}>
                          {/* <div className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${task.status === "done" ? "bg-gray-200" : colors.bg
                            }`}>
                            <span className={`text-[9px] font-bold ${task.status === "done" ? "text-gray-500" : colors.text
                              }`}>
                              {task.assignee.charAt(0).toUpperCase()}
                            </span>
                          </div> */}
                          <span className="text-xs font-medium text-gray-600">{task.assignee}</span>
                        </div>
                      );
                    })()}

                    {task.dueDate && (
                      <div className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 border ${task.status === "done"
                        ? "bg-gray-50 border-gray-100 text-gray-400 opacity-50"
                        : isOverdue(task.dueDate, task.status)
                          ? "bg-red-50 border-red-100 text-red-600 font-semibold"
                          : "bg-gray-50 border-gray-100 text-gray-500"
                        }`}>
                        <Calendar size={11} className={
                          task.status !== "done" && isOverdue(task.dueDate, task.status)
                            ? "text-red-500"
                            : "text-gray-400"
                        } />
                        <span className="text-xs font-medium">{formatDueDate(task.dueDate)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Delete — always visible on mobile, hover on desktop */}
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TasksPage;