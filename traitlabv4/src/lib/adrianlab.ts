/**
 * Cliente único de la API de AdrianLAB (F9, recon RECON_ADRIANZERO_FRONTEND_2026-09-12
 * hallazgo #11 / RECON_ADRIANLAB_2026-09-12 #11): antes de este fichero había 40+
 * URLs `https://adrianlab.vercel.app/...` repetidas a mano en `src/features/**`.
 *
 * Todo el front debe construir URLs de AdrianLAB con `adrianlabUrl()` o uno de los
 * helpers tipados de abajo — nunca con el literal `https://adrianlab.vercel.app`.
 * El test `src/lib/__tests__/noHardcodedAdrianlabUrls.test.ts` falla si vuelve a
 * aparecer ese literal fuera de este fichero.
 */

/** Base URL de AdrianLAB. ⚠️ En el proyecto Vercel `adrianzero` la variable
 *  `VITE_VERCEL_API_URL` SÍ existe y vale `https://adrianlab.vercel.app/api`
 *  (crítico 13-sep, `vercel env pull`): el cliente acepta la base con o sin
 *  `/api` final y lo recorta, porque cada helper ya añade su `/api/...`.
 *  Sin la variable, el fallback reproduce producción. */
const DEFAULT_ADRIANLAB_BASE_URL = 'https://adrianlab.vercel.app';

/** Normaliza la base: sin barras finales y sin un `/api` final (lo añaden los paths). */
export function normalizeAdrianlabBase(raw: string | undefined | null): string {
  const v = (raw && raw.trim()) || DEFAULT_ADRIANLAB_BASE_URL;
  return v.replace(/\/+$/, '').replace(/\/api$/i, '').replace(/\/+$/, '');
}

export const ADRIANLAB_BASE_URL = normalizeAdrianlabBase(import.meta.env.VITE_VERCEL_API_URL);

/** Construye una URL absoluta de AdrianLAB a partir de un path relativo. */
export function adrianlabUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${ADRIANLAB_BASE_URL}${normalized}`;
}

export type ToggleParam =
  | 'closeup'
  | 'shadow'
  | 'glow'
  | 'bn'
  | 'blackout'
  | 'banana';

/** `/api/render/{tokenId}` o `/api/render/{tokenId}.png` (sin querystring). */
export function renderUrl(tokenId: string | number, ext: '.png' | '' = '.png'): string {
  return adrianlabUrl(`/api/render/${tokenId}${ext}`);
}

/** `/api/render/{tokenId}.png?param=true&...` — usado por los toggles visuales
 *  (closeup, shadow, glow, b&w, blackout, banana). */
export function renderWithParamsUrl(
  tokenId: string | number,
  params: Partial<Record<ToggleParam, boolean>>,
  ext: '.png' | '' = '.png'
): string {
  const query = Object.entries(params)
    .filter(([, active]) => active)
    .map(([key]) => `${key}=true`)
    .join('&');
  return adrianlabUrl(`/api/render/${tokenId}${ext}${query ? `?${query}` : ''}`);
}

/** `/api/render/custom-external/{tokenId}?trait=a&trait=b` — preview con traits
 *  aplicados sin mintear (TraitLab / Zero hero). */
export function renderCustomExternalUrl(
  tokenId: string | number,
  traitIds: Array<string | number>
): string {
  const traitParams = traitIds.map((id) => `trait=${id}`).join('&');
  return adrianlabUrl(
    `/api/render/custom-external/${tokenId}${traitParams ? `?${traitParams}` : ''}`
  );
}

/** `/api/render/lambo/{tokenId}?lambo={color}`. */
export function renderLamboUrl(tokenId: string | number, color: string): string {
  return adrianlabUrl(`/api/render/lambo/${tokenId}?lambo=${color}`);
}

/** `/api/metadata/{tokenId}`. */
export function metadataUrl(tokenId: string | number): string {
  return adrianlabUrl(`/api/metadata/${tokenId}`);
}

/** Assets estáticos servidos por AdrianLAB bajo `/labimages/...`
 *  (pósters de ZEROmovies S2, OG punks, floppies…). `path` va sin la barra inicial. */
export function labImageUrl(path: string): string {
  return adrianlabUrl(`/labimages/${path.replace(/^\/+/, '')}`);
}
