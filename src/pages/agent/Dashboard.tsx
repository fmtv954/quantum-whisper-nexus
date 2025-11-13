/**
 * Agent Dashboard - Mission Control for Human Agents
 * 
 * Displays pending handoffs, active calls, and agent performance metrics
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Phone, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { getHandoffRequestsForAccount, getHandoffStats, type HandoffRequest } from "@/lib/handoff";
import { getCurrentAccountId } from "@/lib/data";

export default function AgentDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [handoffs, setHandoffs] = useState<any[]>([]);
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    resolvedToday: 0,
    avgResponseTime: null as number | null,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const accountId = await getCurrentAccountId();
      
      // Load pending and in-progress handoffs
      const [pendingHandoffs, statsData] = await Promise.all([
        getHandoffRequestsForAccount(accountId, { status: "pending" }),
        getHandoffStats(accountId),
      ]);

      setHandoffs(pendingHandoffs);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading agent dashboard:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  const formatTime = (minutes: number | null) => {
    if (!minutes) return "N/A";
    if (minutes < 60) return `${Math.round(minutes)}m`;
    return `${Math.floor(minutes / 60)}h ${Math.round(minutes % 60)}m`;
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agent Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and respond to handoff requests
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Handoffs</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting response
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgress}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Currently handling
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.resolvedToday}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Completed handoffs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatTime(stats.avgResponseTime)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Time to claim
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Handoffs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Handoffs</CardTitle>
          </CardHeader>
          <CardContent>
            {handoffs.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">All caught up!</h3>
                <p className="text-muted-foreground">
                  No pending handoffs at the moment.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Lead</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {handoffs.map((handoff) => (
                    <TableRow key={handoff.id}>
                      <TableCell className="font-mono text-sm">
                        {new Date(handoff.created_at).toLocaleTimeString()}
                      </TableCell>
                      <TableCell>{handoff.campaign?.name || "Unknown"}</TableCell>
                      <TableCell>{handoff.lead?.name || "Unknown"}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {handoff.reason || "No reason provided"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityColor(handoff.priority)}>
                          {handoff.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{handoff.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          asChild
                          variant="default"
                          size="sm"
                        >
                          <Link to={`/agent/handoff/${handoff.id}`}>
                            View
                          </Link>
                        </Button>
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
