import { ScheduleRequest, ScheduleResponse } from '@/types';
import { SCHEDULER_API_BASE_URL, API_ENDPOINTS } from '@/config/api';

class SchedulerApiClient {
  private getToken() {
    return localStorage.getItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${SCHEDULER_API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async scheduleProjectTasks(projectId: string, request: ScheduleRequest): Promise<ScheduleResponse> {
    return this.request<ScheduleResponse>(
      API_ENDPOINTS.scheduler.schedule(projectId),
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }
}

export const schedulerApiClient = new SchedulerApiClient();
