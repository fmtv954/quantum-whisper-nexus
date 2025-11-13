/**
 * Lead detail page - View and manage a single lead
 */

import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  getLeadById, 
  updateLeadStatusAndNotes, 
  getStatusInfo, 
  LEAD_STATUSES,
  type LeadWithCampaign 
} from "@/lib/leads";
import { ArrowLeft, Mail, Phone, Calendar, Clock, User, MessageSquare } from "lucide-react";
import { formatRelativeTime, formatDuration } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [lead, setLead] = useState<LeadWithCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"new" | "qualified" | "unqualified" | "contacted" | "converted">("new");

  useEffect(() => {
    async function loadLead() {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await getLeadById(id);
        
        if (!data) {
          toast({
            title: "Lead not found",
            description: "This lead doesn't exist or you don't have access to it.",
            variant: "destructive",
          });
          navigate("/leads");
          return;
        }
        
        setLead(data);
        setNotes(data.notes || "");
        setStatus(data.status as "new" | "qualified" | "unqualified" | "contacted" | "converted");
      } catch (error) {
        console.error("Failed to load lead:", error);
        toast({
          title: "Error loading lead",
          description: "There was a problem loading this lead. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    loadLead();
  }, [id, navigate, toast]);

  async function handleSave() {
    if (!id) return;
    
    try {
      setSaving(true);
      await updateLeadStatusAndNotes(id, { status, notes });
      
      toast({
        title: "Lead updated",
        description: "Changes saved successfully.",
      });
      
      // Refresh lead data
      const updatedLead = await getLeadById(id);
      if (updatedLead) {
        setLead(updatedLead);
      }
    } catch (error) {
      console.error("Failed to update lead:", error);
      toast({
        title: "Error saving changes",
        description: "There was a problem updating this lead. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Loading lead details...</div>
        </div>
      </AppShell>
    );
  }

  if (!lead) {
    return null;
  }

  const statusInfo = getStatusInfo(lead.status);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/leads">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Leads
            </Link>
          </Button>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {lead.name || "Unnamed Lead"}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant="outline">{statusInfo.label}</Badge>
              {lead.score !== null && (
                <Badge variant={lead.score >= 70 ? "default" : "secondary"}>
                  Score: {lead.score}
                </Badge>
              )}
              <span className="text-sm text-muted-foreground">
                Created {formatRelativeTime(lead.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Lead Details */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="summary" className="w-full">
              <TabsList>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="contact">Contact & Metadata</TabsTrigger>
                <TabsTrigger value="call">Call Context</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Intent Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {lead.intent_summary ? (
                      <p className="text-sm">{lead.intent_summary}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        No intent summary available
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="contact" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {lead.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{lead.email}</span>
                      </div>
                    )}
                    {lead.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{lead.phone}</span>
                      </div>
                    )}
                    {!lead.email && !lead.phone && (
                      <p className="text-sm text-muted-foreground italic">
                        No contact information captured
                      </p>
                    )}
                    {lead.consent_ticket_id && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          Consent ID: {lead.consent_ticket_id}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Campaign Source</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {lead.campaign ? (
                      <Link 
                        to={`/campaigns/${lead.campaign.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {lead.campaign.name}
                      </Link>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        No campaign associated
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="call" className="space-y-4">
                {lead.call_session ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Call Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {new Date(lead.call_session.started_at).toLocaleString()}
                        </span>
                      </div>
                      {lead.call_session.duration_ms && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            Duration: {formatDuration(lead.call_session.duration_ms)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline">{lead.call_session.status}</Badge>
                      </div>
                      {/* TODO: Add transcript preview or link to full call details */}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-8">
                      <p className="text-sm text-muted-foreground text-center">
                        No call session associated with this lead
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Status & Notes */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Manage Lead
                </CardTitle>
                <CardDescription>Update status and add internal notes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={status} 
                    onValueChange={(value) => setStatus(value as "new" | "qualified" | "unqualified" | "contacted" | "converted")}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Internal Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this lead..."
                    rows={6}
                  />
                </div>

                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
