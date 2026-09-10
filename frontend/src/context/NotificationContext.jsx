import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

const POLL_INTERVAL_MS = 20000;

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }
    try {
      const res = await api.get('/notifications/mine');
      setNotifications(res.data.notifications);
    } catch {
      setNotifications([]);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();
    if (!user) return undefined;
    const interval = setInterval(loadNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [user, loadNotifications]);

  async function addNotification(message) {
    try {
      const res = await api.post('/notifications', { message });
      setNotifications((prev) => [res.data.notification, ...prev]);
    } catch {
      // Best-effort: the notification is a nice-to-have, not critical to the action.
    }
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    try {
      await api.patch('/notifications/mark-read');
    } catch {
      // Best-effort; a future load will reconcile the read state.
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAllRead, unreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationProvider');
  return ctx;
}
