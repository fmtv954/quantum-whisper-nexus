/**
 * Campaign Analytics
 * 
 * Per-campaign performance breakdown
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Rocket } from "lucide-react";
import { getCampaignAnalytics, type CampaignAnalytics } from "@/lib/analytics";
import { getCurrentAccountId } from "@/lib/data";

export default function AnalyticsCampaigns() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<CampaignAnalytics[]>([]);
  const [dateRange, setDateRange] = useState("7");

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const accountId = await getCurrentAccountId();
      
      const days = parseInt(dateRange);
      const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const to = new Date().toISOString();

      const data = await getCampaignAnalytics(accountId, { from, to });
      setAnalytics(data);
    } catch (error) {
      console.error("Error loading campaign analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load campaign analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
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

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Campaign Analytics</h1>
            <p className="text-muted-foreground mt-2">
              Performance breakdown by campaign
            </p>
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Campaign Table */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.length === 0 ? (
              <div className="text-center py-12">
                <Rocket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No campaign activity</h3>
                <p className="text-muted-foreground">
                  No campaigns have activity in the selected time range
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead className="text-right">Calls</TableHead>
                      <TableHead className="text-right">Leads</TableHead>
                      <TableHead className="text-right">Conv %</TableHead>
                      <TableHead className="text-right">Handoffs</TableHead>
                      <TableHead className="text-right">Avg Duration</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">Cost/Lead</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.map((campaign) => (
                      <TableRow key={campaign.campaignId}>
                        <TableCell>
                          <Link
                            to={`/campaigns/${campaign.campaignId}`}
                            className="font-medium hover:underline"
                          >
                            {campaign.campaignName}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right">
                          {campaign.calls}
                        </TableCell>
                        <TableCell className="text-right">
                          {campaign.leads}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={
                              campaign.conversionRate > 20
                                ? "default"
                                : campaign.conversionRate > 10
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {campaign.conversionRate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {campaign.handoffs}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatDuration(campaign.avgCallDuration)}
                        </TableCell>
                        <TableCell className="text-right">
                          ${campaign.cost.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          {campaign.leads > 0
                            ? `$${campaign.costPerLead.toFixed(2)}`
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
