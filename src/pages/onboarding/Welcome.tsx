/**
 * Onboarding Welcome Page
 * First step of the onboarding flow - introduces the user to Quantum Voice AI
 */

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Rocket, Mic, Zap, Users } from "lucide-react";

export default function OnboardingWelcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 cyber-grid">
      {/* Animated background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background pointer-events-none" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-cyber-blue/10 rounded-full blur-[100px] animate-pulse-glow" />
      
      <div className="relative z-10 w-full max-w-2xl">
        {/* Progress Indicator */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full glow-blue">
            <div className="w-2 h-2 bg-cyber-green rounded-full animate-pulse" />
            <span className="text-sm font-mono text-muted-foreground">STEP 1 OF 2</span>
          </div>
        </div>

        <Card className="border-border/50 glass glow-blue">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-cyber-blue/10 flex items-center justify-center glow-blue">
              <Rocket className="w-8 h-8 text-cyber-blue" />
            </div>
            <CardTitle className="text-3xl font-bold">
              Welcome to <span className="holographic-text">Quantum Voice AI</span>
            </CardTitle>
            <CardDescription className="text-lg">
              Let's get you set up with your first AI-powered voice campaign in under 2 minutes
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* What is a campaign */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">What you'll create:</h3>
              <p className="text-muted-foreground leading-relaxed">
                A <strong className="text-cyber-blue">campaign</strong> is your AI-powered voice experience that captures leads 
                and answers questions 24/7. It can be accessed via QR codes, embedded web widgets, or direct links.
              </p>
            </div>

            {/* Features grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass p-4 rounded-lg border border-border/50 hover:border-cyber-blue/50 transition-colors">
                <Mic className="w-6 h-6 text-cyber-green mb-2" />
                <h4 className="font-semibold text-sm mb-1">Voice AI Agent</h4>
                <p className="text-xs text-muted-foreground">
                  Natural conversations that qualify and capture leads
                </p>
              </div>

              <div className="glass p-4 rounded-lg border border-border/50 hover:border-cyber-blue/50 transition-colors">
                <Zap className="w-6 h-6 text-cyber-blue mb-2" />
                <h4 className="font-semibold text-sm mb-1">Real-time Response</h4>
                <p className="text-xs text-muted-foreground">
                  &lt;100ms latency for human-like interaction
                </p>
              </div>

              <div className="glass p-4 rounded-lg border border-border/50 hover:border-cyber-blue/50 transition-colors">
                <Users className="w-6 h-6 text-cyber-purple mb-2" />
                <h4 className="font-semibold text-sm mb-1">Lead Capture</h4>
                <p className="text-xs text-muted-foreground">
                  Automatically collect contact info and intent
                </p>
              </div>
            </div>

            {/* What's next */}
            <div className="glass p-4 rounded-lg border border-cyber-green/30">
              <p className="text-sm text-muted-foreground">
                <strong className="text-cyber-green">Next step:</strong> We'll ask you to name your campaign 
                and describe its purpose. This helps us configure the AI to match your goals.
              </p>
            </div>

            {/* CTA */}
            <Button 
              onClick={() => navigate('/onboarding/campaign-setup')}
              className="w-full bg-cyber-blue hover:bg-cyber-blue/90 text-background font-semibold text-lg py-6 glow-blue"
              size="lg"
            >
              Continue to Setup
            </Button>

            {/* Skip option (optional) */}
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              I'll do this later
            </button>
          </CardContent>
        </Card>

        {/* Additional context */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            You can customize flows, add knowledge bases, and configure advanced settings after completing setup
          </p>
        </div>
      </div>
    </div>
  );
}
