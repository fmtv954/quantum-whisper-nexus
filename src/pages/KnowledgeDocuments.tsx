import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { FileText, Upload, ArrowLeft } from "lucide-react";
import {
  getKnowledgeDocuments,
  getKnowledgeSources,
  type KnowledgeDocumentWithSource,
  type KnowledgeSourceWithCount,
} from "@/lib/knowledge";
import { getCurrentAccountId } from "@/lib/data";

export default function KnowledgeDocuments() {
  const [documents, setDocuments] = useState<KnowledgeDocumentWithSource[]>([]);
  const [sources, setSources] = useState<KnowledgeSourceWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const selectedSourceId = searchParams.get("sourceId") || "";
  const selectedStatus = searchParams.get("status") || "";

  useEffect(() => {
    loadData();
  }, [selectedSourceId, selectedStatus]);

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

      const [docsData, sourcesData] = await Promise.all([
        getKnowledgeDocuments(accountId, {
          sourceId: selectedSourceId || undefined,
          status: selectedStatus || undefined,
        }),
        getKnowledgeSources(accountId),
      ]);

      setDocuments(docsData);
      setSources(sourcesData);
    } catch (error) {
      console.error("Error loading documents:", error);
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function updateFilter(key: string, value: string) {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  }

  function getStatusBadgeVariant(status: string): "default" | "secondary" | "outline" {
    switch (status) {
      case "pending":
        return "secondary";
      case "indexed":
        return "default";
      case "error":
        return "outline";
      default:
        return "outline";
    }
  }

  const hasFilters = selectedSourceId || selectedStatus;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/knowledge">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Documents</h1>
            <p className="text-muted-foreground mt-1">
              {documents.length} document{documents.length !== 1 ? "s" : ""} in your knowledge base
            </p>
          </div>
        </div>
        <Button asChild>
          <Link to="/knowledge/upload">
            <Upload className="h-4 w-4 mr-2" />
            Upload Documents
          </Link>
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Select value={selectedSourceId} onValueChange={(value) => updateFilter("sourceId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All sources</SelectItem>
                {sources.map((source) => (
                  <SelectItem key={source.id} value={source.id}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Select value={selectedStatus} onValueChange={(value) => updateFilter("status", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="indexed">Indexed</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {hasFilters && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchParams(new URLSearchParams());
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </Card>

      {/* Documents Table */}
      <Card>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No documents found</h3>
            <p className="text-muted-foreground mb-6">
              {hasFilters
                ? "Try adjusting your filters or upload new documents."
                : "Upload your first document to get started."}
            </p>
            <Button asChild>
              <Link to="/knowledge/upload">
                <Upload className="h-4 w-4 mr-2" />
                Upload Documents
              </Link>
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{doc.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>{doc.source?.name || "Unknown"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {doc.metadata?.mime_type?.split("/")[1]?.toUpperCase() || "FILE"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(doc.status)}>{doc.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Info Note */}
      {documents.length > 0 && (
        <Card className="bg-muted/50">
          <div className="p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Documents with "pending" status are queued for indexing.
              Once indexed, they'll be available for RAG Answer nodes in your conversation flows.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
