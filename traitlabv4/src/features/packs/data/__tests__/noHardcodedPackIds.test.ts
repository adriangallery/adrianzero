import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * `PACKS_FLOPPIES_MISMATCH_REPORT.md` documenta el bug de origen: una
 * tabla a mano (`PACK_METADATA`/`OPENPACK_V4_TOKENS`/`ACTION_PACK_TOKENS`
 * en `features/packs/hooks/{usePacks,useOpenPack}.ts`, la carpeta VIEJA
 * que este worker no toca) que se desincronizó del contrato real: 10014 y
 * 10018 nunca se añadieron a la lista y no se podían abrir.
 *
 * Este test es una guarda estructural (lee el código fuente como texto,
 * no lo ejecuta) que falla si `packRegistry.ts`/las 4 hooks de
 * `features/packs/data` vuelven a introducir un mapa o array de packIds
 * a mano — el catálogo y las rutas de apertura tienen que salir de
 * `scanPackIds`/`getBatchSummary`/`isPackConfigured`/`packConfigs`, no de
 * una lista escrita en el código.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(HERE, '..');

function readSource(file: string): string {
  return readFileSync(join(DATA_DIR, file), 'utf-8');
}

// Un "packId a mano" tiene esta forma: 5 dígitos (10000-19999) o el caso
// especial 1123, usado como CLAVE de un objeto/mapa o como elemento
// literal de un array — exactamente el patrón de `PACK_METADATA`/
// `OPENPACK_V4_TOKENS` en la carpeta vieja.
const HARDCODED_PACK_ID_KEY = /['"`]?\b1(?:0\d{3}|123)\b['"`]?\s*:/; // '10005': {...} o 10005: {...}
const HARDCODED_PACK_ID_ARRAY = /\[\s*1(?:0\d{3}|123)\s*,/; // [10000, 10001, ...]

const FILES_UNDER_TEST = [
  'packRegistry.ts',
  'usePackCatalog.ts',
  'useMyPacks.ts',
  'useBuyPack.ts',
  'useOpenPack.ts',
  'usePackRegistry.ts',
  'logScan.ts',
];

describe('el descubrimiento de packs no depende de listas de packId a mano', () => {
  it.each(FILES_UNDER_TEST)('%s no declara un mapa id→metadata con claves de packId', (file) => {
    const src = readSource(file);
    const match = src.match(HARDCODED_PACK_ID_KEY);
    expect(match, `${file} parece declarar un packId como clave literal: "${match?.[0]}" — eso es justo el patrón de PACK_METADATA que causó PACKS_FLOPPIES_MISMATCH_REPORT.md`).toBeNull();
  });

  it.each(FILES_UNDER_TEST)('%s no declara un array de packIds a mano', (file) => {
    const src = readSource(file);
    const match = src.match(HARDCODED_PACK_ID_ARRAY);
    expect(match, `${file} parece declarar un array literal de packIds: "${match?.[0]}" — eso es justo el patrón de OPENPACK_V4_TOKENS/ACTION_PACK_TOKENS que causó el enrutado roto`).toBeNull();
  });

  it('packRegistry.ts descubre IDs vía scanPackIds/getBatchSummary/isPackConfigured/packConfigs, no vía una lista', () => {
    const src = readSource('packRegistry.ts');
    expect(src).toContain('scanPackIds(');
    expect(src).toContain('getBatchSummary');
    expect(src).toContain('isPackConfigured');
    expect(src).toContain('packConfigs');
  });

  it('el único bloqueo de rango permitido es DEPLOY_BLOCK (metadata de bloque, no de packId)', () => {
    const src = readSource('packRegistry.ts');
    // DEPLOY_BLOCK son bloques de creación de contrato (7-8 dígitos, en el
    // rango de bloques de Base), no packIds (rango 1000-19999) — se
    // permiten explícitamente porque son el equivalente al `startBlock`
    // de un subgraph, no una lista de negocio.
    expect(src).toContain('DEPLOY_BLOCK');
  });
});
