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
import { insertCodeRepositorySchema } from "@shared/schema";
import type { CodeRepository } from "@shared/schema";
import { z } from "zod";
import { Plus, FileCode, Clock, DollarSign, Code2, CheckCircle, AlertCircle, Upload, Link as LinkIcon } from "lucide-react";
import { format } from "date-fns";

const formSchema = insertCodeRepositorySchema.extend({
  name: z.string().min(1, "Name is required"),
  fileUrl: z.string().min(1, "File URL is required"),
  uploadedBy: z.string().min(1, "Uploader ID is required"),
}).omit({ projectId: true });

interface CodeRepositorySectionProps {
  projectId: string;
  repositories: CodeRepository[];
}

export function CodeRepositorySection({ projectId, repositories }: CodeRepositorySectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      fileUrl: "",
      uploadedBy: "demo-vibe-coder-1",
      language: "",
      linesOfCode: 0,
      estimatedHours: 0,
      estimatedCost: "0",
      status: "pending",
    },
  });

  const uploadRepo = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      return await apiRequest("POST", `/api/projects/${projectId}/repositories`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "repositories"] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Code repository uploaded successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload repository",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (uploadMethod === 'file' && selectedFile) {
      toast({
        title: "File Upload",
        description: `File "${selectedFile.name}" ready. Storage integration needed for actual upload.`,
      });
    }
    uploadRepo.mutate(data);
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    form.setValue("name", file.name.replace(/\.[^/.]+$/, ""));
    form.setValue("fileUrl", `uploaded://${file.name}`);
    
    const extension = file.name.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'js': 'JavaScript',
      'ts': 'TypeScript',
      'tsx': 'TypeScript',
      'jsx': 'JavaScript',
      'py': 'Python',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'go': 'Go',
      'rs': 'Rust',
      'rb': 'Ruby',
      'php': 'PHP',
    };
    if (extension && languageMap[extension]) {
      form.setValue("language", languageMap[extension]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case 'reviewed':
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-amber-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-primary text-white';
      case 'reviewed':
        return 'bg-primary/80 text-white';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Code Repositories</h3>
          <p className="text-sm text-muted-foreground">
            Upload code for technical evaluation and cost estimation
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-upload-code">
              <Plus className="h-4 w-4 mr-2" />
              Upload Code
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Code Repository</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex gap-2 mb-4">
                  <Button
                    type="button"
                    variant={uploadMethod === 'file' ? 'default' : 'outline'}
                    onClick={() => setUploadMethod('file')}
                    className="flex-1"
                    data-testid="button-upload-file"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                  <Button
                    type="button"
                    variant={uploadMethod === 'url' ? 'default' : 'outline'}
                    onClick={() => setUploadMethod('url')}
                    className="flex-1"
                    data-testid="button-upload-url"
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Use URL
                  </Button>
                </div>

                {uploadMethod === 'file' ? (
                  <div>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                        isDragging
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-muted/20'
                      }`}
                    >
                      {selectedFile ? (
                        <div>
                          <FileCode className="h-12 w-12 mx-auto mb-4 text-primary" />
                          <p className="font-medium mb-2">{selectedFile.name}</p>
                          <p className="text-sm text-muted-foreground mb-4">
                            {(selectedFile.size / 1024).toFixed(2)} KB
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setSelectedFile(null);
                              form.setValue("fileUrl", "");
                            }}
                            data-testid="button-remove-file"
                          >
                            Remove File
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                          <p className="font-medium mb-2">Drag and drop your code files</p>
                          <p className="text-sm text-muted-foreground mb-4">
                            or click to browse (.zip, .tar.gz, .js, .py, etc.)
                          </p>
                          <input
                            type="file"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileSelect(file);
                            }}
                            className="hidden"
                            id="file-upload"
                            data-testid="input-file-upload"
                          />
                          <label htmlFor="file-upload">
                            <Button type="button" variant="outline" asChild>
                              <span>Choose File</span>
                            </Button>
                          </label>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Note: File storage requires backend integration. For now, files will be referenced by name.
                    </p>
                  </div>
                ) : (
                  <FormField
                    control={form.control}
                    name="fileUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>File URL or GitHub Link</FormLabel>
                        <FormControl>
                          <Input placeholder="https://github.com/... or /uploads/code.zip" {...field} data-testid="input-file-url" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Repository Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Frontend v1.0" {...field} data-testid="input-repo-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language</FormLabel>
                        <FormControl>
                          <Input placeholder="JavaScript, Python, etc." {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="linesOfCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lines of Code (est.)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="5000" 
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
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the codebase and what it does..."
                          className="min-h-[100px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={uploadRepo.isPending} data-testid="button-submit-repo">
                    {uploadRepo.isPending ? "Uploading..." : "Upload Repository"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {repositories.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="p-16 text-center">
            <FileCode className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No code uploaded yet</h3>
            <p className="text-muted-foreground mb-6">
              Upload your code for technical evaluation and cost estimation
            </p>
            <Button onClick={() => setDialogOpen(true)} data-testid="button-upload-first-code">
              <Plus className="h-4 w-4 mr-2" />
              Upload Code
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {repositories.map((repo) => (
            <Card key={repo.id} className="border-border/50 hover-elevate" data-testid={`card-repo-${repo.id}`}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 rounded-lg bg-primary">
                      <Code2 className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-xl font-bold">{repo.name}</h4>
                        <Badge className={getStatusColor(repo.status)}>
                          {getStatusIcon(repo.status)}
                          <span className="ml-1">{repo.status}</span>
                        </Badge>
                      </div>
                      {repo.description && (
                        <p className="text-sm text-muted-foreground mb-3">{repo.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {repo.language && (
                          <Badge variant="secondary" className="text-xs">
                            {repo.language}
                          </Badge>
                        )}
                        {repo.linesOfCode && (
                          <span className="flex items-center gap-1">
                            <FileCode className="h-3.5 w-3.5" />
                            {repo.linesOfCode.toLocaleString()} lines
                          </span>
                        )}
                        <span>Uploaded {format(new Date(repo.uploadedAt!), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              {(repo.estimatedHours || repo.estimatedCost) && (
                <CardContent className="pt-0">
                  <div className="flex gap-6 p-4 rounded-lg bg-muted/30">
                    {repo.estimatedHours && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Est. Hours</p>
                          <p className="font-semibold">{repo.estimatedHours}h</p>
                        </div>
                      </div>
                    )}
                    {repo.estimatedCost && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Est. Cost</p>
                          <p className="font-semibold">${parseFloat(repo.estimatedCost).toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
