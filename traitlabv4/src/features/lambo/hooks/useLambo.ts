/**
 * useLambo Hook
 * Generate Lamborghini variant URLs
 */

import { useState } from 'react';

const VERCEL_API_URL = import.meta.env.VITE_VERCEL_API_URL || 'https://adrianlab.vercel.app/api';

export const LAMBO_COLORS = [
  { id: 'blue', name: 'Blue', hex: '#0066CC' },
  { id: 'red', name: 'Red', hex: '#CC0000' },
  { id: 'yellow', name: 'Yellow', hex: '#FFCC00' },
  { id: 'green', name: 'Green', hex: '#00CC66' },
  { id: 'orange', name: 'Orange', hex: '#FF6600' },
  { id: 'purple', name: 'Purple', hex: '#9933CC' },
  { id: 'pink', name: 'Pink', hex: '#FF66CC' },
  { id: 'white', name: 'White', hex: '#FFFFFF' },
  { id: 'black', name: 'Black', hex: '#000000' },
  { id: 'silver', name: 'Silver', hex: '#C0C0C0' },
  { id: 'gold', name: 'Gold', hex: '#FFD700' },
];

export function useLambo() {
  const [selectedColor, setSelectedColor] = useState<string>('blue');

  const generateLamboUrl = (tokenId: string, color: string): string => {
    return `${VERCEL_API_URL}/render/lambo/${tokenId}?lambo=${color}`;
  };

  const downloadImage = async (tokenId: string, color: string) => {
    const url = generateLamboUrl(tokenId, color);

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `adrianzero-${tokenId}-lambo-${color}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading image:', error);
      throw error;
    }
  };

  return {
    selectedColor,
    setSelectedColor,
    generateLamboUrl,
    downloadImage,
  };
}
