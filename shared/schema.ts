import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Profiles for different user types
export const profiles = pgTable("profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).unique(), // One profile per user
  name: text("name").notNull(),
  role: varchar("role", { length: 20 }).notNull(), // 'coder', 'investor', 'technical'
  avatar: text("avatar"),
  tagline: text("tagline"),
  location: text("location"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
  createdAt: true,
});

export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profiles.$inferSelect;

// Projects - partnerships between vibe coders and technical persons
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  vibeCodeId: varchar("vibe_coder_id").notNull().references(() => profiles.id),
  status: varchar("status", { length: 20 }).notNull().default('active'), // 'active', 'completed', 'archived'
  vision: text("vision"),
  techStack: text("tech_stack").array(),
  targetUsers: text("target_users"),
  currentStage: varchar("current_stage", { length: 20 }), // 'idea', 'prototype', 'mvp', 'launched'
  lookingFor: text("looking_for").array(), // ['funding', 'technical', 'marketing', 'design']
  fundingGoal: decimal("funding_goal", { precision: 12, scale: 2 }),
  
  // Links & Platform
  projectLinks: text("project_links").array(), // GitHub, demo, website, social links
  platform: text("platform"), // Platform used to build project (e.g., Replit, VS Code, etc.)
  
  // Investor Targeting
  investorPreferences: text("investor_preferences"), // JSON string with detailed preferences
  targetFundingStage: varchar("target_funding_stage", { length: 30 }), // 'pre-seed', 'seed', 'series-a', etc.
  targetInvestorTypes: text("target_investor_types").array(), // ['angel', 'vc', 'strategic', 'accelerator']
  minInvestmentAmount: decimal("min_investment_amount", { precision: 12, scale: 2 }),
  maxInvestmentAmount: decimal("max_investment_amount", { precision: 12, scale: 2 }),
  
  // Technical Lead Requirements
  technicalRequirements: text("technical_requirements"), // JSON string with detailed requirements
  requiredSkills: text("required_skills").array(), // Required technical skills
  experienceLevel: varchar("experience_level", { length: 20 }), // 'junior', 'mid', 'senior', 'lead'
  timeCommitment: varchar("time_commitment", { length: 30 }), // 'full-time', 'part-time', 'contract', 'advisor'
  technicalRoles: text("technical_roles").array(), // ['backend', 'frontend', 'devops', 'mobile', 'ai/ml']
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// Project members - technical persons and investors in a project
export const projectMembers = pgTable("project_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  profileId: varchar("profile_id").notNull().references(() => profiles.id),
  role: varchar("role", { length: 20 }).notNull(), // 'technical', 'investor'
  compensationType: varchar("compensation_type", { length: 20 }).notNull(), // 'money', 'ownership'
  compensationAmount: decimal("compensation_amount", { precision: 10, scale: 2 }), // for money
  ownershipPercentage: decimal("ownership_percentage", { precision: 5, scale: 2 }), // for ownership
  hasAccess: boolean("has_access").notNull().default(false), // dashboard access granted by vibe coder
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const insertProjectMemberSchema = createInsertSchema(projectMembers).omit({
  id: true,
  joinedAt: true,
});

export type InsertProjectMember = z.infer<typeof insertProjectMemberSchema>;
export type ProjectMember = typeof projectMembers.$inferSelect;

// Code repositories for evaluation
export const codeRepositories = pgTable("code_repositories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  uploadedBy: varchar("uploaded_by").notNull().references(() => profiles.id),
  name: text("name").notNull(),
  description: text("description"),
  fileUrl: text("file_url").notNull(), // URL or path to uploaded code
  language: text("language"),
  linesOfCode: integer("lines_of_code"),
  estimatedHours: integer("estimated_hours"),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  status: varchar("status", { length: 20 }).notNull().default('pending'), // 'pending', 'reviewed', 'approved'
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const insertCodeRepositorySchema = createInsertSchema(codeRepositories).omit({
  id: true,
  uploadedAt: true,
});

export type InsertCodeRepository = z.infer<typeof insertCodeRepositorySchema>;
export type CodeRepository = typeof codeRepositories.$inferSelect;

// Project documents - business plans, pitch decks, etc.
export const projectDocuments = pgTable("project_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  uploadedBy: varchar("uploaded_by").notNull().references(() => profiles.id),
  name: text("name").notNull(),
  description: text("description"),
  fileUrl: text("file_url").notNull(), // URL or path to uploaded document
  fileType: varchar("file_type", { length: 50 }), // 'pitch-deck', 'business-plan', 'roadmap', 'whitepaper', 'other'
  mimeType: varchar("mime_type", { length: 100 }), // e.g., 'application/pdf', 'image/png'
  fileSize: integer("file_size"), // in bytes
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const insertProjectDocumentSchema = createInsertSchema(projectDocuments).omit({
  id: true,
  uploadedAt: true,
});

export type InsertProjectDocument = z.infer<typeof insertProjectDocumentSchema>;
export type ProjectDocument = typeof projectDocuments.$inferSelect;

// Tasks within projects
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  title: text("title").notNull(),
  description: text("description"),
  assignedTo: varchar("assigned_to").references(() => profiles.id),
  createdBy: varchar("created_by").notNull().references(() => profiles.id),
  status: varchar("status", { length: 20 }).notNull().default('todo'), // 'todo', 'in-progress', 'completed'
  priority: varchar("priority", { length: 20 }).default('medium'), // 'low', 'medium', 'high'
  estimatedHours: integer("estimated_hours"),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

// Contributions tracking for IP value estimation
export const contributions = pgTable("contributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  contributorId: varchar("contributor_id").notNull().references(() => profiles.id),
  taskId: varchar("task_id").references(() => tasks.id),
  type: varchar("type", { length: 20 }).notNull(), // 'code', 'design', 'idea', 'funding', 'management'
  description: text("description"),
  hoursSpent: integer("hours_spent"),
  valueScore: integer("value_score").default(0), // 0-100 score for IP value
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertContributionSchema = createInsertSchema(contributions).omit({
  id: true,
  createdAt: true,
});

export type InsertContribution = z.infer<typeof insertContributionSchema>;
export type Contribution = typeof contributions.$inferSelect;

// Matches/Connections between users
export const matches = pgTable("matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  initiatorId: varchar("initiator_id").notNull().references(() => profiles.id),
  receiverId: varchar("receiver_id").notNull().references(() => profiles.id),
  status: varchar("status", { length: 20 }).notNull().default('pending'), // 'pending', 'accepted', 'rejected'
  matchType: varchar("match_type", { length: 20 }).notNull(), // 'collaboration', 'investment', 'technical', 'mentorship'
  matchReason: text("match_reason"), // AI-generated reason for the match
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
});

export const insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
  createdAt: true,
  respondedAt: true,
});

export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matches.$inferSelect;
