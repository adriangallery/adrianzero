/**
 * App Component
 * Root application component with all providers and routing
 */

import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { WagmiProviderWrapper } from './providers/WagmiProvider';
import { QueryProvider } from './providers/QueryProvider';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { MainLayout } from '@/components/layout/MainLayout';
import { routes } from '@/routes/routes';

// Create router with MainLayout wrapper
const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: routes,
  },
]);

export function App() {
  return (
    <ErrorBoundary>
      <WagmiProviderWrapper>
        <QueryProvider>
          <RouterProvider router={router} />
        </QueryProvider>
      </WagmiProviderWrapper>
    </ErrorBoundary>
  );
}
