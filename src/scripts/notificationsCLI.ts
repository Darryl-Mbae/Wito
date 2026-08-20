/**
 * Notifications CLI Runner
 * 
 * This script can be run from your backend or as a separate Node process
 * to send notifications without exposing sensitive logic to the frontend
 * 
 * Usage:
 *   npx ts-node src/scripts/notificationsCLI.ts --type=all --template=announcement --title="Hello" --message="World"
 *   npx ts-node src/scripts/notificationsCLI.ts --type=seller --userId=USER_ID --template=templateSold --templateName="Flyer" --amount=500
 * 
 * Requires .env variables setup
 */

import { NotificationManager } from "./manageNotifications";
// import { NOTIFICATION_TEMPLATES, type NotificationCategory } from "./sendNotifications";

// Parse CLI arguments
const args = process.argv.slice(2);
const params: Record<string, string> = {};

args.forEach((arg) => {
  const [key, value] = arg.replace(/^--/, "").split("=");
  if (key && value) params[key] = value;
});

async function main() {
  const type = params.type as "all" | "single" | "batch" | "seller";
  const template = params.template as string;

  console.log("🔔 Wito Notification CLI");
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  try {
    if (!type) {
      throw new Error("--type required: all | single | batch | seller");
    }

    // === Template-based sends ===
    if (template === "announcement") {
      const title = params.title || "New Announcement";
      const message = params.message || "Check it out!";
      console.log(`📢 Sending announcement: "${title}"`);
      const result =
        type === "all"
          ? await NotificationManager.broadcastFeature(title, message)
          : await NotificationManager.announce(
              params.orgIds?.split(",") || [],
              title,
              message
            );
      console.log(result.message);
    }

    if (template === "templateSold") {
      const userId = params.userId;
      const templateName = params.templateName || "Template";
      const amount = parseInt(params.amount || "0", 10);
      if (!userId) throw new Error("--userId required for templateSold");
      console.log(
        `💰 Notifying seller ${userId} about sale of "${templateName}" for ${amount} KES`
      );
      const result = await NotificationManager.notifyTemplateSold(
        userId,
        templateName,
        amount
      );
      console.log(result.message);
    }

    if (template === "newFeature") {
      const featureName = params.featureName || "New Feature";
      const description = params.description || "Check it out!";
      console.log(`✨ Broadcasting feature: "${featureName}"`);
      const result = await NotificationManager.broadcastFeature(
        featureName,
        description
      );
      console.log(result.message);
    }

    if (template === "billing") {
      const orgId = params.orgId;
      const message = params.message || "Your billing needs attention";
      if (!orgId) throw new Error("--orgId required for billing");
      console.log(`⚠️  Sending billing alert to org ${orgId}`);
      const result = await NotificationManager.alertBilling(orgId, message);
      console.log(result.message);
    }

    if (template === "welcome") {
      const orgId = params.orgId;
      const orgName = params.orgName || "Your Organization";
      if (!orgId) throw new Error("--orgId required for welcome");
      console.log(`👋 Welcoming org ${orgId} to marketplace`);
      const result = await NotificationManager.welcomeToMarketplace(
        orgId,
        orgName
      );
      console.log(result.message);
    }

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log("✅ Done!");
  } catch (error) {
    console.error(
      "❌ Error:",
      error instanceof Error ? error.message : String(error)
    );
    console.log(`
Usage Examples:
  
  # Broadcast to all users
  npx ts-node src/scripts/notificationsCLI.ts --type=all --template=announcement --title="Maintenance" --message="We're upgrading..."

  # Notify seller about sale
  npx ts-node src/scripts/notificationsCLI.ts --type=seller --userId=seller123 --template=templateSold --templateName="Event Flyer" --amount=500

  # Send to specific orgs
  npx ts-node src/scripts/notificationsCLI.ts --type=batch --orgIds=org1,org2,org3 --template=announcement --title="Hello" --message="Testing"

  # Alert single org about billing
  npx ts-node src/scripts/notificationsCLI.ts --type=single --orgId=org123 --template=billing --message="Your credits are low"

  # Welcome new seller
  npx ts-node src/scripts/notificationsCLI.ts --type=single --orgId=org123 --template=welcome --orgName="My Event Co"
    `);
    process.exit(1);
  }
}

main();
