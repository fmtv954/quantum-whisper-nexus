import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Architecture from "@/components/Architecture";
import CTA from "@/components/CTA";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="font-mono text-xl font-bold holographic-text">
            QUANTUM VOICE AI
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="text-sm">
                Log in
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-cyber-blue hover:bg-cyber-blue/90 text-sm">
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      </nav>
      
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
