/**
 * Send notifications to organizations from the command line.
 *
 * Usage:
 *   npx ts-node scripts/sendNotifications.ts --org-id <orgId> --category <category> --from <from> --subject <subject> --preview <preview>
 *
 * Example:
 *   npx ts-node scripts/sendNotifications.ts --org-id "club-123" --category "announcement" --from "System" --subject "New Feature" --preview "Check-in is now available"
 *
 * Environment variables:
 *   FIREBASE_PROJECT_ID      - Firebase project ID
 *   FIREBASE_PRIVATE_KEY_ID  - Firebase private key ID
 *   FIREBASE_PRIVATE_KEY     - Firebase private key (use \n for newlines in .env)
 *   FIREBASE_CLIENT_EMAIL    - Firebase client email
 *   FIREBASE_CLIENT_ID       - Firebase client ID
 *   FIREBASE_AUTH_URI        - Firebase auth URI
 *   FIREBASE_TOKEN_URI       - Firebase token URI
 */

import admin from "firebase-admin";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

type NotifCategory = "subscription" | "update" | "announcement" | "sale";

interface SendNotificationOptions {
  orgId: string;
  category: NotifCategory;
  from: string;
  subject: string;
  preview: string;
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
 * Send notification to an organization
 */
async function sendNotification(
  db: admin.firestore.Firestore,
  options: SendNotificationOptions
): Promise<void> {
  const { orgId, category, from, subject, preview } = options;

  // Validate category
  const validCategories: NotifCategory[] = [
    "subscription",
    "update",
    "announcement",
    "sale",
  ];
  if (!validCategories.includes(category)) {
    throw new Error(
      `Invalid category. Must be one of: ${validCategories.join(", ")}`
    );
  }

  try {
    const docRef = await db
      .collection("organizations")
      .doc(orgId)
      .collection("notifications")
      .add({
        category,
        from,
        subject,
        preview,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    console.log(`✓ Notification sent successfully to org "${orgId}"`);
    console.log(`  Document ID: ${docRef.id}`);
    console.log(`  Category: ${category}`);
    console.log(`  From: ${from}`);
    console.log(`  Subject: ${subject}`);
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
}

/**
 * Validate required options
 */
function validateOptions(opts: Record<string, string>): SendNotificationOptions {
  const orgId = opts["org-id"] || opts["orgId"];
  const category = (opts.category || "announcement") as NotifCategory;
  const from = opts.from || "System";
  const subject = opts.subject;
  const preview = opts.preview;

  if (!orgId) throw new Error("Missing required option: --org-id");
  if (!subject) throw new Error("Missing required option: --subject");
  if (!preview) throw new Error("Missing required option: --preview");

  return { orgId, category, from, subject, preview };
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Send notifications to organizations

USAGE:
  npx ts-node scripts/sendNotifications.ts [OPTIONS]

OPTIONS:
  --org-id <ID>          Organization ID (required)
  --category <CATEGORY>  Notification category (default: "announcement")
                         Valid: subscription, update, announcement, sale
  --from <NAME>          Sender name (default: "System")
  --subject <TEXT>       Notification subject (required)
  --preview <TEXT>       Preview text (required)
  --help                 Show this help message

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
  npx ts-node scripts/sendNotifications.ts \\
    --org-id "club-123" \\
    --category "announcement" \\
    --from "System" \\
    --subject "Scheduled Maintenance" \\
    --preview "Platform will be down for 30 minutes on Sunday"

  npx ts-node scripts/sendNotifications.ts \\
    --org-id "club-456" \\
    --category "sale" \\
    --from "Marketplace" \\
    --subject "New templates available" \\
    --preview "Check out 5 new templates in the store"
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
    const options = validateOptions(opts);

    console.log("🔔 Initializing Firebase...");
    const db = initializeFirebase();

    console.log("📤 Sending notification...");
    await sendNotification(db, options);

    console.log("\n✨ Done!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
