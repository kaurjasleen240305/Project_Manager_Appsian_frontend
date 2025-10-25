import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, ArrowRight, Loader2, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { Task, ScheduleTaskDto, ScheduleRequest, ScheduleResponse, ScheduledTask } from '@/types';
import { schedulerApiClient } from '@/lib/scheduler-api';
import { toast } from '@/hooks/use-toast';

interface TaskSchedulerProps {
  projectId: string;
  tasks: Task[];
}

const TaskScheduler = ({ projectId, tasks }: TaskSchedulerProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleResponse, setScheduleResponse] = useState<ScheduleResponse | null>(null);
  const [taskDetails, setTaskDetails] = useState<Record<string, { estimatedHours: string; dependencies: string[] }>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Only include incomplete tasks for scheduling
  const incompleteTasks = tasks.filter(task => !task.isCompleted);

  const initializeTaskDetails = () => {
    const initialDetails: Record<string, { estimatedHours: string; dependencies: string[] }> = {};
    incompleteTasks.forEach(task => {
      initialDetails[task.title] = {
        estimatedHours: taskDetails[task.title]?.estimatedHours || '1',
        dependencies: taskDetails[task.title]?.dependencies || []
      };
    });
    console.log('Initializing task details:', initialDetails); // Debug log
    console.log('Incomplete tasks:', incompleteTasks); // Debug log
    setTaskDetails(initialDetails);
  };

  const handleEstimatedHoursChange = (taskTitle: string, value: string) => {
    setTaskDetails(prev => ({
      ...prev,
      [taskTitle]: {
        ...prev[taskTitle],
        estimatedHours: value
      }
    }));
  };

  const handleDependencyChange = (taskTitle: string, dependency: string, checked: boolean) => {
    console.log('Dependency change:', { taskTitle, dependency, checked }); // Debug log
    setTaskDetails(prev => {
      const currentDeps = prev[taskTitle]?.dependencies || [];
      const newDeps = checked 
        ? [...currentDeps, dependency]
        : currentDeps.filter(d => d !== dependency);
      
      const updated = {
        ...prev,
        [taskTitle]: {
          ...prev[taskTitle],
          dependencies: newDeps
        }
      };
      console.log('Updated taskDetails:', updated); // Debug log
      return updated;
    });
  };

  const parseEstimatedHours = (hoursString: string): number => {
    // Remove any non-numeric characters except decimal points
    const cleaned = hoursString.replace(/[^\d.]/g, '');
    const parsed = parseFloat(cleaned);
    
    // Return at least 1 hour if parsing fails or result is less than 1
    return isNaN(parsed) || parsed < 1 ? 1 : Math.round(parsed);
  };

  const validateScheduleRequest = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validate estimated hours
    incompleteTasks.forEach(task => {
      const hoursString = taskDetails[task.title]?.estimatedHours || '1';
      const parsedHours = parseEstimatedHours(hoursString);
      
      if (isNaN(parsedHours) || parsedHours < 1) {
        newErrors[task.title] = 'Please enter a valid number of hours (minimum 1)';
      }
    });
    
    // Check for circular dependencies
    incompleteTasks.forEach(task => {
      const deps = taskDetails[task.title]?.dependencies || [];
      deps.forEach(depTitle => {
        const depTask = incompleteTasks.find(t => t.title === depTitle);
        if (depTask) {
          const depDeps = taskDetails[depTitle]?.dependencies || [];
          if (depDeps.includes(task.title)) {
            newErrors[task.title] = `Circular dependency detected with "${depTitle}"`;
          }
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && incompleteTasks.length > 0;
  };

  const handleScheduleTasks = async () => {
    if (!validateScheduleRequest()) return;

    setIsScheduling(true);
    setErrors({});

    try {
      const scheduleRequest: ScheduleRequest = {
        tasks: incompleteTasks.map(task => ({
          title: task.title,
          estimatedHours: parseEstimatedHours(taskDetails[task.title]?.estimatedHours || '1'),
          dueDate: task.dueDate,
          dependencies: taskDetails[task.title]?.dependencies || []
        }))
      };
      console.log('Schedule Request:', scheduleRequest); // Debug log
      const response = await schedulerApiClient.scheduleProjectTasks(projectId, scheduleRequest);
      console.log('Schedule Response:', response); // Debug log
      setScheduleResponse(response);

      if (response.warnings.length > 0) {
        toast({
          title: 'Schedule generated with warnings',
          description: `${response.warnings.length} warning(s) found. Check the schedule details.`,
          variant: 'default',
        });
      } else {
        toast({
          title: 'Tasks scheduled successfully',
          description: 'The optimal task order has been generated.',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Failed to schedule tasks',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsScheduling(false);
    }
  };

  const openDialog = () => {
    // Initialize task details if empty or if we have new tasks
    if (Object.keys(taskDetails).length === 0 || incompleteTasks.some(task => !taskDetails[task.title])) {
      initializeTaskDetails();
    }
    setIsDialogOpen(true);
    setScheduleResponse(null);
    setErrors({});
  };

  if (incompleteTasks.length === 0) {
    return (
      <Card className="shadow-card">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle2 className="w-12 h-12 text-success mb-4" />
          <h3 className="text-lg font-semibold mb-2">All tasks completed!</h3>
          <p className="text-muted-foreground text-center">
            There are no incomplete tasks to schedule.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Task Scheduler
          </CardTitle>
          <CardDescription>
            Optimize the order of your incomplete tasks based on dependencies and due dates.
            <br />
            <span className="text-xs text-muted-foreground">Working hours: 9:00 AM - 5:00 PM (8 hours/day)</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">{incompleteTasks.length}</span> incomplete tasks
              </div>
              {scheduleResponse && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                    Scheduled
                  </Badge>
                  {scheduleResponse.warnings.length > 0 && (
                    <Badge variant="destructive" className="bg-orange-50 text-orange-700 border-orange-200">
                      {scheduleResponse.warnings.length} Warning(s)
                    </Badge>
                  )}
                </div>
              )}
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openDialog} className="shadow-card-hover">
                  <Clock className="w-4 h-4 mr-2" />
                  Schedule Tasks
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Schedule Project Tasks</DialogTitle>
                  <DialogDescription>
                    Set estimated hours and dependencies for each incomplete task to generate an optimal schedule
                  </DialogDescription>
                </DialogHeader>
                
                {/* Working Hours Info */}
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Info className="h-4 w-4 text-blue-600" />
                  <div className="text-sm text-blue-800">
                    <span className="font-medium">Working Hours:</span> 9:00 AM - 5:00 PM (8 hours per day)
                  </div>
                </div>
                
                <div className="space-y-6">
                  {!scheduleResponse ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Task Configuration</h4>
                        <Badge variant="outline" className="text-xs">
                          {incompleteTasks.length} task{incompleteTasks.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      {incompleteTasks.map((task) => (
                        <Card key={task.id} className="p-4 border-l-4 border-l-blue-500">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium text-lg">{task.title}</h5>
                              {task.dueDate && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground bg-yellow-50 px-2 py-1 rounded">
                                  <Calendar className="w-3 h-3" />
                                  Due {new Date(task.dueDate).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                            
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor={`hours-${task.id}`}>Estimated Hours</Label>
                                <Input
                                  id={`hours-${task.id}`}
                                  type="text"
                                  placeholder="e.g., 2, 1.5, 3 hours, etc."
                                  value={taskDetails[task.title]?.estimatedHours || ''}
                                  onChange={(e) => handleEstimatedHoursChange(task.title, e.target.value)}
                                  className={`max-w-48 ${errors[task.title] ? 'border-destructive' : ''}`}
                                />
                                <p className="text-xs text-muted-foreground">
                                  Enter estimated hours (e.g., "2", "1.5", "3 hours"). Minimum is 1 hour.
                                </p>
                              </div>
                              
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <Label className="text-base font-semibold">Task Dependencies</Label>
                                  <Info className="w-4 h-4 text-blue-500" />
                                </div>
                                <p className="text-sm text-muted-foreground bg-blue-50 p-2 rounded">
                                  📋 Select tasks that must be completed before this task can start
                                </p>
                                
                                {incompleteTasks.filter(t => t.id !== task.id).length > 0 ? (
                                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white space-y-3 min-h-[120px]">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Available tasks:</p>
                                    {incompleteTasks
                                      .filter(t => t.id !== task.id)
                                      .map(otherTask => (
                                        <div key={otherTask.id} className="flex items-center space-x-3 p-2 hover:bg-blue-50 rounded border border-gray-200">
                                          <input
                                            type="checkbox"
                                            id={`dep-${task.id}-${otherTask.id}`}
                                            checked={taskDetails[task.title]?.dependencies?.includes(otherTask.title) || false}
                                            onChange={(e) => handleDependencyChange(task.title, otherTask.title, e.target.checked)}
                                            className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                          />
                                          <label 
                                            htmlFor={`dep-${task.id}-${otherTask.id}`}
                                            className="text-sm font-medium text-gray-700 cursor-pointer flex-1"
                                          >
                                            {otherTask.title}
                                          </label>
                                          <span className="text-xs text-gray-500">
                                            {otherTask.dueDate ? `Due: ${new Date(otherTask.dueDate).toLocaleDateString()}` : 'No due date'}
                                          </span>
                                        </div>
                                      ))
                                    }
                                  </div>
                                ) : (
                                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 text-center">
                                    <p className="text-sm text-muted-foreground">No other tasks available for dependencies</p>
                                  </div>
                                )}
                                
                                {taskDetails[task.title]?.dependencies && taskDetails[task.title].dependencies.length > 0 && (
                                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-sm font-medium text-green-800 mb-2">✅ Selected dependencies:</p>
                                    <div className="flex flex-wrap gap-2">
                                      {taskDetails[task.title].dependencies.map(dep => (
                                        <Badge key={dep} variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                                          {dep}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {errors[task.title] && (
                              <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>{errors[task.title]}</AlertDescription>
                              </Alert>
                            )}
                          </div>
                        </Card>
                      ))}
                      
                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="flex-1" 
                          onClick={() => setIsDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          className="flex-1" 
                          onClick={handleScheduleTasks}
                          disabled={isScheduling}
                        >
                          {isScheduling ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Scheduling...
                            </>
                          ) : (
                            'Generate Schedule'
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Warnings section */}
                      {scheduleResponse.warnings.length > 0 && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="space-y-1">
                              <p className="font-medium">Schedule Warnings:</p>
                              <ul className="list-disc list-inside space-y-1">
                                {scheduleResponse.warnings.map((warning, index) => (
                                  <li key={index} className="text-sm">{warning}</li>
                                ))}
                              </ul>
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Schedule info */}
                      <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <Info className="h-4 w-4 text-blue-600" />
                        <div className="text-sm">
                          <span className="font-medium">Schedule Status: </span>
                          <span className={scheduleResponse.isSchedulable ? 'text-green-600' : 'text-orange-600'}>
                            {scheduleResponse.isSchedulable ? 'Optimal schedule generated' : 'Schedule has conflicts - see warnings above'}
                          </span>
                        </div>
                      </div>

                      {/* Task order and timeline */}
                      <div className="space-y-4">
                        <h4 className="font-medium">Task Schedule & Timeline</h4>
                        <div className="space-y-3">
                          {scheduleResponse.scheduledTasks.map((scheduledTask, index) => {
                            const task = incompleteTasks.find(t => t.title === scheduledTask.title);
                            const dependencies = taskDetails[scheduledTask.title]?.dependencies || [];
                            return (
                              <div key={scheduledTask.title} className="border rounded-lg p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full font-medium text-sm">
                                    {index + 1}
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium">{scheduledTask.title}</div>
                                    {dependencies.length > 0 && (
                                      <div className="text-sm text-muted-foreground">
                                        Depends on: {dependencies.join(', ')}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    {scheduledTask.estimatedHours}h
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-green-600" />
                                    <span className="text-muted-foreground">Start:</span>
                                    <span>{new Date(scheduledTask.startDate).toLocaleDateString()} {new Date(scheduledTask.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-red-600" />
                                    <span className="text-muted-foreground">End:</span>
                                    <span>{new Date(scheduledTask.endDate).toLocaleDateString()} {new Date(scheduledTask.endDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                  </div>
                                </div>
                                
                                {task?.dueDate && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                                    <span className="text-muted-foreground">Due Date:</span>
                                    <span className={new Date(scheduledTask.endDate) > new Date(task.dueDate) ? 'text-red-600 font-medium' : 'text-green-600'}>
                                      {new Date(task.dueDate).toLocaleDateString()}
                                    </span>
                                    {new Date(scheduledTask.endDate) > new Date(task.dueDate) && (
                                      <span className="text-red-600 text-xs">(Overdue)</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => setScheduleResponse(null)}
                        >
                          Edit Configuration
                        </Button>
                        <Button 
                          className="flex-1" 
                          onClick={() => setIsDialogOpen(false)}
                        >
                          Done
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {scheduleResponse && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Current Schedule
              {scheduleResponse.warnings.length > 0 && (
                <Badge variant="destructive" className="bg-orange-50 text-orange-700 border-orange-200">
                  {scheduleResponse.warnings.length} Warning(s)
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Follow this order for optimal task completion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {scheduleResponse.scheduledTasks.slice(0, 5).map((scheduledTask, index) => {
                const task = incompleteTasks.find(t => t.title === scheduledTask.title);
                const dependencies = taskDetails[scheduledTask.title]?.dependencies || [];
                return (
                  <div key={scheduledTask.title} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="flex items-center justify-center w-6 h-6 bg-primary/10 text-primary rounded-full font-medium text-xs">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{scheduledTask.title}</div>
                      {dependencies.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          After: {dependencies.join(', ')}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {new Date(scheduledTask.startDate).toLocaleDateString()} {new Date(scheduledTask.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(scheduledTask.endDate).toLocaleDateString()} {new Date(scheduledTask.endDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {scheduledTask.estimatedHours}h
                    </div>
                  </div>
                );
              })}
              {scheduleResponse.scheduledTasks.length > 5 && (
                <div className="text-sm text-muted-foreground text-center py-2">
                  +{scheduleResponse.scheduledTasks.length - 5} more tasks
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TaskScheduler;
