# Employee Productivity App

A comprehensive productivity application built with React and TypeScript to help employees manage tasks, track time, and monitor their productivity metrics.

## Features

### 📋 Task Management
- Create, edit, and organize tasks with priorities and due dates
- Filter tasks by status (To Do, In Progress, Completed)
- Sort by priority, due date, or creation date
- Add tags and descriptions to tasks
- Track estimated vs actual time spent

### ⏱️ Time Tracking
- Start, pause, and stop time tracking sessions
- Associate time entries with specific tasks
- View time tracking history with filters (today, week, all)
- Real-time timer display with automatic duration calculation

### 📊 Productivity Dashboard
- Overview of key metrics (tasks completed, time tracked, productivity score)
- Interactive charts showing weekly progress
- Recent tasks summary with status indicators
- Productivity score calculation based on task completion and time utilization

### 📅 Calendar View
- Monthly and weekly calendar views
- Visual representation of task due dates
- Upcoming tasks sidebar with priority indicators
- Quick stats showing task distribution and overdue items

### 💾 Data Persistence
- All data automatically saved to browser's local storage
- Sample data loaded on first use for demonstration
- Data persists across browser sessions

## Technology Stack

- **React 18** with TypeScript for type-safe development
- **Tailwind CSS** for modern, responsive styling
- **Recharts** for interactive data visualizations
- **Lucide React** for consistent iconography
- **Local Storage** for client-side data persistence

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd employee-productivity-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view the app in your browser.

## Usage

### Creating Tasks
1. Navigate to the "Tasks" tab
2. Click "New Task" button
3. Fill in task details (title, description, priority, due date, etc.)
4. Click "Create Task" to save

### Time Tracking
1. Go to the "Time Tracker" tab
2. Optionally select a task to associate with the time entry
3. Add a description of what you're working on
4. Click "Start" to begin tracking time
5. Use "Pause" to temporarily stop or "Stop" to end the session

### Viewing Analytics
1. The "Overview" tab shows your productivity dashboard
2. View weekly progress charts for tasks completed and time tracked
3. Monitor your productivity score and key metrics
4. Check recent tasks and their completion status

### Calendar Planning
1. Use the "Calendar" tab to view tasks by due date
2. Switch between monthly and weekly views
3. See upcoming tasks in the sidebar
4. Monitor overdue tasks and plan accordingly

## Project Structure

```
src/
├── components/          # React components
│   ├── Dashboard.tsx    # Main dashboard with tabs
│   ├── TaskManager.tsx  # Task management interface
│   ├── TimeTracker.tsx  # Time tracking functionality
│   ├── Calendar.tsx     # Calendar views
│   └── MetricsChart.tsx # Chart components
├── types/               # TypeScript type definitions
├── hooks/               # Custom React hooks
├── data/                # Sample data and utilities
└── App.tsx             # Main application component
```

## Available Scripts

### `npm start`
Runs the app in development mode on [http://localhost:3000](http://localhost:3000)

### `npm test`
Launches the test runner in interactive watch mode

### `npm run build`
Builds the app for production to the `build` folder

### `npm run eject`
Ejects from Create React App (one-way operation)

## Features in Detail

### Productivity Score Calculation
The productivity score is calculated based on:
- Task completion rate (completed tasks / total tasks)
- Time utilization (tracked time vs 8-hour target)
- Average of both metrics for a balanced score

### Data Management
- Tasks and time entries are automatically saved to localStorage
- Date objects are properly serialized and deserialized
- Sample data is loaded on first use to demonstrate features

### Responsive Design
- Fully responsive layout that works on desktop, tablet, and mobile
- Tailwind CSS utility classes for consistent styling
- Modern UI components with hover states and transitions

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
