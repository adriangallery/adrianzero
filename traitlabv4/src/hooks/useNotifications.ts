/**
 * useNotifications Hook
 * Helper hook for adding notifications
 */

import { useNotificationStore } from '@/store/notificationStore';
import type { NotificationType } from '@/store/notificationStore';

export function useNotifications() {
  const addNotification = useNotificationStore((state) => state.addNotification);

  return {
    success: (title: string, message: string, autoDismiss = true, txHash?: string) => {
      addNotification('success', title, message, autoDismiss, txHash);
    },
    error: (title: string, message: string, autoDismiss = true, txHash?: string) => {
      addNotification('error', title, message, autoDismiss, txHash);
    },
    info: (title: string, message: string, autoDismiss = true, txHash?: string) => {
      addNotification('info', title, message, autoDismiss, txHash);
    },
    warning: (title: string, message: string, autoDismiss = true, txHash?: string) => {
      addNotification('warning', title, message, autoDismiss, txHash);
    },
    custom: (type: NotificationType, title: string, message: string, autoDismiss = true, txHash?: string) => {
      addNotification(type, title, message, autoDismiss, txHash);
    },
  };
}
