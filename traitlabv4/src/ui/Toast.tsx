import { useEffect } from 'react';
import { useNotificationStore } from '@/store/notificationStore';
import type { Notification, NotificationType } from '@/store/notificationStore';
import { getTxExplorerUrl } from '@/config/contracts';
import { cn } from './cn';
import { CheckIcon, AlertIcon, InfoIcon, CloseIcon, ExternalLinkIcon } from './icons';

const TONE_BORDER: Record<NotificationType, string> = {
  success: 'border-ok/40',
  error: 'border-bad/40',
  warning: 'border-warn/40',
  info: 'border-acc2/40',
};

const TONE_ICON_BG: Record<NotificationType, string> = {
  success: 'bg-ok/20 text-ok',
  error: 'bg-bad/20 text-bad',
  warning: 'bg-warn/20 text-warn',
  info: 'bg-acc2/20 text-acc2',
};

function ToneIcon({ type }: { type: NotificationType }) {
  if (type === 'success') return <CheckIcon size={16} />;
  if (type === 'error' || type === 'warning') return <AlertIcon size={16} />;
  return <InfoIcon size={16} />;
}

/** Contenedor global de toasts del sistema F3 — reusa notificationStore/useNotifications. */
export function ToastContainer() {
  const notifications = useNotificationStore((state) => state.notifications);
  const removeNotification = useNotificationStore((state) => state.removeNotification);
  const toastNotifications = notifications.filter((n) => n.autoDismiss);

  return (
    <div
      data-testid="ui-toast-container"
      className="fixed bottom-20 left-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none sm:left-auto sm:right-4 sm:w-96"
    >
      {toastNotifications.slice(0, 3).map((notification) => (
        <ToastItem key={notification.id} notification={notification} onDismiss={() => removeNotification(notification.id)} />
      ))}
    </div>
  );
}

function ToastItem({ notification, onDismiss }: { notification: Notification; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      data-testid="ui-toast"
      role="status"
      className={cn(
        'pointer-events-auto rounded-[var(--r-md)] border-2 bg-panel p-3.5 shadow-2xl',
        TONE_BORDER[notification.type]
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('flex-none w-7 h-7 rounded-full grid place-items-center', TONE_ICON_BG[notification.type])}>
          <ToneIcon type={notification.type} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-ui text-sm font-bold text-fg">{notification.title}</p>
          <p className="text-[13px] text-mute mt-0.5">{notification.message}</p>
          {notification.txHash ? (
            <a
              href={getTxExplorerUrl(notification.txHash)}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 mt-2 text-[12px] font-medium text-acc hover:underline"
            >
              View on BaseScan
              <ExternalLinkIcon size={13} />
            </a>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Cerrar aviso"
          className="flex-none text-mute hover:text-fg"
        >
          <CloseIcon size={16} />
        </button>
      </div>
    </div>
  );
}
