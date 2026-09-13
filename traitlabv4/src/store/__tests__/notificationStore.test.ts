import { describe, it, expect, beforeEach } from 'vitest';
import { useNotificationStore } from '../notificationStore';

/**
 * Regresión 13-sep-2026 (feedback de Adrián desde el iPhone, producción):
 * tocar varias veces una tarjeta bloqueada en /traitlab apilaba el mismo
 * toast "Not allowed" una y otra vez — dos avisos idénticos tapaban la
 * ActionBar. `addNotification` ahora ignora un duplicado exacto
 * (type+title+message) mientras el original siga visible.
 */

beforeEach(() => {
  useNotificationStore.setState({ notifications: [] });
});

describe('notificationStore — dedupe de toasts', () => {
  it('un duplicado exacto no se apila mientras el original siga visible', () => {
    const { addNotification } = useNotificationStore.getState();
    addNotification('warning', 'Not allowed', 'This trait cannot be applied to this token', true);
    addNotification('warning', 'Not allowed', 'This trait cannot be applied to this token', true);
    addNotification('warning', 'Not allowed', 'This trait cannot be applied to this token', true);

    expect(useNotificationStore.getState().notifications).toHaveLength(1);
  });

  it('mensajes distintos SÍ se apilan (no es un dedupe global agresivo)', () => {
    const { addNotification } = useNotificationStore.getState();
    addNotification('warning', 'Not allowed', 'Reason A', true);
    addNotification('warning', 'Not allowed', 'Reason B', true);

    expect(useNotificationStore.getState().notifications).toHaveLength(2);
  });

  it('tras quitar el original, el mismo mensaje puede volver a aparecer', () => {
    const { addNotification, removeNotification } = useNotificationStore.getState();
    addNotification('warning', 'Not allowed', 'Reason A', true);
    const id = useNotificationStore.getState().notifications[0].id;
    removeNotification(id);
    addNotification('warning', 'Not allowed', 'Reason A', true);

    expect(useNotificationStore.getState().notifications).toHaveLength(1);
  });

  it('mismo mensaje pero distinto type no se considera duplicado', () => {
    const { addNotification } = useNotificationStore.getState();
    addNotification('warning', 'Not allowed', 'Same text', true);
    addNotification('error', 'Not allowed', 'Same text', true);

    expect(useNotificationStore.getState().notifications).toHaveLength(2);
  });
});
