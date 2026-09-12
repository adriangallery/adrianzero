/**
 * Diff puro entre "lo equipado on-chain" y "lo que el usuario quiere" en el
 * editor TraitLab, más el plan de firmas que eso implica. Todo puro (sin
 * wagmi/React) para poder testearlo — ver `__tests__/changes.test.ts`.
 *
 * Modelo de selección (`traitlabStore.ts`): `selections[category]` es
 * `undefined` (sin cambio, se queda lo equipado), `null` (quitar lo
 * equipado sin poner nada) o un `traitId` (poner ese trait).
 */

export type CategorySelections = Record<string, string | null | undefined>;
export type CategoryEquipped = Record<string, string | undefined>;

export interface TraitlabChanges {
  /** IDs a incluir en un único `applyTraitMultiple(tokenId, traitIds)`. */
  toApply: string[];
  /** IDs de trait (no categorías) a quitar, uno por `removeTrait(tokenId, traitId)` — el contrato no tiene "removeMultiple". */
  toRemove: string[];
  /** Nº total de cambios (para el badge "N changes" y el texto del ActionBar). */
  count: number;
}

export function computeChanges(equipped: CategoryEquipped, selections: CategorySelections): TraitlabChanges {
  const toApply: string[] = [];
  const toRemove: string[] = [];

  for (const category of Object.keys(selections)) {
    const desired = selections[category];
    if (desired === undefined) continue; // sin cambio en esta categoría
    const current = equipped[category];

    if (desired === null) {
      // Quitar lo equipado (si lo había).
      if (current) toRemove.push(current);
      continue;
    }
    if (desired === current) {
      // Ha vuelto a seleccionar lo mismo que ya estaba puesto: no es un cambio.
      continue;
    }
    // Trait nuevo para esta categoría. Si había uno equipado distinto, el propio
    // applyTraitMultiple lo sustituye (una categoría = un slot) — no hace falta removeTrait aparte.
    toApply.push(desired);
  }

  return { toApply, toRemove, count: toApply.length + toRemove.length };
}

/** IDs finales "deseados" por categoría (equipped + overrides de selections, sin los `null`). Para el preview en vivo y el guardián final de `canApplyTraits`. */
export function effectiveTraitIds(equipped: CategoryEquipped, selections: CategorySelections): string[] {
  const byCategory: Record<string, string> = { ...equipped } as Record<string, string>;
  for (const category of Object.keys(selections)) {
    const desired = selections[category];
    if (desired === undefined) continue;
    if (desired === null) delete byCategory[category];
    else byCategory[category] = desired;
  }
  return Object.values(byCategory);
}

export type SignatureStep =
  | { type: 'approval' }
  | { type: 'remove'; traitId: string }
  | { type: 'apply'; traitIds: string[] };

export interface SignaturePlan {
  steps: SignatureStep[];
  signatureCount: number;
}

/**
 * Cuántas firmas va a pedir la wallet y en qué orden, para poder avisar
 * ANTES de firmar (recon §8.10: "Sin resumen previo de firmas"). El caso
 * típico de la maqueta (solo altas, approval ya concedida) es 1 firma;
 * con approval pendiente son 2; cada quita es una firma propia porque
 * `removeTrait` no tiene variante batch.
 */
export function planSignatures(changes: TraitlabChanges, needsApproval: boolean): SignaturePlan {
  const steps: SignatureStep[] = [];
  if (needsApproval) steps.push({ type: 'approval' });
  for (const traitId of changes.toRemove) steps.push({ type: 'remove', traitId });
  if (changes.toApply.length > 0) steps.push({ type: 'apply', traitIds: changes.toApply });
  return { steps, signatureCount: steps.length };
}
