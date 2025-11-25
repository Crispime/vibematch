import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Project, CodeRepository, Task, ProjectMember, Contribution, Profile } from "@shared/schema";
import { Code, CheckCircle2, Clock, Users, TrendingUp, FileCode, ListTodo, Award, Info, ExternalLink } from "lucide-react";
import { CodeRepositorySection } from "@/components/CodeRepositorySection";
import { TasksSection } from "@/components/TasksSection";
import { TeamSection } from "@/components/TeamSection";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

export default function ProjectDashboard() {
  const [, params] = useRoute("/projects/:id");
  const projectId = params?.id;

  // Get authenticated user
  const { user, isLoading: authLoading } = useAuth();
  const currentUserId = user?.id;

  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId,
  });

  // Fetch members first to determine access level
  const { data: members } = useQuery<ProjectMember[]>({
    queryKey: ["/api/projects", projectId, "members"],
    enabled: !!projectId,
  });

  // Check if user is team member
  const isOwner = currentUserId === project?.vibeCodeId;
  const currentMember = members?.find(m => m.profileId === currentUserId);
  const isTeamMember = isOwner || !!currentMember;
  const hasFullAccess = isOwner || (currentMember?.hasAccess ?? false);

  // Only fetch sensitive data based on access level
  // Repositories and contributions: only for users with full access
  const { data: repositories } = useQuery<CodeRepository[]>({
    queryKey: ["/api/projects", projectId, "repositories"],
    enabled: !!projectId && hasFullAccess,
  });

  const { data: contributions } = useQuery<Contribution[]>({
    queryKey: ["/api/projects", projectId, "contributions"],
    enabled: !!projectId && hasFullAccess,
  });

  // Tasks: all team members can see (filtered in UI for restricted users)
  const { data: tasks } = useQuery<Task[]>({
    queryKey: ["/api/projects", projectId, "tasks"],
    enabled: !!projectId && isTeamMember,
  });

  if (authLoading || projectLoading || !project || !currentUserId) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-6">
          <div className="text-center text-muted-foreground">
            {authLoading ? "Loading user..." : "Loading project..."}
          </div>
        </div>
      </div>
    );
  }

  // Non-team members should not access the dashboard at all
  if (!isTeamMember) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-6 max-w-2xl">
          <Card className="border-border/50">
            <CardContent className="p-12 text-center">
              <div className="mb-6">
                <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <Clock className="h-8 w-8 text-destructive" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-3">Access Denied</h2>
              <p className="text-muted-foreground mb-6">
                You don't have permission to view this project dashboard. 
                Contact the project owner to request access.
              </p>
              <Button 
                onClick={() => window.history.back()} 
                variant="outline"
                data-testid="button-go-back"
              >
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Calculate IP value distribution
  const totalValue = contributions?.reduce((sum, c) => sum + (c.valueScore || 0), 0) || 0;
  const contributorValues = contributions?.reduce((acc, c) => {
    const current = acc[c.contributorId] || 0;
    acc[c.contributorId] = current + (c.valueScore || 0);
    return acc;
  }, {} as Record<string, number>) || {};

  const contributorPercentages = Object.entries(contributorValues).map(([id, value]) => ({
    contributorId: id,
    percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
    value,
  }));

  const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
  const totalTasks = tasks?.length || 0;
  const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                {project.name}
              </h1>
              {project.description && (
                <p className="text-muted-foreground text-lg max-w-3xl">{project.description}</p>
              )}
            </div>
            <Badge 
              variant={project.status === 'active' ? 'default' : 'secondary'}
              className={project.status === 'active' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm' : ''}
            >
              {project.status}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <Card className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                    <FileCode className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm text-muted-foreground">Repositories</span>
                </div>
                <p className="text-3xl font-bold">{repositories?.length || 0}</p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500">
                    <ListTodo className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm text-muted-foreground">Tasks</span>
                </div>
                <p className="text-3xl font-bold">{completedTasks}/{totalTasks}</p>
                <Progress value={taskProgress} className="mt-2 h-1.5" />
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm text-muted-foreground">Team Members</span>
                </div>
                <p className="text-3xl font-bold">{(members?.length || 0) + 1}</p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm text-muted-foreground">Contributions</span>
                </div>
                <p className="text-3xl font-bold">{contributions?.length || 0}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="info" className="space-y-8">
          <TabsList className={`grid w-full ${hasFullAccess ? 'grid-cols-5' : 'grid-cols-3'}`}>
            <TabsTrigger value="info" data-testid="tab-info">
              <Info className="h-4 w-4 mr-2" />
              Project Info
            </TabsTrigger>
            {hasFullAccess && (
              <TabsTrigger value="repositories" data-testid="tab-repositories">
                <Code className="h-4 w-4 mr-2" />
                Code Repositories
              </TabsTrigger>
            )}
            <TabsTrigger value="tasks" data-testid="tab-tasks">
              <ListTodo className="h-4 w-4 mr-2" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="team" data-testid="tab-team">
              <Users className="h-4 w-4 mr-2" />
              Team
            </TabsTrigger>
            {hasFullAccess && (
              <TabsTrigger value="ip-tracking" data-testid="tab-ip">
                <TrendingUp className="h-4 w-4 mr-2" />
                IP Tracking
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="info">
            <div className="space-y-6">
              {/* Basic Information Section */}
              <Card className="border-border/50">
                <CardHeader>
                  <h3 className="text-2xl font-bold">Project Overview</h3>
                </CardHeader>
                <CardContent className="space-y-6">
                  {project.vision && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Vision</h4>
                      <p className="text-muted-foreground" data-testid="text-vision">{project.vision}</p>
                    </div>
                  )}

                  {project.targetUsers && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Target Users</h4>
                      <p className="text-muted-foreground" data-testid="text-target-users">{project.targetUsers}</p>
                    </div>
                  )}

                  {project.currentStage && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Current Stage</h4>
                      <Badge variant="secondary" data-testid="badge-current-stage">
                        {project.currentStage}
                      </Badge>
                    </div>
                  )}

                  {project.techStack && project.techStack.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Tech Stack</h4>
                      <div className="flex flex-wrap gap-2" data-testid="container-tech-stack">
                        {project.techStack.map((tech, index) => (
                          <Badge key={index} variant="outline" data-testid={`badge-tech-${index}`}>
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {project.lookingFor && project.lookingFor.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Looking For</h4>
                      <div className="flex flex-wrap gap-2" data-testid="container-looking-for">
                        {project.lookingFor.map((item, index) => (
                          <Badge key={index} className="bg-gradient-to-r from-primary/90 to-primary text-white" data-testid={`badge-looking-${index}`}>
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {project.fundingGoal && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Funding Goal</h4>
                      <p className="text-2xl font-bold" data-testid="text-funding-goal">
                        ${parseFloat(project.fundingGoal).toLocaleString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Links & Platform Section */}
              {((project.projectLinks && project.projectLinks.length > 0) || project.platform) && (
                <Card className="border-border/50">
                  <CardHeader>
                    <h3 className="text-2xl font-bold">Links & Platform</h3>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {project.projectLinks && project.projectLinks.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-3">Project Links</h4>
                        <div className="space-y-2" data-testid="container-project-links">
                          {project.projectLinks.map((link, index) => (
                            <a
                              key={index}
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-primary hover:underline"
                              data-testid={`link-project-${index}`}
                            >
                              <ExternalLink className="h-4 w-4" />
                              {link}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {project.platform && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Platform</h4>
                        <p className="text-muted-foreground" data-testid="text-platform">{project.platform}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Investor Targeting Section */}
              {(project.targetFundingStage || 
                (project.targetInvestorTypes && project.targetInvestorTypes.length > 0) || 
                project.minInvestmentAmount || 
                project.maxInvestmentAmount || 
                project.investorPreferences) && (
                <Card className="border-border/50">
                  <CardHeader>
                    <h3 className="text-2xl font-bold">Investor Targeting</h3>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {project.targetFundingStage && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Target Funding Stage</h4>
                        <Badge variant="secondary" data-testid="badge-funding-stage">
                          {project.targetFundingStage}
                        </Badge>
                      </div>
                    )}

                    {project.targetInvestorTypes && project.targetInvestorTypes.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Target Investor Types</h4>
                        <div className="flex flex-wrap gap-2" data-testid="container-investor-types">
                          {project.targetInvestorTypes.map((type, index) => (
                            <Badge key={index} variant="outline" data-testid={`badge-investor-${index}`}>
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {(project.minInvestmentAmount || project.maxInvestmentAmount) && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Investment Range</h4>
                        <p className="text-muted-foreground" data-testid="text-investment-range">
                          {project.minInvestmentAmount && `$${parseFloat(project.minInvestmentAmount).toLocaleString()}`}
                          {project.minInvestmentAmount && project.maxInvestmentAmount && ' - '}
                          {project.maxInvestmentAmount && `$${parseFloat(project.maxInvestmentAmount).toLocaleString()}`}
                        </p>
                      </div>
                    )}

                    {project.investorPreferences && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Additional Preferences</h4>
                        <p className="text-muted-foreground" data-testid="text-investor-preferences">
                          {project.investorPreferences}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Technical Requirements Section */}
              {(project.experienceLevel || 
                project.timeCommitment || 
                (project.technicalRoles && project.technicalRoles.length > 0) || 
                (project.requiredSkills && project.requiredSkills.length > 0) || 
                project.technicalRequirements) && (
                <Card className="border-border/50">
                  <CardHeader>
                    <h3 className="text-2xl font-bold">Technical Requirements</h3>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {project.experienceLevel && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Experience Level</h4>
                        <Badge variant="secondary" data-testid="badge-experience-level">
                          {project.experienceLevel}
                        </Badge>
                      </div>
                    )}

                    {project.timeCommitment && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Time Commitment</h4>
                        <Badge variant="secondary" data-testid="badge-time-commitment">
                          {project.timeCommitment}
                        </Badge>
                      </div>
                    )}

                    {project.technicalRoles && project.technicalRoles.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Technical Roles</h4>
                        <div className="flex flex-wrap gap-2" data-testid="container-technical-roles">
                          {project.technicalRoles.map((role, index) => (
                            <Badge key={index} variant="outline" data-testid={`badge-role-${index}`}>
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {project.requiredSkills && project.requiredSkills.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Required Skills</h4>
                        <div className="flex flex-wrap gap-2" data-testid="container-required-skills">
                          {project.requiredSkills.map((skill, index) => (
                            <Badge key={index} variant="outline" data-testid={`badge-skill-${index}`}>
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {project.technicalRequirements && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Additional Requirements</h4>
                        <p className="text-muted-foreground" data-testid="text-technical-requirements">
                          {project.technicalRequirements}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {hasFullAccess && (
            <TabsContent value="repositories">
              <CodeRepositorySection projectId={projectId!} repositories={repositories || []} />
            </TabsContent>
          )}

          <TabsContent value="tasks">
            <TasksSection 
              projectId={projectId!} 
              tasks={tasks || []} 
              members={members || []}
              currentUserId={currentUserId}
              hasFullAccess={hasFullAccess}
            />
          </TabsContent>

          <TabsContent value="team">
            <TeamSection 
              projectId={projectId!} 
              members={members || []} 
              isOwner={isOwner}
              currentUserId={currentUserId}
              hasFullAccess={hasFullAccess}
            />
          </TabsContent>

          {hasFullAccess && (
            <TabsContent value="ip-tracking">
            <div className="space-y-6">
              <Card className="border-border/50">
                <CardHeader>
                  <h3 className="text-2xl font-bold">IP Value Distribution</h3>
                  <p className="text-sm text-muted-foreground">
                    Estimated contribution value based on tasks, hours, and impact scores
                  </p>
                </CardHeader>
                <CardContent>
                  {contributorPercentages.length === 0 ? (
                    <div className="text-center py-12">
                      <Award className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No contributions tracked yet</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Complete tasks and log contributions to see IP value distribution
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {contributorPercentages.map((contributor) => (
                        <div key={contributor.contributorId} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 border-2 border-border">
                                <AvatarFallback>C{contributor.contributorId.slice(-1)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold">Contributor {contributor.contributorId.slice(-4)}</p>
                                <p className="text-xs text-muted-foreground">
                                  Value Score: {contributor.value}
                                </p>
                              </div>
                            </div>
                            <Badge variant="secondary" className="font-bold">
                              {contributor.percentage.toFixed(1)}%
                            </Badge>
                          </div>
                          <Progress value={contributor.percentage} className="h-2" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <h3 className="text-xl font-bold">Recent Contributions</h3>
                </CardHeader>
                <CardContent>
                  {!contributions || contributions.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No contributions logged yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {contributions.slice(0, 10).map((contribution) => (
                        <div 
                          key={contribution.id} 
                          className="flex items-start justify-between gap-4 p-4 rounded-lg border border-border hover-elevate"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {contribution.type}
                              </Badge>
                              {contribution.hoursSpent && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {contribution.hoursSpent}h
                                </span>
                              )}
                            </div>
                            {contribution.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {contribution.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(contribution.createdAt!), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <Badge className="shrink-0 bg-gradient-to-r from-primary/90 to-primary text-white">
                            +{contribution.valueScore} pts
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
