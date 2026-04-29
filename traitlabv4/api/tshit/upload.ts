import { put } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash } from 'node:crypto';

/**
 * POST /api/tshit/upload
 *
 * Body (JSON):
 *   {
 *     svg:    string  // raw <svg>...</svg> markup (148x148, max ~64KB)
 *     wallet: string  // 0x… (audit only — auth happens via the mint tx itself)
 *   }
 *
 * Response:
 *   { url: string, hash: string, size: number }
 *
 * The returned `url` is what the client passes to TShitMintFacet.mintTShit(svgUrl).
 * Vercel Blob URLs are immutable — once uploaded, content cannot be replaced.
 *
 * NOTE: This endpoint is intentionally permissive. A signed-but-unminted SVG
 * is just orphaned blob storage; without an on-chain entry pointing at it,
 * AdrianLAB never resolves it. Downside: a few MB of dead blobs over time.
 * Acceptable tradeoff to keep mint UX as a single signature.
 */
const MAX_BYTES = 64 * 1024; // 64KB hard cap (V1 SVGs are ~5KB)
const ALLOWED_PREFIX = '<svg';
const FORBIDDEN_PATTERNS = [
  /<script\b/i,
  /\bon\w+\s*=/i,        // onclick=, onload=, etc.
  /\bjavascript:/i,
  /<foreignObject\b/i,    // can host arbitrary HTML
  /<iframe\b/i,
];

function corsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  corsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { svg, wallet } = (req.body ?? {}) as { svg?: unknown; wallet?: unknown };

    if (typeof svg !== 'string' || svg.length === 0) {
      return res.status(400).json({ error: 'Missing or invalid svg' });
    }
    if (svg.length > MAX_BYTES) {
      return res.status(413).json({ error: `SVG exceeds ${MAX_BYTES} bytes` });
    }
    if (!svg.trimStart().startsWith(ALLOWED_PREFIX)) {
      return res.status(400).json({ error: 'Body does not start with <svg' });
    }
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(svg)) {
        return res.status(400).json({ error: `SVG contains forbidden pattern: ${pattern.source}` });
      }
    }
    if (typeof wallet !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return res.status(400).json({ error: 'Missing or invalid wallet' });
    }

    // Hash the design — used both for the blob key and exposed to the caller
    // so the frontend can fingerprint duplicates client-side if it wants.
    const hash = createHash('sha256').update(svg, 'utf8').digest('hex').slice(0, 16);
    const walletShort = wallet.toLowerCase().slice(2, 10);
    const key = `tshit/${walletShort}-${hash}.svg`;

    // addRandomSuffix: false → URL is deterministic on the (key) tuple. If the
    // exact same (wallet, svg) is uploaded twice we re-use the same URL, which
    // is fine — the SVG is content-addressable.
    const blob = await put(key, svg, {
      access: 'public',
      contentType: 'image/svg+xml',
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 31536000,
    });

    return res.status(200).json({
      url: blob.url,
      hash,
      size: svg.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error';
    return res.status(500).json({ error: 'Upload failed', detail: msg });
  }
}
