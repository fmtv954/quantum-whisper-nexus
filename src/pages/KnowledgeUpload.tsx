import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, FileText, Loader2 } from "lucide-react";
import {
  createKnowledgeSource,
  createKnowledgeDocument,
  uploadKnowledgeFile,
  getKnowledgeSources,
  type KnowledgeSourceWithCount,
} from "@/lib/knowledge";
import { getCurrentAccountId } from "@/lib/data";
import { useEffect } from "react";

export default function KnowledgeUpload() {
  const [sources, setSources] = useState<KnowledgeSourceWithCount[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string>("");
  const [newSourceName, setNewSourceName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadSources();
  }, []);

  async function loadSources() {
    try {
      const accountId = await getCurrentAccountId();
      if (!accountId) return;
      
      const sourcesData = await getKnowledgeSources(accountId);
      setSources(sourcesData);
      
      // Auto-select first source if available
      if (sourcesData.length > 0 && !selectedSourceId) {
        setSelectedSourceId(sourcesData[0].id);
      }
    } catch (error) {
      console.error("Error loading sources:", error);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to upload",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      const accountId = await getCurrentAccountId();
      if (!accountId) {
        toast({
          title: "Error",
          description: "No account found",
          variant: "destructive",
        });
        return;
      }

      // Create new source if needed
      let sourceId = selectedSourceId;
      if (selectedSourceId === "new") {
        if (!newSourceName.trim()) {
          toast({
            title: "Source name required",
            description: "Please enter a name for the new knowledge source",
            variant: "destructive",
          });
          setUploading(false);
          return;
        }
        const newSource = await createKnowledgeSource(accountId, {
          name: newSourceName,
          type: "uploaded_doc",
        });
        sourceId = newSource.id;
      }

      // Upload each file
      const uploadPromises = files.map(async (file) => {
        // Upload file to storage
        const { path, url } = await uploadKnowledgeFile(accountId, sourceId, file);

        // Create document record
        await createKnowledgeDocument(accountId, sourceId, {
          title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
          uri_or_path: path,
          file_size_bytes: file.size,
          mime_type: file.type,
          metadata: {
            original_filename: file.name,
            public_url: url,
            // Future: Will include campaign_ids, external_index_id, embedding_status
          },
        });
      });

      await Promise.all(uploadPromises);

      toast({
        title: "Upload successful",
        description: `${files.length} document${files.length !== 1 ? "s" : ""} uploaded successfully. Indexing & AI integration will be configured next.`,
      });

      // Navigate to documents list
      navigate("/knowledge/documents");
    } catch (error) {
      console.error("Error uploading documents:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload documents",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/knowledge">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Upload Documents</h1>
          <p className="text-muted-foreground mt-1">
            Add documents to power your AI's knowledge base
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-6">
          {/* Step 1: Select or Create Source */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-1">Step 1: Choose Knowledge Source</h2>
              <p className="text-sm text-muted-foreground">
                Group related documents into sources for better organization
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Knowledge Source</Label>
              <Select value={selectedSourceId} onValueChange={setSelectedSourceId}>
                <SelectTrigger id="source">
                  <SelectValue placeholder="Select a source" />
                </SelectTrigger>
                <SelectContent>
                  {sources.map((source) => (
                    <SelectItem key={source.id} value={source.id}>
                      {source.name} ({source.document_count} docs)
                    </SelectItem>
                  ))}
                  <SelectItem value="new">+ Create new source</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedSourceId === "new" && (
              <div className="space-y-2">
                <Label htmlFor="newSourceName">New Source Name</Label>
                <Input
                  id="newSourceName"
                  placeholder="e.g., Product Documentation"
                  value={newSourceName}
                  onChange={(e) => setNewSourceName(e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          {/* Step 2: Upload Files */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-1">Step 2: Upload Files</h2>
              <p className="text-sm text-muted-foreground">
                Supported formats: PDF, TXT, DOC, DOCX
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="files">Select Files</Label>
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <input
                  id="files"
                  type="file"
                  multiple
                  accept=".pdf,.txt,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="files" className="cursor-pointer">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium">Click to select files</p>
                  <p className="text-xs text-muted-foreground mt-1">or drag and drop</p>
                </label>
              </div>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Files ({files.length})</Label>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 bg-muted rounded text-sm"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1">{file.name}</span>
                      <span className="text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => navigate("/knowledge")}>
              Cancel
            </Button>
            <Button type="submit" disabled={uploading || files.length === 0}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {files.length} File{files.length !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        </Card>
      </form>

      {/* Info Card */}
      <Card className="bg-primary/5 border-primary/20 p-4">
        <h3 className="font-semibold mb-2 text-sm">What happens after upload?</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Documents are securely stored in your account's knowledge base</li>
          <li>• Files are queued for indexing (RAG integration coming soon)</li>
          <li>• Once indexed, they'll be available in RAG Answer nodes in your flows</li>
          <li>• Your AI agents will use this content to provide accurate answers</li>
        </ul>
      </Card>
    </div>
  );
}
