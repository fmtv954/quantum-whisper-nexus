import { Button } from "@/components/ui/button";
import { ArrowRight, Mic, Zap } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden cyber-grid">
      {/* Animated Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background pointer-events-none" />
      
      {/* Floating Orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-cyber-blue/20 rounded-full blur-[100px] animate-pulse-glow" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyber-green/20 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: "1s" }} />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-8 glow-blue">
          <div className="w-2 h-2 bg-cyber-green rounded-full animate-pulse" />
          <span className="text-sm font-mono text-silver">SYSTEM ONLINE • 99.9% UPTIME</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
          <span className="text-foreground">Voice AI That</span>
          <br />
          <span className="holographic-text">Converts 24/7</span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
          Enterprise-grade conversational AI platform that captures leads, qualifies prospects, 
          and books meetings while you sleep. <span className="text-cyber-blue font-semibold">80% lower cost</span> than competitors.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button 
            size="lg" 
            className="bg-cyber-blue hover:bg-cyber-blue/90 text-background font-semibold text-lg px-8 py-6 glow-blue group"
          >
            Start Free Trial
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="border-cyber-green text-cyber-green hover:bg-cyber-green hover:text-background font-semibold text-lg px-8 py-6 glass"
          >
            <Mic className="mr-2 h-5 w-5" />
            Try Live Demo
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {[
            { value: "80%", label: "Cost Savings", color: "cyber-green" },
            { value: "<100ms", label: "Response Time", color: "cyber-blue" },
            { value: "24/7", label: "Availability", color: "cyber-purple" },
            { value: "99.9%", label: "Uptime", color: "cyber-pink" },
          ].map((stat, index) => (
            <div 
              key={index} 
              className="glass p-6 rounded-lg border-pulse group hover:scale-105 transition-transform"
            >
              <div className={`text-3xl font-bold font-mono mb-2 text-${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wide">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Social Proof */}
        <div className="mt-16 flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground uppercase tracking-wider">
            TRUSTED BY INDUSTRY LEADERS
          </p>
          <div className="flex gap-8 items-center opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
            <div className="font-bold text-xl">Tesla</div>
            <div className="font-bold text-xl">SpaceX</div>
            <div className="font-bold text-xl">Amazon</div>
            <div className="font-bold text-xl">Stripe</div>
          </div>
        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default Hero;
