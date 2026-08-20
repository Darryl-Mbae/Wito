/**
 * Send batch notifications to multiple organizations from a JSON file.
 *
 * Usage:
 *   npx ts-node scripts/sendBatchNotifications.ts --file <path>
 *
 * JSON file format:
 *   {
 *     "notifications": [
 *       {
 *         "orgId": "org-1",
 *         "category": "announcement",
 *         "from": "System",
 *         "subject": "...",
 *         "preview": "..."
 *       }
 *     ]
 *   }
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
import * as path from "path";

dotenv.config();

type NotifCategory = "subscription" | "update" | "announcement" | "sale";

interface NotificationPayload {
  orgId: string;
  category: NotifCategory;
  from: string;
  subject: string;
  preview: string;
}

interface BatchFile {
  notifications: NotificationPayload[];
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
 * Load and parse batch file
 */
function loadBatchFile(filePath: string): BatchFile {
  try {
    const fullPath = path.resolve(filePath);
    const content = fs.readFileSync(fullPath, "utf-8");
    const data = JSON.parse(content) as BatchFile;

    if (!data.notifications || !Array.isArray(data.notifications)) {
      throw new Error("Invalid batch file format: missing 'notifications' array");
    }

    return data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in batch file: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Validate notification payload
 */
function validatePayload(payload: NotificationPayload, index: number): void {
  const validCategories: NotifCategory[] = [
    "subscription",
    "update",
    "announcement",
    "sale",
  ];

  if (!payload.orgId) {
    throw new Error(
      `Notification ${index}: missing required field 'orgId'`
    );
  }
  if (!payload.subject) {
    throw new Error(
      `Notification ${index}: missing required field 'subject'`
    );
  }
  if (!payload.preview) {
    throw new Error(
      `Notification ${index}: missing required field 'preview'`
    );
  }
  if (!validCategories.includes(payload.category || "announcement")) {
    throw new Error(
      `Notification ${index}: invalid category. Must be one of: ${validCategories.join(", ")}`
    );
  }
}

/**
 * Send a single notification
 */
async function sendNotification(
  db: admin.firestore.Firestore,
  payload: NotificationPayload
): Promise<string> {
  const { orgId, category, from, subject, preview } = payload;

  const docRef = await db
    .collection("organizations")
    .doc(orgId)
    .collection("notifications")
    .add({
      category: category || "announcement",
      from: from || "System",
      subject,
      preview,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

  return docRef.id;
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Send batch notifications to organizations

USAGE:
  npx ts-node scripts/sendBatchNotifications.ts --file <path>

OPTIONS:
  --file <PATH>  Path to JSON file with notifications (required)
  --help         Show this help message

BATCH FILE FORMAT (JSON):
  {
    "notifications": [
      {
        "orgId": "org-1",
        "category": "announcement",
        "from": "System",
        "subject": "...",
        "preview": "..."
      }
    ]
  }

REQUIRED FIELDS:
  - orgId
  - subject
  - preview

OPTIONAL FIELDS:
  - category (default: "announcement") - subscription, update, announcement, sale
  - from (default: "System")

ENVIRONMENT VARIABLES:
  Set these in your .env file:
  - FIREBASE_PROJECT_ID
  - FIREBASE_PRIVATE_KEY_ID
  - FIREBASE_PRIVATE_KEY
  - FIREBASE_CLIENT_EMAIL
  - FIREBASE_CLIENT_ID
  - FIREBASE_AUTH_URI
  - FIREBASE_TOKEN_URI

EXAMPLE:
  Create a file called notifications.json:
  {
    "notifications": [
      {
        "orgId": "club-123",
        "category": "announcement",
        "from": "System",
        "subject": "New Feature Available",
        "preview": "Event check-in is now available for all events"
      },
      {
        "orgId": "club-456",
        "category": "sale",
        "from": "Marketplace",
        "subject": "Limited Time Sale",
        "preview": "50% off all templates this weekend"
      }
    ]
  }

  Then run:
  npx ts-node scripts/sendBatchNotifications.ts --file notifications.json
`);
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
    const filePath = opts.file;

    if (!filePath) {
      throw new Error("Missing required option: --file");
    }

    console.log("📖 Loading batch file...");
    const batch = loadBatchFile(filePath);

    console.log(
      `Found ${batch.notifications.length} notification(s) to send`
    );

    // Validate all payloads first
    console.log("✓ Validating notifications...");
    batch.notifications.forEach((notif, idx) => {
      validatePayload(notif, idx + 1);
    });

    console.log("🔔 Initializing Firebase...");
    const db = initializeFirebase();

    console.log("📤 Sending notifications...\n");

    const results = [];
    for (let i = 0; i < batch.notifications.length; i++) {
      const notif = batch.notifications[i];
      try {
        const docId = await sendNotification(db, notif);
        console.log(
          `  [${i + 1}/${batch.notifications.length}] ✓ Sent to org "${notif.orgId}"`
        );
        console.log(`      Subject: ${notif.subject}`);
        results.push({ success: true, orgId: notif.orgId, docId });
      } catch (error) {
        console.log(
          `  [${i + 1}/${batch.notifications.length}] ✗ Failed for org "${notif.orgId}"`
        );
        console.log(`      Error: ${error instanceof Error ? error.message : error}`);
        results.push({
          success: false,
          orgId: notif.orgId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(`\n📊 Summary:`);
    console.log(`  ✓ Sent: ${successful}`);
    console.log(`  ✗ Failed: ${failed}`);

    if (failed === 0) {
      console.log("\n✨ All notifications sent successfully!");
      process.exit(0);
    } else {
      console.log("\n⚠️  Some notifications failed to send.");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
