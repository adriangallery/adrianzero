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
  /** Hash de una tx relacionada; si viene, el Toast del sistema F3 añade "View on BaseScan". */
  txHash?: string;
}

interface NotificationStore {
  notifications: Notification[];
  addNotification: (
    type: NotificationType,
    title: string,
    message: string,
    autoDismiss?: boolean,
    txHash?: string
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

      addNotification: (type, title, message, autoDismiss = true, txHash) => {
        // Sin dedupe (13-sep-2026, feedback de Adrián desde el iPhone en
        // producción): tocar varias veces una tarjeta bloqueada apilaba el
        // mismo toast "Not allowed" una y otra vez, tapando la ActionBar.
        // Mientras el mensaje siga visible (= siga en el array; cada
        // ToastItem se autoelimina al expirar su propio timeout de abajo),
        // un duplicado exacto (mismo type+title+message) no se vuelve a
        // encolar — el que ya está en pantalla sigue su curso normal.
        const alreadyVisible = get().notifications.some(
          (n) => n.type === type && n.title === title && n.message === message
        );
        if (alreadyVisible) return;

        const notification: Notification = {
          id: Date.now().toString(),
          type,
          title,
          message,
          timestamp: new Date(),
          read: false,
          autoDismiss,
          txHash,
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
