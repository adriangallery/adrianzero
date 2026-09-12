/**
 * Container Component
 * Main content container with responsive padding
 */

import type { ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
  /** true en <768px: añade hueco inferior para no tapar contenido bajo la TabBar fija (64px + safe-area). */
  tabBarInset?: boolean;
}

export function Container({ children, tabBarInset = false }: ContainerProps) {
  return (
    <div
      className="flex-1 overflow-y-auto"
      style={tabBarInset ? { paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' } : undefined}
    >
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {children}
      </div>
    </div>
  );
}
