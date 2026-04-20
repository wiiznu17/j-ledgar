import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Use localStorage-like storage for both iOS and Android
const createStorage = () => {
  const store: Record<string, any> = {};
  return {
    getItem: (key: string) => {
      const item = store[key];
      return item ? JSON.stringify(item) : null;
    },
    setItem: (key: string, value: string) => {
      store[key] = JSON.parse(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
};

export type NotificationType = 'payment' | 'security' | 'points' | 'info' | 'transfer' | 'error';

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  timestamp: number;
  read: boolean;
  data?: Record<string, any>;
}

interface NotificationStore {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  getUnreadCount: () => number;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],

      addNotification: (notification) => {
        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        set((state) => ({
          notifications: [
            {
              ...notification,
              id,
              timestamp: Date.now(),
              read: false,
            },
            ...state.notifications,
          ].slice(0, 50), // Keep only last 50 notifications
        }));
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
      },

      clearNotifications: () => {
        set({ notifications: [] });
      },

      getUnreadCount: () => {
        return get().notifications.filter((n) => !n.read).length;
      },
    }),
    {
      name: 'notification-store',
      storage: createJSONStorage(() => createStorage()),
    },
  ),
);
