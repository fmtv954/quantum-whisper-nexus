/**
 * Dashboard Page
 * 
 * Main overview page showing key metrics and system status.
 * 
 * This is an EXAMPLE showing how to use the AppShell layout.
 * Future dashboard implementation should expand on this foundation.
 */

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AppShell } from '@/components/layout/AppShell';
import { MetricCard } from '@/components/ui/metric-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Users, Target, DollarSign, Plus, Radio } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const location = useLocation();
  const { toast } = useToast();

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

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's your campaign overview.
            </p>
          </div>
          <Button className="glow-blue">
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </div>

        {/* KPI Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Active Calls"
            value="24"
            icon={<Phone className="h-5 w-5" />}
            trend={{ value: 12, isPositive: true }}
            status="success"
            subtitle="Real-time"
          />
          <MetricCard
            label="Total Leads"
            value="847"
            icon={<Users className="h-5 w-5" />}
            trend={{ value: 8, isPositive: true }}
            subtitle="This month"
          />
          <MetricCard
            label="Conversion Rate"
            value="68%"
            icon={<Target className="h-5 w-5" />}
            trend={{ value: 5, isPositive: false }}
            status="warning"
            subtitle="Target: 75%"
          />
          <MetricCard
            label="Cost / Lead"
            value="$2.34"
            icon={<DollarSign className="h-5 w-5" />}
            trend={{ value: 15, isPositive: true }}
            subtitle="80% below target"
          />
        </div>

        {/* Quick Actions & Status */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="glow-blue">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="h-5 w-5" />
                Quick Start
              </CardTitle>
              <CardDescription>
                Launch your first AI voice campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Get started with our campaign wizard to create your first voice AI experience.
                </p>
              </div>
              <div className="flex gap-2">
                <Button>Create Campaign</Button>
                <Button variant="outline">View Tutorial</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>
                All systems operational
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <StatusItem label="Voice Pipeline" status="operational" />
                <StatusItem label="AI Services" status="operational" />
                <StatusItem label="Knowledge Base" status="operational" />
                <StatusItem label="Lead Capture" status="operational" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Placeholder for future content */}
        <Card className="cyber-grid">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest calls, leads, and campaign updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground py-8 text-center">
              Activity feed will be displayed here with real-time updates
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function StatusItem({ label, status }: { label: string; status: 'operational' | 'degraded' | 'down' }) {
  const colors = {
    operational: 'bg-secondary',
    degraded: 'bg-accent',
    down: 'bg-destructive',
  };

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${colors[status]}`} />
        <span className="text-xs text-muted-foreground capitalize">{status}</span>
      </div>
    </div>
  );
}
