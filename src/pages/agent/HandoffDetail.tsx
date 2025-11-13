/**
 * Handoff Detail Page
 * 
 * Detailed view of a specific handoff request with actions for agents
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  AlertCircle,
  Loader2,
  Phone,
  User,
  Mail,
  MessageSquare,
  Clock,
  CheckCircle2,
} from "lucide-react";
import {
  getHandoffRequestById,
  claimHandoff,
  startHandoff,
  resolveHandoff,
  updateHandoffStatus,
  type HandoffRequest,
} from "@/lib/handoff";
import { getCurrentAccountId, getCurrentUserId } from "@/lib/data";
import { sendHandoffNotificationToSlack } from "@/lib/integrations/slack";
import { createHandoffTaskInAsana } from "@/lib/integrations/asana";

export default function HandoffDetail() {
  const { handoffId } = useParams<{ handoffId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [handoff, setHandoff] = useState<any | null>(null);
  const [notes, setNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadHandoff();
  }, [handoffId]);

  const loadHandoff = async () => {
    if (!handoffId) return;

    try {
      const accountId = await getCurrentAccountId();
      const data = await getHandoffRequestById(accountId, handoffId);

      if (!data) {
        toast({
          title: "Not Found",
          description: "Handoff request not found",
          variant: "destructive",
        });
        navigate("/agent/dashboard");
        return;
      }

      setHandoff(data);
      setNotes(data.notes || "");
    } catch (error) {
      console.error("Error loading handoff:", error);
      toast({
        title: "Error",
        description: "Failed to load handoff details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!handoff) return;

    setUpdating(true);
    try {
      const accountId = await getCurrentAccountId();
      const userId = await getCurrentUserId();
      
      await claimHandoff(accountId, handoff.id, userId);
      
      toast({
        title: "Handoff Claimed",
        description: "You have successfully claimed this handoff",
      });

      loadHandoff();
    } catch (error) {
      console.error("Error claiming handoff:", error);
      toast({
        title: "Error",
        description: "Failed to claim handoff",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleStartProgress = async () => {
    if (!handoff) return;

    setUpdating(true);
    try {
      const accountId = await getCurrentAccountId();
      await startHandoff(accountId, handoff.id);
      
      toast({
        title: "In Progress",
        description: "Handoff marked as in progress",
      });

      loadHandoff();
    } catch (error) {
      console.error("Error starting handoff:", error);
      toast({
        title: "Error",
        description: "Failed to update handoff",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleResolve = async () => {
    if (!handoff) return;

    setUpdating(true);
    try {
      const accountId = await getCurrentAccountId();
      await resolveHandoff(accountId, handoff.id, notes);
      
      toast({
        title: "Handoff Resolved",
        description: "Handoff has been marked as resolved",
      });

      navigate("/agent/dashboard");
    } catch (error) {
      console.error("Error resolving handoff:", error);
      toast({
        title: "Error",
        description: "Failed to resolve handoff",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!handoff) return;

    setUpdating(true);
    try {
      const accountId = await getCurrentAccountId();
      await updateHandoffStatus(accountId, handoff.id, { notes });
      
      toast({
        title: "Notes Saved",
        description: "Your notes have been saved",
      });

      loadHandoff();
    } catch (error) {
      console.error("Error saving notes:", error);
      toast({
        title: "Error",
        description: "Failed to save notes",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "destructive";
      case "high":
        return "default";
      default:
        return "secondary";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "outline";
      case "claimed":
        return "secondary";
      case "in_progress":
        return "default";
      case "resolved":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  if (!handoff) {
    return (
      <AppShell>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Handoff Not Found</h3>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/agent/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const isCallActive = handoff.call?.status === "in_progress";

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Handoff Request
            </h1>
            <p className="text-muted-foreground mt-2">
              {handoff.campaign?.name || "Unknown Campaign"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant={getPriorityColor(handoff.priority)} className="text-sm">
              {handoff.priority} Priority
            </Badge>
            <Badge variant={getStatusColor(handoff.status)} className="text-sm">
              {handoff.status}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Call Context */}
            <Card>
              <CardHeader>
                <CardTitle>Call Context</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Phone className="h-4 w-4" />
                    Call Status
                  </div>
                  <div className="flex items-center gap-2">
                    {isCallActive ? (
                      <>
                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-sm">Live Call</span>
                        <Button
                          asChild
                          size="sm"
                          className="ml-auto"
                        >
                          <Link to={`/call/${handoff.campaign_id}`}>
                            Join Live Call
                          </Link>
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="h-2 w-2 bg-gray-500 rounded-full" />
                        <span className="text-sm">Call Ended</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          Follow-up required
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm font-medium mb-2">
                    <MessageSquare className="h-4 w-4" />
                    Reason for Handoff
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {handoff.reason || "No reason provided"}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Clock className="h-4 w-4" />
                    Timeline
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Requested:</span>
                      <span>{new Date(handoff.created_at).toLocaleString()}</span>
                    </div>
                    {handoff.claimed_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Claimed:</span>
                        <span>{new Date(handoff.claimed_at).toLocaleString()}</span>
                      </div>
                    )}
                    {handoff.resolved_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Resolved:</span>
                        <span>{new Date(handoff.resolved_at).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lead Summary */}
            {handoff.lead && (
              <Card>
                <CardHeader>
                  <CardTitle>Lead Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium mb-2">
                        <User className="h-4 w-4" />
                        Name
                      </div>
                      <p className="text-sm">{handoff.lead.name || "Unknown"}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium mb-2">
                        <Mail className="h-4 w-4" />
                        Contact
                      </div>
                      <p className="text-sm">
                        {handoff.lead.email || handoff.lead.phone || "No contact info"}
                      </p>
                    </div>
                  </div>

                  {handoff.lead.intent_summary && (
                    <div>
                      <div className="text-sm font-medium mb-2">Intent Summary</div>
                      <p className="text-sm text-muted-foreground">
                        {handoff.lead.intent_summary}
                      </p>
                    </div>
                  )}

                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                  >
                    <Link to={`/leads/${handoff.lead.id}`}>
                      View Full Lead Profile
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-6">
            {/* Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {handoff.status === "pending" && (
                  <Button
                    onClick={handleClaim}
                    disabled={updating}
                    className="w-full"
                  >
                    {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Claim Handoff"}
                  </Button>
                )}

                {handoff.status === "claimed" && (
                  <Button
                    onClick={handleStartProgress}
                    disabled={updating}
                    className="w-full"
                  >
                    {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start Progress"}
                  </Button>
                )}

                {(handoff.status === "claimed" || handoff.status === "in_progress") && (
                  <Button
                    onClick={handleResolve}
                    disabled={updating}
                    className="w-full"
                    variant="default"
                  >
                    {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mark Resolved"}
                  </Button>
                )}

                {handoff.status === "resolved" && (
                  <div className="flex items-center justify-center gap-2 text-green-600 py-4">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Resolved</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes Card */}
            <Card>
              <CardHeader>
                <CardTitle>Internal Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this handoff..."
                  rows={6}
                  disabled={handoff.status === "resolved"}
                />
                <Button
                  onClick={handleSaveNotes}
                  disabled={updating || handoff.status === "resolved"}
                  variant="outline"
                  className="w-full"
                >
                  {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Notes"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
