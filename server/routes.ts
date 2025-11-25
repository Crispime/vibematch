import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";
import type { Profile } from "@shared/schema";
import { 
  insertProfileSchema, 
  insertProjectSchema, 
  insertProjectMemberSchema,
  insertCodeRepositorySchema,
  insertProjectDocumentSchema,
  insertTaskSchema,
  insertContributionSchema,
  insertMatchSchema
} from "@shared/schema";
import { generateMatches } from "./aiMatchingService";

// Helper: Extract current user's profile from auth headers/session
async function resolveCurrentProfile(req: any): Promise<Profile | null> {
  let userId: string | undefined;
  
  // Allow x-user-id header in development/test modes OR when x-user-id header is present
  const hasDevHeader = !!req.headers['x-user-id'];
  const allowDevAuth = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' || hasDevHeader;
  
  if (allowDevAuth && req.headers['x-user-id']) {
    userId = req.headers['x-user-id'] as string;
  } else if (req.user?.claims?.sub) {
    userId = req.user.claims.sub;
  }
  
  if (!userId) {
    return null;
  }
  
  let profile = await storage.getProfileByUserId(userId);
  
  // Auto-create profile for development/test users if it doesn't exist
  if (!profile && allowDevAuth && userId && hasDevHeader) {
    console.log(`Auto-creating test profile for user: ${userId}`);
    const newProfile = await storage.createProfile({
      userId: userId,
      email: `${userId}@test.com`,
      firstName: userId.split('-')[0] || 'Test',
      lastName: 'User',
      role: userId.includes('vibe-coder') ? 'coder' : userId.includes('investor') ? 'investor' : 'technical',
      location: 'Test Location',
    });
    profile = newProfile;
  }
  
  return profile || null;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit OIDC authentication
  await setupAuth(app);

  // Auth endpoints
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      let userId: string | undefined;
      
      // In development/test mode, allow x-user-id header for testing
      const allowDevAuth = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
      if (allowDevAuth) {
        userId = req.headers['x-user-id'] as string;
        if (userId) {
          // Create a test user if it doesn't exist
          let user = await storage.getUser(userId);
          if (!user) {
            user = await storage.upsertUser({
              id: userId,
              email: `${userId}@test.com`,
              firstName: userId,
              lastName: 'Test',
            });
          }
          return res.json(user);
        }
      }
      
      // Production: require OIDC authentication
      if (!req.isAuthenticated() || !req.user?.claims?.sub) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      userId = req.user.claims.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Profiles
  app.get("/api/profiles", async (req, res) => {
    try {
      const role = req.query.role as string | undefined;
      const profiles = role 
        ? await storage.getProfilesByRole(role)
        : await storage.getAllProfiles();
      res.json(profiles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profiles" });
    }
  });

  app.get("/api/profiles/:id", async (req, res) => {
    try {
      const profile = await storage.getProfile(req.params.id);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.post("/api/profiles", async (req, res) => {
    try {
      const profileData = insertProfileSchema.parse(req.body);
      const profile = await storage.createProfile(profileData);
      res.status(201).json(profile);
    } catch (error) {
      res.status(400).json({ error: "Invalid profile data" });
    }
  });

  // Projects
  app.get("/api/projects", async (req, res) => {
    try {
      const vibeCodeId = req.query.vibeCodeId as string | undefined;
      const projects = vibeCodeId
        ? await storage.getProjectsByVibeCoder(vibeCodeId)
        : await storage.getAllProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      console.log("Received project data:", req.body);
      
      // Ensure profile exists before creating project (auto-creates in dev mode)
      const currentProfile = await resolveCurrentProfile(req);
      if (!currentProfile) {
        return res.status(401).json({ error: "Unauthorized: Profile not found" });
      }
      
      const projectData = insertProjectSchema.parse(req.body);
      console.log("Parsed project data:", projectData);
      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      console.error("Project creation error:", error);
      res.status(400).json({ error: "Invalid project data", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.updateProject(req.params.id, req.body);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(400).json({ error: "Failed to update project" });
    }
  });

  // Project Members
  app.get("/api/projects/:projectId/members", async (req, res) => {
    try {
      const members = await storage.getProjectMembers(req.params.projectId);
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project members" });
    }
  });

  app.post("/api/projects/:projectId/members", async (req, res) => {
    try {
      const memberData = insertProjectMemberSchema.parse({
        ...req.body,
        projectId: req.params.projectId,
      });
      const member = await storage.addProjectMember(memberData);
      res.status(201).json(member);
    } catch (error) {
      res.status(400).json({ error: "Invalid member data" });
    }
  });

  app.patch("/api/project-members/:id", async (req, res) => {
    try {
      // Require authenticated user (even in demo mode)
      const currentUserId = req.headers['x-user-id'] as string;
      if (!currentUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Validate input - only allow hasAccess updates
      const updateSchema = z.object({
        hasAccess: z.boolean(),
      });
      
      const validatedData = updateSchema.parse(req.body);

      // Get the member directly by ID
      const memberToUpdate = await storage.getProjectMember(req.params.id);
      if (!memberToUpdate) {
        return res.status(404).json({ error: "Member not found" });
      }

      // Get the project to check ownership
      const project = await storage.getProject(memberToUpdate.projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Verify requester is the vibe coder (project owner)
      if (currentUserId !== project.vibeCodeId) {
        return res.status(403).json({ error: "Only the project owner can update member access" });
      }

      // Update only the hasAccess field
      const member = await storage.updateProjectMember(req.params.id, validatedData);
      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }
      res.json(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      res.status(400).json({ error: "Failed to update member" });
    }
  });

  // Code Repositories
  app.get("/api/projects/:projectId/repositories", async (req, res) => {
    try {
      const repos = await storage.getCodeRepositoriesByProject(req.params.projectId);
      res.json(repos);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch repositories" });
    }
  });

  app.get("/api/repositories/:id", async (req, res) => {
    try {
      const repo = await storage.getCodeRepository(req.params.id);
      if (!repo) {
        return res.status(404).json({ error: "Repository not found" });
      }
      res.json(repo);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch repository" });
    }
  });

  app.post("/api/projects/:projectId/repositories", async (req, res) => {
    try {
      const repoData = insertCodeRepositorySchema.parse({
        ...req.body,
        projectId: req.params.projectId,
      });
      const repo = await storage.createCodeRepository(repoData);
      res.status(201).json(repo);
    } catch (error) {
      res.status(400).json({ error: "Invalid repository data" });
    }
  });

  app.patch("/api/repositories/:id", async (req, res) => {
    try {
      const repo = await storage.updateCodeRepository(req.params.id, req.body);
      if (!repo) {
        return res.status(404).json({ error: "Repository not found" });
      }
      res.json(repo);
    } catch (error) {
      res.status(400).json({ error: "Failed to update repository" });
    }
  });

  // Project Documents
  app.get("/api/projects/:projectId/documents", async (req, res) => {
    try {
      const documents = await storage.getProjectDocumentsByProject(req.params.projectId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  app.post("/api/projects/:projectId/documents", async (req, res) => {
    try {
      const documentData = insertProjectDocumentSchema.parse({
        ...req.body,
        projectId: req.params.projectId,
      });
      const document = await storage.createProjectDocument(documentData);
      res.status(201).json(document);
    } catch (error) {
      res.status(400).json({ error: "Invalid document data" });
    }
  });

  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const currentProfile = await resolveCurrentProfile(req);
      if (!currentProfile) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Get document to check ownership
      const document = await storage.getProjectDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Get project to verify user is the owner
      const project = await storage.getProject(document.projectId);
      if (!project || project.vibeCodeId !== currentProfile.id) {
        return res.status(403).json({ error: "Only project owner can delete documents" });
      }

      await storage.deleteProjectDocument(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Failed to delete document" });
    }
  });

  // Tasks
  app.get("/api/projects/:projectId/tasks", async (req, res) => {
    try {
      const tasks = await storage.getTasksByProject(req.params.projectId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch task" });
    }
  });

  app.post("/api/projects/:projectId/tasks", async (req, res) => {
    try {
      const taskData = insertTaskSchema.parse({
        ...req.body,
        projectId: req.params.projectId,
      });
      const task = await storage.createTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      res.status(400).json({ error: "Invalid task data" });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const updateData = { ...req.body };
      // Convert completedAt string to Date if present, or keep null to clear the field
      if (updateData.completedAt && updateData.completedAt !== null) {
        updateData.completedAt = new Date(updateData.completedAt);
      }
      const task = await storage.updateTask(req.params.id, updateData);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Task update error:", error);
      res.status(400).json({ error: "Failed to update task", details: error instanceof Error ? error.message : String(error) });
    }
  });

  // Contributions
  app.get("/api/projects/:projectId/contributions", async (req, res) => {
    try {
      const contributions = await storage.getContributionsByProject(req.params.projectId);
      res.json(contributions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contributions" });
    }
  });

  app.post("/api/projects/:projectId/contributions", async (req, res) => {
    try {
      const contributionData = insertContributionSchema.parse({
        ...req.body,
        projectId: req.params.projectId,
      });
      const contribution = await storage.createContribution(contributionData);
      res.status(201).json(contribution);
    } catch (error) {
      res.status(400).json({ error: "Invalid contribution data" });
    }
  });

  // Matches/Connections
  app.get("/api/matches/:profileId", async (req, res) => {
    try {
      const matches = await storage.getMatches(req.params.profileId);
      res.json(matches);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch matches" });
    }
  });

  app.post("/api/matches", async (req, res) => {
    try {
      const matchData = insertMatchSchema.parse(req.body);
      
      // Server-side validation: prevent duplicate pending matches
      const existingMatches = await storage.getMatches(matchData.initiatorId);
      const hasPendingMatch = existingMatches.some(m => 
        (m.initiatorId === matchData.initiatorId && m.receiverId === matchData.receiverId && m.status === 'pending') ||
        (m.initiatorId === matchData.receiverId && m.receiverId === matchData.initiatorId && m.status === 'pending')
      );
      
      if (hasPendingMatch) {
        return res.status(409).json({ error: "A pending match request already exists between these users" });
      }
      
      const match = await storage.createMatch(matchData);
      res.status(201).json(match);
    } catch (error) {
      console.error("Create match error:", error);
      res.status(400).json({ error: "Invalid match data" });
    }
  });

  app.patch("/api/matches/:id", isAuthenticated, async (req: any, res) => {
    try {
      // Get current user's profile
      const currentProfile = await resolveCurrentProfile(req);
      if (!currentProfile) {
        return res.status(401).json({ error: "Unauthorized: Profile not found" });
      }
      
      // Get all matches for current user to find the one being updated
      const existingMatches = await storage.getMatches(currentProfile.id);
      const match = existingMatches.find(m => m.id === req.params.id);
      
      if (!match) {
        return res.status(404).json({ error: "Match not found" });
      }
      
      // Two-way approval enforcement: only the receiver can accept/reject
      if (req.body.status && req.body.status !== 'pending') {
        if (match.receiverId !== currentProfile.id) {
          return res.status(403).json({ error: "Forbidden: Only the match receiver can accept or reject" });
        }
      }
      
      const updateData = { ...req.body };
      if (updateData.respondedAt) {
        updateData.respondedAt = new Date(updateData.respondedAt);
      } else if (updateData.status && updateData.status !== 'pending') {
        // Auto-set respondedAt when status changes
        updateData.respondedAt = new Date();
      }
      
      const updatedMatch = await storage.updateMatch(req.params.id, updateData);
      if (!updatedMatch) {
        return res.status(404).json({ error: "Match not found" });
      }
      res.json(updatedMatch);
    } catch (error) {
      console.error("Update match error:", error);
      res.status(400).json({ error: "Failed to update match" });
    }
  });

  // AI-Powered Match Suggestions
  app.get("/api/matches/suggestions/:profileId", isAuthenticated, async (req: any, res) => {
    try {
      const { profileId } = req.params;
      const { role, limit } = req.query;
      
      // Get current user ID from auth
      let currentUserId: string | undefined;
      const allowDevAuth = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
      if (allowDevAuth) {
        currentUserId = req.headers['x-user-id'] as string;
      } else if (req.user?.claims?.sub) {
        currentUserId = req.user.claims.sub;
      }
      
      if (!currentUserId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Get the current user's profile using userId (canonical lookup)
      const currentProfile = await storage.getProfileByUserId(currentUserId);
      if (!currentProfile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      // Verify the requested profileId matches the user's canonical profile
      if (currentProfile.id !== profileId) {
        return res.status(403).json({ error: "Forbidden: Cannot access another user's suggestions" });
      }

      // Parse and validate limit with safe defaults (max 20 to prevent excessive costs)
      const parsedLimit = limit ? parseInt(limit as string, 10) : 10;
      const maxResults = Math.min(Math.max(1, isNaN(parsedLimit) ? 10 : parsedLimit), 20);

      // Get current user's projects (if they're a vibe coder)
      const currentUserProjects = currentProfile.role === 'coder' 
        ? await storage.getProjectsByVibeCoder(profileId)
        : [];

      // Get potential match candidates based on role compatibility
      let candidateProfiles = await storage.getAllProfiles();
      
      // Filter out self and apply role filter if provided
      candidateProfiles = candidateProfiles.filter(p => {
        if (p.id === profileId) return false;
        if (role && p.role !== role) return false;
        
        // Role compatibility logic
        if (currentProfile.role === 'coder') {
          return p.role === 'investor' || p.role === 'technical';
        } else if (currentProfile.role === 'investor') {
          return p.role === 'coder';
        } else if (currentProfile.role === 'technical') {
          return p.role === 'coder';
        }
        return false;
      });

      // Get existing matches to exclude them from suggestions
      const existingMatches = await storage.getMatches(profileId);
      const existingMatchIds = new Set([
        ...existingMatches.map(m => m.initiatorId === profileId ? m.receiverId : m.initiatorId)
      ]);
      candidateProfiles = candidateProfiles.filter(p => !existingMatchIds.has(p.id));

      // CRITICAL: Pre-filter to top 20 candidates before AI to prevent unbounded prompt sizes
      // Simple heuristic: prioritize by tag overlap and location match
      const rankedCandidates = candidateProfiles
        .map(candidate => {
          let score = 0;
          
          // Tag overlap
          const userTags = new Set(currentProfile.tags || []);
          const candidateTags = candidate.tags || [];
          const overlap = candidateTags.filter(tag => userTags.has(tag)).length;
          score += overlap * 10;
          
          // Location match
          if (currentProfile.location && candidate.location === currentProfile.location) {
            score += 5;
          }
          
          return { candidate, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 20)
        .map(item => item.candidate);

      // Prepare candidates with their projects (limited to top 20)
      const candidates = await Promise.all(
        rankedCandidates.map(async (profile) => {
          const projects = profile.role === 'coder'
            ? await storage.getProjectsByVibeCoder(profile.id)
            : [];
          return { profile, projects };
        })
      );

      // Generate AI-powered matches
      const aiMatches = await generateMatches(
        currentProfile,
        currentUserProjects,
        candidates,
        maxResults
      );

      // Enrich with profile data
      const enrichedMatches = await Promise.all(
        aiMatches.map(async (match) => {
          const profile = await storage.getProfile(match.profileId);
          return {
            ...match,
            profile,
          };
        })
      );

      res.json(enrichedMatches);
    } catch (error) {
      console.error("AI match suggestions error:", error);
      res.status(500).json({ error: "Failed to generate match suggestions" });
    }
  });

  // Analytics Endpoints
  app.get("/api/analytics/overview", async (req, res) => {
    try {
      const [usersByRole, projectCount, totalMatches, acceptedMatches] = await Promise.all([
        storage.getUserCountByRole(),
        storage.getProjectCount(),
        storage.getMatchCount(),
        storage.getMatchCount('accepted'),
      ]);

      const overview = {
        totalUsers: usersByRole.reduce((sum, item) => sum + item.count, 0),
        usersByRole: {
          vibeCoders: usersByRole.find(r => r.role === 'coder')?.count || 0,
          investors: usersByRole.find(r => r.role === 'investor')?.count || 0,
          techLeads: usersByRole.find(r => r.role === 'technical')?.count || 0,
        },
        projectsHosted: projectCount,
        matchesMade: acceptedMatches,
        totalConnections: totalMatches,
      };

      res.json(overview);
    } catch (error) {
      console.error("Analytics overview error:", error);
      res.status(500).json({ error: "Failed to fetch analytics overview" });
    }
  });

  app.get("/api/analytics/demographics", async (req, res) => {
    try {
      const [byLocation, byTags] = await Promise.all([
        storage.getProfilesByLocation(),
        storage.getProfilesByTags(),
      ]);

      res.json({
        byLocation,
        byTags,
      });
    } catch (error) {
      console.error("Demographics error:", error);
      res.status(500).json({ error: "Failed to fetch demographics" });
    }
  });

  app.get("/api/analytics/growth", async (req, res) => {
    try {
      const period = req.query.period as string || '30d';
      
      // Calculate date range based on period
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      const metrics = await storage.getGrowthMetrics(startDate, endDate);
      
      res.json({
        period,
        startDate,
        endDate,
        metrics,
      });
    } catch (error) {
      console.error("Growth metrics error:", error);
      res.status(500).json({ error: "Failed to fetch growth metrics" });
    }
  });

  app.get("/api/analytics/users-by-role", async (req, res) => {
    try {
      const usersByRole = await storage.getUserCountByRole();
      res.json(usersByRole);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users by role" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
