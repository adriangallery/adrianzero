/**
 * Hook to calculate days since project start
 */

import { useState, useEffect } from 'react';

const START_DATE = new Date('2025-01-21');

export function useDaysBuilding() {
  const [days, setDays] = useState(0);

  useEffect(() => {
    const calculateDays = () => {
      const today = new Date();
      const diff = today.getTime() - START_DATE.getTime();
      const daysPassed = Math.floor(diff / (1000 * 60 * 60 * 24));
      setDays(daysPassed);
    };

    calculateDays();
    // Update every day
    const interval = setInterval(calculateDays, 1000 * 60 * 60 * 24);

    return () => clearInterval(interval);
  }, []);

  return days;
}
