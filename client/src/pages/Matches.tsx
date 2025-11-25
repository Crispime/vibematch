import { useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Check, X, MessageCircle, Sparkles, Heart } from "lucide-react";
import { format } from "date-fns";
import type { Profile, Match } from "@shared/schema";

interface EnrichedMatch extends Match {
  initiatorProfile?: Profile;
  receiverProfile?: Profile;
}

const roleConfig = {
  coder: { label: "Vibe Coder", gradient: "bg-primary" },
  investor: { label: "Investor", gradient: "bg-primary" },
  technical: { label: "Tech Lead", gradient: "bg-primary" },
};

const matchTypeLabels = {
  collaboration: "Collaboration",
  investment: "Investment",
  technical: "Technical Partnership",
  mentorship: "Mentorship",
};

export default function Matches() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Get user's profile
  const { data: profiles } = useQuery<Profile[]>({
    queryKey: ["/api/profiles"],
    enabled: !!user,
  });

  const currentUserProfile = profiles?.find(p => p.userId === user?.id);

  // Get all matches for this user
  const { data: rawMatches, isLoading } = useQuery<Match[]>({
    queryKey: ["/api/matches", currentUserProfile?.id],
    queryFn: async () => {
      if (!currentUserProfile?.id) return [];
      return fetch(`/api/matches/${currentUserProfile.id}`).then(r => r.json());
    },
    enabled: !!currentUserProfile?.id,
  });

  // Enrich matches with profile data using useMemo to always reflect latest data
  const enrichedMatches = useMemo<EnrichedMatch[]>(() => {
    if (!rawMatches || !profiles) return [];
    
    return rawMatches.map(match => ({
      ...match,
      initiatorProfile: profiles.find(p => p.id === match.initiatorId),
      receiverProfile: profiles.find(p => p.id === match.receiverId),
    }));
  }, [rawMatches, profiles]);

  // Respond to match request (accept/reject)
  const respondToMatch = useMutation({
    mutationFn: async ({ matchId, status }: { matchId: string; status: "accepted" | "rejected" }) => {
      return apiRequest(`/api/matches/${matchId}`, "PATCH", {
        status,
        respondedAt: new Date().toISOString(),
      });
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.status === "accepted" ? "Match accepted!" : "Match declined",
        description: variables.status === "accepted" 
          ? "You can now connect with them in the Connections tab"
          : "The match request has been declined",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
    },
    onError: () => {
      toast({
        title: "Action failed",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-4">Please log in to view matches</h1>
        </div>
      </div>
    );
  }

  if (!currentUserProfile) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-4">Create your profile</h1>
          <p className="text-muted-foreground">Set up your profile to start matching</p>
        </div>
      </div>
    );
  }

  const pendingReceived = enrichedMatches?.filter(m => 
    m.status === "pending" && m.receiverId === currentUserProfile.id
  ) || [];

  const pendingSent = enrichedMatches?.filter(m => 
    m.status === "pending" && m.initiatorId === currentUserProfile.id
  ) || [];

  const accepted = enrichedMatches?.filter(m => m.status === "accepted") || [];

  const MatchCard = ({ match, isPending, isReceiver }: { match: EnrichedMatch; isPending: boolean; isReceiver: boolean }) => {
    const otherProfile = isReceiver ? match.initiatorProfile : match.receiverProfile;
    if (!otherProfile) return null;

    const config = roleConfig[otherProfile.role as keyof typeof roleConfig];

    return (
      <Card className="hover-elevate overflow-visible border-border/50" data-testid={`card-match-${otherProfile.name?.toLowerCase().replace(/\s+/g, '-')}`}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 border-2 border-border">
              <AvatarImage src={otherProfile.avatar || undefined} alt={otherProfile.name} />
              <AvatarFallback>{otherProfile.name?.split(" ").map(n => n[0]).join("")}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-bold text-lg" data-testid="text-match-name">{otherProfile.name}</h3>
                <Badge className={`${config.gradient} text-white shadow-sm shrink-0`}>
                  {config.label}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {otherProfile.tagline}
              </p>

              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className="text-xs">
                  {matchTypeLabels[match.matchType as keyof typeof matchTypeLabels]}
                </Badge>
                {match.createdAt && (
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(match.createdAt), "MMM d, yyyy")}
                  </span>
                )}
              </div>
              
              {match.matchReason && (
                <div className="bg-primary/5 border border-primary/20 rounded-md p-3 mb-3">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-foreground/90" data-testid="text-match-reason">
                      {match.matchReason}
                    </p>
                  </div>
                </div>
              )}

              {match.message && (
                <div className="bg-muted/50 rounded-md p-3 mb-3">
                  <p className="text-sm italic text-foreground/80">"{match.message}"</p>
                </div>
              )}

              {isPending && isReceiver ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => respondToMatch.mutate({ matchId: match.id, status: "accepted" })}
                    disabled={respondToMatch.isPending}
                    data-testid="button-accept"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => respondToMatch.mutate({ matchId: match.id, status: "rejected" })}
                    disabled={respondToMatch.isPending}
                    data-testid="button-reject"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Decline
                  </Button>
                </div>
              ) : isPending ? (
                <Badge variant="secondary" className="text-xs">
                  <Heart className="h-3 w-3 mr-1" />
                  Awaiting Response
                </Badge>
              ) : (
                <Button size="sm" variant="outline" data-testid="button-message">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Message
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-6">
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-3">Matches</h1>
          <p className="text-muted-foreground text-lg">Manage your connections and requests</p>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending" data-testid="tab-pending">
              Pending Requests
              {pendingReceived.length > 0 && (
                <Badge className="ml-2 bg-primary text-white">{pendingReceived.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" data-testid="tab-sent">
              Sent Requests
              {pendingSent.length > 0 && (
                <Badge className="ml-2" variant="secondary">{pendingSent.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="connections" data-testid="tab-connections">
              Connections
              {accepted.length > 0 && (
                <Badge className="ml-2" variant="secondary">{accepted.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : pendingReceived.length > 0 ? (
              <div className="space-y-4">
                {pendingReceived.map((match) => (
                  <MatchCard key={match.id} match={match} isPending={true} isReceiver={true} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Heart className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No pending requests</h3>
                  <p className="text-muted-foreground">Check the Discover page to find new matches</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="sent" className="space-y-4">
            {pendingSent.length > 0 ? (
              <div className="space-y-4">
                {pendingSent.map((match) => (
                  <MatchCard key={match.id} match={match} isPending={true} isReceiver={false} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No sent requests</h3>
                  <p className="text-muted-foreground">Visit the Discover page to send match requests</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="connections" className="space-y-4">
            {accepted.length > 0 ? (
              <div className="space-y-4">
                {accepted.map((match) => (
                  <MatchCard 
                    key={match.id} 
                    match={match} 
                    isPending={false} 
                    isReceiver={match.receiverId === currentUserProfile.id} 
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No connections yet</h3>
                  <p className="text-muted-foreground">Accept match requests to build your network</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
