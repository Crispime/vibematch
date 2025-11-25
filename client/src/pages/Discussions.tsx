import { useState } from "react";
import { DiscussionCard } from "@/components/DiscussionCard";
import { CreateDiscussionModal } from "@/components/CreateDiscussionModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus } from "lucide-react";
import avatar1 from "@assets/generated_images/Female_developer_avatar_c02a1206.png";
import avatar2 from "@assets/generated_images/Male_entrepreneur_avatar_7ce6ef92.png";
import avatar3 from "@assets/generated_images/Technical_lead_avatar_ba01cd9c.png";
import avatar4 from "@assets/generated_images/Investor_avatar_1dd011d3.png";

export default function Discussions() {
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const discussions = [
    {
      id: "1",
      title: "Best practices for building MVP on a tight budget?",
      preview: "I'm working on my first startup and have limited runway. What are your recommendations for building an MVP efficiently without compromising quality?",
      author: {
        name: "Michael Rodriguez",
        avatar: avatar2,
        role: "coder" as const
      },
      category: "Startup Advice",
      replies: 24,
      views: 342,
      timestamp: "2 hours ago"
    },
    {
      id: "2",
      title: "Looking for technical co-founder for AI project",
      preview: "I've validated my AI-powered analytics product with customers and secured pre-seed funding. Need a technical co-founder with ML experience.",
      author: {
        name: "Sarah Chen",
        avatar: avatar1,
        role: "coder" as const
      },
      category: "Networking",
      replies: 18,
      views: 256,
      timestamp: "5 hours ago"
    },
    {
      id: "3",
      title: "What metrics do VCs look for in Series A rounds?",
      preview: "We're preparing for our Series A and want to understand what metrics investors prioritize at this stage. ARR, growth rate, retention?",
      author: {
        name: "James Park",
        avatar: avatar4,
        role: "investor" as const
      },
      category: "Funding",
      replies: 31,
      views: 478,
      timestamp: "1 day ago"
    },
    {
      id: "4",
      title: "Kubernetes vs serverless for early-stage startups",
      preview: "Debating infrastructure choices for our SaaS platform. What are the pros and cons of Kubernetes vs serverless architectures for scaling?",
      author: {
        name: "David Kim",
        avatar: avatar3,
        role: "technical" as const
      },
      category: "Tech Discussion",
      replies: 42,
      views: 612,
      timestamp: "2 days ago"
    },
    {
      id: "5",
      title: "Remote hiring strategies that actually work",
      preview: "After building two distributed teams, here's what I learned about hiring remotely. Happy to share insights and answer questions.",
      author: {
        name: "Emma Wilson",
        avatar: avatar1,
        role: "technical" as const
      },
      category: "Job Opportunities",
      replies: 15,
      views: 289,
      timestamp: "3 days ago"
    }
  ];

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-12 flex-wrap gap-4">
            <div>
              <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Discussions</h1>
              <p className="text-muted-foreground text-lg">Join the conversation</p>
            </div>
            <Button onClick={() => setModalOpen(true)} size="lg" className="shadow-lg shadow-primary/20" data-testid="button-new-discussion">
              <Plus className="h-4 w-4 mr-2" />
              New Discussion
            </Button>
          </div>

          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search discussions..."
                className="pl-12 h-14 text-base border-border/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-discussions"
              />
            </div>
          </div>

          <Tabs defaultValue="all" className="mb-6">
            <TabsList>
              <TabsTrigger value="all" data-testid="tab-all-discussions">All</TabsTrigger>
              <TabsTrigger value="startup" data-testid="tab-startup">Startup Advice</TabsTrigger>
              <TabsTrigger value="tech" data-testid="tab-tech">Tech</TabsTrigger>
              <TabsTrigger value="funding" data-testid="tab-funding">Funding</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-6">
            {discussions.map((discussion) => (
              <DiscussionCard key={discussion.id} {...discussion} />
            ))}
          </div>
        </div>
      </div>

      <CreateDiscussionModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
