import { 
  type User, 
  type InsertUser,
  type Profile,
  type InsertProfile,
  type Project,
  type InsertProject,
  type ProjectMember,
  type InsertProjectMember,
  type CodeRepository,
  type InsertCodeRepository,
  type ProjectDocument,
  type InsertProjectDocument,
  type Task,
  type InsertTask,
  type Contribution,
  type InsertContribution,
  type Match,
  type InsertMatch,
  users,
  profiles,
  projects,
  projectMembers,
  codeRepositories,
  projectDocuments,
  tasks,
  contributions,
  matches,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count, sql as drizzleSql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: InsertUser): Promise<User>;
  
  // Profiles
  getProfile(id: string): Promise<Profile | undefined>;
  getProfileByUserId(userId: string): Promise<Profile | undefined>;
  getProfilesByRole(role: string): Promise<Profile[]>;
  getAllProfiles(): Promise<Profile[]>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(id: string, profile: Partial<InsertProfile>): Promise<Profile | undefined>;
  
  // Projects
  getProject(id: string): Promise<Project | undefined>;
  getProjectsByVibeCoder(vibeCodeId: string): Promise<Project[]>;
  getAllProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined>;
  
  // Project Members
  getProjectMembers(projectId: string): Promise<ProjectMember[]>;
  addProjectMember(member: InsertProjectMember): Promise<ProjectMember>;
  getProjectMember(id: string): Promise<ProjectMember | undefined>;
  updateProjectMember(id: string, member: Partial<InsertProjectMember>): Promise<ProjectMember | undefined>;
  
  // Code Repositories
  getCodeRepository(id: string): Promise<CodeRepository | undefined>;
  getCodeRepositoriesByProject(projectId: string): Promise<CodeRepository[]>;
  createCodeRepository(repo: InsertCodeRepository): Promise<CodeRepository>;
  updateCodeRepository(id: string, repo: Partial<InsertCodeRepository>): Promise<CodeRepository | undefined>;
  
  // Project Documents
  getProjectDocument(id: string): Promise<ProjectDocument | undefined>;
  getProjectDocumentsByProject(projectId: string): Promise<ProjectDocument[]>;
  createProjectDocument(doc: InsertProjectDocument): Promise<ProjectDocument>;
  deleteProjectDocument(id: string): Promise<void>;
  
  // Tasks
  getTask(id: string): Promise<Task | undefined>;
  getTasksByProject(projectId: string): Promise<Task[]>;
  getTasksByAssignee(assignedTo: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  
  // Contributions
  getContributionsByProject(projectId: string): Promise<Contribution[]>;
  getContributionsByContributor(contributorId: string): Promise<Contribution[]>;
  createContribution(contribution: InsertContribution): Promise<Contribution>;
  
  // Matches
  getMatches(profileId: string): Promise<Match[]>;
  createMatch(match: InsertMatch): Promise<Match>;
  updateMatch(id: string, match: Partial<InsertMatch>): Promise<Match | undefined>;
  
  // Analytics
  getUserCountByRole(): Promise<{ role: string; count: number }[]>;
  getProjectCount(): Promise<number>;
  getMatchCount(status?: string): Promise<number>;
  getProfilesByLocation(): Promise<{ location: string; count: number }[]>;
  getProfilesByTags(): Promise<{ tag: string; count: number }[]>;
  getGrowthMetrics(startDate: Date, endDate: Date): Promise<{
    newUsers: number;
    newProfiles: number;
    newProjects: number;
    newMatches: number;
  }>;
}

