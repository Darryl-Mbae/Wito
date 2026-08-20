/**
 * Notification Management Script
 * 
 * Usage:
 *   - Import and call functions directly in your admin panel/backend
 *   - Or use with a backend CLI runner
 * 
 * Requires .env variables:
 *   VITE_FIREBASE_PROJECT_ID
 *   VITE_FIREBASE_API_KEY (service account key JSON)
 */

import { getFirestore, collection, addDoc, Timestamp, query, where, getDocs } from "firebase/firestore";
import app from "../config/firebase";

export type NotificationCategory = "subscription" | "update" | "announcement" | "sale";

export interface NotificationPayload {
  category: NotificationCategory;
  from: string;
  subject: string;
  preview: string;
}

/**
 * Send a notification to a single organization
 */
export async function sendNotificationToOrg(
  orgId: string,
  payload: NotificationPayload
): Promise<void> {
  try {
    const db = getFirestore(app);
    await addDoc(collection(db, "organizations", orgId, "notifications"), {
      ...payload,
      read: false,
      createdAt: Timestamp.now(),
    });
    console.log(`✓ Notification sent to org ${orgId}`);
  } catch (error) {
    console.error(`✗ Failed to send notification to org ${orgId}:`, error);
    throw error;
  }
}

/**
 * Send a notification to multiple organizations
 */
export async function sendNotificationToOrgs(
  orgIds: string[],
  payload: NotificationPayload
): Promise<{ success: number; failed: number }> {
  const results = { success: 0, failed: 0 };

  for (const orgId of orgIds) {
    try {
      await sendNotificationToOrg(orgId, payload);
      results.success++;
    } catch {
      results.failed++;
    }
  }

  console.log(
    `Batch complete: ${results.success} succeeded, ${results.failed} failed`
  );
  return results;
}

/**
 * Send a notification to all organizations
 */
export async function sendNotificationToAll(
  payload: NotificationPayload
): Promise<{ success: number; failed: number }> {
  try {
    const db = getFirestore(app);
    const orgsSnap = await getDocs(collection(db, "organizations"));
    const orgIds = orgsSnap.docs.map((d) => d.id);

    console.log(`Sending to ${orgIds.length} organizations...`);
    return await sendNotificationToOrgs(orgIds, payload);
  } catch (error) {
    console.error("Failed to fetch organizations:", error);
    throw error;
  }
}

/**
 * Send a notification to users by a specific seller
 * (gets all orgs where userId matches)
 */
export async function sendNotificationToSeller(
  userId: string,
  payload: NotificationPayload
): Promise<{ success: number; failed: number }> {
  try {
    const db = getFirestore(app);
    const orgsSnap = await getDocs(
      query(collection(db, "organizations"), where("ownerId", "==", userId))
    );
    const orgIds = orgsSnap.docs.map((d) => d.id);

    console.log(`Sending to ${orgIds.length} organizations owned by ${userId}...`);
    return await sendNotificationToOrgs(orgIds, payload);
  } catch (error) {
    console.error(`Failed to send notifications to seller ${userId}:`, error);
    throw error;
  }
}

/**
 * Common notification templates
 */
export const NOTIFICATION_TEMPLATES = {
  welcomeToMarketplace: (orgName: string): NotificationPayload => ({
    category: "announcement",
    from: "Wito",
    subject: "Welcome to Wito Marketplace!",
    preview: `Your organization "${orgName}" has been added to the marketplace. Start selling templates today.`,
  }),

  templateSold: (templateName: string, amount: number): NotificationPayload => ({
    category: "sale",
    from: "Marketplace",
    subject: `${templateName} Sold!`,
    preview: `Your template "${templateName}" was purchased. You earned ${amount} KES.`,
  }),

  newFeature: (featureName: string, description: string): NotificationPayload => ({
    category: "update",
    from: "What's new",
    subject: `New Feature: ${featureName}`,
    preview: description,
  }),

  billingAlert: (message: string): NotificationPayload => ({
    category: "subscription",
    from: "Billing",
    subject: "Billing Update",
    preview: message,
  }),

  announcement: (title: string, message: string): NotificationPayload => ({
    category: "announcement",
    from: "Wito",
    subject: title,
    preview: message,
  }),
};
