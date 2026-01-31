/**
 * Notification Store
 * Global state for notifications
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationType = 'success' | 'info' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  autoDismiss?: boolean;
}

interface NotificationStore {
  notifications: Notification[];
  addNotification: (
    type: NotificationType,
    title: string,
    message: string,
    autoDismiss?: boolean
  ) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],

      addNotification: (type, title, message, autoDismiss = true) => {
        const notification: Notification = {
          id: Date.now().toString(),
          type,
          title,
          message,
          timestamp: new Date(),
          read: false,
          autoDismiss,
        };

        set((state) => ({
          notifications: [notification, ...state.notifications].slice(0, 50), // Keep last 50
        }));

        // Auto-dismiss after 5 seconds if enabled
        if (autoDismiss) {
          setTimeout(() => {
            get().removeNotification(notification.id);
          }, 5000);
        }
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
      },

      clearAll: () => {
        set({ notifications: [] });
      },

      unreadCount: () => {
        return get().notifications.filter((n) => !n.read).length;
      },
    }),
    {
      name: 'traitlab-notifications',
      partialize: (state) => ({
        notifications: state.notifications.slice(0, 50), // Persist last 50
      }),
    }
  )
);
