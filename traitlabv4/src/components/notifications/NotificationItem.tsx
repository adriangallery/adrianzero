/**
 * NotificationItem Component
 * Individual notification card
 */

import { formatDistanceToNow } from 'date-fns';
import { useNotificationStore } from '@/store/notificationStore';
import type { Notification } from '@/store/notificationStore';

interface NotificationItemProps {
  notification: Notification;
}

const typeStyles = {
  success: 'bg-green-500/10 text-green-600 dark:text-green-400',
  error: 'bg-red-500/10 text-red-600 dark:text-red-400',
  warning: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
};

const typeIcons = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

export function NotificationItem({ notification }: NotificationItemProps) {
  const removeNotification = useNotificationStore((state) => state.removeNotification);

  const relativeTime = formatDistanceToNow(new Date(notification.timestamp), {
    addSuffix: true,
  });

  return (
    <div className={`p-3 hover:bg-muted transition-colors ${!notification.read ? 'bg-muted/50' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${typeStyles[notification.type]}`}
        >
          <span className="text-sm font-bold">{typeIcons[notification.type]}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{notification.title}</p>
          <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
          <p className="text-xs text-muted-foreground mt-1">{relativeTime}</p>
        </div>

        {/* Dismiss */}
        <button
          onClick={() => removeNotification(notification.id)}
          className="text-muted-foreground hover:text-foreground flex-shrink-0"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
