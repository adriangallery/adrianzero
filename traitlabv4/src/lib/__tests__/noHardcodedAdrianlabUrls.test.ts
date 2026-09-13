import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * F9 (13-sep-2026, recon RECON_ADRIANZERO_FRONTEND_2026-09-12 hallazgo #11):
 * antes de `src/lib/adrianlab.ts` había 40+ URLs del dominio de AdrianLAB
 * escritas a mano en `src/features/**`. Este guardián falla si ese literal
 * vuelve a aparecer fuera del cliente único.
 */

// Construido a trozos para que este propio fichero no dispare el guardián.
const ADRIANLAB_HOST = ['adrianlab', 'vercel', 'app'].join('.');

const SRC_ROOT = join(__dirname, '..', '..');

// `features/packs/**` está fuera de este barrido a propósito: PR #20 (en
// vuelo en paralelo a F9) toca esos ficheros — se migrará ahí, no aquí, para
// no pisar ese trabajo. Quitar esta excepción en cuanto ese PR aterrice.
const EXCLUDED_DIRS = [join(SRC_ROOT, 'features', 'packs')];

const ALLOWED_FILE = join(SRC_ROOT, 'lib', 'adrianlab.ts');
const THIS_FILE = fileURLToPath(import.meta.url);

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (EXCLUDED_DIRS.includes(full)) continue;
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, files);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

describe('no hardcoded AdrianLAB URLs outside src/lib/adrianlab.ts', () => {
  // Los tests pueden citar el dominio (p. ej. adrianlabBase.test.ts) — no son código de producción.
  const files = walk(SRC_ROOT).filter((f) => f !== ALLOWED_FILE && f !== THIS_FILE && !f.includes('__tests__'));
  const offenders: string[] = [];

  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    if (content.includes(ADRIANLAB_HOST)) {
      offenders.push(relative(SRC_ROOT, file));
    }
  }

  it('found at least one source file to scan (sanity check)', () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it('has no literal adrianlab.vercel.app outside the client', () => {
    expect(offenders).toEqual([]);
  });
});
