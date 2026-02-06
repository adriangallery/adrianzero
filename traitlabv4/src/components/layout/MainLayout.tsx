/**
 * MainLayout Component
 * Main app layout with header, sidebar, and content area
 */

import { useEffect, useState, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Container } from './Container';
import { ToastContainer } from '../notifications/Toast';
import { ZeroStyleChrome } from './ZeroStyleChrome';

export function MainLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(min-width: 1024px)').matches;
  });
  const location = useLocation();
  const isZeroLanding = location.pathname.startsWith('/zero');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const onChange = (event: MediaQueryListEvent) => {
      setIsDesktop(event.matches);
    };

    setIsDesktop(mediaQuery.matches);
    mediaQuery.addEventListener('change', onChange);

    return () => {
      mediaQuery.removeEventListener('change', onChange);
    };
  }, []);

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

  if (isDesktop) {
    return (
      <div className="h-screen overflow-hidden bg-background">
        <ZeroStyleChrome />

        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center">
              <div className="shimmer h-16 w-16 rounded-full" />
            </div>
          }
        >
          <div className="h-full overflow-y-auto pt-20">
            <div className="container mx-auto max-w-7xl px-4 py-6">
              <Outlet />
            </div>
          </div>
        </Suspense>

        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
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
