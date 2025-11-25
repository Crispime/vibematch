import { ProfileCard } from "../ProfileCard";
import avatarImg from "@assets/generated_images/Female_developer_avatar_c02a1206.png";

export default function ProfileCardExample() {
  return (
    <div className="p-6 max-w-md">
      <ProfileCard
        id="1"
        name="Sarah Chen"
        role="coder"
        avatar={avatarImg}
        tagline="Building AI-powered productivity tools. Looking for seed funding and a technical co-founder."
        location="San Francisco, CA"
        tags={["React", "Node.js", "AI/ML", "SaaS"]}
        matchScore={92}
      />
    </div>
  );
}
