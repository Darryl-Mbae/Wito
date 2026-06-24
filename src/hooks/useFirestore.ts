import { useState } from "react";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import app from "../config/firebase";
import { ensureUserProfile } from "../lib/auth/ensureUserProfile";

// ─── Resolve a pending invite token for a user ───────────────────────────────
// Each invite entry has its own token. On accept: token is cleared (null),
// accepted flips to true, and the org is added to the user's profile.
export const resolveInviteToken = async (uid: string, token: string): Promise<boolean> => {
  const db = getFirestore(app);

  try {
    // Scan orgs to find the one with an invite entry containing this token.
    // Token is per-person so only one entry across all orgs will match.
    const orgsSnap = await getDocs(collection(db, "organizations"));

    let matchedOrgId: string | null = null;
    let matchedOrgData: any = null;
    let matchedInvite: any = null;

    for (const orgDoc of orgsSnap.docs) {
      const data = orgDoc.data();
      const invited: any[] = data.invitedDirectors || [];
      const invite = invited.find(
        (inv) => inv.token === token && !inv.accepted
      );
      if (invite) {
        matchedOrgId = orgDoc.id;
        matchedOrgData = data;
        matchedInvite = invite;
        break;
      }
    }

    if (!matchedOrgId || !matchedInvite) return false;

    // Get the user doc to verify they own the email the invite was sent to
    const userDoc = await getDoc(doc(db, "users", uid));
    if (!userDoc.exists()) return false;
    const userEmail = userDoc.data().email as string;

    if (matchedInvite.email !== userEmail) return false;

    // Mark accepted and nullify the token (single-use)
    const updatedInvites = (matchedOrgData.invitedDirectors as any[]).map((inv) =>
      inv.token === token
        ? { ...inv, accepted: true, token: null, acceptedAt: new Date() }
        : inv
    );

    await updateDoc(doc(db, "organizations", matchedOrgId), {
      invitedDirectors: updatedInvites,
    });

    // Add org to user's profile (guard against duplicates)
    const existingOrgs: any[] = userDoc.data().organization || [];
    const alreadyMember = existingOrgs.some((o) => o.id === matchedOrgId);
    if (!alreadyMember) {
      await updateDoc(doc(db, "users", uid), {
        organization: [...existingOrgs, { id: matchedOrgId, role: "director" }],
      });
    }

    return true;
  } catch (err) {
    console.error("resolveInviteToken error:", err);
    return false;
  }
};

export const useCreatUser = () => {
  const [dbError, setDbError] = useState<string | null>(null);
  const [isDbPending, setIsDbPending] = useState(false);

  const createUserProfile = async (user: User) => {
    if (!user.uid) return;

    setIsDbPending(true);
    setDbError(null);

    try {
      await ensureUserProfile(user);
    } catch (err: unknown) {
      console.error("Firestore error:", err);
      setDbError("Failed to sync user profile.");
    } finally {
      setIsDbPending(false);
    }
  };

  return { createUserProfile, dbError, isDbPending };
};