/**
 * Manage notifications - list, clear, or export notifications for organizations.
 *
 * Usage:
 *   npx ts-node scripts/manageNotifications.ts --action <action> [OPTIONS]
 *
 * Actions:
 *   list      - List all notifications for an organization
 *   clear     - Delete all notifications for an organization
 *   export    - Export notifications to JSON file
 *
 * Environment variables:
 *   FIREBASE_PROJECT_ID      - Firebase project ID
 *   FIREBASE_PRIVATE_KEY_ID  - Firebase private key ID
 *   FIREBASE_PRIVATE_KEY     - Firebase private key
 *   FIREBASE_CLIENT_EMAIL    - Firebase client email
 *   FIREBASE_CLIENT_ID       - Firebase client ID
 *   FIREBASE_AUTH_URI        - Firebase auth URI
 *   FIREBASE_TOKEN_URI       - Firebase token URI
 */

import admin from "firebase-admin";
import * as dotenv from "dotenv";
import * as fs from "fs";

dotenv.config();

type Action = "list" | "clear" | "export";

interface NotificationRecord {
  id: string;
  category: string;
  from: string;
  subject: string;
  preview: string;
  read: boolean;
  createdAt: string;
}

/**
 * Parse command line arguments into key-value pairs
 */
function parseArgs(args: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      const value = args[i + 1];
      if (value && !value.startsWith("--")) {
        result[key] = value;
        i++;
      }
    }
  }
  return result;
}

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebase() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKeyId = process.env.FIREBASE_PRIVATE_KEY_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const clientId = process.env.FIREBASE_CLIENT_ID;
  const authUri = process.env.FIREBASE_AUTH_URI;
  const tokenUri = process.env.FIREBASE_TOKEN_URI;

  if (
    !projectId ||
    !privateKeyId ||
    !privateKey ||
    !clientEmail ||
    !clientId ||
    !authUri ||
    !tokenUri
  ) {
    throw new Error(
      "Missing required Firebase environment variables. Please check your .env file."
    );
  }

  const serviceAccount = {
    type: "service_account",
    project_id: projectId,
    private_key_id: privateKeyId,
    private_key: privateKey,
    client_email: clientEmail,
    client_id: clientId,
    auth_uri: authUri,
    token_uri: tokenUri,
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${clientEmail}`,
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });

  return admin.firestore();
}

/**
 * List all notifications for an organization
 */
async function listNotifications(
  db: admin.firestore.Firestore,
  orgId: string
): Promise<void> {
  const snap = await db
    .collection("organizations")
    .doc(orgId)
    .collection("notifications")
    .orderBy("createdAt", "desc")
    .get();

  if (snap.empty) {
    console.log("No notifications found for this organization.");
    return;
  }

  console.log(`\n📋 Notifications for organization "${orgId}" (${snap.size} total)\n`);

  snap.docs.forEach((doc, idx) => {
    const data = doc.data();
    const createdAt = data.createdAt?.toDate?.()?.toISOString?.() ?? data.time ?? "unknown";
    console.log(`[${idx + 1}] ${data.subject}`);
    console.log(`    ID: ${doc.id}`);
    console.log(`    From: ${data.from || "System"}`);
    console.log(`    Category: ${data.category || "announcement"}`);
    console.log(`    Status: ${data.read ? "✓ Read" : "○ Unread"}`);
    console.log(`    Created: ${createdAt}`);
    console.log(`    Preview: ${data.preview}`);
    console.log();
  });
}

/**
 * Clear all notifications for an organization
 */
async function clearNotifications(
  db: admin.firestore.Firestore,
  orgId: string
): Promise<void> {
  const batch = db.batch();
  const snap = await db
    .collection("organizations")
    .doc(orgId)
    .collection("notifications")
    .get();

  if (snap.empty) {
    console.log("No notifications to clear.");
    return;
  }

  snap.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`✓ Deleted ${snap.size} notification(s) from organization "${orgId}"`);
}

/**
 * Export notifications to JSON file
 */
async function exportNotifications(
  db: admin.firestore.Firestore,
  orgId: string,
  outputFile?: string
): Promise<void> {
  const snap = await db
    .collection("organizations")
    .doc(orgId)
    .collection("notifications")
    .orderBy("createdAt", "desc")
    .get();

  const notifications: NotificationRecord[] = snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      category: data.category || "announcement",
      from: data.from || "System",
      subject: data.subject || "",
      preview: data.preview || "",
      read: data.read ?? false,
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? data.time ?? "",
    };
  });

  const defaultOutput = `notifications-${orgId}-${new Date().toISOString().split("T")[0]}.json`;
  const file = outputFile || defaultOutput;

  fs.writeFileSync(
    file,
    JSON.stringify(
      {
        orgId,
        exportedAt: new Date().toISOString(),
        count: notifications.length,
        notifications,
      },
      null,
      2
    )
  );

  console.log(`✓ Exported ${notifications.length} notification(s) to ${file}`);
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Manage notifications for organizations

USAGE:
  npx ts-node scripts/manageNotifications.ts --action <action> [OPTIONS]

ACTIONS:
  list       List all notifications for an organization
  clear      Delete all notifications for an organization
  export     Export notifications to JSON file

OPTIONS:
  --org-id <ID>      Organization ID (required for all actions)
  --output <FILE>    Output file for export action (optional, default: notifications-<org-id>-<date>.json)
  --help             Show this help message

ENVIRONMENT VARIABLES:
  Set these in your .env file:
  - FIREBASE_PROJECT_ID
  - FIREBASE_PRIVATE_KEY_ID
  - FIREBASE_PRIVATE_KEY
  - FIREBASE_CLIENT_EMAIL
  - FIREBASE_CLIENT_ID
  - FIREBASE_AUTH_URI
  - FIREBASE_TOKEN_URI

EXAMPLES:
  # List all notifications for an organization
  npx ts-node scripts/manageNotifications.ts --action list --org-id "club-123"

  # Clear all notifications (with confirmation)
  npx ts-node scripts/manageNotifications.ts --action clear --org-id "club-123"

  # Export notifications to a JSON file
  npx ts-node scripts/manageNotifications.ts --action export --org-id "club-123"

  # Export to a specific file
  npx ts-node scripts/manageNotifications.ts --action export --org-id "club-123" --output backup.json
`);
}

