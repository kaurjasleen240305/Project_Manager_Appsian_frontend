# Task Scheduler Integration Demo

## Overview
I have successfully integrated the project scheduler API from the MiniProjectManager backend into the Project Manager frontend. Here's what has been implemented:

## Files Created/Modified:

### 1. API Configuration (`src/config/api.ts`)
- Added `SCHEDULER_API_BASE_URL` configuration
- Added scheduler endpoints for the MiniProjectManager API

### 2. Type Definitions (`src/types/index.ts`)
- Added `ScheduleTaskDto` - Task data structure for scheduling
- Added `ScheduleRequest` - Request payload for the scheduler API
- Added `ScheduleResponse` - Response structure with recommended order

### 3. Scheduler API Client (`src/lib/scheduler-api.ts`)
- Created dedicated API client for scheduler endpoints
- Handles authentication with JWT tokens
- Communicates with MiniProjectManager backend

### 4. Task Scheduler Component (`src/components/TaskSchedulerSimple.tsx`)
- React component for task scheduling interface
- Filters incomplete tasks (isCompleted: false)
- Allows users to set estimated hours for tasks
- Calls the MiniProjectManager schedule API
- Displays recommended task order
- Follows existing UI design patterns

### 5. Integration (`src/pages/ProjectDetails.tsx`)
- Added TaskScheduler component to project details page
- Positioned above the tasks list for easy access

## How It Works:

1. **Task Filtering**: The scheduler automatically identifies incomplete tasks in a project
2. **User Input**: Users can configure estimated hours for each task
3. **API Integration**: Sends task data to `/api/v1/projects/{projectId}/schedule` endpoint
4. **Algorithm**: Backend uses topological sorting (Kahn's Algorithm) for optimal ordering
5. **Display**: Shows recommended task sequence with visual indicators

## Key Features:

- **Smart Filtering**: Only shows incomplete tasks for scheduling
- **User-Friendly Interface**: Intuitive dialog for task configuration
- **Visual Feedback**: Clear display of recommended order with step numbers
- **Responsive Design**: Works on all screen sizes
- **Error Handling**: Graceful error messages and loading states
- **Consistent Styling**: Matches existing design system

## API Integration Details:

### Request Format:
```json
{
  "tasks": [
    {
      "title": "Task Name",
      "estimatedHours": 2,
      "dueDate": "2025-10-30T00:00:00Z",
      "dependencies": []
    }
  ]
}
```

### Response Format:
```json
{
  "recommendedOrder": ["Task 1", "Task 2", "Task 3"]
}
```

## Environment Setup:

Add to `.env.local`:
```
VITE_SCHEDULER_API_BASE_URL=http://localhost:5000
```

## Usage Flow:

1. Navigate to any project with incomplete tasks
2. Find the "Task Scheduler" section above the task list
3. Click "Schedule Tasks" to open configuration dialog
4. Set estimated hours for each incomplete task
5. Click "Generate Schedule" to get optimal order
6. View recommended sequence in compact format

## Backend Requirements:

The integration expects the MiniProjectManager backend to be running with:
- Authentication enabled (JWT tokens)
- CORS configured for frontend domain
- Schedule controller at `/api/v1/projects/{projectId}/schedule`

## Benefits:

- **Improved Productivity**: Users get optimal task ordering
- **Better Planning**: Clear sequence helps with time management
- **Seamless Integration**: No disruption to existing workflow
- **Professional UI**: Consistent with existing design patterns

The scheduler integration provides a powerful new feature while maintaining the simplicity and usability of the existing project management interface.
