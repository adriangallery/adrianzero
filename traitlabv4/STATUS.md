# TraitLAB V4 / adrianzero.com — estado (14-sep-2026)

Un solo sitio para saber cómo está el front. Lo histórico (enero–febrero de 2026) está en
[`docs/history/`](./docs/history/). El plan vivo es
`orquestacion-fable/planes/PLAN_ADRIANZERO_2026-09.md`.

## Qué es

- App de adrianzero.com: React 19 + Vite 7 + Tailwind 4, wagmi/viem + RainbowKit, TanStack Query, Zustand.
- Base mainnet (8453). Contratos en `src/config/contracts.ts`; ABIs verificados en `src/lib/web3/abi`.
- Imágenes y metadata vienen de AdrianLAB (`src/lib/adrianlab.ts` es el único cliente; un test
  impide URLs sueltas).

## Despliegue y calidad

- `main` = producción en Vercel (proyecto `adrianzero`). Cada rama tiene preview propia.
- CI (`.github/workflows/ci.yml`): lint, `tsc -b --noEmit`, `npm test` (vitest).
- Diseño: sistema D11 en `src/ui` (vista `/ui-kit`), mobile-first, textos ≥ 13 px.

## Secciones (rediseño de septiembre)

| Ruta | Estado |
|---|---|
| `/zero` (home móvil), `/mynfts`, `/traitlab` | Rediseñadas (F3–F4, F8), pfp mini fija al hacer scroll |
| `/packs` | Sección propia (F5): catálogo desde registro semilla + escaneo de eventos, apertura con reveal |
| `/shop` | Hoja de compra por ítem (F8), ZERO/ADRIAN y reclamo gratis con allowlist |
| `/tshit` | T-Shit Studio (1000 ZERO, SVG como paths, límite 200 KB) |
| `/claim` | Airdrop Cubist Souls → $ZERO (A4b-2). Cerrado hasta que se active on-chain |
| `/drop/:assetId` | Landing de un drop del ShopFacet (primer uso: Beta Tester Cap 1182) |
| `/zeromovies`, `/budokai`, `/gallery`, `/gumball`, `/timeline`, `/about` | Existentes, pasados por la limpieza F10 |

PWA básica (manifest, iconos, `display: standalone`) y tarjeta OG desde F11.

## Reglas que conviene no romper

- Traits equipables: lista negra por **categoría** (`features/traitlab/lib/equippable.ts`), no por rango de id.
- Poder equipar se comprueba simulando `applyTraitMultiple`; no hace falta `setApprovalForAll`.
- Packs: el contrato de apertura se resuelve en vivo; no volver a meter listas de packIds a mano
  (test `noHardcodedPackIds`).
- `public/data/traits.json` es una **copia** de la de AdrianLAB: cada trait nuevo va a las dos
  (`Contratos/scripts/launch-items.mjs` lo hace solo).

## Pendiente

- Lighthouse móvil ≥ 90 en Home y TraitLab (F11, parte 2).
- Revisión final de diseño con Fable (semana del 19-sep).
