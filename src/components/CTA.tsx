import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

const CTA = () => {
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Dramatic Background */}
      <div className="absolute inset-0 cyber-grid" />
      <div className="absolute inset-0 bg-gradient-radial from-cyber-blue/20 via-transparent to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyber-green/20 rounded-full blur-[150px] animate-pulse-glow" />
      
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full glass glow-blue mb-8">
          <Sparkles className="h-8 w-8 text-cyber-blue" />
        </div>

        {/* Headline */}
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
          Ready to <span className="holographic-text">Launch</span>?
        </h2>

        {/* Subheadline */}
        <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
          Join 500+ companies using Quantum Voice AI to automate conversations, 
          capture leads, and scale customer engagement 24/7.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button 
            size="lg" 
            className="bg-cyber-blue hover:bg-cyber-blue/90 text-background font-semibold text-lg px-10 py-7 glow-blue group"
          >
            Start Free 14-Day Trial
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="border-cyber-green text-cyber-green hover:bg-cyber-green hover:text-background font-semibold text-lg px-10 py-7 glass"
          >
            Schedule Demo
          </Button>
        </div>

        {/* Trust Signals */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-cyber-green rounded-full" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-cyber-blue rounded-full" />
            <span>Setup in 5 minutes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-cyber-purple rounded-full" />
            <span>Cancel anytime</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
