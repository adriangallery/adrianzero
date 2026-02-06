import { useState, useEffect } from 'react';

interface CountdownResult {
  timeRemaining: string;
  isExpired: boolean;
  label: 'Ends in' | 'Starts in' | 'Closed' | 'Active';
}

function formatDuration(totalSeconds: number): string {
  let s = Math.floor(totalSeconds);
  const d = Math.floor(s / 86400);
  s %= 86400;
  const h = Math.floor(s / 3600);
  s %= 3600;
  const m = Math.floor(s / 60);
  s %= 60;

  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  parts.push(`${String(h).padStart(2, '0')}h`);
  parts.push(`${String(m).padStart(2, '0')}m`);
  parts.push(`${String(s).padStart(2, '0')}s`);

  return parts.join(' ');
}

export function useCountdown(
  startTime: number,
  endTime: number,
  isActive: boolean
): CountdownResult {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Mint has ended
  if (endTime > 0 && now >= endTime) {
    return {
      timeRemaining: 'Mint closed',
      isExpired: true,
      label: 'Closed',
    };
  }

  // Mint is active and has an end time
  if (isActive && endTime > 0 && now < endTime) {
    const remaining = endTime - now;
    return {
      timeRemaining: formatDuration(remaining),
      isExpired: false,
      label: 'Ends in',
    };
  }

  // Mint hasn't started yet
  if (startTime > 0 && now < startTime) {
    const remaining = startTime - now;
    return {
      timeRemaining: formatDuration(remaining),
      isExpired: false,
      label: 'Starts in',
    };
  }

  // Default/fallback
  if (isActive) {
    return {
      timeRemaining: 'No end time',
      isExpired: false,
      label: 'Active',
    };
  }

  return {
    timeRemaining: '--',
    isExpired: false,
    label: 'Active',
  };
}
