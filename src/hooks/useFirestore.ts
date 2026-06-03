import { useState } from "react";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  collection,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import app from "../config/firebase";

type ProfileData = {
  email: string;
  name?: string;
  photoURL?: string | null;
};

export const useCreatUser = () => {
  const [dbError, setDbError] = useState<string | null>(null);
  const [isDbPending, setIsDbPending] = useState(false);

  const db = getFirestore(app);

  const createUserProfile = async (
    uid: string,
    profileData: ProfileData
  ) => {
    if (!uid) return;

    setIsDbPending(true);
    setDbError(null);

    const userRef = doc(db, "users", uid);

    try {
      const docSnap = await getDoc(userRef);

      if (!docSnap.exists()) {
        const payload = {
          uid,
          name: profileData.name || "Anonymous User",
          email: profileData.email,
          photoURL: profileData.photoURL || null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          role: "user",
        };

        await setDoc(userRef, payload);

        console.log("Firestore profile created.");

        // ----------------------------
        // AUTO-RESOLVE INVITES (FIXED)
        // ----------------------------

        try {
          const orgsSnap = await getDocs(
            collection(db, "organizations")
          );

          const autoOrgs: any[] = [];

          for (const orgDoc of orgsSnap.docs) {
            const orgData = orgDoc.data();

            const invited = orgData.invitedDirectors || [];

            const hasInvite = invited.some(
              (inv: any) =>
                inv.email === profileData.email && inv.accepted === false
            );

            if (!hasInvite) continue;

            autoOrgs.push({
              id: orgDoc.id,
              role: "director",
            });

            const updatedInvites = invited.map((inv: any) =>
              inv.email === profileData.email
                ? { ...inv, accepted: true }
                : inv
            );

            await updateDoc(doc(db, "organizations", orgDoc.id), {
              invitedDirectors: updatedInvites,
            });
          }

          if (autoOrgs.length > 0) {
            await updateDoc(userRef, {
              organization: autoOrgs,
            });

            console.log(
              `Auto-resolved ${autoOrgs.length} invites.`
            );
          }
        } catch (inviteErr) {
          console.error("Invite auto-resolve error:", inviteErr);
        }
      } else {
        console.log("User already exists.");
      }
    } catch (err: unknown) {
      console.error("Firestore error:", err);
      setDbError("Failed to sync user profile.");
    } finally {
      setIsDbPending(false);
    }
  };

  return { createUserProfile, dbError, isDbPending };
};