/**
 * useNotifications Hook
 * Helper hook for adding notifications
 */

import { useNotificationStore } from '@/store/notificationStore';
import type { NotificationType } from '@/store/notificationStore';

export function useNotifications() {
  const addNotification = useNotificationStore((state) => state.addNotification);

  return {
    success: (title: string, message: string, autoDismiss = true) => {
      addNotification('success', title, message, autoDismiss);
    },
    error: (title: string, message: string, autoDismiss = true) => {
      addNotification('error', title, message, autoDismiss);
    },
    info: (title: string, message: string, autoDismiss = true) => {
      addNotification('info', title, message, autoDismiss);
    },
    warning: (title: string, message: string, autoDismiss = true) => {
      addNotification('warning', title, message, autoDismiss);
    },
    custom: (type: NotificationType, title: string, message: string, autoDismiss = true) => {
      addNotification(type, title, message, autoDismiss);
    },
  };
}
