/**
 * Leads list page - View all leads for the current account
 */

import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getLeadsForAccount, getStatusInfo, type LeadWithCampaign } from "@/lib/leads";
import { Users, Plus } from "lucide-react";
import { formatRelativeTime } from "@/lib/data";

export default function Leads() {
  const [leads, setLeads] = useState<LeadWithCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get("campaignId");

  useEffect(() => {
    async function loadLeads() {
      try {
        setLoading(true);
        const data = await getLeadsForAccount({ 
          campaignId: campaignId || undefined 
        });
        setLeads(data);
      } catch (error) {
        console.error("Failed to load leads:", error);
      } finally {
        setLoading(false);
      }
    }

    loadLeads();
  }, [campaignId]);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
            <p className="text-muted-foreground mt-1">
              Contact information captured by your AI campaigns
            </p>
          </div>
          <Button asChild>
            <Link to="/campaigns/new">
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Link>
          </Button>
        </div>

        {/* Leads Table */}
        {loading ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">Loading leads...</div>
            </CardContent>
          </Card>
        ) : leads.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                No leads yet
              </CardTitle>
              <CardDescription>
                Leads will appear here after your AI campaigns capture contact information from calls.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4 py-4">
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Create a campaign and start conversations to begin capturing qualified leads automatically.
                </p>
                <div className="flex gap-3">
                  <Button asChild>
                    <Link to="/campaigns/new">Create Campaign</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/dashboard">Back to Dashboard</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => {
                  const statusInfo = getStatusInfo(lead.status);
                  return (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">
                        {lead.name || "Unnamed Lead"}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          {lead.email && (
                            <div className="text-muted-foreground">{lead.email}</div>
                          )}
                          {lead.phone && (
                            <div className="text-muted-foreground">{lead.phone}</div>
                          )}
                          {!lead.email && !lead.phone && (
                            <div className="text-muted-foreground italic">No contact info</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {lead.campaign ? (
                          <Link 
                            to={`/campaigns/${lead.campaign.id}`}
                            className="text-sm hover:underline"
                          >
                            {lead.campaign.name}
                          </Link>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {lead.score !== null ? (
                          <Badge variant={lead.score >= 70 ? "default" : "secondary"}>
                            {lead.score}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatRelativeTime(lead.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/leads/${lead.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
