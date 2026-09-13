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
deploy en la primera visita de cada navegador es lento.

**RPC dedicado, nunca Alchemy (fix 13-sep, hallazgo del crítico en
producción):** `logScan.ts` usa SIEMPRE un cliente propio contra el RPC
público de Base (`mainnet.base.org`, sin clave) para `eth_getLogs` —
nunca el `publicClient` de wagmi. En producción ese `publicClient` es
`fallback([alchemy…, infura?, mainnet.base.org, …])`, y Alchemy respondía
`-32600 "up to a 10 block range"` a `eth_getLogs` para esta cuenta/plan —
muy por debajo de lo que se asumía (2000, el límite medido del RPC
público) y por debajo incluso del suelo de troceo, así que el escaneo
reventaba en vez de progresar. El resto de lecturas de `packRegistry.ts`
(multicall, `readContract`) siguen yendo por wagmi/Alchemy sin cambios —
esas sí soportan su rango normal, el problema era específico de
`eth_getLogs`.

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
node scripts/packs-registry-seed.mjs
```

- **NO le pases un `RPC_URL` de Alchemy/Infura** pensando que va más
  rápido — es justo el bug que este fix corrige (ver arriba). El default,
  sin `RPC_URL`, ya es el correcto: `mainnet.base.org`, sin clave, 2000
  bloques por llamada. El script avisa por consola si `RPC_URL` parece
  Alchemy/Infura.
- El script es incremental: si `registry.seed.json` ya existe, solo
  escanea desde su `lastScannedBlock` + 1, no repite el historial — con
  el seed al día son ~25-30 peticiones, segundos.
- Commitea el `registry.seed.json` resultante junto con el cambio que
  motivó la regeneración (o suelto, si es solo mantenimiento).
- **No se ejecuta en CI** — es un paso manual, deliberadamente (mismo
  criterio que el resto del repo: nada de escaneos largos de RPC en cada
  push).

Tanto la generación inicial (13-sep) como esta actualización (13-sep,
mismo día, fix del RPC dedicado) se hicieron sin `node_modules` instalado
en el worktree (regla del plan: nada de `npm install`/build en el
portátil de 8 GB), reproduciendo la misma lógica de escaneo contra la API
REST de Blockscout en lugar de `eth_getLogs` directo — mismo resultado
(mismos `packIds`, confirmado sin cambios desde la primera generación),
solo `lastScannedBlock`/`generatedAt` puestos al día. Las próximas
regeneraciones deberían usar el script de verdad
(`scripts/packs-registry-seed.mjs`) con `node_modules` instalado.
