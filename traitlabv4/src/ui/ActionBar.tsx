import type { ReactNode } from 'react';
import { cn } from './cn';

export interface ActionBarProps {
  /** Botón principal ya montado (usar <Button variant="primary" full />). */
  primary: ReactNode;
  /** Acción secundaria opcional (icono cuadrado 48x48, p.ej. deshacer). */
  secondary?: ReactNode;
  /** Se posiciona pegada al fondo cuando no hay TabBar visible (desktop). */
  aboveTabBar?: boolean;
  className?: string;
}

/**
 * Barra de acción fija: botón principal + secundario opcional, con degradado
 * de fondo para no tapar el contenido que queda debajo (patrón Main.dc.html).
 */
export function ActionBar({ primary, secondary, aboveTabBar = true, className }: ActionBarProps) {
  return (
    <div
      data-testid="ui-actionbar"
      className={cn(
        'fixed inset-x-0 z-20 flex items-center gap-2.5 px-4 pt-2.5 pb-3',
        'bg-gradient-to-t from-bg via-bg/95 to-transparent',
        aboveTabBar ? 'bottom-16' : 'bottom-0',
        className
      )}
    >
      {secondary ? (
        <div className="flex-none w-12 h-12 rounded-[var(--r-md)] border-2 border-line grid place-items-center text-fg">
          {secondary}
        </div>
      ) : null}
      <div className="flex-1 min-w-0">{primary}</div>
    </div>
  );
}
