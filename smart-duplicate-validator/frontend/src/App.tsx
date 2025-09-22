import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { store } from './store';
import { useAppDispatch, useAppSelector } from './store';
import { initializeAuth } from './store/slices/authSlice';
import { initializeUI } from './store/slices/uiSlice';
import { getTheme } from './theme';

// Layout components
import Layout from './components/common/Layout';
import PrivateRoute from './components/common/PrivateRoute';
import NotificationManager from './components/common/NotificationManager';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MediaPage from './pages/MediaPage';
import DuplicatesPage from './pages/DuplicatesPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';

// Socket.io connection
import { io, Socket } from 'socket.io-client';

// Socket instance
let socket: Socket;

function AppContent() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector(state => state.auth);
  const { theme } = useAppSelector(state => state.ui);

  useEffect(() => {
    // Initialize app state
    dispatch(initializeAuth());
    dispatch(initializeUI());
  }, [dispatch]);

  useEffect(() => {
    // Initialize socket connection when authenticated
    if (isAuthenticated && user) {
      socket = io(process.env.REACT_APP_API_URL || 'http://localhost:3000');
      
      socket.on('connect', () => {
        console.log('Connected to server');
        socket.emit('join-room', user.id);
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from server');
      });

      socket.on('processing-update', (data) => {
        // Handle real-time processing updates
        console.log('Processing update:', data);
        // You would dispatch actions to update the store here
      });

      return () => {
        if (socket) {
          socket.disconnect();
        }
      };
    }
  }, [isAuthenticated, user]);

  const currentTheme = getTheme(theme.mode);

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public routes */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
            } 
          />
          <Route 
            path="/register" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />
            } 
          />
          
          {/* Protected routes */}
          <Route 
            path="/" 
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="media" element={<MediaPage />} />
            <Route path="duplicates" element={<DuplicatesPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route 
              path="admin" 
              element={
                <PrivateRoute requiredRole="ADMIN">
                  <AdminPage />
                </PrivateRoute>
              } 
            />
          </Route>
          
          {/* Catch all route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
      <NotificationManager />
    </ThemeProvider>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;