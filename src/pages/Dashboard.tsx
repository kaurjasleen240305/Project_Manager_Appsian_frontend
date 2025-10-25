import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LogOut, Plus, FolderOpen, Calendar, Loader2, Trash2 } from 'lucide-react';
import { Project, CreateProjectDto } from '@/types';
import { apiClient } from '@/lib/api';
import { API_ENDPOINTS } from '@/config/api';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

const projectSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
});

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newProject, setNewProject] = useState<CreateProjectDto>({
    title: '',
    description: '',
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await apiClient<Project[]>(API_ENDPOINTS.projects.list);
      console.log(data);
      setProjects(data);
    } catch (error: any) {
      toast({
        title: 'Error loading projects',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = projectSchema.safeParse(newProject);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsCreating(true);
    try {
      const created = await apiClient<Project>(API_ENDPOINTS.projects.create, {
        method: 'POST',
        body: JSON.stringify(newProject),
      });

      setProjects([created, ...projects]);
      setIsDialogOpen(false);
      setNewProject({ title: '', description: '' });
      
      toast({
        title: 'Project created',
        description: 'Your new project has been created successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to create project',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await apiClient(API_ENDPOINTS.projects.delete(id), {
        method: 'DELETE',
      });

      setProjects(projects.filter((p) => p.id !== id));
      
      toast({
        title: 'Project deleted',
        description: 'The project has been removed.',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to delete project',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Project Manager</h1>
              <p className="text-sm text-muted-foreground">Welcome back, {user}</p>
            </div>
          </div>
          
          <Button variant="outline" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Your Projects</h2>
            <p className="text-muted-foreground">Manage and track all your projects in one place</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="shadow-card-hover">
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Add a new project to start organizing your tasks
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="My Awesome Project"
                    value={newProject.title}
                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                    className={errors.title ? 'border-destructive' : ''}
                  />
                  {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="What is this project about?"
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    className={errors.description ? 'border-destructive' : ''}
                    rows={3}
                  />
                  {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Project'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : projects.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <FolderOpen className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Create your first project to start organizing your work and tracking tasks
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card 
                key={project.id} 
                className="shadow-card hover:shadow-card-hover transition-smooth cursor-pointer group"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="group-hover:text-primary transition-smooth">
                        {project.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-2">
                        <Calendar className="w-3 h-3" />
                        {new Date(project.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-smooth"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                {project.description && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.description}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
