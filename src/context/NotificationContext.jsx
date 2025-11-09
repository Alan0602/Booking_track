// src/context/NotificationContext.jsx
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";

const NotificationContext = createContext();

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
};

const NOTIF_KEY = "crm-compass-notifications-v2";

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(NOTIF_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setNotifications(parsed);
      }
    } catch (e) {
      console.error("Failed to load notifications", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(NOTIF_KEY, JSON.stringify(notifications));
    } catch (e) {
      console.error("Failed to save notifications", e);
    }
  }, [notifications]);

  const addNotification = useCallback((message, type = "info") => {
    const key = `${type}:${message}`;
    const now = Date.now();

    setNotifications(prev => {
      const exists = prev.some(n => 
        n.type === type && 
        n.message === message && 
        now - n.timestamp < 3000
      );
      if (exists) return prev;

      const id = now + Math.random();
      const n = { id, message, type, timestamp: now, read: false };
      return [n, ...prev];
    });
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.read).length,
    [notifications]
  );

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      markAsRead,
      clearAll,
      unreadCount,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};