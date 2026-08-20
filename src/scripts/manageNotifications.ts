/**
 * Notification Manager
 * 
 * Utility for managing notifications from an admin panel or CLI
 * Add this to your admin dashboard or backend routes
 */

import {
  sendNotificationToOrg,
  sendNotificationToOrgs,
  sendNotificationToAll,
  sendNotificationToSeller,
  NOTIFICATION_TEMPLATES,
  type NotificationPayload,
} from "./sendNotifications";

export interface AdminNotificationRequest {
  type: "single" | "batch" | "all" | "seller";
  orgId?: string;
  orgIds?: string[];
  userId?: string;
  payload: NotificationPayload;
}

/**
 * Main entry point for admin notification management
 * Can be called from React component, backend API, or CLI
 */
export async function handleNotificationRequest(
  request: AdminNotificationRequest
): Promise<{ status: "success" | "error"; message: string; data?: any }> {
  try {
    switch (request.type) {
      case "single": {
        if (!request.orgId) {
          return { status: "error", message: "orgId required for single notification" };
        }
        await sendNotificationToOrg(request.orgId, request.payload);
        return { status: "success", message: `Sent to org ${request.orgId}` };
      }

      case "batch": {
        if (!request.orgIds || request.orgIds.length === 0) {
          return { status: "error", message: "orgIds array required for batch notification" };
        }
        const result = await sendNotificationToOrgs(request.orgIds, request.payload);
        return {
          status: "success",
          message: `Batch sent: ${result.success} succeeded, ${result.failed} failed`,
          data: result,
        };
      }

      case "all": {
        const result = await sendNotificationToAll(request.payload);
        return {
          status: "success",
          message: `Broadcast sent: ${result.success} succeeded, ${result.failed} failed`,
          data: result,
        };
      }

      case "seller": {
        if (!request.userId) {
          return { status: "error", message: "userId required for seller notification" };
        }
        const result = await sendNotificationToSeller(request.userId, request.payload);
        return {
          status: "success",
          message: `Seller notifications sent: ${result.success} succeeded, ${result.failed} failed`,
          data: result,
        };
      }

      default:
        return { status: "error", message: "Unknown notification type" };
    }
  } catch (error) {
    return {
      status: "error",
      message: `Failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Quick-send helpers for common scenarios
 */
export const NotificationManager = {
  /**
   * Notify a seller that their template was purchased
   */
  async notifyTemplateSold(
    sellerUserId: string,
    templateName: string,
    amount: number
  ) {
    return handleNotificationRequest({
      type: "seller",
      userId: sellerUserId,
      payload: NOTIFICATION_TEMPLATES.templateSold(templateName, amount),
    });
  },

  /**
   * Broadcast a new feature to all users
   */
  async broadcastFeature(featureName: string, description: string) {
    return handleNotificationRequest({
      type: "all",
      payload: NOTIFICATION_TEMPLATES.newFeature(featureName, description),
    });
  },

  /**
   * Send announcement to specific organizations
   */
  async announce(orgIds: string[], title: string, message: string) {
    return handleNotificationRequest({
      type: "batch",
      orgIds,
      payload: NOTIFICATION_TEMPLATES.announcement(title, message),
    });
  },

  /**
   * Send billing alert to specific org
   */
  async alertBilling(orgId: string, message: string) {
    return handleNotificationRequest({
      type: "single",
      orgId,
      payload: NOTIFICATION_TEMPLATES.billingAlert(message),
    });
  },

  /**
   * Welcome a new seller to marketplace
   */
  async welcomeToMarketplace(orgId: string, orgName: string) {
    return handleNotificationRequest({
      type: "single",
      orgId,
      payload: NOTIFICATION_TEMPLATES.welcomeToMarketplace(orgName),
    });
  },

  /**
   * Send custom notification
   */
  async sendCustom(request: AdminNotificationRequest) {
    return handleNotificationRequest(request);
  },
};
