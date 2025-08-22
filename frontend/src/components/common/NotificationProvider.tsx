/**
 * Notification Provider
 * Global notification system for the application
 */

import React, { useEffect, createContext, useContext } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Slide,
  Box,
  Portal
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import { useNotifications, Notification } from '../../hooks/useNotifications';
import { navigationController } from '../../services/NavigationController';

interface NotificationContextType {
  addNotification: (message: string, type?: 'info' | 'success' | 'warning' | 'error', duration?: number) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotificationContext = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

const SlideTransition = (props: TransitionProps) => {
  return <Slide {...props} direction="down" />;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { notifications, addNotification, removeNotification, clearAllNotifications } = useNotifications();

  // Set up the navigation controller notification handler
  useEffect(() => {
    navigationController.setNotificationHandler(addNotification);
  }, [addNotification]);

  const getAlertSeverity = (type: Notification['type']) => {
    switch (type) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'success': return 'success';
      default: return 'info';
    }
  };

  const getAlertTitle = (type: Notification['type']) => {
    switch (type) {
      case 'error': return 'Error';
      case 'warning': return 'Warning';
      case 'success': return 'Success';
      default: return 'Info';
    }
  };

  return (
    <NotificationContext.Provider value={{ addNotification, removeNotification, clearAllNotifications }}>
      {children}
      
      {/* Notification Stack */}
      <Portal>
        <Box
          sx={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            maxWidth: '400px',
            minWidth: '300px'
          }}
        >
          {notifications.map((notification) => (
            <Snackbar
              key={notification.id}
              open={true}
              TransitionComponent={SlideTransition}
              sx={{
                position: 'static',
                transform: 'none',
                margin: 0
              }}
            >
              <Alert
                severity={getAlertSeverity(notification.type)}
                variant="filled"
                onClose={() => removeNotification(notification.id)}
                sx={{
                  width: '100%',
                  boxShadow: (theme) => theme.shadows[6],
                  '& .MuiAlert-message': {
                    width: '100%'
                  }
                }}
              >
                <AlertTitle sx={{ fontSize: '14px', fontWeight: 600, mb: 0.5 }}>
                  {getAlertTitle(notification.type)}
                </AlertTitle>
                {notification.message}
              </Alert>
            </Snackbar>
          ))}
        </Box>
      </Portal>
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;