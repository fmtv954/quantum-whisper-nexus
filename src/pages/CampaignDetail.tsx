/**
 * Campaign detail hub - view and manage a single campaign
 */

import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Edit2, Save, X, Workflow, Upload, Users, TrendingUp, Phone } from "lucide-react";
import { getCurrentAccountId } from "@/lib/data";
import { getCampaignById, updateCampaign, updateCampaignStatus, getRecentCallsForCampaign, type Campaign } from "@/lib/campaigns";
import { formatRelativeTime, formatDuration } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [recentCalls, setRecentCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (id) {
      loadCampaign();
      loadRecentCalls();
    }
  }, [id]);

  async function loadCampaign() {
    if (!id) return;

    const accountId = await getCurrentAccountId();
    if (!accountId) {
      navigate("/login");
      return;
    }

    const data = await getCampaignById(accountId, id);
    if (!data) {
      toast({
        title: "Campaign not found",
        description: "This campaign does not exist or you don't have access to it.",
        variant: "destructive",
      });
      navigate("/campaigns");
      return;
    }

    setCampaign(data);
    setEditData({
      name: data.name,
      description: data.description || "",
    });
    setLoading(false);
  }

  async function loadRecentCalls() {
    if (!id) return;
    const calls = await getRecentCallsForCampaign(id, 10);
    setRecentCalls(calls);
  }

  async function handleSaveEdit() {
    if (!id || !campaign) return;

    const accountId = await getCurrentAccountId();
    if (!accountId) return;

    const updated = await updateCampaign(accountId, id, editData);
    if (updated) {
      setCampaign(updated);
      setEditing(false);
      toast({
        title: "Campaign updated",
        description: "Your changes have been saved.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update campaign.",
        variant: "destructive",
      });
    }
  }

  async function handleActivateCampaign() {
    if (!id || !campaign) return;

    const accountId = await getCurrentAccountId();
    if (!accountId) return;

    const updated = await updateCampaignStatus(accountId, id, 'active');
    if (updated) {
      setCampaign(updated);
      toast({
        title: "Campaign activated",
        description: "Your campaign is now live and ready for calls.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to activate campaign.",
        variant: "destructive",
      });
    }
  }

  function getStatusVariant(status: string): "default" | "secondary" | "outline" {
    switch (status) {
      case 'active':
        return 'default';
      case 'draft':
        return 'secondary';
      case 'paused':
        return 'outline';
      default:
        return 'secondary';
    }
  }

  function getCallStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'in_progress':
        return 'text-blue-600';
      default:
        return 'text-muted-foreground';
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Loading campaign...</div>
        </div>
      </AppShell>
    );
  }

  if (!campaign) {
    return null;
  }

  const goal = campaign.metadata?.goal as string | undefined;

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/campaigns">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Campaigns
            </Link>
          </Button>

          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              {editing ? (
                <div className="space-y-3 max-w-2xl">
                  <div>
                    <Label htmlFor="edit-name">Campaign Name</Label>
                    <Input
                      id="edit-name"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={editData.description}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      rows={2}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveEdit}>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => {
                      setEditing(false);
                      setEditData({
                        name: campaign.name,
                        description: campaign.description || "",
                      });
                    }}>
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold tracking-tight">{campaign.name}</h1>
                    <Badge variant={getStatusVariant(campaign.status)}>{campaign.status}</Badge>
                    {campaign.status === 'draft' && (
                      <Button onClick={handleActivateCampaign} size="sm">
                        Activate Campaign
                      </Button>
                    )}
                  </div>
                  {campaign.description && (
                    <p className="text-muted-foreground">{campaign.description}</p>
                  )}
                </>
              )}
            </div>
            {!editing && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Test Call - Primary Action */}
        <Card className="p-6 border-primary bg-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1">Test Your AI Agent</h3>
              <p className="text-sm text-muted-foreground">
                Try a live call to experience your campaign
              </p>
            </div>
            <Button size="lg" asChild className="gap-2">
              <Link to={`/call/${campaign.id}`}>
                <Phone className="h-5 w-5" />
                Start Test Call
              </Link>
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to={`/flows/designer/${campaign.id}`}>
                <Workflow className="mr-2 h-4 w-4" />
                Design Flow
              </Link>
            </Button>
          </Card>
          <Card className="p-4">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to={`/knowledge/upload?campaignId=${campaign.id}`}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Knowledge
              </Link>
            </Button>
          </Card>
          <Card className="p-4">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to={`/leads?campaignId=${campaign.id}`}>
                <Users className="mr-2 h-4 w-4" />
                View Leads
              </Link>
            </Button>
          </Card>
          <Card className="p-4">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to={`/analytics/campaigns?campaignId=${campaign.id}`}>
                <TrendingUp className="mr-2 h-4 w-4" />
                Analytics
              </Link>
            </Button>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="calls">Recent Calls</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Campaign Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Entry Type</Label>
                  <p className="capitalize mt-1">{campaign.entry_type?.replace('_', ' ')}</p>
                </div>
                {goal && (
                  <div>
                    <Label className="text-muted-foreground">Goal</Label>
                    <p className="capitalize mt-1">{goal.replace('_', ' ')}</p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p className="mt-1">{new Date(campaign.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Last Updated</Label>
                  <p className="mt-1">{formatRelativeTime(campaign.updated_at)}</p>
                </div>
              </div>
            </Card>

            {recentCalls.length === 0 && (
              <Card className="p-8 text-center">
                <div className="space-y-3">
                  <div className="text-4xl">📞</div>
                  <h3 className="text-lg font-semibold">No calls yet</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Once calls start, you'll see activity and metrics here. Complete your campaign
                    setup by designing the conversation flow and uploading knowledge.
                  </p>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="calls">
            <Card>
              {recentCalls.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No call sessions recorded yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Started</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Lead Captured</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentCalls.map((call) => (
                      <TableRow key={call.id}>
                        <TableCell>{formatRelativeTime(call.started_at)}</TableCell>
                        <TableCell>
                          <span className={getCallStatusColor(call.status)}>
                            {call.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          {call.duration_ms ? formatDuration(Math.round(call.duration_ms / 1000)) : '-'}
                        </TableCell>
                        <TableCell>
                          {call.lead_id ? (
                            <Badge variant="default">Yes</Badge>
                          ) : (
                            <span className="text-muted-foreground">No</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
