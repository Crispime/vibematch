import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProjectSchema } from "@shared/schema";
import type { Project } from "@shared/schema";
import { z } from "zod";
import { Plus, FolderKanban, Calendar, Code, ArrowRight, ArrowLeft, Upload } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const formSchema = insertProjectSchema.extend({
  name: z.string().min(1, "Project name is required"),
  vibeCodeId: z.string().min(1, "Vibe coder ID is required"),
  techStack: z.array(z.string()).optional(),
  lookingFor: z.array(z.string()).optional(),
  
  // Links & Platform
  projectLinks: z.array(z.string()).optional(),
  platform: z.string().optional(),
  
  // Investor Targeting
  investorPreferences: z.string().optional(),
  targetFundingStage: z.string().optional(),
  targetInvestorTypes: z.array(z.string()).optional(),
  minInvestmentAmount: z.string().optional(),
  maxInvestmentAmount: z.string().optional(),
  
  // Technical Lead Requirements
  technicalRequirements: z.string().optional(),
  requiredSkills: z.array(z.string()).optional(),
  experienceLevel: z.string().optional(),
  timeCommitment: z.string().optional(),
  technicalRoles: z.array(z.string()).optional(),
});

export default function Projects() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState("basic");
  const [techStackInput, setTechStackInput] = useState("");
  const [linkInput, setLinkInput] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const { toast } = useToast();

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      vibeCodeId: "demo-vibe-coder-1",
      status: "active",
      vision: "",
      techStack: [],
      targetUsers: "",
      currentStage: undefined,
      lookingFor: [],
      fundingGoal: undefined,
      
      // Links & Platform
      projectLinks: [],
      platform: "",
      
      // Investor Targeting
      investorPreferences: "",
      targetFundingStage: "",
      targetInvestorTypes: [],
      minInvestmentAmount: "",
      maxInvestmentAmount: "",
      
      // Technical Lead Requirements
      technicalRequirements: "",
      requiredSkills: [],
      experienceLevel: "",
      timeCommitment: "",
      technicalRoles: [],
    },
  });

  const createProject = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      return await apiRequest("POST", "/api/projects", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Project created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    const submitData = {
      ...data,
      techStack: data.techStack || [],
      lookingFor: data.lookingFor || [],
      fundingGoal: data.fundingGoal ? String(data.fundingGoal) : undefined,
      projectLinks: data.projectLinks || [],
      targetInvestorTypes: data.targetInvestorTypes || [],
      requiredSkills: data.requiredSkills || [],
      technicalRoles: data.technicalRoles || [],
      minInvestmentAmount: data.minInvestmentAmount || undefined,
      maxInvestmentAmount: data.maxInvestmentAmount || undefined,
    };
    createProject.mutate(submitData);
  };

  const addTechStack = () => {
    if (techStackInput.trim()) {
      const currentStack = form.getValues("techStack") || [];
      form.setValue("techStack", [...currentStack, techStackInput.trim()]);
      setTechStackInput("");
    }
  };

  const removeTechStack = (index: number) => {
    const currentStack = form.getValues("techStack") || [];
    form.setValue("techStack", currentStack.filter((_, i) => i !== index));
  };

  // Project Links helpers
  const addLink = () => {
    if (linkInput.trim()) {
      const currentLinks = form.getValues("projectLinks") || [];
      const trimmedLink = linkInput.trim();
      if (!currentLinks.includes(trimmedLink)) {
        form.setValue("projectLinks", [...currentLinks, trimmedLink]);
      }
      setLinkInput("");
    }
  };

  const removeLink = (index: number) => {
    const currentLinks = form.getValues("projectLinks") || [];
    form.setValue("projectLinks", currentLinks.filter((_, i) => i !== index));
  };

  // Required Skills helpers
  const addSkill = () => {
    if (skillInput.trim()) {
      const currentSkills = form.getValues("requiredSkills") || [];
      const trimmedSkill = skillInput.trim();
      if (!currentSkills.includes(trimmedSkill)) {
        form.setValue("requiredSkills", [...currentSkills, trimmedSkill]);
      }
      setSkillInput("");
    }
  };

  const removeSkill = (index: number) => {
    const currentSkills = form.getValues("requiredSkills") || [];
    form.setValue("requiredSkills", currentSkills.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-6">
          <div className="text-center text-muted-foreground">Loading projects...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-5xl font-bold mb-3">
              Projects
            </h1>
            <p className="text-muted-foreground text-lg">Manage your collaborative partnerships</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" data-testid="button-new-project">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Vibe Coding Project</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-5 mb-6">
                      <TabsTrigger value="basic" data-testid="tab-basic">Basic Info</TabsTrigger>
                      <TabsTrigger value="vibe" data-testid="tab-vibe">Vision</TabsTrigger>
                      <TabsTrigger value="team" data-testid="tab-team">Team Needs</TabsTrigger>
                      <TabsTrigger value="links" data-testid="tab-links">Links</TabsTrigger>
                      <TabsTrigger value="docs" data-testid="tab-docs">Documents</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="basic" className="space-y-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="My Awesome App" {...field} data-testid="input-project-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Brief Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="A short overview of your project..."
                                className="min-h-[100px]"
                                {...field}
                                value={field.value || ""}
                                data-testid="input-project-description"
                              />
                            </FormControl>
                            <FormDescription>Provide a concise summary of what your project does</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex gap-3 justify-end pt-4">
                        <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="button" onClick={() => setCurrentTab("vibe")} data-testid="button-next-to-vibe">
                          Next: Vibe Questions <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="vibe" className="space-y-6">
                      <FormField
                        control={form.control}
                        name="vision"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Vision</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="What problem are you solving? What's your long-term vision?"
                                className="min-h-[120px]"
                                {...field}
                                value={field.value || ""}
                                data-testid="input-vision"
                              />
                            </FormControl>
                            <FormDescription>Share your vision and the impact you want to create</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="targetUsers"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Target Users</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., Small business owners, freelancers, students..."
                                {...field}
                                value={field.value || ""}
                                data-testid="input-target-users"
                              />
                            </FormControl>
                            <FormDescription>Who will benefit from your project?</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="currentStage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Stage</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger data-testid="select-current-stage">
                                  <SelectValue placeholder="Select your project stage" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="idea">Idea Phase</SelectItem>
                                <SelectItem value="prototype">Prototype</SelectItem>
                                <SelectItem value="mvp">MVP Built</SelectItem>
                                <SelectItem value="launched">Launched</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>Where is your project in the development lifecycle?</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div>
                        <FormLabel>Tech Stack</FormLabel>
                        <div className="flex gap-2 mt-2">
                          <Input 
                            placeholder="Add a technology (e.g., React, Node.js)"
                            value={techStackInput}
                            onChange={(e) => setTechStackInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechStack())}
                            data-testid="input-tech-stack"
                          />
                          <Button type="button" onClick={addTechStack} variant="outline" data-testid="button-add-tech">
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {(form.watch("techStack") || []).map((tech, index) => (
                            <Badge key={index} variant="secondary" className="px-3 py-1">
                              {tech}
                              <button
                                type="button"
                                onClick={() => removeTechStack(index)}
                                className="ml-2 hover:text-destructive"
                                data-testid={`button-remove-tech-${index}`}
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          Technologies you're using or planning to use
                        </p>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="lookingFor"
                        render={() => (
                          <FormItem>
                            <FormLabel>What Are You Looking For?</FormLabel>
                            <div className="space-y-2 mt-2">
                              {['funding', 'technical', 'marketing', 'design'].map((option) => (
                                <FormField
                                  key={option}
                                  control={form.control}
                                  name="lookingFor"
                                  render={({ field }) => (
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(option)}
                                          onCheckedChange={(checked) => {
                                            const current = field.value || [];
                                            if (checked) {
                                              field.onChange([...current, option]);
                                            } else {
                                              field.onChange(current.filter((val) => val !== option));
                                            }
                                          }}
                                          data-testid={`checkbox-looking-${option}`}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal cursor-pointer capitalize">
                                        {option}
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                              ))}
                            </div>
                            <FormDescription>Select all that apply</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="fundingGoal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Funding Goal (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                placeholder="50000"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                data-testid="input-funding-goal"
                              />
                            </FormControl>
                            <FormDescription>Target funding amount in USD</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex gap-3 justify-between pt-4">
                        <Button type="button" variant="outline" onClick={() => setCurrentTab("basic")}>
                          <ArrowLeft className="h-4 w-4 mr-2" /> Back
                        </Button>
                        <div className="flex gap-3">
                          <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="button" onClick={() => setCurrentTab("team")} data-testid="button-next-to-team">
                            Next: Team Needs <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="team" className="space-y-6">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Investor Targeting</h3>
                          
                          <div className="space-y-6">
                            <FormField
                              control={form.control}
                              name="targetFundingStage"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Target Funding Stage</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value || ""}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-funding-stage">
                                        <SelectValue placeholder="Select funding stage" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="pre-seed">Pre-Seed</SelectItem>
                                      <SelectItem value="seed">Seed</SelectItem>
                                      <SelectItem value="series-a">Series A</SelectItem>
                                      <SelectItem value="series-b+">Series B+</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormDescription>What stage of funding are you targeting?</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="targetInvestorTypes"
                              render={() => (
                                <FormItem>
                                  <FormLabel>Target Investor Types</FormLabel>
                                  <div className="space-y-2 mt-2">
                                    {['angel', 'vc', 'strategic', 'accelerator'].map((type) => (
                                      <FormField
                                        key={type}
                                        control={form.control}
                                        name="targetInvestorTypes"
                                        render={({ field }) => (
                                          <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl>
                                              <Checkbox
                                                checked={field.value?.includes(type)}
                                                onCheckedChange={(checked) => {
                                                  const current = field.value || [];
                                                  if (checked) {
                                                    field.onChange([...current, type]);
                                                  } else {
                                                    field.onChange(current.filter((val) => val !== type));
                                                  }
                                                }}
                                                data-testid={`checkbox-investor-${type}`}
                                              />
                                            </FormControl>
                                            <FormLabel className="font-normal cursor-pointer capitalize">
                                              {type === 'vc' ? 'VC' : type.charAt(0).toUpperCase() + type.slice(1)}
                                            </FormLabel>
                                          </FormItem>
                                        )}
                                      />
                                    ))}
                                  </div>
                                  <FormDescription>Select all investor types you're interested in</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="minInvestmentAmount"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Min Investment Amount</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number"
                                        placeholder="10000"
                                        {...field}
                                        value={field.value || ""}
                                        data-testid="input-min-investment"
                                      />
                                    </FormControl>
                                    <FormDescription>USD</FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="maxInvestmentAmount"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Max Investment Amount</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number"
                                        placeholder="100000"
                                        {...field}
                                        value={field.value || ""}
                                        data-testid="input-max-investment"
                                      />
                                    </FormControl>
                                    <FormDescription>USD</FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <FormField
                              control={form.control}
                              name="investorPreferences"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Additional Investor Preferences</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Any specific requirements or preferences for investors..."
                                      className="min-h-[100px]"
                                      {...field}
                                      value={field.value || ""}
                                      data-testid="input-investor-preferences"
                                    />
                                  </FormControl>
                                  <FormDescription>Share any additional context about your ideal investors</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                        
                        <div className="border-t pt-6">
                          <h3 className="text-lg font-semibold mb-4">Technical Lead Requirements</h3>
                          
                          <div className="space-y-6">
                            <FormField
                              control={form.control}
                              name="experienceLevel"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Experience Level</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value || ""}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-experience-level">
                                        <SelectValue placeholder="Select experience level" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="junior">Junior</SelectItem>
                                      <SelectItem value="mid">Mid-Level</SelectItem>
                                      <SelectItem value="senior">Senior</SelectItem>
                                      <SelectItem value="lead">Lead</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormDescription>Minimum experience level required</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="timeCommitment"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Time Commitment</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value || ""}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-time-commitment">
                                        <SelectValue placeholder="Select time commitment" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="full-time">Full-Time</SelectItem>
                                      <SelectItem value="part-time">Part-Time</SelectItem>
                                      <SelectItem value="contract">Contract</SelectItem>
                                      <SelectItem value="advisor">Advisor</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormDescription>Expected time commitment</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="technicalRoles"
                              render={() => (
                                <FormItem>
                                  <FormLabel>Technical Roles Needed</FormLabel>
                                  <div className="space-y-2 mt-2">
                                    {['backend', 'frontend', 'devops', 'mobile', 'ai/ml'].map((role) => (
                                      <FormField
                                        key={role}
                                        control={form.control}
                                        name="technicalRoles"
                                        render={({ field }) => (
                                          <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl>
                                              <Checkbox
                                                checked={field.value?.includes(role)}
                                                onCheckedChange={(checked) => {
                                                  const current = field.value || [];
                                                  if (checked) {
                                                    field.onChange([...current, role]);
                                                  } else {
                                                    field.onChange(current.filter((val) => val !== role));
                                                  }
                                                }}
                                                data-testid={`checkbox-role-${role}`}
                                              />
                                            </FormControl>
                                            <FormLabel className="font-normal cursor-pointer capitalize">
                                              {role === 'ai/ml' ? 'AI/ML' : role.charAt(0).toUpperCase() + role.slice(1)}
                                            </FormLabel>
                                          </FormItem>
                                        )}
                                      />
                                    ))}
                                  </div>
                                  <FormDescription>Select all technical roles needed</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <div>
                              <FormLabel>Required Skills</FormLabel>
                              <div className="flex gap-2 mt-2">
                                <Input 
                                  placeholder="Add a required skill (e.g., Python, AWS)"
                                  value={skillInput}
                                  onChange={(e) => setSkillInput(e.target.value)}
                                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                  data-testid="input-required-skill"
                                />
                                <Button type="button" onClick={addSkill} variant="outline" data-testid="button-add-skill">
                                  Add
                                </Button>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-3">
                                {(form.watch("requiredSkills") || []).map((skill, index) => (
                                  <Badge key={index} variant="secondary" className="px-3 py-1">
                                    {skill}
                                    <button
                                      type="button"
                                      onClick={() => removeSkill(index)}
                                      className="ml-2 hover:text-destructive"
                                      data-testid={`button-remove-skill-${index}`}
                                    >
                                      ×
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                              <p className="text-sm text-muted-foreground mt-2">
                                Specific technical skills required for the role
                              </p>
                            </div>
                            
                            <FormField
                              control={form.control}
                              name="technicalRequirements"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Additional Technical Requirements</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Any specific technical requirements or preferences..."
                                      className="min-h-[100px]"
                                      {...field}
                                      value={field.value || ""}
                                      data-testid="input-technical-requirements"
                                    />
                                  </FormControl>
                                  <FormDescription>Share any additional context about your technical needs</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-3 justify-between pt-4">
                        <Button type="button" variant="outline" onClick={() => setCurrentTab("vibe")}>
                          <ArrowLeft className="h-4 w-4 mr-2" /> Back
                        </Button>
                        <div className="flex gap-3">
                          <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="button" onClick={() => setCurrentTab("links")} data-testid="button-next-to-links">
                            Next: Links <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="links" className="space-y-6">
                      <div>
                        <FormLabel>Project Links</FormLabel>
                        <div className="flex gap-2 mt-2">
                          <Input 
                            placeholder="Add a project link (e.g., GitHub, demo site)"
                            value={linkInput}
                            onChange={(e) => setLinkInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLink())}
                            data-testid="input-project-link"
                          />
                          <Button type="button" onClick={addLink} variant="outline" data-testid="button-add-link">
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {(form.watch("projectLinks") || []).map((link, index) => (
                            <Badge key={index} variant="secondary" className="px-3 py-1">
                              {link}
                              <button
                                type="button"
                                onClick={() => removeLink(index)}
                                className="ml-2 hover:text-destructive"
                                data-testid={`button-remove-link-${index}`}
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          Links to your project repository, demo, or related resources
                        </p>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="platform"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Development Platform</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., Replit, VS Code, IntelliJ..."
                                {...field}
                                value={field.value || ""}
                                data-testid="input-platform"
                              />
                            </FormControl>
                            <FormDescription>Primary platform or IDE you're using for development</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex gap-3 justify-between pt-4">
                        <Button type="button" variant="outline" onClick={() => setCurrentTab("team")}>
                          <ArrowLeft className="h-4 w-4 mr-2" /> Back
                        </Button>
                        <div className="flex gap-3">
                          <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="button" onClick={() => setCurrentTab("docs")} data-testid="button-next-to-docs">
                            Next: Documents <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="docs" className="space-y-6">
                      <div className="border-2 border-dashed border-border rounded-lg p-12 text-center bg-muted/20">
                        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="font-semibold mb-2">Upload Initial Code (Optional)</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          You can upload code files now or add them later from the project dashboard
                        </p>
                        <Button type="button" variant="outline" disabled data-testid="button-upload-code">
                          <Code className="h-4 w-4 mr-2" />
                          Choose Files (Coming Soon)
                        </Button>
                      </div>
                      
                      <div className="bg-muted/30 rounded-lg p-4">
                        <h4 className="font-medium mb-2">📝 Note:</h4>
                        <p className="text-sm text-muted-foreground">
                          After creating your project, you can upload code files, manage repositories, 
                          assign tasks, and track contributions from the project dashboard.
                        </p>
                      </div>
                      
                      <div className="flex gap-3 justify-between pt-4">
                        <Button type="button" variant="outline" onClick={() => setCurrentTab("links")}>
                          <ArrowLeft className="h-4 w-4 mr-2" /> Back
                        </Button>
                        <div className="flex gap-3">
                          <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button 
                            type="button"
                            disabled={createProject.isPending} 
                            data-testid="button-create-project"
                            onClick={() => form.handleSubmit(onSubmit)()}
                          >
                            {createProject.isPending ? "Creating..." : "Create Project"}
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {!projects || projects.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="p-16 text-center">
              <FolderKanban className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first project to start collaborating with technical leads
              </p>
              <Button onClick={() => setDialogOpen(true)} data-testid="button-create-first-project">
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`} className="block">
                <Card className="hover-elevate border-border/50 h-full" data-testid={`card-project-${project.id}`}>
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="font-bold text-xl line-clamp-2 flex-1">{project.name}</h3>
                        <Badge 
                          variant={project.status === 'active' ? 'default' : 'secondary'}
                        >
                          {project.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pb-4">
                      {project.description && (
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
                          {project.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Created {format(new Date(project.createdAt!), 'MMM d, yyyy')}</span>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="pt-0">
                      <div className="text-sm font-medium text-primary">View Dashboard →</div>
                    </CardFooter>
                  </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
