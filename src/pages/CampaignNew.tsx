/**
 * New campaign wizard - create a new campaign
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { getCurrentAccountId } from "@/lib/data";
import { createCampaignForAccount } from "@/lib/campaigns";
import { useToast } from "@/hooks/use-toast";

export default function CampaignNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    goal: "",
    entry_type: "web_widget",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Campaign name is required";
    }

    if (!formData.goal.trim()) {
      newErrors.goal = "Campaign goal is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const accountId = await getCurrentAccountId();
      if (!accountId) {
        toast({
          title: "Error",
          description: "Could not determine account. Please try logging in again.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const campaign = await createCampaignForAccount(accountId, formData);

      if (!campaign) {
        toast({
          title: "Error",
          description: "Failed to create campaign. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      toast({
        title: "Campaign created",
        description: `${campaign.name} has been created successfully.`,
      });

      navigate(`/campaigns/${campaign.id}`);
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/campaigns">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Campaigns
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Create New Campaign</h1>
          <p className="text-muted-foreground mt-2">
            Set up a new AI-powered voice campaign for lead capture
          </p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">
                Campaign Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Product Demo Campaign"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this campaign's purpose..."
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">
                Optional: Add context about this campaign
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal">
                Campaign Goal <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.goal}
                onValueChange={(value) => setFormData({ ...formData, goal: value })}
              >
                <SelectTrigger id="goal" className={errors.goal ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select a goal..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead_capture">Capture leads for my event</SelectItem>
                  <SelectItem value="product_questions">Answer questions about my product</SelectItem>
                  <SelectItem value="qualification">Qualify callers before human handoff</SelectItem>
                  <SelectItem value="customer_support">Provide customer support</SelectItem>
                  <SelectItem value="appointment_booking">Book appointments</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.goal && (
                <p className="text-sm text-destructive">{errors.goal}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="entry_type">Entry Type</Label>
              <Select
                value={formData.entry_type}
                onValueChange={(value) => setFormData({ ...formData, entry_type: value })}
              >
                <SelectTrigger id="entry_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="web_widget">Web Widget</SelectItem>
                  <SelectItem value="qr_code">QR Code Only</SelectItem>
                  <SelectItem value="both">Both (QR + Widget)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                How users will access this voice AI experience
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Creating..." : "Create Campaign"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/campaigns")}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>

        <Card className="p-4 bg-muted/50">
          <p className="text-sm text-muted-foreground">
            <strong>Next steps after creation:</strong> You'll be able to design your conversation
            flow, upload knowledge base documents, and generate QR codes or embed widgets.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
