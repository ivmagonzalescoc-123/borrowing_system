import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

function storageKey(userId) {
  return `notifications_${userId}`;
}

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey(user.id)) || '[]');
      setNotifications(stored);
    } catch {
      setNotifications([]);
    }
  }, [user]);

  function persist(next) {
    setNotifications(next);
    if (user) {
      localStorage.setItem(storageKey(user.id), JSON.stringify(next));
    }
  }

  function addNotification(message) {
    const entry = { id: Date.now(), message, createdAt: new Date().toISOString(), read: false };
    persist([entry, ...notifications].slice(0, 20));
  }

  function markAllRead() {
    persist(notifications.map((n) => ({ ...n, read: true })));
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

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
