import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Task } from '../types';

interface CalendarProps {
  tasks: Task[];
}

export const Calendar: React.FC<CalendarProps> = ({ tasks }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');

  const today = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      const days = direction === 'prev' ? -7 : 7;
      newDate.setDate(prev.getDate() + days);
      return newDate;
    });
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  const getWeekDates = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Start from Monday
    startOfWeek.setDate(diff);

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dayTasks = getTasksForDate(date);
      const isToday = date.toDateString() === today.toDateString();
      const isPast = date < today && !isToday;

      days.push(
        <div
          key={day}
          className={`p-2 min-h-[100px] border border-gray-200 ${
            isToday ? 'bg-blue-50 border-blue-300' : isPast ? 'bg-gray-50' : 'bg-white'
          }`}
        >
          <div className={`text-sm font-medium mb-1 ${
            isToday ? 'text-blue-600' : isPast ? 'text-gray-400' : 'text-gray-900'
          }`}>
            {day}
          </div>
          <div className="space-y-1">
            {dayTasks.slice(0, 3).map(task => (
              <div
                key={task.id}
                className={`text-xs p-1 rounded truncate ${
                  task.priority === 'high' ? 'bg-red-100 text-red-800' :
                  task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}
                title={task.title}
              >
                {task.title}
              </div>
            ))}
            {dayTasks.length > 3 && (
              <div className="text-xs text-gray-500">
                +{dayTasks.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-lg overflow-hidden">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="bg-gray-50 p-3 text-center text-sm font-medium text-gray-700 border-b border-gray-200">
            {day}
          </div>
        ))}
        {days}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDates = getWeekDates();

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-4">
          {weekDates.map((date, index) => {
            const dayTasks = getTasksForDate(date);
            const isToday = date.toDateString() === today.toDateString();
            const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

            return (
              <div key={index} className="space-y-2">
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-600">
                    {dayNames[index]}
                  </div>
                  <div className={`text-lg font-semibold ${
                    isToday ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                    {date.getDate()}
                  </div>
                </div>
                <div className={`min-h-[200px] p-3 rounded-lg border-2 ${
                  isToday ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'
                }`}>
                  <div className="space-y-2">
                    {dayTasks.map(task => (
                      <div
                        key={task.id}
                        className={`text-sm p-2 rounded ${
                          task.priority === 'high' ? 'bg-red-100 text-red-800 border-l-4 border-red-500' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500' :
                          'bg-green-100 text-green-800 border-l-4 border-green-500'
                        }`}
                      >
                        <div className="font-medium">{task.title}</div>
                        {task.description && (
                          <div className="text-xs opacity-75 mt-1">
                            {task.description.length > 50 
                              ? `${task.description.substring(0, 50)}...` 
                              : task.description
                            }
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getUpcomingTasks = () => {
    const upcoming = tasks
      .filter(task => task.dueDate && new Date(task.dueDate) >= today && task.status !== 'completed')
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 5);
    
    return upcoming;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Calendar</h2>
          <p className="text-gray-600">View tasks and deadlines in calendar format</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex space-x-1">
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                view === 'month'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                view === 'week'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => view === 'month' ? navigateMonth('prev') : navigateWeek('prev')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <h3 className="text-xl font-semibold text-gray-900">
          {view === 'month' 
            ? currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            : `Week of ${getWeekDates()[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
          }
        </h3>
        
        <button
          onClick={() => view === 'month' ? navigateMonth('next') : navigateWeek('next')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar View */}
        <div className="lg:col-span-3">
          {view === 'month' ? renderMonthView() : renderWeekView()}
        </div>

        {/* Upcoming Tasks Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2" />
              Upcoming Tasks
            </h4>
            <div className="space-y-3">
              {getUpcomingTasks().map(task => (
                <div key={task.id} className="border-l-4 border-primary-500 pl-3">
                  <div className="text-sm font-medium text-gray-900">{task.title}</div>
                  <div className="text-xs text-gray-500">
                    Due: {new Date(task.dueDate!).toLocaleDateString()}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                    task.priority === 'high' ? 'bg-red-100 text-red-800' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {task.priority}
                  </div>
                </div>
              ))}
              {getUpcomingTasks().length === 0 && (
                <p className="text-gray-500 text-sm">No upcoming tasks with due dates.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Tasks</span>
                <span className="text-sm font-medium">{tasks.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Completed</span>
                <span className="text-sm font-medium text-green-600">
                  {tasks.filter(t => t.status === 'completed').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">In Progress</span>
                <span className="text-sm font-medium text-blue-600">
                  {tasks.filter(t => t.status === 'in-progress').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Overdue</span>
                <span className="text-sm font-medium text-red-600">
                  {tasks.filter(t => t.dueDate && new Date(t.dueDate) < today && t.status !== 'completed').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};