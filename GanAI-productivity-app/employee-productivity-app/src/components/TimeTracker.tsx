import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock, BarChart3 } from 'lucide-react';
import { Task, TimeEntry } from '../types';

interface TimeTrackerProps {
  tasks: Task[];
  timeEntries: TimeEntry[];
  onTimeEntryUpdate: (entry: TimeEntry) => void;
}

export const TimeTracker: React.FC<TimeTrackerProps> = ({
  tasks,
  timeEntries,
  onTimeEntryUpdate,
}) => {
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [filter, setFilter] = useState<'today' | 'week' | 'all'>('today');

  useEffect(() => {
    const active = timeEntries.find(entry => entry.isActive);
    if (active) {
      setActiveEntry(active);
      setSelectedTaskId(active.taskId || '');
      setDescription(active.description);
      
      // Calculate current duration
      const now = new Date();
      const startTime = new Date(active.startTime);
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      setCurrentTime(elapsed);
    }
  }, [timeEntries]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (activeEntry) {
      interval = setInterval(() => {
        setCurrentTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeEntry]);

  const handleStart = () => {
    if (activeEntry) return;

    const newEntry: TimeEntry = {
      id: Date.now().toString(),
      taskId: selectedTaskId || undefined,
      description: description || 'Time tracking session',
      startTime: new Date(),
      duration: 0,
      isActive: true,
    };

    setActiveEntry(newEntry);
    setCurrentTime(0);
    onTimeEntryUpdate(newEntry);
  };

  const handlePause = () => {
    if (!activeEntry) return;

    const updatedEntry: TimeEntry = {
      ...activeEntry,
      duration: activeEntry.duration + currentTime,
      isActive: false,
    };

    setActiveEntry(null);
    setCurrentTime(0);
    onTimeEntryUpdate(updatedEntry);
  };

  const handleStop = () => {
    if (!activeEntry) return;

    const updatedEntry: TimeEntry = {
      ...activeEntry,
      endTime: new Date(),
      duration: activeEntry.duration + currentTime,
      isActive: false,
    };

    setActiveEntry(null);
    setCurrentTime(0);
    setDescription('');
    setSelectedTaskId('');
    onTimeEntryUpdate(updatedEntry);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getFilteredEntries = () => {
    const now = new Date();
    
    return timeEntries.filter(entry => {
      if (entry.isActive) return true;
      
      const entryDate = new Date(entry.startTime);
      
      switch (filter) {
        case 'today':
          return entryDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return entryDate >= weekAgo;
        default:
          return true;
      }
    }).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  };

  const getTotalTime = () => {
    const filteredEntries = getFilteredEntries();
    const totalMinutes = filteredEntries.reduce((total, entry) => {
      if (entry.isActive) {
        return total + entry.duration + Math.floor(currentTime / 60);
      }
      return total + entry.duration;
    }, 0);
    
    return formatDuration(totalMinutes);
  };

  const getTaskName = (taskId?: string) => {
    if (!taskId) return 'No task selected';
    const task = tasks.find(t => t.id === taskId);
    return task ? task.title : 'Unknown task';
  };

  const currentDuration = activeEntry ? activeEntry.duration + currentTime : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Time Tracker</h2>
          <p className="text-gray-600">Track time spent on tasks and projects</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total time ({filter})</p>
          <p className="text-2xl font-bold text-primary-600">{getTotalTime()}</p>
        </div>
      </div>

      {/* Timer Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <div className="text-6xl font-mono font-bold text-gray-900 mb-4">
            {formatTime(Math.floor(currentDuration))}
          </div>
          
          {activeEntry && (
            <div className="text-sm text-gray-600 mb-4">
              <p>Tracking: {getTaskName(activeEntry.taskId)}</p>
              <p>{activeEntry.description}</p>
            </div>
          )}
        </div>

        {!activeEntry && (
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Task (Optional)
              </label>
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">No specific task</option>
                {tasks.filter(task => task.status !== 'completed').map(task => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What are you working on?"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        )}

        <div className="flex justify-center space-x-4">
          {!activeEntry ? (
            <button
              onClick={handleStart}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <Play className="w-5 h-5" />
              <span>Start</span>
            </button>
          ) : (
            <>
              <button
                onClick={handlePause}
                className="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 flex items-center space-x-2"
              >
                <Pause className="w-5 h-5" />
                <span>Pause</span>
              </button>
              <button
                onClick={handleStop}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 flex items-center space-x-2"
              >
                <Square className="w-5 h-5" />
                <span>Stop</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter and Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex space-x-2">
          {['today', 'week', 'all'].map((period) => (
            <button
              key={period}
              onClick={() => setFilter(period as any)}
              className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                filter === period
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{getFilteredEntries().length} sessions</span>
          </div>
          <div className="flex items-center space-x-1">
            <BarChart3 className="w-4 h-4" />
            <span>Avg: {getFilteredEntries().length > 0 
              ? formatDuration(Math.round(getFilteredEntries().reduce((sum, entry) => sum + entry.duration, 0) / getFilteredEntries().length))
              : '0m'}</span>
          </div>
        </div>
      </div>

      {/* Time Entries List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Time Entries</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {getFilteredEntries().map((entry) => (
            <div key={entry.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      entry.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {entry.description}
                      </p>
                      <p className="text-sm text-gray-500">
                        {getTaskName(entry.taskId)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {entry.isActive 
                      ? formatDuration(Math.floor((entry.duration + currentTime) / 60))
                      : formatDuration(entry.duration)
                    }
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(entry.startTime).toLocaleString()}
                    {entry.endTime && ` - ${new Date(entry.endTime).toLocaleTimeString()}`}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {getFilteredEntries().length === 0 && (
            <div className="px-6 py-8 text-center">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No time entries found for the selected period.</p>
              <p className="text-gray-400 text-sm">Start tracking time to see your entries here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};