import { Task, TimeEntry } from '../types';

export const sampleTasks: Task[] = [
  {
    id: '1',
    title: 'Complete project proposal',
    description: 'Prepare comprehensive project proposal for Q1 2024 including budget and timeline',
    priority: 'high',
    status: 'in-progress',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    dueDate: new Date('2024-01-25'),
    estimatedHours: 8,
    actualHours: 5,
    tags: ['proposal', 'urgent', 'Q1']
  },
  {
    id: '2',
    title: 'Review team performance metrics',
    description: 'Analyze team productivity data and prepare monthly report',
    priority: 'medium',
    status: 'todo',
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-18'),
    dueDate: new Date('2024-01-30'),
    estimatedHours: 4,
    tags: ['review', 'metrics', 'team']
  },
  {
    id: '3',
    title: 'Update documentation',
    description: 'Update API documentation with latest changes and examples',
    priority: 'low',
    status: 'completed',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-22'),
    dueDate: new Date('2024-01-22'),
    estimatedHours: 3,
    actualHours: 2.5,
    tags: ['documentation', 'api']
  },
  {
    id: '4',
    title: 'Client meeting preparation',
    description: 'Prepare presentation slides and demo for client meeting',
    priority: 'high',
    status: 'todo',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
    dueDate: new Date('2024-01-26'),
    estimatedHours: 6,
    tags: ['client', 'presentation', 'demo']
  },
  {
    id: '5',
    title: 'Code review for feature branch',
    description: 'Review pull request for new user authentication feature',
    priority: 'medium',
    status: 'in-progress',
    createdAt: new Date('2024-01-19'),
    updatedAt: new Date('2024-01-21'),
    estimatedHours: 2,
    actualHours: 1,
    tags: ['code-review', 'authentication']
  }
];

export const sampleTimeEntries: TimeEntry[] = [
  {
    id: '1',
    taskId: '1',
    description: 'Working on project proposal draft',
    startTime: new Date('2024-01-22T09:00:00'),
    endTime: new Date('2024-01-22T12:30:00'),
    duration: 210, // 3.5 hours in minutes
    isActive: false
  },
  {
    id: '2',
    taskId: '3',
    description: 'Updating API documentation',
    startTime: new Date('2024-01-22T14:00:00'),
    endTime: new Date('2024-01-22T16:30:00'),
    duration: 150, // 2.5 hours in minutes
    isActive: false
  },
  {
    id: '3',
    taskId: '5',
    description: 'Code review session',
    startTime: new Date('2024-01-21T10:00:00'),
    endTime: new Date('2024-01-21T11:00:00'),
    duration: 60, // 1 hour in minutes
    isActive: false
  },
  {
    id: '4',
    description: 'Email and administrative tasks',
    startTime: new Date('2024-01-22T08:00:00'),
    endTime: new Date('2024-01-22T08:45:00'),
    duration: 45,
    isActive: false
  }
];