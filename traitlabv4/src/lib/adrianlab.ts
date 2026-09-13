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

/** Base URL de AdrianLAB. `VITE_VERCEL_API_URL` no está definida hoy en el
 *  proyecto Vercel `adrianzero` — el fallback reproduce el comportamiento
 *  actual en producción. Si se define, debe ser la base SIN `/api` final
 *  (p.ej. `https://adrianlab.vercel.app` o un dominio propio). */
const DEFAULT_ADRIANLAB_BASE_URL = 'https://adrianlab.vercel.app';

export const ADRIANLAB_BASE_URL = (
  import.meta.env.VITE_VERCEL_API_URL || DEFAULT_ADRIANLAB_BASE_URL
).replace(/\/+$/, '');

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
