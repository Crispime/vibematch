import OpenAI from "openai";
import type { Profile, Project } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

interface MatchCandidate {
  profile: Profile;
  projects?: Project[];
}

interface MatchResult {
  profileId: string;
  matchScore: number;
  matchReason: string;
  matchType: "collaboration" | "investment" | "technical" | "mentorship";
}

export async function generateMatches(
  currentUser: Profile,
  currentUserProjects: Project[],
  candidates: MatchCandidate[],
  limit: number = 10
): Promise<MatchResult[]> {
  if (candidates.length === 0) {
    return [];
  }

  const prompt = buildMatchingPrompt(currentUser, currentUserProjects, candidates);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert matchmaking AI for a professional networking platform called VibeMatch. 
Your job is to analyze user profiles and intelligently match:
- Vibe Coders (entrepreneurs/builders) with Investors and Tech Leads
- Investors with Vibe Coders who have promising projects
- Tech Leads with Vibe Coders who need technical leadership

Consider: skills alignment, project fit, location proximity, complementary expertise, and strategic value.
Return match scores (0-100) with specific, actionable reasons.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return [];
    }

    const aiResponse = JSON.parse(content);
    const matches: MatchResult[] = aiResponse.matches || [];

    return matches
      .filter((m: MatchResult) => m.matchScore >= 50)
      .sort((a: MatchResult, b: MatchResult) => b.matchScore - a.matchScore)
      .slice(0, limit);
  } catch (error) {
    console.error("AI matching error:", error);
    return [];
  }
}

function buildMatchingPrompt(
  currentUser: Profile,
  currentUserProjects: Project[],
  candidates: MatchCandidate[]
): string {
  const userDescription = `
Current User Profile:
- Name: ${currentUser.name}
- Role: ${currentUser.role}
- Tagline: ${currentUser.tagline || "N/A"}
- Location: ${currentUser.location || "N/A"}
- Skills/Tags: ${currentUser.tags?.join(", ") || "N/A"}
${
  currentUserProjects.length > 0
    ? `
- Projects:
${currentUserProjects
  .map(
    (p) => `  * ${p.name}: ${p.description || "N/A"}
    - Stage: ${p.currentStage || "N/A"}
    - Looking for: ${p.lookingFor?.join(", ") || "N/A"}
    - Tech Stack: ${p.techStack?.join(", ") || "N/A"}
    - Funding Goal: ${p.fundingGoal ? `$${p.fundingGoal}` : "N/A"}`
  )
  .join("\n")}`
    : ""
}
`;

  const candidatesDescription = candidates
    .map((c, idx) => {
      const projects = c.projects || [];
      return `
Candidate ${idx + 1}:
- ID: ${c.profile.id}
- Name: ${c.profile.name}
- Role: ${c.profile.role}
- Tagline: ${c.profile.tagline || "N/A"}
- Location: ${c.profile.location || "N/A"}
- Skills/Tags: ${c.profile.tags?.join(", ") || "N/A"}
${
  projects.length > 0
    ? `- Projects:
${projects
  .map(
    (p) => `  * ${p.name}: ${p.description || "N/A"}
    - Stage: ${p.currentStage || "N/A"}
    - Looking for: ${p.lookingFor?.join(", ") || "N/A"}
    - Tech Stack: ${p.techStack?.join(", ") || "N/A"}`
  )
  .join("\n")}`
    : ""
}`;
    })
    .join("\n---\n");

  return `${userDescription}

---
Candidate Profiles to Match:
${candidatesDescription}

---
Instructions:
Analyze each candidate and determine their match quality with the current user.
For each candidate, provide:
1. matchScore (0-100): How well they match
2. matchReason: A specific, actionable 1-2 sentence explanation
3. matchType: "collaboration", "investment", "technical", or "mentorship"

Only include candidates with a match score of 50 or higher.

Return your response as JSON in this format:
{
  "matches": [
    {
      "profileId": "candidate-id",
      "matchScore": 85,
      "matchReason": "Strong technical alignment with React and Node.js skills. Their experience in scalable systems matches your MVP stage project needs.",
      "matchType": "technical"
    }
  ]
}`;
}

export async function explainMatch(
  user1: Profile,
  user2: Profile,
  user1Projects?: Project[],
  user2Projects?: Project[]
): Promise<{ reason: string; matchType: string }> {
  const prompt = `
User 1:
- Name: ${user1.name}
- Role: ${user1.role}
- Skills: ${user1.tags?.join(", ") || "N/A"}
- Tagline: ${user1.tagline || "N/A"}
${user1Projects?.length ? `- Has ${user1Projects.length} project(s)` : ""}

User 2:
- Name: ${user2.name}
- Role: ${user2.role}
- Skills: ${user2.tags?.join(", ") || "N/A"}
- Tagline: ${user2.tagline || "N/A"}
${user2Projects?.length ? `- Has ${user2Projects.length} project(s)` : ""}

Explain in 1-2 sentences why these two users would be a good match. Also determine the match type: "collaboration", "investment", "technical", or "mentorship".

Return JSON:
{
  "reason": "explanation here",
  "matchType": "technical"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a matchmaking expert. Provide concise, specific match explanations.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (content) {
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("AI explain match error:", error);
  }

  return {
    reason: "Potential collaboration opportunity based on complementary skills.",
    matchType: "collaboration",
  };
}
