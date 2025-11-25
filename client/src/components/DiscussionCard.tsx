import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Eye } from "lucide-react";

export interface DiscussionCardProps {
  id: string;
  title: string;
  preview: string;
  author: {
    name: string;
    avatar: string;
    role: "coder" | "investor" | "technical";
  };
  category: string;
  replies: number;
  views: number;
  timestamp: string;
}

const roleConfig = {
  coder: { label: "Vibe Coder", gradient: "bg-gradient-to-r from-blue-600 to-cyan-600" },
  investor: { label: "Investor", gradient: "bg-gradient-to-r from-emerald-600 to-teal-600" },
  technical: { label: "Tech Lead", gradient: "bg-gradient-to-r from-violet-600 to-purple-600" },
};

export function DiscussionCard({
  title,
  preview,
  author,
  category,
  replies,
  views,
  timestamp,
}: DiscussionCardProps) {
  const config = roleConfig[author.role];

  return (
    <Card className="hover-elevate overflow-visible border-border/50" data-testid={`card-discussion-${title.toLowerCase().replace(/\s+/g, '-').slice(0, 20)}`}>
      <CardContent className="p-8">
        <div className="flex items-start gap-5">
          <Avatar className="h-12 w-12 shrink-0 border-2 border-border">
            <AvatarImage src={author.avatar} alt={author.name} />
            <AvatarFallback>{author.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="font-semibold text-sm" data-testid="text-author-name">{author.name}</span>
              <Badge className={`${config.gradient} text-white text-xs shadow-sm`}>
                {config.label}
              </Badge>
              <span className="text-xs text-muted-foreground">• {timestamp}</span>
            </div>
            
            <h3 className="font-bold text-xl mb-3 line-clamp-2 leading-tight" data-testid="text-discussion-title">
              {title}
            </h3>
            
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
              {preview}
            </p>
            
            <div className="flex items-center gap-4 flex-wrap">
              <Badge variant="secondary" className="font-medium">{category}</Badge>
              
              <div className="flex items-center gap-5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span className="font-medium">{replies}</span> {replies === 1 ? 'reply' : 'replies'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" />
                  <span className="font-medium">{views}</span> views
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
