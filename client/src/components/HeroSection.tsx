import { Button } from "@/components/ui/button";
import { Sparkles, Users, MessageSquare, TrendingUp } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-[700px] flex items-center justify-center overflow-hidden bg-muted/30">
      <div className="absolute inset-0 bg-gradient-to-b from-background to-muted/50" />
      
      <div className="relative z-10 container mx-auto px-4 py-24 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-8">
            <div className="p-4 rounded-full bg-primary">
              <Sparkles className="h-12 w-12 text-white" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight">
            Connect. Collaborate. <span className="text-primary">Create.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            The platform where vibe coders, investors, and technical leads come together to build the future.
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center mb-16">
            <Button 
              size="lg" 
              variant="default"
              className="text-lg px-10 py-6 h-auto"
              data-testid="button-get-started"
            >
              Get Started
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-10 py-6 h-auto"
              data-testid="button-learn-more"
            >
              Learn More
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-card border border-border rounded-xl p-8 hover-elevate">
              <div className="p-3 rounded-lg bg-primary/10 w-fit mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold mb-3 text-lg">Find Your Team</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Connect with talented coders and technical leads</p>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-8 hover-elevate">
              <div className="p-3 rounded-lg bg-primary/10 w-fit mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold mb-3 text-lg">Secure Funding</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Match with investors who believe in your vision</p>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-8 hover-elevate">
              <div className="p-3 rounded-lg bg-primary/10 w-fit mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold mb-3 text-lg">Join the Community</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Engage in discussions and share knowledge</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
