import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/ui/metric-card";
import { useToast } from "@/hooks/use-toast";
import { FileText, Upload, Database, BookOpen } from "lucide-react";
import {
  getKnowledgeOverview,
  getKnowledgeSources,
  type KnowledgeOverview,
  type KnowledgeSourceWithCount,
} from "@/lib/knowledge";
import { getCurrentAccountId } from "@/lib/data";

export default function Knowledge() {
  const [overview, setOverview] = useState<KnowledgeOverview | null>(null);
  const [sources, setSources] = useState<KnowledgeSourceWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const accountId = await getCurrentAccountId();
      if (!accountId) {
        toast({
          title: "Error",
          description: "No account found",
          variant: "destructive",
        });
        return;
      }

      const [overviewData, sourcesData] = await Promise.all([
        getKnowledgeOverview(accountId),
        getKnowledgeSources(accountId),
      ]);

      setOverview(overviewData);
      setSources(sourcesData);
    } catch (error) {
      console.error("Error loading knowledge data:", error);
      toast({
        title: "Error",
        description: "Failed to load knowledge base",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const isEmpty = !loading && overview && overview.totalSources === 0 && overview.totalDocuments === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground mt-2">
            Documents and sources that power your AI answers
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/knowledge/documents">View All Documents</Link>
          </Button>
          <Button asChild>
            <Link to="/knowledge/upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload Documents
            </Link>
          </Button>
        </div>
      </div>

      {isEmpty ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold">Build Your Knowledge Base</h2>
            <p className="text-muted-foreground">
              Upload your PDFs, FAQs, and docs so the AI can answer detailed questions about
              your business. Your voice agents will use this knowledge to provide accurate,
              contextual responses.
            </p>
            <Button onClick={() => navigate("/knowledge/upload")} size="lg" className="mt-4">
              <Upload className="h-4 w-4 mr-2" />
              Upload Your First Document
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              label="Knowledge Sources"
              value={overview?.totalSources.toString() || "0"}
            />
            <MetricCard
              label="Total Documents"
              value={overview?.totalDocuments.toString() || "0"}
            />
            <MetricCard
              label="Uploaded Docs"
              value={overview?.documentsByType.uploaded_doc.toString() || "0"}
              subtitle="Ready for AI to reference"
            />
          </div>

          {/* Sources List */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Knowledge Sources</h2>
              {sources.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No knowledge sources yet. Upload documents to get started.
                </p>
              ) : (
                <div className="space-y-4">
                  {sources.map((source) => (
                    <div
                      key={source.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{source.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{source.type}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {source.document_count || 0} document
                              {source.document_count !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {new Date(source.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Info Card */}
          <Card className="bg-primary/5 border-primary/20">
            <div className="p-6">
              <h3 className="font-semibold mb-2">How Knowledge Powers Your AI</h3>
              <p className="text-sm text-muted-foreground">
                Documents you upload are used by RAG Answer nodes in your conversation flows.
                When a caller asks a question, the AI searches your knowledge base and provides
                accurate, contextual answers based on your content.
              </p>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
