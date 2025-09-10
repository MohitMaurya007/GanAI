import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, Target, TrendingUp } from 'lucide-react';
import { Task, TimeEntry, ProductivityMetrics } from '../types';
import { TaskManager } from './TaskManager';
import { TimeTracker } from './TimeTracker';
import { Calendar } from './Calendar';
import { MetricsChart } from './MetricsChart';

interface DashboardProps {
  tasks: Task[];
  timeEntries: TimeEntry[];
  onTaskUpdate: (task: Task) => void;
  onTimeEntryUpdate: (entry: TimeEntry) => void;
  onTaskCreate: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  tasks,
  timeEntries,
  onTaskUpdate,
  onTimeEntryUpdate,
  onTaskCreate,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'time' | 'calendar'>('overview');
  const [metrics, setMetrics] = useState<ProductivityMetrics | null>(null);

  useEffect(() => {
    calculateMetrics();
  }, [tasks, timeEntries]);

  const calculateMetrics = () => {
    const completedTasks = tasks.filter(task => task.status === 'completed');
    const totalTimeTracked = timeEntries.reduce((total, entry) => total + entry.duration, 0);
    
    const weeklyProgress = getWeeklyProgress();
    const averageTaskTime = completedTasks.length > 0 
      ? completedTasks.reduce((sum, task) => sum + (task.actualHours || 0), 0) / completedTasks.length
      : 0;

    const productivityScore = calculateProductivityScore();

    setMetrics({
      tasksCompleted: completedTasks.length,
      totalTimeTracked,
      averageTaskCompletionTime: averageTaskTime,
      productivityScore,
      weeklyProgress,
    });
  };

  const getWeeklyProgress = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay() + 1));

    return days.map((day, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      
      const dayTasks = tasks.filter(task => 
        task.status === 'completed' && 
        new Date(task.updatedAt).toDateString() === date.toDateString()
      );
      
      const dayTimeEntries = timeEntries.filter(entry =>
        new Date(entry.startTime).toDateString() === date.toDateString()
      );
      
      return {
        day,
        tasksCompleted: dayTasks.length,
        timeTracked: dayTimeEntries.reduce((sum, entry) => sum + entry.duration, 0),
      };
    });
  };

  const calculateProductivityScore = () => {
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    const totalTimeTracked = timeEntries.reduce((total, entry) => total + entry.duration, 0);
    const timeScore = Math.min((totalTimeTracked / (8 * 60)) * 100, 100); // 8 hours as target
    
    return Math.round((completionRate + timeScore) / 2);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'tasks', label: 'Tasks', icon: CheckCircle },
    { id: 'time', label: 'Time Tracker', icon: Clock },
    { id: 'calendar', label: 'Calendar', icon: Target },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-gray-900">Employee Productivity</h1>
            <div className="flex space-x-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Tasks Completed</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {metrics?.tasksCompleted || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <Clock className="w-8 h-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Time Tracked</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {formatTime(metrics?.totalTimeTracked || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <Target className="w-8 h-8 text-purple-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Avg. Task Time</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {metrics?.averageTaskCompletionTime.toFixed(1)}h
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <TrendingUp className="w-8 h-8 text-orange-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Productivity Score</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {metrics?.productivityScore || 0}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Weekly Progress</h3>
                {metrics && <MetricsChart data={metrics.weeklyProgress} />}
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Tasks</h3>
                <div className="space-y-3">
                  {tasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        task.status === 'completed' ? 'bg-green-500' :
                        task.status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-300'
                      }`} />
                      <span className="text-sm text-gray-700 flex-1">{task.title}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        task.priority === 'high' ? 'bg-red-100 text-red-800' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <TaskManager
            tasks={tasks}
            onTaskUpdate={onTaskUpdate}
            onTaskCreate={onTaskCreate}
          />
        )}

        {activeTab === 'time' && (
          <TimeTracker
            tasks={tasks}
            timeEntries={timeEntries}
            onTimeEntryUpdate={onTimeEntryUpdate}
          />
        )}

        {activeTab === 'calendar' && (
          <Calendar tasks={tasks} />
        )}
      </div>
    </div>
  );
};