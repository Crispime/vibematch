import { HeroSection } from "@/components/HeroSection";
import { ProfileCard } from "@/components/ProfileCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import avatar1 from "@assets/generated_images/Female_developer_avatar_c02a1206.png";
import avatar2 from "@assets/generated_images/Male_entrepreneur_avatar_7ce6ef92.png";
import avatar3 from "@assets/generated_images/Technical_lead_avatar_ba01cd9c.png";
import avatar4 from "@assets/generated_images/Investor_avatar_1dd011d3.png";

export default function Home() {
  const [, setLocation] = useLocation();
  
  const featuredProfiles = [
    {
      id: "1",
      name: "Sarah Chen",
      role: "coder" as const,
      avatar: avatar1,
      tagline: "Building AI-powered productivity tools. Looking for seed funding and a technical co-founder.",
      location: "San Francisco, CA",
      tags: ["React", "Node.js", "AI/ML", "SaaS"],
      matchScore: 92
    },
    {
      id: "2",
      name: "Michael Rodriguez",
      role: "investor" as const,
      avatar: avatar4,
      tagline: "Angel investor focused on early-stage B2B SaaS. $50K-$500K tickets.",
      location: "New York, NY",
      tags: ["SaaS", "B2B", "Enterprise", "AI"],
      matchScore: 88
    },
    {
      id: "3",
      name: "David Kim",
      role: "technical" as const,
      avatar: avatar3,
      tagline: "Senior full-stack engineer. 10+ years building scalable systems. Open to CTO roles.",
      location: "Austin, TX",
      tags: ["System Design", "Cloud", "Leadership", "Golang"],
      matchScore: 85
    },
    {
      id: "4",
      name: "Alex Thompson",
      role: "coder" as const,
      avatar: avatar2,
      tagline: "Blockchain enthusiast building decentralized finance solutions. Seeking technical advisors.",
      location: "Miami, FL",
      tags: ["Blockchain", "Web3", "DeFi", "Solidity"],
      matchScore: 90
    }
  ];

  return (
    <div className="min-h-screen">
      <HeroSection />
      
      <section className="py-24 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl font-bold mb-3">Featured Profiles</h2>
              <p className="text-muted-foreground text-lg">Connect with talented individuals in the community</p>
            </div>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => setLocation("/discover")}
              data-testid="button-view-all"
            >
              View All
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProfiles.map((profile) => (
              <ProfileCard key={profile.id} {...profile} />
            ))}
          </div>
        </div>
      </section>
      
      <section className="py-24 relative overflow-hidden bg-muted/30">
        <div className="container mx-auto px-6 text-center relative">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Join thousands of entrepreneurs, developers, and investors building the future together.
          </p>
          <Button size="lg" className="text-lg px-10 py-6 h-auto" data-testid="button-cta-signup">
            Create Your Profile
          </Button>
        </div>
      </section>
    </div>
  );
}
