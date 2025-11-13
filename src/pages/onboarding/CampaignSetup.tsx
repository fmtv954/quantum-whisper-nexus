/**
 * Onboarding Campaign Setup Page
 * Second step - collect basic campaign info and create first campaign
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { createFirstCampaign } from "@/lib/onboarding";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { QrCode, Globe, Sparkles } from "lucide-react";

export default function OnboardingCampaignSetup() {
  const [campaignName, setCampaignName] = useState("");
  const [goal, setGoal] = useState("");
  const [entryType, setEntryType] = useState<'qr_code' | 'web_widget' | 'both'>('web_widget');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!campaignName.trim()) {
      toast({
        title: "Campaign name required",
        description: "Please enter a name for your campaign",
        variant: "destructive",
      });
      return;
    }

    if (!goal.trim()) {
      toast({
        title: "Goal required",
        description: "Please describe what you want to achieve",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { campaign, error } = await createFirstCampaign({
      name: campaignName,
      goal,
      entry_type: entryType,
    });

    if (error) {
      toast({
        title: "Failed to create campaign",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (campaign) {
      toast({
        title: "Campaign created! 🎉",
        description: `${campaign.name} is ready to go. Let's customize it further.`,
      });
      
      // Redirect to dashboard with success state
      navigate('/dashboard', { 
        state: { 
          onboardingComplete: true,
          newCampaignId: campaign.id 
        } 
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8 cyber-grid">
      {/* Animated background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyber-green/10 rounded-full blur-[120px] animate-pulse-glow" />
      
      <div className="relative z-10 w-full max-w-2xl">
        {/* Progress Indicator */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full glow-green">
            <div className="w-2 h-2 bg-cyber-green rounded-full animate-pulse" />
            <span className="text-sm font-mono text-muted-foreground">STEP 2 OF 2</span>
          </div>
        </div>

        <Card className="border-border/50 glass glow-green">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-cyber-green" />
              Create Your First Campaign
            </CardTitle>
            <CardDescription className="text-base">
              Tell us about your use case so we can configure the perfect AI agent for you
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campaign Name */}
              <div className="space-y-2">
                <Label htmlFor="campaign-name" className="text-foreground">
                  Campaign Name *
                </Label>
                <Input
                  id="campaign-name"
                  type="text"
                  placeholder="e.g., Real Estate Open House, Product Demo Line, Event Registration"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="border-border/50 focus:border-cyber-green"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Give your campaign a descriptive name that reflects its purpose
                </p>
              </div>

              {/* Goal/Use Case */}
              <div className="space-y-2">
                <Label htmlFor="goal" className="text-foreground">
                  What's your goal? *
                </Label>
                <Textarea
                  id="goal"
                  placeholder="e.g., Capture leads for our summer event, Answer FAQs about our product, Qualify sales prospects before human handoff"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="border-border/50 focus:border-cyber-green min-h-[100px]"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Describe what you want the AI to do - this helps us configure its behavior
                </p>
              </div>

              {/* Entry Type */}
              <div className="space-y-3">
                <Label className="text-foreground">
                  How will people access this campaign? *
                </Label>
                <RadioGroup 
                  value={entryType} 
                  onValueChange={(value: any) => setEntryType(value)}
                  className="space-y-3"
                >
                  <div className="flex items-start space-x-3 glass p-4 rounded-lg border border-border/50 hover:border-cyber-blue/50 transition-colors cursor-pointer">
                    <RadioGroupItem value="web_widget" id="web_widget" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="web_widget" className="flex items-center gap-2 cursor-pointer">
                        <Globe className="w-4 h-4 text-cyber-blue" />
                        <span className="font-semibold">Web Widget</span>
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Embed on your website for instant voice interactions
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 glass p-4 rounded-lg border border-border/50 hover:border-cyber-green/50 transition-colors cursor-pointer">
                    <RadioGroupItem value="qr_code" id="qr_code" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="qr_code" className="flex items-center gap-2 cursor-pointer">
                        <QrCode className="w-4 h-4 text-cyber-green" />
                        <span className="font-semibold">QR Code</span>
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Perfect for physical locations, events, and print materials
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 glass p-4 rounded-lg border border-border/50 hover:border-cyber-purple/50 transition-colors cursor-pointer">
                    <RadioGroupItem value="both" id="both" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="both" className="flex items-center gap-2 cursor-pointer">
                        <Sparkles className="w-4 h-4 text-cyber-purple" />
                        <span className="font-semibold">Both (Recommended)</span>
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Maximum flexibility - use QR codes and web widgets together
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Info Box */}
              <div className="glass p-4 rounded-lg border border-cyber-blue/30">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-cyber-blue">What happens next:</strong> After creating your campaign, 
                  you can customize the AI's personality, add knowledge sources, configure lead capture forms, 
                  and test the conversation flow.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/onboarding/welcome')}
                  disabled={loading}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-cyber-green hover:bg-cyber-green/90 text-background font-semibold glow-green"
                >
                  {loading ? "Creating..." : "Create Campaign"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Additional context */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Don't worry - you can change all these settings later from your dashboard
          </p>
        </div>
      </div>
    </div>
  );
}
