import { Database, Cpu, Radio, Lock } from "lucide-react";

const Architecture = () => {
  const layers = [
    {
      title: "Client Layer",
      icon: Radio,
      components: ["Web Browser", "Mobile App", "QR Code Scanner"],
      color: "cyber-blue",
    },
    {
      title: "Real-Time Layer",
      icon: Cpu,
      components: ["LiveKit WebRTC", "Deepgram STT/TTS", "Socket Fallback"],
      color: "cyber-green",
    },
    {
      title: "AI Services",
      icon: Brain,
      components: ["GPT-4-mini", "Gemini RAG", "Tavily Search"],
      color: "cyber-purple",
    },
    {
      title: "Data Layer",
      icon: Database,
      components: ["Supabase PostgreSQL", "Redis Cache", "File Storage"],
      color: "cyber-pink",
    },
  ];

  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8">
      {/* Background */}
      <div className="absolute inset-0 cyber-grid opacity-20" />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block glass px-4 py-2 rounded-full mb-6">
            <span className="text-sm font-mono text-cyber-green">SYSTEM ARCHITECTURE</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Built Like <span className="holographic-text">Mission Control</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Multi-layered architecture designed for reliability, scalability, and real-time performance.
          </p>
        </div>

        {/* Architecture Diagram */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {layers.map((layer, index) => {
            const Icon = layer.icon;
            return (
              <div
                key={index}
                className="glass p-6 rounded-lg border-2 border-border hover:border-cyber-blue/50 transition-all relative group"
              >
                {/* Connection Line */}
                {index < layers.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-cyber-blue/30 group-hover:bg-cyber-blue transition-colors">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-cyber-blue rounded-full" />
                  </div>
                )}
                
                <div className={`w-12 h-12 rounded-lg bg-${layer.color}/10 flex items-center justify-center mb-4`}>
                  <Icon className={`h-6 w-6 text-${layer.color}`} />
                </div>
                <h3 className="text-lg font-bold mb-4 text-foreground">
                  {layer.title}
                </h3>
                <div className="space-y-2">
                  {layer.components.map((component, i) => (
                    <div
                      key={i}
                      className="text-sm text-muted-foreground font-mono bg-background/50 px-3 py-2 rounded border border-border/50"
                    >
                      {component}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tech Stack Pills */}
        <div className="flex flex-wrap justify-center gap-3 mt-12">
          {[
            "Next.js 14",
            "TypeScript",
            "Supabase",
            "LiveKit",
            "Deepgram",
            "OpenAI GPT-4",
            "Redis",
            "WebRTC",
            "Tailwind CSS",
          ].map((tech, index) => (
            <div
              key={index}
              className="glass px-4 py-2 rounded-full text-sm font-mono text-muted-foreground hover:text-cyber-blue hover:border-cyber-blue/50 border border-border transition-all cursor-default"
            >
              {tech}
            </div>
          ))}
        </div>

        {/* Security Badge */}
        <div className="mt-16 glass p-6 rounded-xl border border-cyber-green/30 max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-4">
            <Lock className="h-8 w-8 text-cyber-green" />
            <div>
              <div className="font-bold text-lg mb-1">Enterprise Security</div>
              <div className="text-sm text-muted-foreground">
                SOC 2 Type II • GDPR Compliant • 256-bit Encryption • Row-Level Security
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Note: Missing Brain import
import { Brain } from "lucide-react";

export default Architecture;
