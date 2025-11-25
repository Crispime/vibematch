import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Search, MapPin, Sparkles, Heart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Profile } from "@shared/schema";

interface AIMatchSuggestion {
  profileId: string;
  matchScore: number;
  matchReason: string;
  matchType: "collaboration" | "investment" | "technical" | "mentorship";
  profile: Profile;
}

const roleConfig = {
  coder: { label: "Vibe Coder", gradient: "bg-primary" },
  investor: { label: "Investor", gradient: "bg-primary" },
  technical: { label: "Tech Lead", gradient: "bg-primary" },
};

export default function Discover() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Get user's profile
  const { data: profiles } = useQuery<Profile[]>({
    queryKey: ["/api/profiles"],
    enabled: !!user,
  });

  const currentUserProfile = profiles?.find(p => p.userId === user?.id);

  // Get AI-powered match suggestions
  const roleParam = selectedRole ? `?role=${selectedRole}` : "";
  const suggestionsUrl = currentUserProfile?.id 
    ? `/api/matches/suggestions/${currentUserProfile.id}${roleParam}`
    : null;
    
  const { data: aiMatches, isLoading } = useQuery<AIMatchSuggestion[]>({
    queryKey: [suggestionsUrl],
    enabled: !!suggestionsUrl,
  });

  // Send match request mutation
  const sendMatchRequest = useMutation({
    mutationFn: async (suggestion: AIMatchSuggestion) => {
      if (!currentUserProfile) throw new Error("No profile found");
      
      return apiRequest("/api/matches", "POST", {
        initiatorId: currentUserProfile.id,
        receiverId: suggestion.profileId,
        status: "pending",
        matchType: suggestion.matchType,
        matchReason: suggestion.matchReason,
        message: `I think we'd be a great match! ${suggestion.matchReason}`,
      });
    },
    onSuccess: () => {
      toast({
        title: "Match request sent!",
        description: "They'll be notified of your interest.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/matches/suggestions"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send request",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Filter matches by search query (with null safety)
  const filteredMatches = Array.isArray(aiMatches) ? aiMatches.filter(match => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      match.profile.name?.toLowerCase().includes(query) ||
      match.profile.tagline?.toLowerCase().includes(query) ||
      match.profile.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }) : [];

  if (!user) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-4">Please log in to discover matches</h1>
          <p className="text-muted-foreground">Create your profile to get AI-powered recommendations</p>
        </div>
      </div>
    );
  }

  if (!currentUserProfile) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-4">Create your profile</h1>
          <p className="text-muted-foreground">Set up your profile to start discovering matches</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-6">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              AI-Powered Matches
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Discover your perfect collaborators, investors, and technical partners
          </p>
        </div>

        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by name, skills, or interests..."
              className="pl-12 h-14 text-base border-border/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search"
            />
          </div>
        </div>

        <Tabs defaultValue="all" className="mb-6" onValueChange={(v) => setSelectedRole(v === "all" ? null : v)}>
          <TabsList>
            <TabsTrigger value="all" data-testid="tab-all">All Matches</TabsTrigger>
            <TabsTrigger value="coder" data-testid="tab-coders">Vibe Coders</TabsTrigger>
            <TabsTrigger value="investor" data-testid="tab-investors">Investors</TabsTrigger>
            <TabsTrigger value="technical" data-testid="tab-technical">Tech Leads</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-visible">
                <CardContent className="p-8">
                  <div className="flex items-start gap-5">
                    <Skeleton className="h-20 w-20 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredMatches && filteredMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredMatches.map((match) => {
              const config = roleConfig[match.profile.role as keyof typeof roleConfig];
              return (
                <Card key={match.profileId} className="hover-elevate overflow-visible border-border/50" data-testid={`card-match-${match.profile.name?.toLowerCase().replace(/\s+/g, '-')}`}>
                  <CardContent className="p-8">
                    <div className="flex items-start gap-5">
                      <Avatar className="h-20 w-20 border-2 border-border">
                        <AvatarImage src={match.profile.avatar || undefined} alt={match.profile.name} />
                        <AvatarFallback>{match.profile.name?.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-xl mb-2" data-testid="text-match-name">{match.profile.name}</h3>
                        
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <Badge className={`${config.gradient} text-white shadow-sm`}>
                            {config.label}
                          </Badge>
                          <Badge className="bg-primary text-white" data-testid="badge-match-score">
                            {match.matchScore}% Match
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                          {match.profile.tagline}
                        </p>
                        
                        {match.profile.location && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{match.profile.location}</span>
                          </div>
                        )}
                        
                        <div className="bg-primary/5 border border-primary/20 rounded-md p-3 mb-4">
                          <div className="flex items-start gap-2">
                            <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <p className="text-sm text-foreground/90" data-testid="text-match-reason">
                              {match.matchReason}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {match.profile.tags?.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs font-medium">
                              {tag}
                            </Badge>
                          ))}
                          {match.profile.tags && match.profile.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs font-medium">
                              +{match.profile.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="p-8 pt-0 flex gap-3">
                    <Button 
                      variant="default" 
                      className="flex-1"
                      onClick={() => sendMatchRequest.mutate(match)}
                      disabled={sendMatchRequest.isPending}
                      data-testid="button-send-request"
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      {sendMatchRequest.isPending ? "Sending..." : "Send Request"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Sparkles className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold mb-2">No matches found</h3>
            <p className="text-muted-foreground">
              {searchQuery 
                ? "Try a different search term" 
                : "Check back later for new recommendations"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
