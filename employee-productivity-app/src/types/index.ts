export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  tags: string[];
}

export interface TimeEntry {
  id: string;
  taskId?: string;
  description: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  isActive: boolean;
}

export interface ProductivityMetrics {
  tasksCompleted: number;
  totalTimeTracked: number; // in minutes
  averageTaskCompletionTime: number;
  productivityScore: number;
  weeklyProgress: {
    day: string;
    tasksCompleted: number;
    timeTracked: number;
  }[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  type: 'task' | 'meeting' | 'deadline' | 'break';
  color: string;
}