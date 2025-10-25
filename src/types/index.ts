

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
