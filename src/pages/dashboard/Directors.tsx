import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Users, Plus, Trash2 } from "lucide-react";
import {
  getFirestore,
  doc,
  onSnapshot,
  updateDoc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import app from "../../config/firebase";
import { type DashboardContextType } from "../Dashboard";

const Directors: React.FC = () => {
  const { activeOrg } = useOutletContext<DashboardContextType>();

  const [loading, setLoading] = useState(true);
  const [directors, setDirectors] = useState<any[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [orgData, setOrgData] = useState<any>(null);
  const [isInvitedMember, setIsInvitedMember] = useState(false);

  useEffect(() => {
    if (!activeOrg) {
      setDirectors([]);
      setLoading(false);
      return;
    }

    const db = getFirestore(app);
    const auth = getAuth(app);
    const currentUser = auth.currentUser;
    const orgRef = doc(db, "organizations", activeOrg.id);

    const unsubscribe = onSnapshot(orgRef, async (snap) => {
      if (!snap.exists()) return;
      setLoading(true);

      const data = snap.data();
      setOrgData(data);

      const currentEmail = currentUser?.email || "";
      const isOwner = data.createdBy === currentUser?.uid;
      const invitedEntry = (data.invitedDirectors || []).find(
        (d: any) => d.email === currentEmail
      );
      setIsInvitedMember(!isOwner && !!invitedEntry);

      // Fetch owner details
      const ownerRef = doc(db, "users", data.createdBy);
      const ownerSnap = await getDoc(ownerRef);
      let owner = { name: "Owner", email: "" };
      if (ownerSnap.exists()) {
        const u = ownerSnap.data();
        owner = { name: u.name || "Owner", email: u.email || "" };
      }

      const formattedDirectors: any[] = [
        {
          id: data.createdBy,
          name: owner.name,
          email: owner.email,
          role: "Owner",
          status: "Active",
          isOwner: true,
        },
      ];

      if (data.invitedDirectors && Array.isArray(data.invitedDirectors)) {
        const invitedEmails: string[] = data.invitedDirectors.map(
          (invite: any) => invite.email
        );

        const emailToName: Record<string, string> = {};
        if (invitedEmails.length > 0) {
          const chunkSize = 30;
          for (let i = 0; i < invitedEmails.length; i += chunkSize) {
            const chunk = invitedEmails.slice(i, i + chunkSize);
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("email", "in", chunk));
            const usersSnap = await getDocs(q);
            usersSnap.forEach((userDoc) => {
              const u = userDoc.data();
              if (u.email) {
                emailToName[u.email] = u.name || u.displayName || u.email;
              }
            });
          }
        }

        data.invitedDirectors.forEach((invite: any, index: number) => {
          const resolvedName =
            emailToName[invite.email] ||
            (invite.accepted ? invite.email : "Invited User");

          formattedDirectors.push({
            id: `invite-${index}`,
            name: resolvedName,
            email: invite.email,
            role: "Director",
            status: invite.accepted ? "Active" : "Pending",
            isOwner: false,
          });
        });
      }

      setDirectors(formattedDirectors);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeOrg]);

  const handleAddDirector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes("@") || !activeOrg) return;

    const db = getFirestore(app);
    const orgRef = doc(db, "organizations", activeOrg.id);

    const exists = orgData?.invitedDirectors?.find(
      (d: any) => d.email === newEmail
    );
    if (exists) {
      setNewEmail("");
      return;
    }

    try {
      await updateDoc(orgRef, {
        invitedDirectors: [...(orgData?.invitedDirectors || []), { email: newEmail, accepted: false }],
      });
      setNewEmail("");
    } catch (err) {
      console.error("Error adding director", err);
    }
  };

  const handleRemoveDirector = async (emailToRemove: string) => {
    if (!activeOrg) return;
    const db = getFirestore(app);
    const orgRef = doc(db, "organizations", activeOrg.id);

    try {
      await updateDoc(orgRef, {
        invitedDirectors: (orgData?.invitedDirectors || []).filter(
          (d: any) => d.email !== emailToRemove
        ),
      });
    } catch (err) {
      console.error("Error removing director", err);
    }
  };

  if (!activeOrg) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <p className="text-gray-500">
          Please select an organization to view its directors.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin h-6 w-6 border-2 border-gray-300 border-t-[#7877C6] rounded-full mx-auto" />
          <p className="text-gray-500 text-sm">Loading directors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Directors</h1>
        <p className="text-sm text-gray-500 mt-1">Manage who has access to this organization.</p>
      </div>

      {/* Invite form — hidden for invited members */}
      {!isInvitedMember && (
        <div className="w-full lg:w-[50%] rounded-2xl bg-white py-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Invite New Director
          </h3>
          <form onSubmit={handleAddDirector} className="flex gap-3">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="director@example.com"
              className="flex-1 rounded-xl border-0 py-2.5 pl-3 pr-3 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#7877C6] sm:text-sm sm:leading-6"
            />
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-[#7877C6] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#7877C6]/90 transition cursor-pointer"
            >
              <Plus size={16} />
              <span className="hidden md:block">Send Invite</span>
            </button>
          </form>
        </div>
      )}

      {/* Directors Table */}
      <div className="md:w-[90%] lg:w-[75%] rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {directors.map((director) => (
                <tr key={director.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-4">
                    <div className="h-8 w-8 rounded-full bg-[#7877C6]/10 flex items-center justify-center shrink-0">
                      <span className="text-[#7877C6] font-medium text-xs">
                        {director.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 whitespace-nowrap">{director.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-500">{director.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`h-1.5 w-1.5 rounded-full ${director.status === "Active" ? "bg-emerald-500" : "bg-amber-500"}`} />
                      <span className="text-sm text-gray-700 font-medium">{director.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {!director.isOwner && !isInvitedMember && (
                      <button
                        onClick={() => handleRemoveDirector(director.email)}
                        className="text-gray-400 hover:text-red-500 transition p-1 cursor-pointer"
                        title="Remove Director"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {directors.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    <Users className="mx-auto h-8 w-8 text-gray-200 mb-2" />
                    <p className="text-sm font-medium text-gray-500">No directors found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Directors;