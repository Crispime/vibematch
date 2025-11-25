import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTaskSchema } from "@shared/schema";
import type { Task, ProjectMember } from "@shared/schema";
import { z } from "zod";
import { Plus, ListTodo, Clock, AlertCircle, CheckCircle2, Circle } from "lucide-react";
import { format } from "date-fns";

const formSchema = insertTaskSchema.extend({
  title: z.string().min(1, "Title is required"),
  createdBy: z.string().min(1, "Creator ID is required"),
}).omit({ projectId: true });

interface TasksSectionProps {
  projectId: string;
  tasks: Task[];
  members: ProjectMember[];
  currentUserId: string;
  hasFullAccess: boolean;
}

export function TasksSection({ projectId, tasks, members, currentUserId, hasFullAccess }: TasksSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      createdBy: "demo-vibe-coder-1",
      status: "todo",
      priority: "medium",
      estimatedHours: 0,
    },
  });

  const createTask = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      return await apiRequest("POST", `/api/projects/${projectId}/tasks`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "tasks"] });
      setDialogOpen(false);
      form.reset();
    },
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const updateData: { status: string; completedAt?: Date | null } = { status };
      if (status === 'completed') {
        updateData.completedAt = new Date();
      } else {
        updateData.completedAt = null;
      }
      return await apiRequest("PATCH", `/api/tasks/${taskId}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "tasks"] });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createTask.mutate(data);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white';
      case 'in-progress':
        return 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white';
      default:
        return '';
    }
  };

  const getPriorityColor = (priority?: string | null) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 dark:bg-red-950/20';
      case 'medium':
        return 'text-amber-600 bg-amber-50 dark:bg-amber-950/20';
      case 'low':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-950/20';
      default:
        return '';
    }
  };

  // Filter tasks based on access level
  const visibleTasks = hasFullAccess 
    ? tasks 
    : tasks.filter(t => t.assignedTo === currentUserId);

  const todoTasks = visibleTasks.filter(t => t.status === 'todo');
  const inProgressTasks = visibleTasks.filter(t => t.status === 'in-progress');
  const completedTasks = visibleTasks.filter(t => t.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">{hasFullAccess ? 'Task Management' : 'My Tasks'}</h3>
          <p className="text-sm text-muted-foreground">
            {hasFullAccess 
              ? 'Assign and track work across the team'
              : 'View and manage your assigned tasks'
            }
          </p>
        </div>
        
        {hasFullAccess && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-task">
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Implement user authentication" {...field} data-testid="input-task-title" />
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the task in detail..."
                          className="min-h-[100px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || "medium"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estimatedHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Hours</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="8" 
                            {...field}
                            value={field.value || ""}
                            onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createTask.isPending} data-testid="button-submit-task">
                    {createTask.isPending ? "Creating..." : "Create Task"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {visibleTasks.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="p-16 text-center">
            <ListTodo className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">{hasFullAccess ? 'No tasks yet' : 'No tasks assigned'}</h3>
            <p className="text-muted-foreground mb-6">
              {hasFullAccess 
                ? 'Create tasks to organize work and track progress'
                : 'You have no tasks assigned to you yet'
              }
            </p>
            {hasFullAccess && (
              <Button onClick={() => setDialogOpen(true)} data-testid="button-create-first-task">
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Circle className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-semibold">To Do</h4>
              <Badge variant="secondary" className="ml-auto">{todoTasks.length}</Badge>
            </div>
            <div className="space-y-3">
              {todoTasks.map((task) => (
                <Card key={task.id} className="border-border/50 hover-elevate" data-testid={`card-task-${task.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 space-y-1">
                        <h5 className="font-semibold text-sm">{task.title}</h5>
                        <div className="flex items-center gap-2">
                          <Select
                            value={task.status}
                            onValueChange={(value) => updateTaskStatus.mutate({ taskId: task.id, status: value })}
                            disabled={updateTaskStatus.isPending}
                          >
                            <SelectTrigger className="h-7 w-32 text-xs" data-testid={`select-task-status-${task.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todo">To Do</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {task.priority && (
                        <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </Badge>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-blue-600" />
              <h4 className="font-semibold">In Progress</h4>
              <Badge variant="secondary" className="ml-auto">{inProgressTasks.length}</Badge>
            </div>
            <div className="space-y-3">
              {inProgressTasks.map((task) => (
                <Card key={task.id} className="border-border/50 border-l-4 border-l-blue-600 hover-elevate" data-testid={`card-task-${task.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 space-y-1">
                        <h5 className="font-semibold text-sm">{task.title}</h5>
                        <div className="flex items-center gap-2">
                          <Select
                            value={task.status}
                            onValueChange={(value) => updateTaskStatus.mutate({ taskId: task.id, status: value })}
                            disabled={updateTaskStatus.isPending}
                          >
                            <SelectTrigger className="h-7 w-32 text-xs" data-testid={`select-task-status-${task.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todo">To Do</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {task.priority && (
                        <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </Badge>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <h4 className="font-semibold">Completed</h4>
              <Badge variant="secondary" className="ml-auto">{completedTasks.length}</Badge>
            </div>
            <div className="space-y-3">
              {completedTasks.map((task) => (
                <Card key={task.id} className="border-border/50 border-l-4 border-l-emerald-600 hover-elevate opacity-75" data-testid={`card-task-${task.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 space-y-1">
                        <h5 className="font-semibold text-sm line-through decoration-muted-foreground">{task.title}</h5>
                        <div className="flex items-center gap-2">
                          <Select
                            value={task.status}
                            onValueChange={(value) => updateTaskStatus.mutate({ taskId: task.id, status: value })}
                            disabled={updateTaskStatus.isPending}
                          >
                            <SelectTrigger className="h-7 w-32 text-xs" data-testid={`select-task-status-${task.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todo">To Do</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                          {task.completedAt && (
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(task.completedAt), 'MMM d')}
                            </span>
                          )}
                        </div>
                      </div>
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
