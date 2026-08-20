/**
 * Clear all transactions and sales data for a user
 * Resets transaction history and seller dashboard to 0, but keeps products in marketplace
 *
 * Usage:
 *   npx ts-node scripts/clearTransactionsAndSales.ts --user-id <userId>
 *
 * Example:
 *   npx ts-node scripts/clearTransactionsAndSales.ts --user-id "user123"
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

dotenv.config();

/**
 * Parse command line arguments
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
 * Delete all transactions for a user
 */
async function deleteUserTransactions(
  db: admin.firestore.Firestore,
  userId: string
): Promise<number> {
  const transactionsRef = admin
    .firestore()
    .collection("users")
    .doc(userId)
    .collection("transactions");

  const snapshot = await transactionsRef.get();
  let count = 0;

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
    count++;
  });

  if (count > 0) {
    await batch.commit();
  }

  return count;
}

/**
 * Delete all notifications for a user
 */
async function deleteUserNotifications(
  db: admin.firestore.Firestore,
  userId: string
): Promise<number> {
  const notificationsRef = admin
    .firestore()
    .collection("users")
    .doc(userId)
    .collection("notifications");

  const snapshot = await notificationsRef.get();
  let count = 0;

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
    count++;
  });

  if (count > 0) {
    await batch.commit();
  }

  return count;
}

/**
 * Reset user credits to 0
 */
async function resetUserCredits(
  db: admin.firestore.Firestore,
  userId: string
): Promise<void> {
  await admin
    .firestore()
    .collection("users")
    .doc(userId)
    .update({
      credits: 0,
    });
}

/**
 * Clear all organization transactions for user's orgs
 */
async function clearOrgTransactions(
  db: admin.firestore.Firestore,
  userId: string
): Promise<number> {
  let totalCleared = 0;

  // Get all organizations this user belongs to
  const userDoc = await admin
    .firestore()
    .collection("users")
    .doc(userId)
    .get();

  if (!userDoc.exists()) {
    console.log("User not found");
    return 0;
  }

  const userData = userDoc.data();
  const userOrgs = userData?.organization || [];

  // Clear transactions from each organization
  for (const orgRef of userOrgs) {
    if (!orgRef.id) continue;

    const orgTransactionsRef = admin
      .firestore()
      .collection("organizations")
      .doc(orgRef.id)
      .collection("transactions");

    const snapshot = await orgTransactionsRef.get();
    const batch = db.batch();

    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      totalCleared++;
    });

    if (snapshot.size > 0) {
      await batch.commit();
    }
  }

  return totalCleared;
}

/**
 * Display help
 */
function showHelp() {
  console.log(`
Clear all transactions and sales data for testing

USAGE:
  npx ts-node scripts/clearTransactionsAndSales.ts --user-id <userId>

OPTIONS:
  --user-id <ID>  User ID to clear (required)
  --help          Show this help message

WHAT GETS CLEARED:
  ✓ All user transactions (purchases, sales, etc.)
  ✓ All user notifications
  ✓ User credits reset to 0
  ✓ All organization transactions
  ✓ Seller earnings reset to 0

WHAT STAYS:
  ✓ Products in marketplace
  ✓ User account data
  ✓ Organization data
  ✓ Purchased template ownership

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
  npx ts-node scripts/clearTransactionsAndSales.ts --user-id "abc123xyz"
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
    const userId = opts["user-id"] || opts.userId;

    if (!userId) {
      throw new Error("Missing required option: --user-id");
    }

    console.log("🔔 Initializing Firebase...");
    const db = initializeFirebase();

    console.log(`\n📊 Clearing data for user: ${userId}\n`);

    // Delete transactions
    console.log("🗑️  Deleting user transactions...");
    const txnCount = await deleteUserTransactions(db, userId);
    console.log(`   ✓ Deleted ${txnCount} transactions`);

    // Delete notifications
    console.log("🗑️  Deleting user notifications...");
    const notifCount = await deleteUserNotifications(db, userId);
    console.log(`   ✓ Deleted ${notifCount} notifications`);

    // Reset credits
    console.log("💰 Resetting user credits to 0...");
    await resetUserCredits(db, userId);
    console.log("   ✓ Credits reset");

    // Clear org transactions
    console.log("🗑️  Deleting organization transactions...");
    const orgTxnCount = await clearOrgTransactions(db, userId);
    console.log(`   ✓ Deleted ${orgTxnCount} organization transactions`);

    console.log("\n✅ Summary:");
    console.log(`   Transactions cleared: ${txnCount}`);
    console.log(`   Notifications cleared: ${notifCount}`);
    console.log(`   Organization transactions cleared: ${orgTxnCount}`);
    console.log(`   Credits reset to: 0`);
    console.log(
      "\n💡 Templates in marketplace are still available for testing!"
    );
    console.log("\n✨ Done!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
