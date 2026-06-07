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
import { EMAIL_TEMPLATES } from "../lib/emails/templates";
import { useMailtrap } from "./useMailtrap";

type ProfileData = {
  email: string;
  name?: string;
  photoURL?: string | null;
};

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
  const { sendEmail } = useMailtrap();


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
        // Send WELCOME email after user creation
        try {
          await sendEmail(
            profileData.email,
            EMAIL_TEMPLATES.welcomeEmail.uuid,
            {
              email: profileData.email,
              company_name: "Your Platform Name", // or dynamic if you have it
            }
          );

          console.log("Welcome email sent to:", profileData.email);
        } catch (err) {
          console.error("Welcome email failed:", err);
        }

        // Auto-resolve any existing invites for this email
        try {
          const orgsSnap = await getDocs(collection(db, "organizations"));
          const autoOrgs: any[] = [];

          for (const orgDoc of orgsSnap.docs) {
            const orgData = orgDoc.data();
            const invited = orgData.invitedDirectors || [];

            const hasInvite = invited.some(
              (inv: any) =>
                inv.email === profileData.email && inv.accepted === false
            );

            if (!hasInvite) continue;

            autoOrgs.push({ id: orgDoc.id, role: "director" });

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
            await updateDoc(userRef, { organization: autoOrgs });
            console.log(`Auto-resolved ${autoOrgs.length} invites.`);
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