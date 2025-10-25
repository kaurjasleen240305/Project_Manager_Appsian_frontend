export interface AuthResponse {
  token: string;
  username: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  password: string;
  username: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  userId: string;
  tasks?: Task[];
}

export interface Task {
  id: string;
  title: string;
  dueDate?: string;
  isCompleted: boolean;
  projectId: string;
}

export interface CreateProjectDto {
  title: string;
  description?: string;
}

export interface CreateTaskDto {
  title: string;
  dueDate?: string;
}

export interface UpdateTaskDto {
  title?: string;
  dueDate?: string;
  isCompleted?: boolean;
}

// Scheduler types for MiniProjectManager
export interface ScheduleTaskDto {
  title: string;
  estimatedHours: number;
  dueDate?: string;
  dependencies: string[];
}

export interface ScheduleRequest {
  tasks: ScheduleTaskDto[];
}

export interface ScheduledTask {
  title: string;
  startDate: string;
  endDate: string;
  estimatedHours: number;
}

export interface ScheduleResponse {
  recommendedOrder: string[];
  scheduledTasks: ScheduledTask[];
  isSchedulable: boolean;
  warnings: string[];
}
