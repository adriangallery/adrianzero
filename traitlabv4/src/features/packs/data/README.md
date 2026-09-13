# `features/packs/data`

Capa de datos (viem + wagmi + react-query, sin UI) para el flujo
«comprar → abrir → ver lo obtenido → equipar» de Packs (F5,
`PLAN_ADRIANZERO_2026-09.md` §5.1). Ver `packRegistry.ts` para el diseño
completo; este README cubre solo el mantenimiento del seed.

## `registry.seed.json` — qué es y por qué existe

`AdrianFloppyDiscs`, `OpenPack v4` y `ActionPacks` no tienen
`packCount()`/`nextPackId()`: la única forma de saber qué `packId` existe
de verdad es leer el evento `PackConfigured` que cada
`setPackConfig`/`configurePack` emite (`logScan.ts`). Esos contratos
llevan ~17,7 M de bloques de vida en Base — escanear desde su bloque de
deploy en la primera visita de cada navegador es lento y el RPC público
(`mainnet.base.org`, uno de los fallbacks de `RPC_URLS`) limita
`eth_getLogs` a 2000 bloques por llamada, lo que puede dar 429.

`registry.seed.json` es el resultado de ESE escaneo largo, hecho una vez
offline y commiteado. `logScan.ts` lo usa como punto de partida (si
`localStorage` del navegador no tiene ya algo más reciente) y solo escanea
los bloques nuevos desde `lastScannedBlock`. Es un **cache de
descubrimiento**, no una lista de negocio: los `packId` que trae se
verifican siempre en vivo (`getPackConfig`/`isPackConfigured`/
`packConfigs`) antes de usarse — si algo del seed ya no está configurado,
se descarta sin más. Por eso el seed puede (y de hecho hoy trae) IDs
espurios de pruebas antiguas sin que eso rompa nada:

- `ACTION_PACKS` trae `1101000` y `958456612211095500865958880335127040123446439478`
  — el segundo es sospechosamente igual a la propia dirección del
  contrato ActionPacks vista como `uint256` (bloque ~34,48M, ago-2025,
  fase de pruebas). `isPackConfigured(...)` de ese id da `false` hoy →
  se descarta en `buildOpenOnlyRoutes`. Se deja tal cual en el seed
  (no se cura a mano) porque un escaneo fresco produciría exactamente lo
  mismo — curarlo a mano reintroduciría el problema que este diseño evita.

## Cuándo regenerarlo

Después de registrar un pack nuevo en cualquiera de los 3 contratos
(`Contratos/RUNBOOK_LANZAR_ITEMS.md` paso 7, `setPackConfig`/
`configurePack`) — si no, ese pack nuevo se sigue descubriendo bien (el
escaneo incremental normal lo encuentra desde `lastScannedBlock`), pero el
seed se queda un poco desactualizado para navegadores sin `localStorage`
previo. No es urgente, pero conviene mantenerlo fresco de vez en cuando.

## Cómo regenerarlo

```bash
cd traitlabv4
RPC_URL=https://tu-rpc-con-clave node scripts/packs-registry-seed.mjs
```

- **Usa un RPC con clave (Alchemy, el mismo patrón que `config/alchemy.ts`)**,
  no el público — sin él, `RPC_URL` cae por defecto a
  `https://mainnet.base.org` (funciona, pero trocea a 2000 bloques y puede
  tardar si ha pasado mucho tiempo desde el último seed).
- El script es incremental: si `registry.seed.json` ya existe, solo
  escanea desde su `lastScannedBlock` + 1, no repite el historial.
- Commitea el `registry.seed.json` resultante junto con el cambio que
  motivó la regeneración (o suelto, si es solo mantenimiento).
- **No se ejecuta en CI** — es un paso manual, deliberadamente (mismo
  criterio que el resto del repo: nada de escaneos largos de RPC en cada
  push).

Esta vez (13-sep-2026) se generó sin `node_modules` instalado en el
worktree (regla del plan: nada de `npm install`/build en el portátil de
8 GB) reproduciendo la misma lógica de escaneo contra la API REST de
Blockscout en lugar de `eth_getLogs` directo — mismo resultado, sin
depender del RPC. Las próximas regeneraciones deberían usar el script de
verdad (`scripts/packs-registry-seed.mjs`) con un RPC real.
