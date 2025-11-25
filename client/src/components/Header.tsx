import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Users, MessageSquare, Sparkles, FolderKanban, Heart } from "lucide-react";

export function Header() {
  const [, setLocation] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-20 items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3 hover-elevate active-elevate-2 px-3 py-2 rounded-lg" data-testid="link-home">
          <div className="p-2 rounded-lg bg-primary">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-bold">VibeMatch</span>
        </Link>

        <nav className="hidden md:flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="default" 
            onClick={() => setLocation("/discover")}
            data-testid="link-discover"
          >
            <Users className="h-4 w-4 mr-2" />
            Discover
          </Button>
          <Button 
            variant="ghost" 
            size="default" 
            onClick={() => setLocation("/matches")}
            data-testid="link-matches"
          >
            <Heart className="h-4 w-4 mr-2" />
            Matches
          </Button>
          <Button 
            variant="ghost" 
            size="default" 
            onClick={() => setLocation("/projects")}
            data-testid="link-projects"
          >
            <FolderKanban className="h-4 w-4 mr-2" />
            Projects
          </Button>
          <Button 
            variant="ghost" 
            size="default" 
            onClick={() => setLocation("/discussions")}
            data-testid="link-discussions"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Discussions
          </Button>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="default" size="default" data-testid="button-create-profile">
            Create Profile
          </Button>
        </div>
      </div>
    </header>
  );
}
