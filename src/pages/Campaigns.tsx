/**
 * Campaigns list page - shows all campaigns for the current account
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Eye } from "lucide-react";
import { getCurrentAccountId } from "@/lib/data";
import { getCampaignsForAccount, type Campaign } from "@/lib/campaigns";

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
    setLoading(true);
    const accountId = await getCurrentAccountId();
    if (!accountId) {
      setLoading(false);
      return;
    }

    const data = await getCampaignsForAccount(accountId);
    setCampaigns(data);
    setLoading(false);
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

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Loading campaigns...</div>
        </div>
      </AppShell>
    );
  }

  if (campaigns.length === 0) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
              <p className="text-muted-foreground mt-2">
                Voice AI campaigns for lead capture and engagement
              </p>
            </div>
          </div>

          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="text-5xl">🎯</div>
              <h3 className="text-xl font-semibold">Create Your First Campaign</h3>
              <p className="text-muted-foreground">
                Campaigns are AI-powered voice experiences that capture leads through QR codes,
                web widgets, or direct links. Each campaign has its own conversation flow and
                knowledge base.
              </p>
              <div className="pt-4">
                <Button asChild size="lg">
                  <Link to="/campaigns/new">
                    <Plus className="mr-2 h-5 w-5" />
                    Create Campaign
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
            <p className="text-muted-foreground mt-2">
              Manage your voice AI campaigns
            </p>
          </div>
          <Button asChild>
            <Link to="/campaigns/new">
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Link>
          </Button>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Entry Type</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{campaign.name}</div>
                      {campaign.description && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {campaign.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(campaign.status)}>
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">
                    {campaign.entry_type?.replace('_', ' ')}
                  </TableCell>
                  <TableCell>{formatDate(campaign.created_at)}</TableCell>
                  <TableCell>{formatDate(campaign.updated_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link to={`/campaigns/${campaign.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AppShell>
  );
}
