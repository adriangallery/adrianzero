/**
 * RootRoute Component
 * Smart component for / route that shows appropriate content:
 * - No wallet: redirects to /adrianzero (demo mode)
 * - With wallet: shows DashboardModule
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { DashboardModule } from '@/features/dashboard/components/DashboardModule';

export function RootRoute() {
  const { isConnected } = useAccount();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isConnected) {
      // Not connected → redirect to demo experience
      navigate('/adrianzero', { replace: true });
    }
  }, [isConnected, navigate]);

  // If not connected, don't render anything (will redirect)
  if (!isConnected) {
    return null;
  }

  // Connected → show dashboard
  return <DashboardModule />;
}