export class DbStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async upsertUser(userData: InsertUser): Promise<User> {
    const result = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result[0];
  }

  // Profiles
  async getProfile(id: string): Promise<Profile | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.id, id));
    return result[0];
  }

  async getProfileByUserId(userId: string): Promise<Profile | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.userId, userId)).orderBy(desc(profiles.createdAt)).limit(1);
    return result[0];
  }

  async getProfilesByRole(role: string): Promise<Profile[]> {
    return await db.select().from(profiles).where(eq(profiles.role, role));
  }

  async getAllProfiles(): Promise<Profile[]> {
    return await db.select().from(profiles);
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const result = await db.insert(profiles).values(profile).returning();
    return result[0];
  }

  async updateProfile(id: string, profile: Partial<InsertProfile>): Promise<Profile | undefined> {
    const result = await db.update(profiles).set(profile).where(eq(profiles.id, id)).returning();
    return result[0];
  }

  // Projects
  async getProject(id: string): Promise<Project | undefined> {
    const result = await db.select().from(projects).where(eq(projects.id, id));
    return result[0];
  }

  async getProjectsByVibeCoder(vibeCodeId: string): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.vibeCodeId, vibeCodeId));
  }

  async getAllProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async createProject(project: InsertProject): Promise<Project> {
    const result = await db.insert(projects).values(project).returning();
    return result[0];
  }

  async updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined> {
    const result = await db.update(projects).set({ ...project, updatedAt: new Date() }).where(eq(projects.id, id)).returning();
    return result[0];
  }

  // Project Members
  async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    return await db.select().from(projectMembers).where(eq(projectMembers.projectId, projectId));
  }

  async addProjectMember(member: InsertProjectMember): Promise<ProjectMember> {
    const result = await db.insert(projectMembers).values(member).returning();
    return result[0];
  }

  async getProjectMember(id: string): Promise<ProjectMember | undefined> {
    const result = await db.select().from(projectMembers).where(eq(projectMembers.id, id));
    return result[0];
  }

  async updateProjectMember(id: string, member: Partial<InsertProjectMember>): Promise<ProjectMember | undefined> {
    const result = await db.update(projectMembers).set(member).where(eq(projectMembers.id, id)).returning();
    return result[0];
  }

  // Code Repositories
  async getCodeRepository(id: string): Promise<CodeRepository | undefined> {
    const result = await db.select().from(codeRepositories).where(eq(codeRepositories.id, id));
    return result[0];
  }

  async getCodeRepositoriesByProject(projectId: string): Promise<CodeRepository[]> {
    return await db.select().from(codeRepositories).where(eq(codeRepositories.projectId, projectId)).orderBy(desc(codeRepositories.uploadedAt));
  }

  async createCodeRepository(repo: InsertCodeRepository): Promise<CodeRepository> {
    const result = await db.insert(codeRepositories).values(repo).returning();
    return result[0];
  }

  async updateCodeRepository(id: string, repo: Partial<InsertCodeRepository>): Promise<CodeRepository | undefined> {
    const result = await db.update(codeRepositories).set(repo).where(eq(codeRepositories.id, id)).returning();
    return result[0];
  }

  // Project Documents
  async getProjectDocument(id: string): Promise<ProjectDocument | undefined> {
    const result = await db.select().from(projectDocuments).where(eq(projectDocuments.id, id));
    return result[0];
  }

  async getProjectDocumentsByProject(projectId: string): Promise<ProjectDocument[]> {
    return await db.select().from(projectDocuments).where(eq(projectDocuments.projectId, projectId)).orderBy(desc(projectDocuments.uploadedAt));
  }

  async createProjectDocument(doc: InsertProjectDocument): Promise<ProjectDocument> {
    const result = await db.insert(projectDocuments).values(doc).returning();
    return result[0];
  }

  async deleteProjectDocument(id: string): Promise<void> {
    await db.delete(projectDocuments).where(eq(projectDocuments.id, id));
  }

  // Tasks
  async getTask(id: string): Promise<Task | undefined> {
    const result = await db.select().from(tasks).where(eq(tasks.id, id));
    return result[0];
  }

  async getTasksByProject(projectId: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.projectId, projectId)).orderBy(desc(tasks.createdAt));
  }

  async getTasksByAssignee(assignedTo: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.assignedTo, assignedTo)).orderBy(desc(tasks.createdAt));
  }

  async createTask(task: InsertTask): Promise<Task> {
    const result = await db.insert(tasks).values(task).returning();
    return result[0];
  }

  async updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined> {
    const result = await db.update(tasks).set(task).where(eq(tasks.id, id)).returning();
    return result[0];
  }

  // Contributions
  async getContributionsByProject(projectId: string): Promise<Contribution[]> {
    return await db.select().from(contributions).where(eq(contributions.projectId, projectId)).orderBy(desc(contributions.createdAt));
  }

  async getContributionsByContributor(contributorId: string): Promise<Contribution[]> {
    return await db.select().from(contributions).where(eq(contributions.contributorId, contributorId)).orderBy(desc(contributions.createdAt));
  }

  async createContribution(contribution: InsertContribution): Promise<Contribution> {
    const result = await db.insert(contributions).values(contribution).returning();
    return result[0];
  }

  // Matches
  async getMatches(profileId: string): Promise<Match[]> {
    return await db
      .select()
      .from(matches)
      .where(
        drizzleSql`${matches.initiatorId} = ${profileId} OR ${matches.receiverId} = ${profileId}`
      )
      .orderBy(desc(matches.createdAt));
  }

  async createMatch(match: InsertMatch): Promise<Match> {
    const result = await db.insert(matches).values(match).returning();
    return result[0];
  }

  async updateMatch(id: string, match: Partial<InsertMatch>): Promise<Match | undefined> {
    const result = await db.update(matches).set(match).where(eq(matches.id, id)).returning();
    return result[0];
  }

  // Analytics
  async getUserCountByRole(): Promise<{ role: string; count: number }[]> {
    const results = await db
      .select({
        role: profiles.role,
        count: drizzleSql<number>`cast(count(*) as integer)`,
      })
      .from(profiles)
      .groupBy(profiles.role);
    
    return results.map(r => ({ role: r.role, count: r.count }));
  }

  async getProjectCount(): Promise<number> {
    const result = await db
      .select({ count: drizzleSql<number>`cast(count(*) as integer)` })
      .from(projects);
    
    return result[0]?.count || 0;
  }

  async getMatchCount(status?: string): Promise<number> {
    if (status) {
      const result = await db
        .select({ count: drizzleSql<number>`cast(count(*) as integer)` })
        .from(matches)
        .where(eq(matches.status, status));
      return result[0]?.count || 0;
    }
    
    const result = await db
      .select({ count: drizzleSql<number>`cast(count(*) as integer)` })
      .from(matches);
    return result[0]?.count || 0;
  }

  async getProfilesByLocation(): Promise<{ location: string; count: number }[]> {
    const results = await db
      .select({
        location: profiles.location,
        count: drizzleSql<number>`cast(count(*) as integer)`,
      })
      .from(profiles)
      .where(drizzleSql`${profiles.location} IS NOT NULL`)
      .groupBy(profiles.location)
      .orderBy(drizzleSql`count(*) DESC`)
      .limit(20);
    
    return results.map(r => ({ location: r.location || 'Unknown', count: r.count }));
  }

  async getProfilesByTags(): Promise<{ tag: string; count: number }[]> {
    const result = await db.execute(drizzleSql`
      SELECT tag, COUNT(*) as count
      FROM profiles, UNNEST(tags) as tag
      GROUP BY tag
      ORDER BY count DESC
      LIMIT 30
    `);
    
    return (result.rows || []).map((row: any) => ({
      tag: row.tag,
      count: parseInt(row.count),
    }));
  }

  async getGrowthMetrics(startDate: Date, endDate: Date): Promise<{
    newUsers: number;
    newProfiles: number;
    newProjects: number;
    newMatches: number;
  }> {
    const newUsers = await db
      .select({ count: drizzleSql<number>`cast(count(*) as integer)` })
      .from(users)
      .where(
        and(
          drizzleSql`${users.createdAt} >= ${startDate}`,
          drizzleSql`${users.createdAt} <= ${endDate}`
        )
      );

    const newProfiles = await db
      .select({ count: drizzleSql<number>`cast(count(*) as integer)` })
      .from(profiles)
      .where(
        and(
          drizzleSql`${profiles.createdAt} >= ${startDate}`,
          drizzleSql`${profiles.createdAt} <= ${endDate}`
        )
      );

    const newProjects = await db
      .select({ count: drizzleSql<number>`cast(count(*) as integer)` })
      .from(projects)
      .where(
        and(
          drizzleSql`${projects.createdAt} >= ${startDate}`,
          drizzleSql`${projects.createdAt} <= ${endDate}`
        )
      );

    const newMatches = await db
      .select({ count: drizzleSql<number>`cast(count(*) as integer)` })
      .from(matches)
      .where(
        and(
          drizzleSql`${matches.createdAt} >= ${startDate}`,
          drizzleSql`${matches.createdAt} <= ${endDate}`
        )
      );

    return {
      newUsers: newUsers[0]?.count || 0,
      newProfiles: newProfiles[0]?.count || 0,
      newProjects: newProjects[0]?.count || 0,
      newMatches: newMatches[0]?.count || 0,
    };
  }
}

export const storage = new DbStorage();
