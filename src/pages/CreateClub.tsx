import React, { useState } from "react";
import { ArrowRight, Astroid } from "lucide-react";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc, updateDoc, arrayUnion, collection } from "firebase/firestore";
import app from "../config/firebase";
import { useOutletContext } from "react-router-dom";
import { EMAIL_TEMPLATES } from "../lib/emails/templates";
import { useMailtrap } from "../hooks/useMailtrap";


export default function CreateClub() {
  const [clubName, setClubName] = useState("");
  // const [directorEmail, setDirectorEmail] = useState("");
  // const [directors, setDirectors] = useState<{ email: string; accepted: boolean }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { onOrgCreated } = useOutletContext<{ onOrgCreated: () => void }>();
  const { sendEmail } = useMailtrap();

  // const handleAddDirector = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!directorEmail || !directorEmail.includes("@")) return;
  //   if (!directors.find(d => d.email === directorEmail)) {
  //     setDirectors([...directors, { email: directorEmail, accepted: false }]);
  //   }
  //   setDirectorEmail("");
  // };

  // const handleRemoveDirector = (emailToRemove: string) => {
  //   setDirectors(directors.filter((d) => d.email !== emailToRemove));
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubName.trim()) {
      setError("Club name is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const auth = getAuth(app);
      const db = getFirestore(app);
      const user = auth.currentUser;

      if (!user || !user.email) throw new Error("Not authenticated or missing email");

      // Each director gets their own unique token — no shared org-level token
      // const directorsWithTokens = directors.map((dir) => ({
      //   ...dir,
      //   token: crypto.randomUUID(),
      // }));

      // 1. Create org — no invitationToken field on the org itself
      const newOrgRef = doc(collection(db, "organizations"));
      await setDoc(newOrgRef, {
        name: clubName,
        // invitedDirectors: directorsWithTokens,
        createdBy: user.uid,
        createdAt: new Date(),
        plan: "free"
      });

      // 2. Update user doc
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        organization: arrayUnion({ id: newOrgRef.id, role: "director" })
      });

      // Send welcome email to the creator
      try {
        await sendEmail(
          user.email,
          EMAIL_TEMPLATES.welcomeEmail.id,
          {
            email: user.email,
            company_name: clubName,
            base_url: window.location.origin,
          }
        );
      } catch (welcomeErr) {
        console.error("Failed to send welcome email to creator:", welcomeErr);
      }

      // 3. Send each director their own unique link
      // if (directorsWithTokens.length > 0) {
      //   const emailPromises = directorsWithTokens.map((dir) =>
      //     sendEmail(
      //       dir.email,
      //       EMAIL_TEMPLATES.userInvitation.id,
      //       {
      //         company_name: clubName,
      //         logo_url: import.meta.env.VITE_LOGO_URL ?? `${window.location.origin}/images/logo.png`,
      //         email: dir.email,
      //         base_url: window.location.origin,
      //         token: dir.token,
      //       }
      //     )
      //   );
      //   await Promise.all(emailPromises);
      // }

      onOrgCreated();

    } catch (err: any) {
      console.error("Error creating club:", err);
      setError(err.message || "Failed to create club. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col py-8 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-[#7877C6]">
          <Astroid size={38} strokeWidth={1.5} />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Create your Club
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Set up your organization to start managing events and members.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xs sm:rounded-2xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <div>
              <label htmlFor="clubName" className="block text-sm font-medium text-gray-700">
                Club Name
              </label>
              <div className="mt-2 relative">

                <input
                  id="clubName"
                  name="clubName"
                  type="text"
                  required
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  className="block w-full rounded-xl border-0 py-2.5 px-3 text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#7877C6] sm:text-sm sm:leading-6"
                  placeholder="e.g. Future Leaders Association"
                />
              </div>
            </div>

            {/* <div>
              <label htmlFor="directorEmail" className="block text-sm font-medium text-gray-700">
                Invite Directors (Optional)
              </label>
              <div className="mt-2 flex rounded-md shadow-xs gap-2">
                <div className="relative flex grow items-stretch focus-within:z-10">

                  <input
                    type="email"
                    name="directorEmail"
                    id="directorEmail"
                    value={directorEmail}
                    onChange={(e) => setDirectorEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddDirector(e);
                      }
                    }}
                    className="block w-full rounded-xl border-0 py-2.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#7877C6] sm:text-sm sm:leading-6"
                    placeholder="director@example.com"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddDirector}
                  className="relative inline-flex items-center gap-x-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10 cursor-pointer"
                >
                  <Plus className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </button>
              </div>
            </div> */}

            {/* {directors.length > 0 && (
              <ul role="list" className="mt-4 divide-y divide-gray-100 border-t border-b border-gray-100">
                {directors.map((dir) => (
                  <li key={dir.email} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-x-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      <span className="text-sm font-medium leading-6 text-gray-900">{dir.email}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDirector(dir.email)}
                      className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </li>
                ))}
              </ul>
            )} */}

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full justify-center items-center gap-2 rounded-xl bg-[#7877C6] px-3 py-3 text-sm font-semibold leading-6 text-white shadow-xs hover:bg-[#6b6ab3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7877C6] disabled:opacity-70 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {isSubmitting ? "Creating..." : "Create Club"}
                {!isSubmitting && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
