import { Activity, Brain, Database, Shield, Zap, Users } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Brain,
      title: "AI Agent Builder",
      description: "Visual flow designer with drag-and-drop nodes. Build complex conversation logic without code.",
      color: "cyber-blue",
    },
    {
      icon: Zap,
      title: "Real-Time Voice",
      description: "Sub-100ms latency with LiveKit WebRTC. Natural conversation flows that feel human.",
      color: "cyber-green",
    },
    {
      icon: Database,
      title: "Smart RAG Search",
      description: "Upload PDFs, docs, and knowledge bases. AI searches and answers from your content instantly.",
      color: "cyber-purple",
    },
    {
      icon: Activity,
      title: "Live Analytics",
      description: "Mission-control dashboard with real-time call metrics, conversion tracking, and ROI monitoring.",
      color: "cyber-pink",
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "SOC 2 compliant infrastructure. Row-level security, encryption at rest, and GDPR ready.",
      color: "cyber-blue",
    },
    {
      icon: Users,
      title: "Lead Qualification",
      description: "Intelligent lead scoring and routing. Automatically qualify and dispatch to sales teams.",
      color: "cyber-green",
    },
  ];

  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 cyber-grid opacity-30" />
      <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-cyber-purple/10 rounded-full blur-[150px]" />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block glass px-4 py-2 rounded-full mb-6">
            <span className="text-sm font-mono text-cyber-blue">SYSTEM CAPABILITIES</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Enterprise AI, <span className="holographic-text">Startup Pricing</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Built on the same infrastructure that powers SpaceX communications. 
            Optimized for cost without sacrificing performance.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="glass p-8 rounded-lg border border-border hover:border-cyber-blue/50 transition-all group hover:scale-[1.02] hover:glow-blue"
              >
                <div className={`w-12 h-12 rounded-lg bg-${feature.color}/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <Icon className={`h-6 w-6 text-${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Cost Comparison */}
        <div className="mt-20 glass p-8 rounded-xl border border-cyber-green/30 glow-green">
          <div className="grid md:grid-cols-3 gap-8 items-center">
            <div className="text-center">
              <div className="text-5xl font-bold font-mono text-destructive mb-2">$0.25</div>
              <div className="text-sm text-muted-foreground">Competitors / Minute</div>
            </div>
            <div className="flex items-center justify-center">
              <div className="text-4xl font-bold text-cyber-green">→</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold font-mono text-cyber-green mb-2">$0.031</div>
              <div className="text-sm text-muted-foreground">Quantum Voice AI</div>
            </div>
          </div>
          <p className="text-center mt-6 text-cyber-green font-semibold">
            Save $219 per 1,000 minutes • Same enterprise quality
          </p>
        </div>
      </div>
    </section>
  );
};

export default Features;
