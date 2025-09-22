import React, { useEffect } from 'react';
import { Snackbar, Alert, AlertTitle, Slide, SlideProps } from '@mui/material';
import { useAppSelector, useAppDispatch } from '../../store';
import { removeNotification } from '../../store/slices/notificationSlice';

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

const NotificationManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const { notifications } = useAppSelector(state => state.notifications);

  useEffect(() => {
    // Auto-remove notifications after their duration
    notifications.forEach(notification => {
      if (notification.duration && notification.duration > 0) {
        const timer = setTimeout(() => {
          dispatch(removeNotification(notification.id));
        }, notification.duration);

        return () => clearTimeout(timer);
      }
    });
  }, [notifications, dispatch]);

  const handleClose = (notificationId: string) => {
    dispatch(removeNotification(notificationId));
  };

  // Only show the most recent notification
  const currentNotification = notifications[notifications.length - 1];

  if (!currentNotification) {
    return null;
  }

  return (
    <Snackbar
      open={true}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      TransitionComponent={SlideTransition}
      sx={{ mb: 2, mr: 2 }}
    >
      <Alert
        severity={currentNotification.type}
        onClose={() => handleClose(currentNotification.id)}
        variant="filled"
        sx={{
          minWidth: 300,
          maxWidth: 500,
          '& .MuiAlert-message': {
            width: '100%',
          },
        }}
      >
        <AlertTitle sx={{ fontWeight: 'bold' }}>
          {currentNotification.title}
        </AlertTitle>
        {currentNotification.message}
      </Alert>
    </Snackbar>
  );
};

export default NotificationManager;