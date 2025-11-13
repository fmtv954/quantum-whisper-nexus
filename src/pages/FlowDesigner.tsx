/**
 * Flow Designer - Visual conversation flow editor
 * Uses React Flow for node-based editing
 * 
 * Future: Add real-time testing panel, more node types, conditional branching
 */

import { useCallback, useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
} from "reactflow";
import "reactflow/dist/style.css";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  getFlowForCampaign,
  createOrUpdateFlowForCampaign,
  createDefaultFlow,
  validateFlowDefinition,
} from "@/lib/flows";
import { supabase } from "@/integrations/supabase/client";
import type { FlowNode, FlowDefinition } from "../../types/flow";
import {
  Save,
  ArrowLeft,
  Plus,
  PlayCircle,
  MessageSquare,
  User,
  Brain,
  CheckCircle,
  Loader2,
} from "lucide-react";

const nodeTypes = {
  start: ({ data }: any) => (
    <div className="px-4 py-2 shadow-md rounded-md border-2 border-primary bg-card min-w-[180px]">
      <div className="flex items-center gap-2">
        <PlayCircle className="h-4 w-4 text-primary" />
        <div className="font-semibold">{data.label}</div>
      </div>
      <div className="text-xs text-muted-foreground mt-1">{data.type}</div>
    </div>
  ),
  lead_gate: ({ data }: any) => (
    <div className="px-4 py-2 shadow-md rounded-md border-2 border-purple-500 bg-card min-w-[180px]">
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-purple-500" />
        <div className="font-semibold">{data.label}</div>
      </div>
      <div className="text-xs text-muted-foreground mt-1">{data.type}</div>
    </div>
  ),
  rag_answer: ({ data }: any) => (
    <div className="px-4 py-2 shadow-md rounded-md border-2 border-blue-500 bg-card min-w-[180px]">
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-blue-500" />
        <div className="font-semibold">{data.label}</div>
      </div>
      <div className="text-xs text-muted-foreground mt-1">{data.type}</div>
    </div>
  ),
  end: ({ data }: any) => (
    <div className="px-4 py-2 shadow-md rounded-md border-2 border-green-500 bg-card min-w-[180px]">
      <div className="flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <div className="font-semibold">{data.label}</div>
      </div>
      <div className="text-xs text-muted-foreground mt-1">{data.type}</div>
    </div>
  ),
};

