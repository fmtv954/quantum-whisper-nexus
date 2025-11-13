/**
 * Global Analytics Overview
 * 
 * High-level performance metrics across all campaigns
 */

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MetricCard } from "@/components/ui/metric-card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, TrendingUp, Phone, Users, DollarSign, Target } from "lucide-react";
import { getGlobalAnalytics, type GlobalAnalytics } from "@/lib/analytics";
import { getCurrentAccountId } from "@/lib/data";

export default function Analytics() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<GlobalAnalytics | null>(null);
  const [dateRange, setDateRange] = useState("7"); // days

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

      const data = await getGlobalAnalytics(accountId, { from, to });
      setAnalytics(data);
    } catch (error) {
      console.error("Error loading analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
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
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground mt-2">
              Performance metrics and insights
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

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <MetricCard
            label="Total Calls"
            value={analytics?.totalCalls || 0}
            icon={<Phone className="h-5 w-5" />}
            status="success"
          />
          <MetricCard
            label="Total Leads"
            value={analytics?.totalLeads || 0}
            icon={<Users className="h-5 w-5" />}
            status="success"
          />
          <MetricCard
            label="Conversion Rate"
            value={`${(analytics?.conversionRate || 0).toFixed(1)}%`}
            icon={<Target className="h-5 w-5" />}
            trend={{
              value: analytics?.conversionRate || 0,
              isPositive: (analytics?.conversionRate || 0) > 15,
            }}
          />
          <MetricCard
            label="Total Cost"
            value={`$${(analytics?.totalCost || 0).toFixed(2)}`}
            icon={<DollarSign className="h-5 w-5" />}
            subtitle="All services"
          />
          <MetricCard
            label="Cost per Lead"
            value={`$${(analytics?.costPerLead || 0).toFixed(2)}`}
            icon={<TrendingUp className="h-5 w-5" />}
            trend={{
              value: 0,
              isPositive: (analytics?.costPerLead || 0) < 5,
            }}
          />
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Call Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg Call Duration</span>
                <span className="text-2xl font-bold">
                  {Math.round(analytics?.avgCallDuration || 0)}s
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Handoff Rate</span>
                <span className="text-2xl font-bold">
                  {(analytics?.handoffRate || 0).toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild variant="outline" className="w-full">
                <a href="/analytics/campaigns">View Campaign Analytics</a>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <a href="/analytics/costs">View Cost Breakdown</a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Empty State Guidance */}
        {analytics && analytics.totalCalls === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Phone className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No data yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Run your first test campaign to see analytics appear here
              </p>
              <Button asChild>
                <a href="/campaigns/new">Create Campaign</a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
