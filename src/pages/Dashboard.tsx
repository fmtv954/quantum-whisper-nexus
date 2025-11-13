/**
 * Dashboard Page - Main overview for Quantum Voice AI Platform
 * Shows key metrics, recent activity, and quick actions
 */

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppShell } from '@/components/layout/AppShell';
import { MetricCard } from '@/components/ui/metric-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Users, Target, TrendingUp, Plus, Radio, Sparkles, ArrowRight, Clock } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { 
  getCurrentAccountId, 
  getDashboardMetrics, 
  getRecentCallActivity,
  formatDuration,
  formatRelativeTime,
  type DashboardMetrics,
  type RecentCallActivity
} from '@/lib/data';

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentCallActivity[]>([]);
  const [accountId, setAccountId] = useState<string | null>(null);

  // Show welcome toast if coming from onboarding
  useEffect(() => {
    const state = location.state as any;
    if (state?.onboardingComplete) {
      toast({
        title: "🎉 You're all set!",
        description: "Your first campaign has been created. Let's customize it to match your needs.",
      });
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [location, toast]);

  // Fetch dashboard data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      const currentAccountId = await getCurrentAccountId();
      if (!currentAccountId) {
        setLoading(false);
        return;
      }

      setAccountId(currentAccountId);

      // Fetch metrics and recent activity in parallel
      const [metricsData, activityData] = await Promise.all([
        getDashboardMetrics(currentAccountId),
        getRecentCallActivity(currentAccountId, 10),
      ]);

      setMetrics(metricsData);
      setRecentActivity(activityData);
      setLoading(false);
    }

    fetchData();
  }, []);

  // Loading state
  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-pulse text-primary mb-2">Loading dashboard...</div>
          </div>
        </div>
      </AppShell>
    );
  }

  // Empty state - new account with no data
  const isEmpty = metrics && metrics.totalCampaigns === 0;

  if (isEmpty) {
    return (
      <AppShell>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome to Quantum Voice AI</h1>
            <p className="text-muted-foreground">
              Your mission control for AI-powered voice campaigns
            </p>
          </div>

          {/* Getting Started Card */}
          <Card className="glass glow-blue border-cyber-blue/30">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-cyber-blue/10 flex items-center justify-center glow-blue">
                  <Sparkles className="w-6 h-6 text-cyber-blue" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Ready to Launch Your First Campaign?</CardTitle>
                  <CardDescription className="text-base mt-1">
                    Get your AI voice agent up and running in minutes
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* What you'll see */}
              <div>
                <h3 className="font-semibold mb-3">What you'll see on this dashboard:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="glass p-4 rounded-lg border border-border/50">
                    <Phone className="w-5 h-5 text-cyber-green mb-2" />
                    <h4 className="font-semibold text-sm mb-1">Live Call Metrics</h4>
                    <p className="text-xs text-muted-foreground">
                      Track active calls, completion rates, and call duration
                    </p>
                  </div>
                  <div className="glass p-4 rounded-lg border border-border/50">
                    <Users className="w-5 h-5 text-cyber-blue mb-2" />
                    <h4 className="font-semibold text-sm mb-1">Lead Capture</h4>
                    <p className="text-xs text-muted-foreground">
                      Monitor captured leads with qualification scores
                    </p>
                  </div>
                  <div className="glass p-4 rounded-lg border border-border/50">
                    <Target className="w-5 h-5 text-cyber-purple mb-2" />
                    <h4 className="font-semibold text-sm mb-1">Campaign Performance</h4>
                    <p className="text-xs text-muted-foreground">
                      View conversion rates and ROI per campaign
                    </p>
                  </div>
                  <div className="glass p-4 rounded-lg border border-border/50">
                    <TrendingUp className="w-5 h-5 text-cyber-pink mb-2" />
                    <h4 className="font-semibold text-sm mb-1">Recent Activity</h4>
                    <p className="text-xs text-muted-foreground">
                      See real-time updates from your voice AI agents
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div className="space-y-3">
                <h3 className="font-semibold">Next steps:</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={() => navigate('/campaigns/new')}
                    className="bg-cyber-blue hover:bg-cyber-blue/90 text-background font-semibold glow-blue flex-1"
                    size="lg"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Create Your First Campaign
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/onboarding/welcome')}
                    className="border-cyber-green text-cyber-green hover:bg-cyber-green hover:text-background flex-1"
                    size="lg"
                  >
                    <Sparkles className="mr-2 h-5 w-5" />
                    Start Guided Setup
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  // Active dashboard with data
  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header with CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of your voice AI campaigns and activity
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => navigate('/analytics')}
              variant="outline"
              className="gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              View Analytics
            </Button>
            <Button 
              onClick={() => navigate('/campaigns/new')}
              className="bg-cyber-blue hover:bg-cyber-blue/90 text-background font-semibold glow-blue"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Active Campaigns"
            value={metrics?.activeCampaigns.toString() || '0'}
            subtitle={`${metrics?.totalCampaigns || 0} total`}
            icon={<Radio className="h-5 w-5" />}
          />
          <MetricCard
            label="Calls Today"
            value={metrics?.callsToday.toString() || '0'}
            subtitle="Last 24 hours"
            icon={<Phone className="h-5 w-5" />}
            trend={metrics?.callsToday ? { value: metrics.callsToday, isPositive: true } : undefined}
            status="success"
          />
          <MetricCard
            label="Leads Today"
            value={metrics?.leadsToday.toString() || '0'}
            subtitle={`${metrics?.totalLeads || 0} total leads`}
            icon={<Users className="h-5 w-5" />}
            trend={metrics?.leadsToday ? { value: metrics.leadsToday, isPositive: true } : undefined}
            status="warning"
          />
          <MetricCard
            label="Avg Call Duration"
            value={
              metrics?.avgCallDurationToday 
                ? formatDuration(metrics.avgCallDurationToday)
                : 'N/A'
            }
            subtitle="Today's average"
            icon={<Clock className="h-5 w-5" />}
          />
        </div>

        {/* Recent Activity */}
        <Card className="glass">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-cyber-green" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest call sessions from your campaigns</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/campaigns')}
                className="text-cyber-blue hover:text-cyber-blue/80"
              >
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Phone className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No call activity yet</p>
                <p className="text-sm mt-1">
                  Start your first campaign to see activity here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((call) => (
                  <div
                    key={call.id}
                    className="glass p-4 rounded-lg border border-border/50 hover:border-cyber-blue/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">
                            {call.campaign?.name || 'Unknown Campaign'}
                          </span>
                          <Badge 
                            variant={
                              call.status === 'completed' ? 'default' :
                              call.status === 'active' ? 'secondary' :
                              'outline'
                            }
                            className="text-xs"
                          >
                            {call.status}
                          </Badge>
                          {call.lead_id && (
                            <Badge variant="secondary" className="text-xs bg-cyber-green/20 text-cyber-green border-cyber-green/30">
                              Lead Captured
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatRelativeTime(call.started_at)}
                          </span>
                          {call.duration_ms && (
                            <span>
                              Duration: {formatDuration(Math.round(call.duration_ms / 1000))}
                            </span>
                          )}
                        </div>
                      </div>
                      {call.lead_id && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => navigate(`/leads`)}
                          className="text-cyber-blue hover:text-cyber-blue/80"
                        >
                          View Lead
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions (for future expansion) */}
        {/* TODO: Add quick action cards for:
          - Design conversation flow → /flows/designer/[campaignId]
          - Upload knowledge → /knowledge/upload
          - View analytics → /dashboard/analytics
        */}
      </div>
    </AppShell>
  );
}
