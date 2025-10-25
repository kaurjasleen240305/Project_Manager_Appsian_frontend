import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Plus, Loader2, Trash2, Calendar as CalendarIcon, CheckCircle2, Circle } from 'lucide-react';
import { Project, Task, CreateTaskDto, UpdateTaskDto } from '@/types';
import { apiClient } from '@/lib/api';
import { API_ENDPOINTS } from '@/config/api';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  dueDate: z.string().optional(),
});

const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newTask, setNewTask] = useState<CreateTaskDto>({
    title: '',
    dueDate: '',
  });

  useEffect(() => {
    if (id) {
      fetchProject();
    }
  }, [id]);

  const fetchProject = async () => {
    if (!id) return;
    
    try {
      const data = await apiClient<Project>(API_ENDPOINTS.projects.get(id));
      setProject(data);
      setTasks(data.tasks || []);
    } catch (error: any) {
      toast({
        title: 'Error loading project',
        description: error.message,
        variant: 'destructive',
      });
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setErrors({});
    const validation = taskSchema.safeParse(newTask);
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
      const created = await apiClient<Task>(API_ENDPOINTS.tasks.create(id), {
        method: 'POST',
        body: JSON.stringify(newTask),
      });

      setTasks([...tasks, created]);
      setIsDialogOpen(false);
      setNewTask({ title: '', dueDate: '' });
      
      toast({
        title: 'Task created',
        description: 'Your new task has been added.',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to create task',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleTask = async (task: Task) => {
    try {
      const updated = await apiClient<Task>(API_ENDPOINTS.tasks.update(task.id), {
        method: 'PUT',
        body: JSON.stringify({ isCompleted: !task.isCompleted ,dueDate:task.dueDate,title:task.title} as UpdateTaskDto),
      });

      setTasks(tasks.map((t) => (t.id === task.id ? updated : t)));
    } catch (error: any) {
      toast({
        title: 'Failed to update task',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await apiClient(API_ENDPOINTS.tasks.delete(taskId), {
        method: 'DELETE',
      });

      setTasks(tasks.filter((t) => t.id !== taskId));
      
      toast({
        title: 'Task deleted',
        description: 'The task has been removed.',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to delete task',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return null;
  }

  const completedTasks = tasks.filter((t) => t.isCompleted).length;
  const totalTasks = tasks.length;
  const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{project.title}</h1>
              {project.description && (
                <p className="text-muted-foreground">{project.description}</p>
              )}
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span className="text-sm text-muted-foreground">
                    {completedTasks} of {totalTasks} tasks completed
                  </span>
                </div>
              </div>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="shadow-card-hover">
                  <Plus className="w-4 h-4 mr-2" />
                  New Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                  <DialogDescription>
                    Add a new task to this project
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateTask} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="task-title">Title *</Label>
                    <Input
                      id="task-title"
                      placeholder="Task name"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      className={errors.title ? 'border-destructive' : ''}
                    />
                    {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="task-due-date">Due Date</Label>
                    <Input
                      id="task-due-date"
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    />
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
                        'Create Task'
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {totalTasks > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-muted-foreground">{Math.round(completionPercentage)}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Tasks</h2>

        {tasks.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <Circle className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No tasks yet</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Create your first task to start tracking your work
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Task
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <Card 
                key={task.id} 
                className="shadow-card hover:shadow-card-hover transition-smooth group"
              >
                <CardContent className="flex items-center gap-4 py-4">
                  <Checkbox
                    checked={task.isCompleted}
                    onCheckedChange={() => handleToggleTask(task)}
                    className="mt-1"
                  />
                  
                  <div className="flex-1">
                    <h3 className={`font-medium ${task.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </h3>
                    {task.dueDate && (
                      <div className="flex items-center gap-2 mt-1">
                        <CalendarIcon className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Due {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-smooth"
                    onClick={() => handleDeleteTask(task.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ProjectDetails;
