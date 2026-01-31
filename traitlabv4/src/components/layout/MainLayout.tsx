/**
 * MainLayout Component
 * Main app layout with header, sidebar, and content area
 */

import { useState, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Container } from './Container';
import { ToastContainer } from '../notifications/Toast';

export function MainLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
