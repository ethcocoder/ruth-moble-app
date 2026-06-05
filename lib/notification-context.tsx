import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuthContext } from './auth-context';
import { listenToNotifications, Notification, markNotificationAsRead, markAllNotificationsAsRead } from './_core/firestore';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuthContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const unsubscribe = listenToNotifications(null, (notifications) => {
      const filtered = notifications.filter(n => {
        if (profile?.role === 'admin') {
          // Admins should NOT see user_approved or user_rejected notifications
          if (n.type === 'user_approved' || n.type === 'user_rejected') {
            return false;
          }
          return true;
        }
        if (n.userId === user.uid) return true;
        return false;
      });
      setNotifications(filtered);
      setLoading(false);
    });

    return unsubscribe;
  }, [user, profile]);

  const markAsRead = useCallback(async (notificationId: string) => {
    await markNotificationAsRead(notificationId);
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    await markAllNotificationsAsRead(user.uid);
  }, [user]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return context;
}
