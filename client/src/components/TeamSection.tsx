import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProjectMemberSchema } from "@shared/schema";
import type { ProjectMember } from "@shared/schema";
import { z } from "zod";
import { Plus, Users, DollarSign, PieChart } from "lucide-react";
import { format } from "date-fns";

const formSchema = insertProjectMemberSchema.extend({
  profileId: z.string().min(1, "Profile ID is required"),
  role: z.string().min(1, "Role is required"),
  compensationType: z.string().min(1, "Compensation type is required"),
}).omit({ projectId: true });

interface TeamSectionProps {
  projectId: string;
  members: ProjectMember[];
  isOwner: boolean;
  currentUserId: string;
  hasFullAccess: boolean;
}

export function TeamSection({ projectId, members, isOwner, currentUserId, hasFullAccess }: TeamSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      profileId: "",
      role: "technical",
      compensationType: "ownership",
      compensationAmount: "0",
      ownershipPercentage: "0",
    },
  });

  const compensationType = form.watch("compensationType");

  const addMember = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      return await apiRequest("POST", `/api/projects/${projectId}/members`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "members"] });
      setDialogOpen(false);
      form.reset();
    },
  });

  const toggleAccess = useMutation({
    mutationFn: async ({ memberId, hasAccess }: { memberId: string; hasAccess: boolean }) => {
      return await apiRequest(
        "PATCH", 
        `/api/project-members/${memberId}`, 
        { hasAccess },
        { 'x-user-id': currentUserId }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "members"] });
      toast({
        title: "Access updated",
        description: "Team member dashboard access has been updated.",
      });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "members"] });
      toast({
        title: "Error",
        description: "Failed to update access. You must be the project owner.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    addMember.mutate(data);
  };

  // Filter members based on access level
  const visibleMembers = hasFullAccess 
    ? members 
    : members.filter(m => m.profileId === currentUserId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">{hasFullAccess ? 'Team Members' : 'My Team Info'}</h3>
          <p className="text-sm text-muted-foreground">
            {hasFullAccess 
              ? 'Manage collaborators and their compensation'
              : 'View your team membership information'
            }
          </p>
        </div>
        
        {hasFullAccess && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-member">
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="profileId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profile ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter profile ID" {...field} data-testid="input-member-profile-id" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-member-role">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="technical">Technical Lead</SelectItem>
                          <SelectItem value="investor">Investor</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="compensationType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Compensation Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-compensation-type">
                            <SelectValue placeholder="Select compensation type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="money">Money</SelectItem>
                          <SelectItem value="ownership">Ownership Stake</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {compensationType === "money" ? (
                  <FormField
                    control={form.control}
                    name="compensationAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Amount ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="10000" 
                            {...field}
                            value={field.value || ""}
                            data-testid="input-compensation-amount"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="ownershipPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ownership Percentage (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="15" 
                            step="0.1"
                            min="0"
                            max="100"
                            {...field}
                            value={field.value || ""}
                            data-testid="input-ownership-percentage"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addMember.isPending} data-testid="button-submit-member">
                    {addMember.isPending ? "Adding..." : "Add Member"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {visibleMembers.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="p-16 text-center">
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">{hasFullAccess ? 'No team members yet' : 'Not a team member'}</h3>
            <p className="text-muted-foreground mb-6">
              {hasFullAccess 
                ? 'Add technical leads or investors to your project'
                : 'You are not currently a team member of this project'
              }
            </p>
            {hasFullAccess && (
              <Button onClick={() => setDialogOpen(true)} data-testid="button-add-first-member">
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {visibleMembers.map((member) => (
            <Card key={member.id} className="border-border/50 hover-elevate" data-testid={`card-member-${member.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <Avatar className="h-16 w-16 border-2 border-border">
                      <AvatarFallback className="text-lg">
                        {member.role === 'technical' ? 'TL' : 'IN'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-bold">Profile {member.profileId.slice(-6)}</h4>
                        <Badge 
                          className={
                            member.role === 'technical' 
                              ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-sm'
                              : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                          }
                        >
                          {member.role === 'technical' ? 'Technical Lead' : 'Investor'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Joined {format(new Date(member.joinedAt!), 'MMM d, yyyy')}
                      </p>
                      
                      <div className="flex items-center gap-6">
                        {member.compensationType === 'money' && member.compensationAmount ? (
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                              <DollarSign className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Payment</p>
                              <p className="font-semibold">
                                ${parseFloat(member.compensationAmount).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ) : member.compensationType === 'ownership' && member.ownershipPercentage ? (
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                              <PieChart className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Ownership</p>
                              <p className="font-semibold">
                                {parseFloat(member.ownershipPercentage).toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  
                  {isOwner && (
                    <div className="flex items-center gap-3 pl-4 border-l border-border">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor={`access-${member.id}`} className="text-xs text-muted-foreground">
                          Dashboard Access
                        </Label>
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`access-${member.id}`}
                            checked={member.hasAccess}
                            onCheckedChange={(checked) => {
                              toggleAccess.mutate({ memberId: member.id, hasAccess: checked });
                            }}
                            disabled={toggleAccess.isPending}
                            data-testid={`switch-access-${member.id}`}
                          />
                          <span className="text-sm">
                            {member.hasAccess ? (
                              <Badge 
                                variant="default" 
                                className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm"
                                data-testid={`badge-access-status-${member.id}`}
                              >
                                Granted
                              </Badge>
                            ) : (
                              <Badge 
                                variant="secondary"
                                data-testid={`badge-access-status-${member.id}`}
                              >
                                Not Granted
                              </Badge>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
