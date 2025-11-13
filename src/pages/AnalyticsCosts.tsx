/**
 * Cost & Usage Analytics
 * 
 * Detailed cost breakdown by provider, service, and campaign
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
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
import { Loader2, DollarSign, Cpu, Mic, Volume2, Radio } from "lucide-react";
import { getCostAnalytics, type CostAnalytics } from "@/lib/analytics";
import { getCurrentAccountId } from "@/lib/data";

export default function AnalyticsCosts() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<CostAnalytics | null>(null);
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

      const data = await getCostAnalytics(accountId, { from, to });
      setAnalytics(data);
    } catch (error) {
      console.error("Error loading cost analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load cost analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cost & Usage</h1>
            <p className="text-muted-foreground mt-2">
              Detailed cost breakdown and usage monitoring
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

        {/* Cost Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <MetricCard
            label="Total Cost"
            value={`$${(analytics?.totalCost || 0).toFixed(2)}`}
            icon={<DollarSign className="h-5 w-5" />}
            subtitle="All services"
          />
          <MetricCard
            label="LLM Cost"
            value={`$${(analytics?.llmCost || 0).toFixed(2)}`}
            icon={<Cpu className="h-5 w-5" />}
            subtitle="OpenAI"
          />
          <MetricCard
            label="STT Cost"
            value={`$${(analytics?.sttCost || 0).toFixed(2)}`}
            icon={<Mic className="h-5 w-5" />}
            subtitle="Deepgram"
          />
          <MetricCard
            label="TTS Cost"
            value={`$${(analytics?.ttsCost || 0).toFixed(2)}`}
            icon={<Volume2 className="h-5 w-5" />}
            subtitle="Deepgram"
          />
          <MetricCard
            label="LiveKit Cost"
            value={`$${(analytics?.livekitCost || 0).toFixed(2)}`}
            icon={<Radio className="h-5 w-5" />}
            subtitle="WebRTC"
          />
        </div>

        {/* Provider Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Cost by Provider & Service</CardTitle>
          </CardHeader>
          <CardContent>
            {!analytics || analytics.breakdown.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No usage data available</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead className="text-right">Units</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.breakdown.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium capitalize">
                        {item.provider}
                      </TableCell>
                      <TableCell className="capitalize">{item.service}</TableCell>
                      <TableCell className="text-right">
                        {item.total_units.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        ${item.total_cost.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Cost by Campaign */}
        <Card>
          <CardHeader>
            <CardTitle>Cost by Campaign</CardTitle>
          </CardHeader>
          <CardContent>
            {!analytics || analytics.byCampaign.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No campaign cost data available</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead className="text-right">Calls</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                    <TableHead className="text-right">Cost/Call</TableHead>
                    <TableHead className="text-right">Cost/Lead</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.byCampaign.map((campaign) => (
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
                        ${campaign.totalCost.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {campaign.calls > 0
                          ? `$${campaign.costPerCall.toFixed(2)}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {campaign.costPerLead > 0
                          ? `$${campaign.costPerLead.toFixed(2)}`
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
