/**
 * MainLayout Component
 * Main app layout with header, sidebar, and content area
 */

import { useState, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Container } from './Container';
import { ToastContainer } from '../notifications/Toast';

export function MainLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const isZeroLanding = location.pathname.startsWith('/zero');

  if (isZeroLanding) {
    return (
      <div className="h-screen overflow-hidden bg-background">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center">
              <div className="shimmer h-16 w-16 rounded-full" />
            </div>
          }
        >
          <div className="h-full overflow-y-auto">
            <Outlet />
          </div>
        </Suspense>

        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar variant="desktop" />

      {/* Mobile Sidebar */}
      <Sidebar
        variant="mobile"
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onMenuClick={() => setIsMobileSidebarOpen(true)} />

        <Container>
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-16">
                <div className="shimmer w-16 h-16 rounded-full mb-4" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </Container>
      </div>

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}
