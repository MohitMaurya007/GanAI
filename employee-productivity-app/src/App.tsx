import React, { useCallback, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { Task, TimeEntry } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { sampleTasks, sampleTimeEntries } from './data/sampleData';
import './App.css';

function App() {
  const [tasks, setTasks] = useLocalStorage<Task[]>('productivity-tasks', []);
  const [timeEntries, setTimeEntries] = useLocalStorage<TimeEntry[]>('productivity-time-entries', []);

  // Load sample data on first run
  useEffect(() => {
    if (tasks.length === 0 && timeEntries.length === 0) {
      setTasks(sampleTasks);
      setTimeEntries(sampleTimeEntries);
    }
  }, [tasks.length, timeEntries.length, setTasks, setTimeEntries]);

  const handleTaskCreate = useCallback((taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setTasks(prev => [newTask, ...prev]);
  }, [setTasks]);

  const handleTaskUpdate = useCallback((updatedTask: Task) => {
    setTasks(prev => prev.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    ));
  }, [setTasks]);

  const handleTimeEntryUpdate = useCallback((timeEntry: TimeEntry) => {
    setTimeEntries(prev => {
      const existingIndex = prev.findIndex(entry => entry.id === timeEntry.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = timeEntry;
        return updated;
      } else {
        return [timeEntry, ...prev];
      }
    });
  }, [setTimeEntries]);

  return (
    <div className="App">
      <Dashboard
        tasks={tasks}
        timeEntries={timeEntries}
        onTaskCreate={handleTaskCreate}
        onTaskUpdate={handleTaskUpdate}
        onTimeEntryUpdate={handleTimeEntryUpdate}
      />
    </div>
  );
}

export default App;
