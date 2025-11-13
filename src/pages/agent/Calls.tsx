/**
 * Agent Calls List
 * 
 * View all calls where agents were involved or handoffs occurred
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentAccountId } from "@/lib/data";

export default function AgentCalls() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [calls, setCalls] = useState<any[]>([]);

  useEffect(() => {
    loadCalls();
  }, []);

  const loadCalls = async () => {
    try {
      const accountId = await getCurrentAccountId();

      // Load calls that have handoff requests
      const { data, error } = await supabase
        .from("call_sessions")
        .select(`
          *,
          campaign:campaigns(id, name),
          lead:leads(id, name),
          handoff:handoff_requests!call_id(id, status, priority)
        `)
        .eq("account_id", accountId)
        .not("handoff", "is", null)
        .order("started_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      setCalls(data || []);
    } catch (error) {
      console.error("Error loading calls:", error);
      toast({
        title: "Error",
        description: "Failed to load calls",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return "N/A";
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress":
        return "default";
      case "completed":
        return "secondary";
      default:
        return "outline";
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agent Calls</h1>
          <p className="text-muted-foreground mt-2">
            Calls with human agent involvement
          </p>
        </div>

        {/* Calls Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Calls with Handoffs</CardTitle>
          </CardHeader>
          <CardContent>
            {calls.length === 0 ? (
              <div className="text-center py-12">
                <Phone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No calls yet</h3>
                <p className="text-muted-foreground">
                  Calls with handoffs will appear here.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date/Time</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Lead</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Call Status</TableHead>
                    <TableHead>Handoff Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calls.map((call) => {
                    const handoff = Array.isArray(call.handoff) ? call.handoff[0] : call.handoff;
                    
                    return (
                      <TableRow key={call.id}>
                        <TableCell className="font-mono text-sm">
                          {new Date(call.started_at).toLocaleString()}
                        </TableCell>
                        <TableCell>{call.campaign?.name || "Unknown"}</TableCell>
                        <TableCell>{call.lead?.name || "Unknown"}</TableCell>
                        <TableCell>{formatDuration(call.duration_ms)}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(call.status)}>
                            {call.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {handoff && (
                            <Badge variant="outline">
                              {handoff.status}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {handoff && (
                            <Link
                              to={`/agent/handoff/${handoff.id}`}
                              className="text-primary hover:underline text-sm"
                            >
                              View Handoff
                            </Link>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
