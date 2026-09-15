// adrianzero.com servido desde el mini (Dokku) — mudanza de ZERO al mini, fase 1.
// Servidor Node sin dependencias que sustituye a Vercel:
//  - dist/ de Vite con fallback de SPA y las reglas de vercel.json (redirección /adventure,
//    /shooter, cabeceras de caché) + www → apex.
//  - /api/tshit/upload: puerto de api/tshit/upload.ts. Guarda el SVG en disco (/data/tshit)
//    en vez de Vercel Blob. La URL devuelta va on-chain en TShitMintFacet.mintTShit(svgUrl):
//    BLOB_DIR tiene que ser un montaje persistente. Los T-Shits anteriores siguen en Vercel Blob.
//  - /api/movies2/golden-proof: puerto de api/movies2/golden-proof.ts con el mismo _snapshot.json.
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { promises as fs, createReadStream, readFileSync } from 'node:fs';
import path from 'node:path';

const PORT = Number(process.env.PORT || 5000);
const DIST = path.resolve(process.env.DIST_DIR || './dist');
const BLOB_DIR = path.resolve(process.env.BLOB_DIR || '/data/tshit');
const SNAPSHOT_PATH = path.resolve(process.env.SNAPSHOT_PATH || './api/movies2/_snapshot.json');
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || 'https://adrianzero.com').replace(/\/$/, '');
const APEX_HOST = new URL(PUBLIC_BASE_URL).host;
const ADVENTURE_URL = 'https://adventure.adrianzero.com';
const GIT_SHA = process.env.GIT_SHA || 'unknown';

// Mismo tope que api/tshit/upload.ts y MAX_DESIGN_SVG_BYTES en src/features/tshit-studio/lib/svgExport.ts
const MAX_BYTES = 200 * 1024;
const FORBIDDEN_PATTERNS = [/<script\b/i, /\bon\w+\s*=/i, /\bjavascript:/i, /<foreignObject\b/i, /<iframe\b/i];
const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
  '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.wasm': 'application/wasm',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf',
  '.webmanifest': 'application/manifest+json', '.map': 'application/json', '.xml': 'application/xml',
};

function cors(methods) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function send(res, status, body, headers = {}) {
  const buf = typeof body === 'string' ? Buffer.from(body) : body;
  res.writeHead(status, { 'Content-Length': buf.length, ...headers });
  res.end(res.req.method === 'HEAD' ? undefined : buf);
}

function sendJson(res, status, obj, methods = 'GET, OPTIONS') {
  send(res, status, JSON.stringify(obj), { 'Content-Type': 'application/json', ...cors(methods) });
}

function redirect(res, status, location) {
  res.writeHead(status, { Location: location, 'Content-Length': 0 });
  res.end();
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
  const methods = 'POST, OPTIONS';
  let body;
  try {
    // El escapado JSON puede casi duplicar el SVG: margen sobre el tope real, que se comprueba abajo
    body = JSON.parse(await readBody(req, MAX_BYTES * 2 + 8 * 1024));
  } catch (err) {
    return sendJson(res, err?.code === 413 ? 413 : 400, { error: 'Invalid JSON body' }, methods);
  }
  const { svg, wallet } = body ?? {};
  if (typeof svg !== 'string' || svg.length === 0) return sendJson(res, 400, { error: 'Missing or invalid svg' }, methods);
  if (Buffer.byteLength(svg, 'utf8') > MAX_BYTES) return sendJson(res, 413, { error: `SVG exceeds ${MAX_BYTES} bytes` }, methods);
  if (!svg.trimStart().startsWith('<svg')) return sendJson(res, 400, { error: 'Body does not start with <svg' }, methods);
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(svg)) return sendJson(res, 400, { error: `SVG contains forbidden pattern: ${pattern.source}` }, methods);
  }
  if (typeof wallet !== 'string' || !ADDRESS_RE.test(wallet)) {
    return sendJson(res, 400, { error: 'Missing or invalid wallet' }, methods);
  }

  // Mismo nombre que la clave de Blob: el SVG es direccionable por contenido
  const hash = createHash('sha256').update(svg, 'utf8').digest('hex').slice(0, 16);
  const name = `${wallet.toLowerCase().slice(2, 10)}-${hash}.svg`;
  try {
    await fs.mkdir(BLOB_DIR, { recursive: true });
    await fs.writeFile(path.join(BLOB_DIR, name), svg, 'utf8');
  } catch (err) {
    return sendJson(res, 500, { error: 'Upload failed', detail: err.message }, methods);
  }
  return sendJson(res, 200, { url: `${PUBLIC_BASE_URL}/api/tshit/blob/${name}`, hash, size: svg.length }, methods);
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