/**
 * Confirm action (simple CLI prompt)
 */
async function confirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    process.stdout.write(`${message} (yes/no): `);
    process.stdin.once("data", (data) => {
      const answer = data.toString().trim().toLowerCase();
      resolve(answer === "yes" || answer === "y");
    });
  });
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help")) {
    showHelp();
    process.exit(0);
  }

  try {
    const opts = parseArgs(args);
    const action = (opts.action || "") as Action;
    const orgId = opts["org-id"] || opts.orgId;

    if (!action) {
      throw new Error("Missing required option: --action");
    }

    if (!["list", "clear", "export"].includes(action)) {
      throw new Error(
        `Invalid action "${action}". Must be one of: list, clear, export`
      );
    }

    if (!orgId) {
      throw new Error("Missing required option: --org-id");
    }

    console.log("🔔 Initializing Firebase...");
    const db = initializeFirebase();

    if (action === "list") {
      await listNotifications(db, orgId);
    } else if (action === "clear") {
      const ok = await confirm(
        `⚠️  This will delete ALL notifications for organization "${orgId}". Continue?`
      );
      if (!ok) {
        console.log("❌ Cancelled.");
        process.exit(0);
      }
      await clearNotifications(db, orgId);
    } else if (action === "export") {
      const outputFile = opts.output;
      await exportNotifications(db, orgId, outputFile);
    }

    console.log("\n✨ Done!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
