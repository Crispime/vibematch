import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Briefcase } from "lucide-react";

export type UserRole = "coder" | "investor" | "technical";

export interface ProfileCardProps {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  tagline: string;
  location: string;
  tags: string[];
  matchScore?: number;
}

const roleConfig = {
  coder: { label: "Vibe Coder", gradient: "bg-primary" },
  investor: { label: "Investor", gradient: "bg-primary" },
  technical: { label: "Tech Lead", gradient: "bg-primary" },
};

export function ProfileCard({
  name,
  role,
  avatar,
  tagline,
  location,
  tags,
  matchScore,
}: ProfileCardProps) {
  const config = roleConfig[role];

  return (
    <Card className="hover-elevate overflow-visible border-border/50" data-testid={`card-profile-${name.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="p-8">
        <div className="flex items-start gap-5">
          <Avatar className="h-20 w-20 border-2 border-border">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback>{name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-xl mb-2" data-testid="text-profile-name">{name}</h3>
            
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Badge className={`${config.gradient} text-white shadow-sm`}>
                {config.label}
              </Badge>
              {matchScore && (
                <Badge className="bg-primary text-white">
                  {matchScore}% Match
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
              {tagline}
            </p>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
              <MapPin className="h-3.5 w-3.5" />
              <span>{location}</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs font-medium">
                  {tag}
                </Badge>
              ))}
              {tags.length > 3 && (
                <Badge variant="secondary" className="text-xs font-medium">
                  +{tags.length - 3}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-8 pt-0 flex gap-3">
        <Button variant="default" className="flex-1" data-testid="button-view-profile">
          View Profile
        </Button>
        <Button variant="outline" className="flex-1" data-testid="button-connect">
          Connect
        </Button>
      </CardFooter>
    </Card>
  );
}
