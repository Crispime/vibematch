import { DiscussionCard } from "../DiscussionCard";
import avatarImg from "@assets/generated_images/Male_entrepreneur_avatar_7ce6ef92.png";

export default function DiscussionCardExample() {
  return (
    <div className="p-6 max-w-3xl">
      <DiscussionCard
        id="1"
        title="Best practices for building MVP on a tight budget?"
        preview="I'm working on my first startup and have limited runway. What are your recommendations for building an MVP efficiently without compromising quality?"
        author={{
          name: "Michael Rodriguez",
          avatar: avatarImg,
          role: "coder"
        }}
        category="Startup Advice"
        replies={24}
        views={342}
        timestamp="2 hours ago"
      />
    </div>
  );
}
