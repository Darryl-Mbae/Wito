import React, { useState, useEffect } from "react";
import { User, Shield, CreditCard, AlertTriangle } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import type { DashboardContextType } from "../Dashboard";
import { getAuth, sendPasswordResetEmail,  } from "firebase/auth";
import { doc, getDoc, updateDoc,  } from "firebase/firestore";
import { db } from "../../config/firebase";

const sections = [
  { id: "profile", label: "Profile", icon: User, description: "Update your name and organization details." },
  { id: "security", label: "Security", icon: Shield, description: "Reset your password via email." },
  { id: "billing", label: "Billing", icon: CreditCard, description: "View your plan, invoices, and payment methods." },
  { id: "danger", label: "Danger Zone", icon: AlertTriangle, description: "Permanently delete your organization or account." },
];

const Settings: React.FC = () => {
  const auth = getAuth();
  const firebaseUser = auth.currentUser;
  const { activeOrg } = useOutletContext<DashboardContextType>();

  const [activeSection, setActiveSection] = useState("profile");
  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState("");

  const [confirmText, setConfirmText] = useState("");
  // const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    console.log(confirmText)
    console.log(deleteError)
  },[confirmText,deleteError])

  

  // const isOrgOwner = activeOrg && firebaseUser && activeOrg.createdBy === firebaseUser.uid;

  useEffect(() => {
    setConfirmText("");
    setDeleteError("");
  }, [activeSection]);

  // const handleDeleteOrganizationAndAccount = async () => {
  //   if (!firebaseUser || !activeOrg) return;
  //   setDeleting(true);
  //   setDeleteError("");
  //   try {
  //     // 1. Fetch and delete tasks
  //     const tasksQuery = query(collection(db, "tasks"), where("orgId", "==", activeOrg.id));
  //     const tasksSnap = await getDocs(tasksQuery);
  //     const taskDeletes = tasksSnap.docs.map((d) => deleteDoc(d.ref));

  //     // 2. Fetch and delete events
  //     const eventsQuery = query(collection(db, "events"), where("orgId", "==", activeOrg.id));
  //     const eventsSnap = await getDocs(eventsQuery);
  //     const eventDeletes = eventsSnap.docs.map((d) => deleteDoc(d.ref));

  //     // 3. Fetch and delete flyers
  //     const flyersQuery = query(collection(db, "flyers"), where("orgId", "==", activeOrg.id));
  //     const flyersSnap = await getDocs(flyersQuery);
  //     const flyerDeletes = flyersSnap.docs.map((d) => deleteDoc(d.ref));

  //     await Promise.all([...taskDeletes, ...eventDeletes, ...flyerDeletes]);

  //     // 4. Delete organization
  //     await deleteDoc(doc(db, "organizations", activeOrg.id));

  //     // 5. Delete user document from Firestore
  //     await deleteDoc(doc(db, "users", firebaseUser.uid));

  //     // 6. Delete user from auth
  //     await deleteUser(firebaseUser);

  //     window.location.href = "/";
  //   } catch (err: any) {
  //     console.error("Deletion error:", err);
  //     if (err.code === "auth/requires-recent-login") {
  //       setDeleteError("For security reasons, this sensitive operation requires a recent login. Please log out, log back in, and try again.");
  //     } else {
  //       setDeleteError(err.message || "Failed to complete deletion. Please try again.");
  //     }
  //   } finally {
  //     setDeleting(false);
  //   }
  // };

  // const handleDeleteOnlyAccount = async () => {
  //   if (!firebaseUser) return;
  //   setDeleting(true);
  //   setDeleteError("");
  //   try {
  //     // Find all organizations where this user is invited or a director, and remove them
  //     const userDocRef = doc(db, "users", firebaseUser.uid);
  //     const userSnap = await getDoc(userDocRef);
  //     if (userSnap.exists()) {
  //       const userData = userSnap.data();
  //       const userOrgs = userData.organization || [];
  //       for (const orgRef of userOrgs) {
  //         const orgDocRef = doc(db, "organizations", orgRef.id);
  //         const orgSnap = await getDoc(orgDocRef);
  //         if (orgSnap.exists()) {
  //           const orgData = orgSnap.data();
  //           const invited = orgData.invitedDirectors || [];
  //           const updatedInvited = invited.filter((inv: any) => inv.email !== firebaseUser.email);
  //           await updateDoc(orgDocRef, { invitedDirectors: updatedInvited });
  //         }
  //       }
  //     }

  //     // Delete user document from Firestore
  //     await deleteDoc(userDocRef);

  //     // Delete user from auth
  //     await deleteUser(firebaseUser);

  //     window.location.href = "/";
  //   } catch (err: any) {
  //     console.error("Deletion error:", err);
  //     if (err.code === "auth/requires-recent-login") {
  //       setDeleteError("For security reasons, this sensitive operation requires a recent login. Please log out, log back in, and try again.");
  //     } else {
  //       setDeleteError(err.message || "Failed to complete deletion. Please try again.");
  //     }
  //   } finally {
  //     setDeleting(false);
  //   }
  // };

  useEffect(() => {
    if (!firebaseUser) return;
    const fetchUser = async () => {
      const snap = await getDoc(doc(db, "users", firebaseUser.uid));
      if (snap.exists()) setName(snap.data().name ?? "");
    };
    fetchUser();
  }, [firebaseUser]);

  useEffect(() => {
    if (!activeOrg) return;
    const fetchOrg = async () => {
      const snap = await getDoc(doc(db, "organizations", activeOrg.id));
      if (snap.exists()) setOrgName(snap.data().name ?? "");
    };
    fetchOrg();
  }, [activeOrg]);

  const handleSaveAll = async () => {
    if (!firebaseUser) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", firebaseUser.uid), { name });
      if (activeOrg) {
        await updateDoc(doc(db, "organizations", activeOrg.id), { name: orgName });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      window.location.reload();
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!firebaseUser?.email) return;
    setResetError("");
    try {
      await sendPasswordResetEmail(auth, firebaseUser.email);
      setResetSent(true);
      setTimeout(() => setResetSent(false), 4000);
    } catch {
      setResetError("Failed to send reset email. Please try again.");
    }
  };

  const current = sections.find((s) => s.id === activeSection)!;
  const Icon = current.icon;

  const inputCls =
    "mt-1 w-full rounded-[8px] border border-gray-200 bg-white/70 px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-[#7877C6]/20 transition";
  const btnCls =
    "rounded-[8px] bg-[#7877C6] px-5 py-2 text-sm font-medium text-white hover:bg-[#7877C6]/90 transition cursor-pointer disabled:opacity-60";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account and preferences.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-4 border-b border-gray-100 shrink-0 w-fit" style={{ scrollbarWidth: "none" }}>
        {sections.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`pb-2.5 text-sm font-medium border-b-2 -mb-[1px] transition cursor-pointer whitespace-nowrap
              ${activeSection === id
                ? "border-[#7877C6] text-[#7877C6]"
                : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content panel */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
          <div className="h-9 w-9 rounded-xl bg-[#7877C6]/8 flex items-center justify-center">
            <Icon size={17} className="text-[#7877C6]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{current.label}</h3>
            <p className="text-xs text-gray-400">{current.description}</p>
          </div>
        </div>

        <div className="space-y-4 max-w-md">

          {/* Profile */}
          {activeSection === "profile" && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={firebaseUser?.email ?? ""}
                  disabled
                  className={`${inputCls} bg-gray-50 text-gray-400 cursor-not-allowed`}
                />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed here.</p>
              </div>

              {activeOrg && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Organization</p>
                  <label className="text-sm font-medium text-gray-700">Organization Name</label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Organization name"
                    className={inputCls}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Editing <span className="font-medium text-gray-500">{activeOrg.name}</span>
                  </p>
                </div>
              )}

              <button className={btnCls} disabled={saving} onClick={handleSaveAll}>
                {saved ? "Saved!" : saving ? "Saving…" : "Save Changes"}
              </button>
            </>
          )}

          {/* Security */}
          {activeSection === "security" && (
            <>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-sm text-gray-600">
                  We'll send a password reset link to{" "}
                  <span className="font-medium text-gray-800">{firebaseUser?.email}</span>.
                </p>
              </div>
              {resetError && <p className="text-xs text-red-500">{resetError}</p>}
              <button className={btnCls} onClick={handleResetPassword}>
                {resetSent ? "Reset email sent!" : "Send Password Reset Email"}
              </button>
            </>
          )}

          {/* Billing */}
          {activeSection === "billing" && (
            <div className="space-y-3">
              <div className="rounded-xl border border-[#7877C6]/20 bg-[#7877C6]/5 p-4">
                <p className="text-xs font-medium text-[#7877C6] uppercase tracking-wide mb-1">Current Plan</p>
                <p className="text-sm font-semibold text-gray-900">Free Tier</p>
                <p className="text-xs text-gray-400 mt-0.5">Upgrade to unlock all features.</p>
              </div>
              <button className={btnCls}>Upgrade Plan</button>
            </div>
          )}

          {/* Danger Zone */}
          {/* {activeSection === "danger" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-red-200 bg-red-50/50 p-5 space-y-4">
                <div className="flex gap-3">
                  <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="text-sm font-semibold text-red-900">
                      {isOrgOwner ? "Delete Organisation & Account" : "Delete Account"}
                    </h4>
                    <p className="text-xs text-red-700 mt-1 leading-relaxed">
                      {isOrgOwner
                        ? `As the owner of ${activeOrg?.name || "the active organisation"}, deleting this organisation will permanently delete all associated tasks, events, and designs. This will also permanently delete your user account. This action is irreversible.`
                        : "Deleting your account will remove your user profile and revoke your access/memberships to all organisations. This action is irreversible."}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-red-100 space-y-3">
                  <label className="block text-xs font-semibold text-red-900">
                    {isOrgOwner
                      ? `To confirm, please type your organisation name: "${activeOrg?.name}"`
                      : 'To confirm, please type "DELETE"'}
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    className="w-full rounded-[8px] border border-red-200 bg-white px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-red-500/20 transition text-red-900 placeholder:text-red-300"
                    placeholder={isOrgOwner ? activeOrg?.name : "DELETE"}
                  />
                </div>
              </div>

              {deleteError && (
                <div className="p-3 bg-red-100 border border-red-200 rounded-lg text-xs font-medium text-red-700">
                  {deleteError}
                </div>
              )}

              <button
                onClick={isOrgOwner ? handleDeleteOrganizationAndAccount : handleDeleteOnlyAccount}
                disabled={deleting || confirmText !== (isOrgOwner ? activeOrg?.name : "DELETE")}
                className="w-full rounded-[8px] bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-center"
              >
                {deleting ? "Deleting..." : isOrgOwner ? "Permanently Delete Organisation and Account" : "Permanently Delete Account"}
              </button>
            </div>
          )} */}

        </div>
      </div>
    </div>
  );
};

export default Settings;