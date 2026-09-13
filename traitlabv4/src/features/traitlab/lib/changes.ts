/**
 * Diff puro entre "lo equipado on-chain" y "lo que el usuario quiere" en el
 * editor TraitLab, más el plan de firmas que eso implica. Todo puro (sin
 * wagmi/React) para poder testearlo — ver `__tests__/changes.test.ts`.
 *
 * Modelo de selección (`traitlabStore.ts`): `selections[category]` es
 * `undefined` (sin cambio, se queda lo equipado) o un `traitId` (poner ese
 * trait). ⚠️ 13-sep-2026: el contrato `AdrianTraitsExtensions` NO tiene
 * forma de desequipar (verificado con `cast code` — no hay
 * `removeTrait`/`unequip`/similar en el bytecode desplegado, ver
 * `__fixtures__/traitsExtensions.onchain-selectors.json`); `null` como
 * "quitar" se retiró del modelo. Sustituir un trait de una categoría solo
 * es posible aplicando OTRO trait encima — si el usuario solo tiene el que
 * ya está puesto, no hay nada que hacer (la UI lo dice con un texto corto).
 */

export type CategorySelections = Record<string, string | undefined>;
export type CategoryEquipped = Record<string, string | undefined>;

export interface TraitlabChanges {
  /** IDs a incluir en un único `applyTraitMultiple(tokenId, traitIds)`. */
  toApply: string[];
  /** Nº total de cambios (para el badge "N changes" y el texto del ActionBar). */
  count: number;
}

export function computeChanges(equipped: CategoryEquipped, selections: CategorySelections): TraitlabChanges {
  const toApply: string[] = [];

  for (const category of Object.keys(selections)) {
    const desired = selections[category];
    if (desired === undefined) continue; // sin cambio en esta categoría
    const current = equipped[category];

    if (desired === current) {
      // Ha vuelto a seleccionar lo mismo que ya estaba puesto: no es un cambio.
      continue;
    }
    // Trait nuevo para esta categoría. Si había uno equipado distinto, el propio
    // applyTraitMultiple lo sustituye (una categoría = un slot).
    toApply.push(desired);
  }

  return { toApply, count: toApply.length };
}

export type SignatureStep = { type: 'approval' } | { type: 'apply'; traitIds: string[] };

export interface SignaturePlan {
  steps: SignatureStep[];
  signatureCount: number;
}

/**
 * Cuántas firmas va a pedir la wallet y en qué orden, para poder avisar
 * ANTES de firmar (recon §8.10: "Sin resumen previo de firmas"). Caso
 * típico: 1 firma (approval ya concedida) o 2 (falta approval) — nunca
 * más, porque `applyTraitMultiple` ya es un único batch y el contrato no
 * tiene una operación de "quitar" que necesite firma aparte.
 */
export function planSignatures(changes: TraitlabChanges, needsApproval: boolean): SignaturePlan {
  const steps: SignatureStep[] = [];
  if (needsApproval) steps.push({ type: 'approval' });
  if (changes.toApply.length > 0) steps.push({ type: 'apply', traitIds: changes.toApply });
  return { steps, signatureCount: steps.length };
}