export default function FlowDesigner() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [campaign, setCampaign] = useState<any>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load campaign and flow
  useEffect(() => {
    async function loadData() {
      if (!campaignId) return;

      try {
        // Load campaign
        const { data: campaignData } = await supabase
          .from("campaigns")
          .select("*")
          .eq("id", campaignId)
          .single();

        if (!campaignData) {
          toast({
            title: "Campaign not found",
            variant: "destructive",
          });
          navigate("/campaigns");
          return;
        }

        setCampaign(campaignData);

        // Load or create flow
        let flowDef: FlowDefinition;
        const existingFlow = await getFlowForCampaign(campaignId);

        if (existingFlow) {
          flowDef = existingFlow.definition;
        } else {
          flowDef = createDefaultFlow();
        }

        // Convert to React Flow format
        const rfNodes: Node[] = flowDef.nodes.map((node) => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: { ...node, label: node.label },
        }));

        const rfEdges: Edge[] = flowDef.edges.map((edge) => ({
          id: edge.id,
          source: edge.sourceNodeId,
          target: edge.targetNodeId,
          label: edge.label,
        }));

        setNodes(rfNodes);
        setEdges(rfEdges);
      } catch (error) {
        console.error("Error loading flow:", error);
        toast({
          title: "Error loading flow",
          description: "Failed to load the conversation flow.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [campaignId, navigate, toast]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
      setHasUnsavedChanges(true);
    },
    [setEdges]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node.data as FlowNode);
  }, []);

  const addNode = (type: FlowNode["type"]) => {
    // Check if start node already exists
    if (type === "start" && nodes.some((n) => n.type === "start")) {
      toast({
        title: "Cannot add Start node",
        description: "Only one Start node is allowed per flow.",
        variant: "destructive",
      });
      return;
    }

    const newId = `${type}-${Date.now()}`;
    const newNode: Node = {
      id: newId,
      type,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 200 + 100 },
      data: {
        id: newId,
        type,
        label: type === "start" ? "Start" : type === "end" ? "End" : type === "lead_gate" ? "Lead Capture" : "AI Answer",
        position: { x: 0, y: 0 },
        ...(type === "start" && {
          greeting_message: "Hello! How can I help?",
        }),
        ...(type === "lead_gate" && {
          collect_name: true,
          collect_email: true,
          collect_phone: false,
          consent_required: true,
          consent_prompt: "May I collect your contact info?",
        }),
        ...(type === "rag_answer" && {
          system_prompt: "You are a helpful assistant.",
          knowledge_source_ids: [],
        }),
        ...(type === "end" && {
          closing_message: "Thank you!",
        }),
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setHasUnsavedChanges(true);
  };

  const updateNodeData = (nodeId: string, updates: Partial<FlowNode>) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      )
    );
    if (selectedNode?.id === nodeId) {
      setSelectedNode({ ...selectedNode, ...updates } as FlowNode);
    }
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!campaignId) return;

    setSaving(true);
    try {
      // Convert to FlowDefinition format
      const flowDef: FlowDefinition = {
        nodes: nodes.map((node) => ({
          ...node.data,
          position: node.position,
        })) as FlowNode[],
        edges: edges.map((edge) => ({
          id: edge.id,
          sourceNodeId: edge.source,
          targetNodeId: edge.target,
          label: edge.label as string,
        })),
        version: 1,
      };

      // Validate
      const validation = validateFlowDefinition(flowDef);
      if (!validation.valid) {
        toast({
          title: "Invalid flow",
          description: validation.errors.join(". "),
          variant: "destructive",
        });
        return;
      }

      if (validation.warnings && validation.warnings.length > 0) {
        console.warn("Flow warnings:", validation.warnings);
      }

      // Save
      await createOrUpdateFlowForCampaign(campaignId, flowDef);
      
      setHasUnsavedChanges(false);
      toast({
        title: "Flow saved",
        description: "Your conversation flow has been saved successfully.",
      });
    } catch (error: any) {
      console.error("Error saving flow:", error);
      toast({
        title: "Error saving flow",
        description: error.message || "Failed to save the flow.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="border-b bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/campaigns/${campaignId}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Flow Designer</h1>
                <p className="text-sm text-muted-foreground">
                  {campaign?.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {hasUnsavedChanges && (
                <Badge variant="outline">Unsaved changes</Badge>
              )}
              <Button onClick={handleSave} disabled={saving || !hasUnsavedChanges}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Flow"}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Node Palette */}
          <div className="w-48 border-r bg-muted/30 p-4 space-y-2">
            <h3 className="font-semibold text-sm mb-3">Add Nodes</h3>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => addNode("start")}
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              Start
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => addNode("lead_gate")}
            >
              <User className="mr-2 h-4 w-4" />
              Lead Gate
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => addNode("rag_answer")}
            >
              <Brain className="mr-2 h-4 w-4" />
              RAG Answer
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => addNode("end")}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              End
            </Button>
          </div>

          {/* Canvas */}
          <div className="flex-1">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
            >
              <Controls />
              <MiniMap />
              <Background gap={12} size={1} />
            </ReactFlow>
          </div>

          {/* Properties Panel */}
          {selectedNode && (
            <div className="w-80 border-l bg-card p-4 overflow-y-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Node Properties</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Label</Label>
                    <Input
                      value={selectedNode.label}
                      onChange={(e) =>
                        updateNodeData(selectedNode.id, { label: e.target.value })
                      }
                    />
                  </div>

                  {selectedNode.type === "start" && (
                    <>
                      <div>
                        <Label>Greeting Message</Label>
                        <Textarea
                          value={selectedNode.greeting_message}
                          onChange={(e) =>
                            updateNodeData(selectedNode.id, {
                              greeting_message: e.target.value,
                            })
                          }
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label>Fallback Message (Optional)</Label>
                        <Textarea
                          value={selectedNode.fallback_message || ""}
                          onChange={(e) =>
                            updateNodeData(selectedNode.id, {
                              fallback_message: e.target.value,
                            })
                          }
                          rows={2}
                        />
                      </div>
                    </>
                  )}

                  {selectedNode.type === "lead_gate" && (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Collect Name</Label>
                          <Switch
                            checked={selectedNode.collect_name}
                            onCheckedChange={(checked) =>
                              updateNodeData(selectedNode.id, {
                                collect_name: checked,
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Collect Email</Label>
                          <Switch
                            checked={selectedNode.collect_email}
                            onCheckedChange={(checked) =>
                              updateNodeData(selectedNode.id, {
                                collect_email: checked,
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Collect Phone</Label>
                          <Switch
                            checked={selectedNode.collect_phone}
                            onCheckedChange={(checked) =>
                              updateNodeData(selectedNode.id, {
                                collect_phone: checked,
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Consent Required</Label>
                          <Switch
                            checked={selectedNode.consent_required}
                            onCheckedChange={(checked) =>
                              updateNodeData(selectedNode.id, {
                                consent_required: checked,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Consent Prompt</Label>
                        <Textarea
                          value={selectedNode.consent_prompt}
                          onChange={(e) =>
                            updateNodeData(selectedNode.id, {
                              consent_prompt: e.target.value,
                            })
                          }
                          rows={3}
                        />
                      </div>
                    </>
                  )}

                  {selectedNode.type === "rag_answer" && (
                    <>
                      <div>
                        <Label>System Prompt</Label>
                        <Textarea
                          value={selectedNode.system_prompt}
                          onChange={(e) =>
                            updateNodeData(selectedNode.id, {
                              system_prompt: e.target.value,
                            })
                          }
                          rows={4}
                        />
                      </div>
                      <div>
                        <Label>Knowledge Sources (comma-separated IDs)</Label>
                        <Input
                          value={selectedNode.knowledge_source_ids?.join(", ") || ""}
                          onChange={(e) =>
                            updateNodeData(selectedNode.id, {
                              knowledge_source_ids: e.target.value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean),
                            })
                          }
                          placeholder="source1, source2"
                        />
                      </div>
                    </>
                  )}

                  {selectedNode.type === "end" && (
                    <div>
                      <Label>Closing Message</Label>
                      <Textarea
                        value={selectedNode.closing_message}
                        onChange={(e) =>
                          updateNodeData(selectedNode.id, {
                            closing_message: e.target.value,
                          })
                        }
                        rows={3}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
