/**
 * editRoute — F3.5 (13-sep-2026), tarea 5 del plan.
 * El botón "Edit" de una tarjeta ZERO en Mis NFTs debe llevar a /traitlab
 * (el editor nuevo lo lanza el worker F4 en paralelo, en features/traitlab —
 * NO se toca aquí). Mientras esa ruta no exista en `main`, cae al patrón
 * actual: abrir la pestaña "Traits" embebida dentro de /mynfts.
 *
 * matchRoutes contra la config real evita hardcodear un booleano que haya
 * que recordar borrar cuando F4 mergee: en cuanto /traitlab exista en
 * routes.tsx, este helper empieza a devolverla sin tocar nada más.
 */
import { matchRoutes } from 'react-router-dom';
import { routes } from '@/routes/routes';

let cachedHasTraitLabRoute: boolean | null = null;

function hasTraitLabRoute(): boolean {
  if (cachedHasTraitLabRoute === null) {
    cachedHasTraitLabRoute = matchRoutes(routes, '/traitlab') !== null;
  }
  return cachedHasTraitLabRoute;
}

/** Href para el botón "Edit" de una tarjeta ZERO. */
export function editRouteFor(tokenId?: string | number): string {
  if (hasTraitLabRoute()) {
    return tokenId !== undefined ? `/traitlab?token=${tokenId}` : '/traitlab';
  }
  return '/mynfts?tab=traits';
}
