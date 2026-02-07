/**
 * RootRoute Component
 * Redirects root domain to ZERO landing page.
 */

import { Navigate } from 'react-router-dom';

export function RootRoute() {
  return <Navigate to="/zero" replace />;
}