let snapshot = null;
function loadSnapshot() {
  snapshot ??= JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf8'));
  return snapshot;
}

function handleGoldenProof(res, url) {
  const address = url.searchParams.get('address') ?? '';
  if (!ADDRESS_RE.test(address)) return sendJson(res, 400, { error: 'Missing or invalid address' });
  try {
    const snap = loadSnapshot();
    const wallet = snap.wallets.find((w) => w.address.toLowerCase() === address.toLowerCase());
    if (!wallet) return sendJson(res, 200, { eligible: false });
    return sendJson(res, 200, {
      eligible: true,
      ticketCount: wallet.ticketCount,
      crossSeasonWeight: wallet.crossSeasonWeight,
      proof: wallet.proof,
      merkleRoot: snap.totals.merkleRoot,
      snapshotTakenAt: snap.snapshotTakenAt,
      totalEligibleHolders: snap.totals.holders,
      totalTickets: snap.totals.totalGoldenTickets,
      totalCrossSeasonWeight: snap.totals.totalCrossSeasonWeight,
    });
  } catch (err) {
    return sendJson(res, 500, { error: 'Failed to read snapshot', detail: err.message });
  }
}

async function serveStatic(res, urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return sendJson(res, 400, { error: 'Bad path' });
  }
  let filePath = path.normalize(path.join(DIST, decoded));
  if (filePath !== DIST && !filePath.startsWith(DIST + path.sep)) return sendJson(res, 403, { error: 'Forbidden' });
  let stat = await fs.stat(filePath).catch(() => null);
  if (stat?.isDirectory()) {
    filePath = path.join(filePath, 'index.html');
    stat = await fs.stat(filePath).catch(() => null);
  }
  if (!stat) {
    // Fallback de SPA: las rutas del cliente (/traitlab, /claim, …) se resuelven en la app
    filePath = path.join(DIST, 'index.html');
    stat = await fs.stat(filePath).catch(() => null);
    if (!stat) return sendJson(res, 404, { error: 'Not found' });
  }
  const ext = path.extname(filePath).toLowerCase();
  const cacheControl = ext === '.html'
    ? 'no-cache, no-store, must-revalidate'
    : urlPath.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=300';
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Content-Length': stat.size,
    'Cache-Control': cacheControl,
  });
  if (res.req.method === 'HEAD') return res.end();
  createReadStream(filePath).pipe(res);
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const host = (req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0];

    if (host === `www.${APEX_HOST}`) return redirect(res, 308, `${PUBLIC_BASE_URL}${url.pathname}${url.search}`);

    if (url.pathname === '/healthz') return sendJson(res, 200, { ok: true, sha: GIT_SHA });

    if (url.pathname === '/api/tshit/upload') {
      if (req.method === 'OPTIONS') return send(res, 204, '', cors('POST, OPTIONS'));
      if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' }, 'POST, OPTIONS');
      return await handleUpload(req, res);
    }
    if (url.pathname.startsWith('/api/tshit/blob/')) {
      return await handleBlob(res, url.pathname.slice('/api/tshit/blob/'.length));
    }
    if (url.pathname === '/api/movies2/golden-proof') {
      if (req.method === 'OPTIONS') return send(res, 204, '', cors('GET, OPTIONS'));
      if (req.method !== 'GET') return sendJson(res, 405, { error: 'Method not allowed' });
      return handleGoldenProof(res, url);
    }

    // vercel.json: /adventure vive en su propio subdominio (redirección no permanente)
    if (url.pathname === '/adventure' || url.pathname.startsWith('/adventure/')) {
      const rest = url.pathname.slice('/adventure'.length).replace(/^\//, '');
      return redirect(res, 307, `${ADVENTURE_URL}/${rest}${url.search}`);
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') return sendJson(res, 405, { error: 'Method not allowed' });
    return await serveStatic(res, url.pathname);
  } catch (err) {
    return sendJson(res, 500, { error: 'Internal error', detail: err.message });
  }
});

server.listen(PORT, () => console.log(`adrianzero ${GIT_SHA} serving ${DIST} on :${PORT} (blobs: ${BLOB_DIR})`));
