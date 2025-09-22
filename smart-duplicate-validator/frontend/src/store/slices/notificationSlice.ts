import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Notification } from '../../types';

interface NotificationState {
  notifications: Notification[];
}

const initialState: NotificationState = {
  notifications: [],
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    updateNotification: (state, action: PayloadAction<{ id: string; updates: Partial<Notification> }>) => {
      const { id, updates } = action.payload;
      const index = state.notifications.findIndex(notification => notification.id === id);
      if (index !== -1) {
        state.notifications[index] = { ...state.notifications[index], ...updates };
      }
    },
  },
});

export const {
  addNotification,
  removeNotification,
  clearNotifications,
  updateNotification,
} = notificationSlice.actions;

// Helper action creators for common notification types
export const showSuccessNotification = (title: string, message: string, duration = 5000) => 
  addNotification({ type: 'success', title, message, duration });

export const showErrorNotification = (title: string, message: string, duration = 8000) => 
  addNotification({ type: 'error', title, message, duration });

export const showWarningNotification = (title: string, message: string, duration = 6000) => 
  addNotification({ type: 'warning', title, message, duration });

export const showInfoNotification = (title: string, message: string, duration = 5000) => 
  addNotification({ type: 'info', title, message, duration });

export default notificationSlice.reducer;