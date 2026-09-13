import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * F9 (13-sep-2026): guardián contra volver a hardcodear una API key de
 * Infura/Alchemy como fallback literal en el código (como pasó con
 * `VITE_INFURA_API_KEY || 'cc0c8013...'` en `src/config/alchemy.ts`, ya
 * arreglado en H4/PR #2 — expuesta en el historial público de GitHub desde
 * 2025, Adrián debe rotarla en Infura). Toda key SIEMPRE por `import.meta.env`,
 * sin fallback literal.
 */

const SRC_ROOT = join(__dirname, '..', '..');
const THIS_FILE = fileURLToPath(import.meta.url);

// Literal `infura.io/v3/<32-hex-project-id>` o `alchemy.com/v2/<key>` seguido
// directamente de una cadena (no de un `${...}` ni de un cierre de backtick),
// es decir: la key va escrita a mano, no interpolada desde una env var.
const HARDCODED_KEY_PATTERNS = [
  /infura\.io\/v3\/[a-f0-9]{16,}/i,
  /alchemy\.com\/v2\/[A-Za-z0-9_-]{20,}/,
];

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, files);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

describe('no hardcoded Infura/Alchemy RPC keys', () => {
  const files = walk(SRC_ROOT).filter((f) => f !== THIS_FILE);
  const offenders: string[] = [];

  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    for (const pattern of HARDCODED_KEY_PATTERNS) {
      if (pattern.test(content)) {
        offenders.push(`${relative(SRC_ROOT, file)} (${pattern})`);
      }
    }
  }

  it('found at least one source file to scan (sanity check)', () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it('has no literal RPC provider key anywhere in src/', () => {
    expect(offenders).toEqual([]);
  });
});
