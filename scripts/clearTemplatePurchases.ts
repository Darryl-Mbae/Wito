/**
 * Clear all template marketplace purchases for a user or all users
 * Removes all "template-purchase" transactions and resets seller earnings
 * Useful for resetting user to 0 sales and 0 revenue for testing
 *
 * Usage:
 *   npx ts-node scripts/clearTemplatePurchases.ts --user-id <userId>
 *   npx ts-node scripts/clearTemplatePurchases.ts --seller-id <sellerId>
 *   npx ts-node scripts/clearTemplatePurchases.ts --all
 *
 * Examples:
 *   npx ts-node scripts/clearTemplatePurchases.ts --user-id "user123"
 *   npx ts-node scripts/clearTemplatePurchases.ts --seller-id "seller456"
 *   npx ts-node scripts/clearTemplatePurchases.ts --all
 *
 * Environment variables (from .env):
 *   FIREBASE_SERVICE_ACCOUNT_PATH  - Path to your downloaded Firebase
 *                                    service account JSON file (relative
 *                                    paths are resolved from wherever you
 *                                    run the script from, i.e. process.cwd())
 */

import { initializeApp, cert, getApps, type App } from "firebase-admin/app";
import { getFirestore, FieldValue, type Firestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

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
 * Initialize Firebase Admin SDK using a service account JSON file
 */
function initializeFirebase(): Firestore {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (!serviceAccountPath) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_PATH is not set. Point it at your downloaded service account JSON file."
    );
  }

  const resolvedPath = path.resolve(serviceAccountPath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Service account file not found at: ${resolvedPath}`);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, "utf8"));

  let app: App;
  if (getApps().length === 0) {
    app = initializeApp({ credential: cert(serviceAccount) });
  } else {
    app = getApps()[0];
  }

  return getFirestore(app);
}

/**
 * Delete all template purchases for a specific user (buyer)
 */
async function deleteBuyerTemplatePurchases(
  db: Firestore,
  buyerId: string
): Promise<number> {
  const transactionsRef = db
    .collection("users")
    .doc(buyerId)
    .collection("transactions");

  const snapshot = await transactionsRef
    .where("type", "==", "template-purchase")
    .get();

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
 * Delete all template sales for a specific seller
 * Also resets seller credits/earnings
 */
async function deleteSellerTemplateSales(
  db: Firestore,
  sellerId: string
): Promise<{ salesDeleted: number; creditsReset: number }> {
  const transactionsRef = db
    .collection("users")
    .doc(sellerId)
    .collection("transactions");

  const snapshot = await transactionsRef.where("type", "==", "sale").get();

  let count = 0;
  let totalCreditsRemoved = 0;
  const batch = db.batch();

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    totalCreditsRemoved += data.amount || 0;
    batch.delete(doc.ref);
    count++;
  });

  if (count > 0) {
    await batch.commit();
  }

  const userDoc = await db.collection("users").doc(sellerId).get();

  if (userDoc.exists) {
    const userData = userDoc.data();
    const currentCredits = userData?.credits || 0;

    if (currentCredits > 0) {
      await db
        .collection("users")
        .doc(sellerId)
        .update({
          credits: FieldValue.increment(-totalCreditsRemoved),
        });
    }
  }

  return { salesDeleted: count, creditsReset: totalCreditsRemoved };
}

/**
 * Clear all template purchases from all users
 */
async function clearAllTemplatePurchases(
  db: Firestore
): Promise<{
  buyersAffected: number;
  purchasesDeleted: number;
  sellersAffected: number;
  salesDeleted: number;
  totalCreditsReset: number;
}> {
  let buyersAffected = 0;
  let purchasesDeleted = 0;
  let sellersAffected = 0;
  let salesDeleted = 0;
  let totalCreditsReset = 0;

  const usersSnapshot = await db.collection("users").get();

  // Clear purchases for each buyer
  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    const count = await deleteBuyerTemplatePurchases(db, userId);
    if (count > 0) {
      buyersAffected++;
      purchasesDeleted += count;
    }
  }

  // Clear sales and reset credits for each seller
  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    const result = await deleteSellerTemplateSales(db, userId);
    if (result.salesDeleted > 0) {
      sellersAffected++;
      salesDeleted += result.salesDeleted;
      totalCreditsReset += result.creditsReset;
    }
  }

  return {
    buyersAffected,
    purchasesDeleted,
    sellersAffected,
    salesDeleted,
    totalCreditsReset,
  };
}

/**
 * Display help
 */
function showHelp() {
  console.log(`
Clear all template marketplace purchases for testing

USAGE:
  npx ts-node scripts/clearTemplatePurchases.ts [--user-id <userId> | --seller-id <sellerId> | --all]

OPTIONS:
  --user-id <ID>  Clear purchases for a specific user (buyer)
  --seller-id <ID> Clear sales for a specific seller
  --all           Clear ALL template purchases from all users
  --help          Show this help message

WHAT GETS CLEARED:
  ✓ All "template-purchase" transactions (when buying templates)
  ✓ All "sale" transactions (seller side of template sales)
  ✓ Seller earnings/credits are reset based on sales removed
  ✓ User sales count goes to 0
  ✓ User revenue goes to 0

WHAT STAYS:
  ✓ Templates in marketplace
  ✓ Credit purchase transactions
  ✓ Other transaction types
  ✓ User account data

ENVIRONMENT VARIABLES:
  Set this in your .env file:
  - FIREBASE_SERVICE_ACCOUNT_PATH   (path to your downloaded service account JSON)

EXAMPLES:
  Clear purchases for one buyer:
    npx ts-node scripts/clearTemplatePurchases.ts --user-id "buyer123"

  Clear sales for one seller:
    npx ts-node scripts/clearTemplatePurchases.ts --seller-id "seller456"

  Clear ALL template purchases (careful!):
    npx ts-node scripts/clearTemplatePurchases.ts --all
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
    const userId = opts["user-id"];
    const sellerId = opts["seller-id"];
    const clearAll = args.includes("--all");

    if (!userId && !sellerId && !clearAll) {
      throw new Error(
        "Missing required option: use --user-id, --seller-id, or --all"
      );
    }

    console.log("🔔 Initializing Firebase...");
    const db = initializeFirebase();

    if (clearAll) {
      console.log("\n⚠️  CLEARING ALL TEMPLATE PURCHASES FROM ALL USERS\n");

      const result = await clearAllTemplatePurchases(db);

      console.log("✅ Summary:");
      console.log(`   Buyers affected: ${result.buyersAffected}`);
      console.log(`   Purchases deleted: ${result.purchasesDeleted}`);
      console.log(`   Sellers affected: ${result.sellersAffected}`);
      console.log(`   Sales deleted: ${result.salesDeleted}`);
      console.log(`   Total credits reset: ${result.totalCreditsReset} KES`);
    } else if (userId) {
      console.log(`\n🗑️  Clearing template purchases for buyer: ${userId}\n`);

      const count = await deleteBuyerTemplatePurchases(db, userId);

      console.log("✅ Summary:");
      console.log(`   Template purchases deleted: ${count}`);
    } else if (sellerId) {
      console.log(`\n🗑️  Clearing template sales for seller: ${sellerId}\n`);

      const result = await deleteSellerTemplateSales(db, sellerId);

      console.log("✅ Summary:");
      console.log(`   Template sales deleted: ${result.salesDeleted}`);
      console.log(`   Credits reset: ${result.creditsReset} KES`);
    }

    console.log("\n✨ Done!");
    process.exit(0);
  } catch (error) {
    console.error(
      "❌ Error:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

main();