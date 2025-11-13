/**
 * Asana Integration for Handoff Task Creation
 * 
 * Creates tasks in Asana when handoff requests are made.
 * Requires ASANA_ACCESS_TOKEN and ASANA_PROJECT_ID to be configured.
 */

import { HandoffRequest } from "../handoff";

export interface AsanaTaskOptions {
  projectId?: string;
  accessToken?: string;
  assignee?: string;
}

/**
 * Create a handoff task in Asana
 */
export async function createHandoffTaskInAsana(
  handoffRequest: any, // Extended with campaign/lead/call data
  options?: AsanaTaskOptions
): Promise<{ success: boolean; taskId?: string; error?: string }> {
  // Check if Asana is configured
  const accessToken = options?.accessToken || import.meta.env.VITE_ASANA_ACCESS_TOKEN;
  const projectId = options?.projectId || import.meta.env.VITE_ASANA_PROJECT_ID;

  if (!accessToken || !projectId) {
    console.warn("Asana not fully configured. Skipping Asana task creation.");
    return { success: false, error: "Asana credentials not configured" };
  }

  try {
    const taskData = formatAsanaTask(handoffRequest, projectId, options?.assignee);

    const response = await fetch("https://app.asana.com/api/1.0/tasks", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: taskData }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Asana API error:", errorData);
      return { success: false, error: `Asana API error: ${response.status}` };
    }

    const result = await response.json();
    console.log("Handoff task created in Asana:", result.data.gid);
    
    return { success: true, taskId: result.data.gid };
  } catch (error) {
    console.error("Error creating Asana task:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Format handoff request as Asana task
 */
function formatAsanaTask(handoff: any, projectId: string, assignee?: string) {
  const campaignName = handoff.campaign?.name || "Unknown Campaign";
  const leadName = handoff.lead?.name || "Unknown Lead";
  const leadContact = handoff.lead?.phone || handoff.lead?.email || "No contact info";
  const handoffUrl = `${window.location.origin}/agent/handoff/${handoff.id}`;

  const taskName = `Handoff – ${campaignName} – ${handoff.reason?.substring(0, 50) || "No reason"}`;
  
  const notes = `
🔔 **Handoff Request**

**Campaign:** ${campaignName}
**Lead:** ${leadName}
**Contact:** ${leadContact}
**Priority:** ${handoff.priority.toUpperCase()}

**Reason:**
${handoff.reason || "No reason provided"}

**Intent Summary:**
${handoff.lead?.intent_summary || "Unknown"}

**Call Status:** ${handoff.call?.status === "in_progress" ? "Live (can join now)" : "Ended (follow-up required)"}

**Action Required:**
${handoff.call?.status === "in_progress" ? "Join the live call" : "Follow up with the lead via phone/email"}

**Link:** ${handoffUrl}
`.trim();

  const task: any = {
    name: taskName,
    notes,
    projects: [projectId],
  };

  if (assignee) {
    task.assignee = assignee;
  }

  // Set due date based on priority
  if (handoff.priority === "urgent") {
    // Due in 1 hour
    const dueDate = new Date();
    dueDate.setHours(dueDate.getHours() + 1);
    task.due_at = dueDate.toISOString();
  } else if (handoff.priority === "high") {
    // Due in 4 hours
    const dueDate = new Date();
    dueDate.setHours(dueDate.getHours() + 4);
    task.due_at = dueDate.toISOString();
  }

  return task;
}

/**
 * Update Asana task when handoff status changes
 */
export async function updateAsanaTask(
  taskId: string,
  updates: {
    completed?: boolean;
    notes?: string;
  },
  options?: AsanaTaskOptions
): Promise<{ success: boolean; error?: string }> {
  const accessToken = options?.accessToken || import.meta.env.VITE_ASANA_ACCESS_TOKEN;

  if (!accessToken) {
    return { success: false, error: "Asana access token not configured" };
  }

  try {
    const response = await fetch(`https://app.asana.com/api/1.0/tasks/${taskId}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: updates }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Asana API error:", errorData);
      return { success: false, error: `Asana API error: ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating Asana task:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}
