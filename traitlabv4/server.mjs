// Self-hosted server for adrianzero.com (mini/Dokku) — replaces Vercel hosting.
// Zero-dependency Node server: serves the Vite dist/ (SPA fallback) and ports
// the /api/tshit/upload endpoint from api/tshit/upload.ts, storing SVGs on
// local disk (/data) instead of Vercel Blob. Uploaded URLs are immutable and
// on-chain-referenced by TShitMintFacet.mintTShit(svgUrl), so BLOB_DIR must be
// a persistent mount.
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { promises as fs, createReadStream } from 'node:fs';
import path from 'node:path';

const PORT = Number(process.env.PORT || 5000);
const DIST = path.resolve(process.env.DIST_DIR || './dist');
const BLOB_DIR = path.resolve(process.env.BLOB_DIR || '/data/tshit');
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || 'https://adrianzero.com').replace(/\/$/, '');

const MAX_BYTES = 64 * 1024;
const FORBIDDEN_PATTERNS = [/<script\b/i, /\bon\w+\s*=/i, /\bjavascript:/i, /<foreignObject\b/i, /<iframe\b/i];

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
  '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.wasm': 'application/wasm',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf',
  '.webmanifest': 'application/manifest+json', '.map': 'application/json',
};

function send(res, status, body, headers = {}) {
  const buf = typeof body === 'string' ? Buffer.from(body) : body;
  res.writeHead(status, { 'Content-Length': buf.length, ...headers });
  res.end(buf);
}
function sendJson(res, status, obj) {
  send(res, status, JSON.stringify(obj), {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
}

async function readBody(req, limit) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw Object.assign(new Error('payload too large'), { code: 413 });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function handleUpload(req, res) {
  let body;
  try {
    // JSON envelope overhead on top of the 64KB SVG cap
    body = JSON.parse(await readBody(req, MAX_BYTES + 8 * 1024));
  } catch (err) {
    return sendJson(res, err?.code === 413 ? 413 : 400, { error: 'Invalid JSON body' });
  }
  const { svg, wallet } = body ?? {};
  if (typeof svg !== 'string' || svg.length === 0) return sendJson(res, 400, { error: 'Missing or invalid svg' });
  if (svg.length > MAX_BYTES) return sendJson(res, 413, { error: `SVG exceeds ${MAX_BYTES} bytes` });
  if (!svg.trimStart().startsWith('<svg')) return sendJson(res, 400, { error: 'Body does not start with <svg' });
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(svg)) return sendJson(res, 400, { error: `SVG contains forbidden pattern: ${pattern.source}` });
  }
  if (typeof wallet !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    return sendJson(res, 400, { error: 'Missing or invalid wallet' });
  }

  const hash = createHash('sha256').update(svg, 'utf8').digest('hex').slice(0, 16);
  const walletShort = wallet.toLowerCase().slice(2, 10);
  const name = `${walletShort}-${hash}.svg`;
  try {
    await fs.mkdir(BLOB_DIR, { recursive: true });
    await fs.writeFile(path.join(BLOB_DIR, name), svg, 'utf8');
  } catch (err) {
    return sendJson(res, 500, { error: 'Upload failed', detail: err.message });
  }
  return sendJson(res, 200, { url: `${PUBLIC_BASE_URL}/api/tshit/blob/${name}`, hash, size: svg.length });
}

async function handleBlob(res, name) {
  if (!/^[a-f0-9]{8}-[a-f0-9]{16}\.svg$/.test(name)) return sendJson(res, 400, { error: 'Bad blob name' });
  try {
    const svg = await fs.readFile(path.join(BLOB_DIR, name));
    return send(res, 200, svg, {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
    });
  } catch {
    return sendJson(res, 404, { error: 'Not found' });
  }
}

async function serveStatic(res, urlPath) {
  let filePath = path.normalize(path.join(DIST, decodeURIComponent(urlPath)));
  if (!filePath.startsWith(DIST)) return sendJson(res, 403, { error: 'Forbidden' });
  let stat = await fs.stat(filePath).catch(() => null);
  if (stat?.isDirectory()) {
    filePath = path.join(filePath, 'index.html');
    stat = await fs.stat(filePath).catch(() => null);
  }
  if (!stat) {
    // SPA fallback — client-side routes (budokai, dojo, …) resolve in the app
    filePath = path.join(DIST, 'index.html');
    stat = await fs.stat(filePath).catch(() => null);
    if (!stat) return sendJson(res, 404, { error: 'Not found' });
  }
  const ext = path.extname(filePath).toLowerCase();
  const immutable = urlPath.startsWith('/assets/');
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Content-Length': stat.size,
    'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'public, max-age=300',
  });
  createReadStream(filePath).pipe(res);
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (url.pathname === '/api/tshit/upload') {
      if (req.method === 'OPTIONS') return sendJson(res, 204, {});
      if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });
      return await handleUpload(req, res);
    }
    if (url.pathname.startsWith('/api/tshit/blob/')) {
      return await handleBlob(res, url.pathname.slice('/api/tshit/blob/'.length));
    }
    if (url.pathname === '/healthz') return sendJson(res, 200, { ok: true });
    if (req.method !== 'GET' && req.method !== 'HEAD') return sendJson(res, 405, { error: 'Method not allowed' });
    return await serveStatic(res, url.pathname);
  } catch (err) {
    return sendJson(res, 500, { error: 'Internal error', detail: err.message });
  }
});

server.listen(PORT, () => console.log(`adrianzero serving ${DIST} on :${PORT} (blobs: ${BLOB_DIR})`));
