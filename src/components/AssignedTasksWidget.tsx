import React, { useState, useEffect } from "react";
import { CheckCircle2, Circle, Lock, Calendar } from "lucide-react";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import app from "../config/firebase";

interface AssignedTask {
  id: string;
  title: string;
  status: "todo" | "done";
  visibility?: "public" | "private";
  dueDate?: string;
  createdBy: string;
  assigneeUid?: string;
  assignee: string;
}

interface AssignedTasksWidgetProps {
  orgId: string | null | undefined;
}

const AssignedTasksWidget: React.FC<AssignedTasksWidgetProps> = ({ orgId }) => {
  const auth = getAuth(app);
  const currentUser = auth.currentUser;
  const [tasks, setTasks] = useState<AssignedTask[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orgId || !currentUser) {
      setTasks([]);
      return;
    }

    const db = getFirestore(app);
    const q = query(collection(db, "tasks"), where("orgId", "==", orgId));

    setLoading(true);
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AssignedTask));

      // Filter to show only tasks assigned to current user
      const assignedTasks = data.filter((task) => {
        return task.assigneeUid === currentUser.uid && task.status === "todo";
      });

      assignedTasks.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });

      setTasks(assignedTasks);
      setLoading(false);
    });

    return () => unsub();
  }, [orgId, currentUser]);

  const formatDueDate = (dateStr: string | undefined) => {
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
    if (diffDays < 0) return `${Math.abs(diffDays)}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  };

  const isOverdue = (dateStr: string | undefined, status: "todo" | "done") => {
    if (status === "done" || !dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(dateStr);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() < today.getTime();
  };

  if (!orgId) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-center h-32">
        <div className="animate-spin h-4 w-4 border-2 border-gray-200 border-t-[#7877C6] rounded-full" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 text-center">
        <div className="h-10 w-10 rounded-lg bg-[#7877C6]/10 flex items-center justify-center mx-auto mb-2">
          <CheckCircle2 size={18} className="text-[#7877C6]" />
        </div>
        <p className="text-sm font-medium text-gray-700">No tasks assigned</p>
        <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-[#7877C6]/5 to-transparent">
        <h3 className="text-sm font-semibold text-gray-900">Assigned to You</h3>
        <p className="text-xs text-gray-400 mt-0.5">{tasks.length} pending task{tasks.length !== 1 ? "s" : ""}</p>
      </div>
      <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
        {tasks.map((task) => (
          <div key={task.id} className="p-3 hover:bg-gray-50 transition">
            <div className="flex items-start gap-2.5">
              <Circle size={16} className="text-gray-300 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-1.5">
                  <p className="text-sm font-medium text-gray-800 break-words">{task.title}</p>
                  {task.visibility === "private" && (
                    <Lock size={11} className="text-amber-400 shrink-0 mt-0.5" />
                  )}
                </div>
                {task.dueDate && (
                  <div
                    className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 border text-[11px] font-medium mt-2 ${
                      isOverdue(task.dueDate, task.status)
                        ? "bg-red-50 border-red-100 text-red-600"
                        : "bg-gray-50 border-gray-100 text-gray-500"
                    }`}
                  >
                    <Calendar
                      size={10}
                      className={isOverdue(task.dueDate, task.status) ? "text-red-500" : "text-gray-400"}
                    />
                    {formatDueDate(task.dueDate)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssignedTasksWidget;
