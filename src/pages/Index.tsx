import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Architecture from "@/components/Architecture";
import CTA from "@/components/CTA";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <Features />
      <Architecture />
      <CTA />
      
      {/* Footer */}
      <footer className="border-t border-border/50 py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="font-mono text-2xl font-bold mb-4 holographic-text">
            QUANTUM VOICE AI
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Enterprise Voice AI Platform • Built with Next.js, Supabase & LiveKit
          </p>
          <div className="flex justify-center gap-8 text-sm text-muted-foreground">
            <a href="#" className="hover:text-cyber-blue transition-colors">Documentation</a>
            <a href="#" className="hover:text-cyber-blue transition-colors">API Reference</a>
            <a href="#" className="hover:text-cyber-blue transition-colors">Support</a>
            <a href="#" className="hover:text-cyber-blue transition-colors">Status</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
