/**
 * Upload the rendered SVG to /api/tshit/upload and return the immutable
 * Vercel Blob URL. The mint hook chains this before calling mintTShit.
 */
import { useState } from 'react';

interface UploadResponse {
  url: string;
  hash: string;
  size: number;
}

export function useUploadDesign() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (svg: string, wallet: string): Promise<UploadResponse> => {
    setIsUploading(true);
    setError(null);
    try {
      const res = await fetch('/api/tshit/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ svg, wallet }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Upload failed (${res.status}): ${text || res.statusText}`);
      }
      const data = (await res.json()) as UploadResponse;
      if (!data.url) throw new Error('Upload response missing url');
      return data;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown error';
      setError(msg);
      throw e;
    } finally {
      setIsUploading(false);
    }
  };

  return { upload, isUploading, error };
}
