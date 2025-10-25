// API Configuration
// Update this URL to point to your .NET 8 backend
export const API_BASE_URL = 'https://project-manager-appsian.onrender.com';

// Scheduler API URL for MiniProjectManager
export const SCHEDULER_API_BASE_URL = 'https://project-manager-appsian.onrender.com';

export const API_ENDPOINTS = {
  auth: {
    register: '/api/Auth/register',
    login: '/api/Auth/login',
  },
  projects: {
    list: '/api/Projects',
    create: '/api/Projects',
    get: (id: string) => `/api/Projects/${id}`,
    delete: (id: string) => `/api/Projects/${id}`,
  },
  tasks: {
    create: (projectId: string) => `/api/projects/${projectId}/tasks`,
    update: (taskId: string) => `/api/tasks/${taskId}`,
    delete: (taskId: string) => `/api/tasks/${taskId}`,
  },
  scheduler: {
    schedule: (projectId: string) => `/api/v1/projects/${projectId}/schedule`,
  },
} as const;
