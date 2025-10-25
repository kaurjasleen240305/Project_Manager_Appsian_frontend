# Task Scheduler Integration

## Overview
This integration adds a task scheduling feature to the Project Manager frontend that communicates with the MiniProjectManager backend's schedule API. The scheduler helps users optimize the order of their incomplete tasks.

## Key Features

### 1. Task Scheduler Component (`TaskSchedulerSimple.tsx`)
- **Purpose**: Provides a UI for scheduling incomplete tasks in optimal order
- **Location**: `src/components/TaskSchedulerSimple.tsx`
- **Features**:
  - Shows only incomplete tasks (isCompleted: false)
  - Allows users to set estimated hours for each task
  - Communicates with the MiniProjectManager schedule API
  - Displays recommended task order based on dependencies
  - Responsive and consistent with existing UI design

### 2. API Integration
- **Scheduler API Client**: `src/lib/scheduler-api.ts`
- **Backend URL**: Configurable via environment variable `VITE_SCHEDULER_API_BASE_URL` (defaults to `http://localhost:5000`)
- **Endpoint**: `/api/v1/projects/{projectId}/schedule`
- **Authentication**: Uses JWT token from localStorage

### 3. Updated API Configuration
- **File**: `src/config/api.ts`
- **Changes**: Added scheduler API base URL and endpoints

### 4. Type Definitions
- **File**: `src/types/index.ts`
- **Added Types**:
  - `ScheduleTaskDto`: Task data for scheduling
  - `ScheduleRequest`: Request payload for scheduling API
  - `ScheduleResponse`: Response from scheduling API

### 5. UI Integration
- **Location**: Integrated into the ProjectDetails page (`src/pages/ProjectDetails.tsx`)
- **Placement**: Above the tasks list, providing scheduling capabilities for the current project
- **Design**: Follows the same design patterns as existing components

## How It Works

1. **Task Filtering**: The scheduler automatically filters out completed tasks and only works with incomplete ones
2. **Configuration**: Users can set estimated hours for each task
3. **API Call**: Sends task data to the MiniProjectManager schedule endpoint
4. **Results**: Displays the recommended task order returned by the backend algorithm
5. **Visual Feedback**: Shows the current schedule in a compact format below the main scheduler

## Backend Integration

### MiniProjectManager Schedule API
- **Controller**: `ScheduleController.cs`
- **Algorithm**: Uses topological sorting (Kahn's Algorithm) for dependency resolution
- **Input**: Array of tasks with titles, estimated hours, due dates, and dependencies
- **Output**: Recommended order array

### Authentication
- Uses the same JWT authentication as the main project manager
- Token is automatically included in API requests

## Usage

1. Navigate to any project details page
2. Look for the "Task Scheduler" section above the tasks list
3. Click "Schedule Tasks" to open the configuration dialog
4. Set estimated hours for each incomplete task
5. Click "Generate Schedule" to get the optimal task order
6. View the recommended schedule in the results

## Technical Notes

- The component gracefully handles cases where all tasks are completed
- Error handling provides user-friendly feedback
- The scheduler respects the existing design system and styling
- Compatible with the current authentication system
- Responsive design works on all screen sizes

## Environment Variables

Add to your `.env` file:
```
VITE_SCHEDULER_API_BASE_URL=http://localhost:5000
```

## API Flow

1. **Filter Tasks**: Only incomplete tasks are sent to the scheduler
2. **Request Format**:
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
3. **Response Format**:
   ```json
   {
     "recommendedOrder": ["Task 1", "Task 2", "Task 3"]
   }
   ```

This integration provides a seamless way for users to optimize their task workflow while maintaining the existing user experience and design consistency.
