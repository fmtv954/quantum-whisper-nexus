/**
 * Slack Integration for Handoff Notifications
 * 
 * Sends formatted handoff notifications to Slack channels or DMs.
 * Requires SLACK_WEBHOOK_URL or SLACK_BOT_TOKEN to be configured.
 */

import { HandoffRequest } from "../handoff";

export interface SlackNotificationOptions {
  channel?: string;
  webhookUrl?: string;
}

/**
 * Send handoff notification to Slack
 */
export async function sendHandoffNotificationToSlack(
  handoffRequest: any, // Extended with campaign/lead/call data
  options?: SlackNotificationOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Check if Slack is configured
  const webhookUrl = options?.webhookUrl || import.meta.env.VITE_SLACK_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn("Slack webhook URL not configured. Skipping Slack notification.");
    return { success: false, error: "Slack webhook URL not configured" };
  }

  try {
    // Format the message
    const message = formatHandoffMessage(handoffRequest);

    // Send to Slack
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Slack API error:", errorText);
      return { success: false, error: `Slack API error: ${response.status}` };
    }

    console.log("Handoff notification sent to Slack successfully");
    return { success: true };
  } catch (error) {
    console.error("Error sending Slack notification:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Format handoff request as Slack message block
 */
function formatHandoffMessage(handoff: any) {
  const priorityEmoji = {
    normal: "🔔",
    high: "⚠️",
    urgent: "🚨",
  };

  const emoji = priorityEmoji[handoff.priority as keyof typeof priorityEmoji] || "🔔";
  const campaignName = handoff.campaign?.name || "Unknown Campaign";
  const leadName = handoff.lead?.name || "Unknown Lead";
  const leadContact = handoff.lead?.phone || handoff.lead?.email || "No contact info";

  // Build the handoff URL
  const handoffUrl = `${window.location.origin}/agent/handoff/${handoff.id}`;
  const callStatus = handoff.call?.status === "in_progress" ? "🟢 Live" : "🔴 Ended";

  return {
    text: `${emoji} New Handoff Request – ${campaignName}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${emoji} New Handoff Request`,
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Campaign:*\n${campaignName}`,
          },
          {
            type: "mrkdwn",
            text: `*Priority:*\n${handoff.priority.toUpperCase()}`,
          },
          {
            type: "mrkdwn",
            text: `*Lead:*\n${leadName}`,
          },
          {
            type: "mrkdwn",
            text: `*Contact:*\n${leadContact}`,
          },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Reason:*\n${handoff.reason || "No reason provided"}`,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Call Status:*\n${callStatus}`,
          },
          {
            type: "mrkdwn",
            text: `*Intent:*\n${handoff.lead?.intent_summary || "Unknown"}`,
          },
        ],
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: handoff.call?.status === "in_progress" ? "Join Live Call" : "View Handoff",
              emoji: true,
            },
            style: handoff.call?.status === "in_progress" ? "primary" : "default",
            url: handoffUrl,
          },
        ],
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `Requested at: <!date^${Math.floor(new Date(handoff.requested_at).getTime() / 1000)}^{date_short_pretty} at {time}|${handoff.requested_at}>`,
          },
        ],
      },
    ],
  };
}

/**
 * Update Slack message (if message ID is stored)
 */
export async function updateSlackMessage(
  messageId: string,
  handoffRequest: any,
  options?: SlackNotificationOptions
): Promise<{ success: boolean; error?: string }> {
  // This requires Slack Bot Token and channel ID
  // For MVP, we'll skip this functionality
  console.log("Slack message update not yet implemented");
  return { success: false, error: "Not implemented" };
}
