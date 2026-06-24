import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  getDocs,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import app from "../../config/firebase";
import appConfig from "../../config/app";
import { EMAIL_TEMPLATES } from "../emails/templates";
import { sendTemplatedEmail } from "../emails/sendEmail";

export async function ensureUserProfile(user: User): Promise<void> {
  if (!user.uid || !user.email) return;

  const db = getFirestore(app);
  const userRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(userRef);

  if (docSnap.exists()) return;

  const profileData = {
    uid: user.uid,
    name: user.displayName || "Anonymous User",
    email: user.email,
    photoURL: user.photoURL || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    role: "user",
  };

  await setDoc(userRef, profileData);

  try {
    await sendTemplatedEmail(user.email, EMAIL_TEMPLATES.welcomeEmail.id, {
      email: user.email,
      company_name: appConfig.name,
      base_url: window.location.origin,
    });
  } catch (err) {
    console.error("Welcome email failed:", err);
  }

  try {
    const orgsSnap = await getDocs(collection(db, "organizations"));
    const autoOrgs: { id: string; role: string }[] = [];

    for (const orgDoc of orgsSnap.docs) {
      const orgData = orgDoc.data();
      const invited = orgData.invitedDirectors || [];

      const hasInvite = invited.some(
        (inv: { email: string; accepted: boolean }) =>
          inv.email === user.email && inv.accepted === false
      );

      if (!hasInvite) continue;

      autoOrgs.push({ id: orgDoc.id, role: "director" });

      const updatedInvites = invited.map((inv: { email: string; accepted: boolean }) =>
        inv.email === user.email ? { ...inv, accepted: true } : inv
      );

      await updateDoc(doc(db, "organizations", orgDoc.id), {
        invitedDirectors: updatedInvites,
      });
    }

    if (autoOrgs.length > 0) {
      await updateDoc(userRef, { organization: autoOrgs });
    }
  } catch (inviteErr) {
    console.error("Invite auto-resolve error:", inviteErr);
  }
}
