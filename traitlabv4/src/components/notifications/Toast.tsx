/**
 * Toast Component
 * Auto-dismissing toast notifications
 */

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';
import type { Notification } from '@/store/notificationStore';

const typeStyles = {
  success: 'bg-green-500 text-white',
  error: 'bg-red-500 text-white',
  warning: 'bg-yellow-500 text-white',
  info: 'bg-blue-500 text-white',
};

const typeIcons = {
  success: <CheckCircle2 className="h-4 w-4" />,
  error: <XCircle className="h-4 w-4" />,
  warning: <AlertTriangle className="h-4 w-4" />,
  info: <Info className="h-4 w-4" />,
};

export function ToastContainer() {
  const notifications = useNotificationStore((state) => state.notifications);
  const removeNotification = useNotificationStore((state) => state.removeNotification);

  // Filter only auto-dismiss notifications
  const toastNotifications = notifications.filter((n) => n.autoDismiss);

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
      <AnimatePresence>
        {toastNotifications.slice(0, 3).map((notification) => (
          <ToastItem
            key={notification.id}
            notification={notification}
            onDismiss={() => removeNotification(notification.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({
  notification,
  onDismiss,
}: {
  notification: Notification;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`${typeStyles[notification.type]} rounded-lg shadow-lg p-4 max-w-sm pointer-events-auto`}
    >
      <div className="flex items-start gap-3">
        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          {typeIcons[notification.type]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{notification.title}</p>
          <p className="text-xs mt-1 opacity-90">{notification.message}</p>
        </div>
        <button
          onClick={onDismiss}
          className="text-white/80 hover:text-white flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
