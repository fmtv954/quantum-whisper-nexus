/**
 * Handoff Trigger - Creates handoff requests from calls
 */

import { createHandoffRequest } from "../handoff";
import { sendHandoffNotificationToSlack } from "./slack";
import { createHandoffTaskInAsana } from "./asana";

export interface TriggerHandoffParams {
  accountId: string;
  campaignId: string;
  callId: string;
  leadId?: string;
  reason: string;
  priority?: "low" | "medium" | "high" | "urgent";
}

/**
 * Trigger a handoff from a call - creates request and sends notifications
 */
export async function triggerHandoffFromCall(params: TriggerHandoffParams): Promise<void> {
  try {
    // Create handoff request
    const handoff = await createHandoffRequest({
      accountId: params.accountId,
      campaignId: params.campaignId,
      callId: params.callId,
      leadId: params.leadId,
      reason: params.reason,
      priority: params.priority || "medium",
    });

    console.log("Handoff request created:", handoff.id);

    // Send Slack notification (non-blocking)
    sendHandoffNotificationToSlack(handoff).catch(error => {
      console.error("Failed to send Slack notification:", error);
    });

    // Create Asana task (non-blocking)
    createHandoffTaskInAsana(handoff).catch(error => {
      console.error("Failed to create Asana task:", error);
    });

  } catch (error) {
    console.error("Error triggering handoff:", error);
    throw error;
  }
}
