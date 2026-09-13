import { describe, it, expect } from 'vitest';
import { computeChanges, planSignatures } from '../lib/changes';

describe('computeChanges', () => {
  it('sin selecciones no hay cambios', () => {
    expect(computeChanges({ HAIR: '444' }, {})).toEqual({ toApply: [], count: 0 });
  });

  it('elegir un trait nuevo en una categoría vacía cuenta como alta', () => {
    const changes = computeChanges({}, { HAIR: '444' });
    expect(changes).toEqual({ toApply: ['444'], count: 1 });
  });

  it('sustituir lo equipado por otro trait de la misma categoría es un alta (applyTraitMultiple sustituye el slot)', () => {
    const changes = computeChanges({ HAIR: '444' }, { HAIR: '700' });
    expect(changes).toEqual({ toApply: ['700'], count: 1 });
  });

  it('volver a elegir lo mismo que ya estaba puesto no es un cambio', () => {
    const changes = computeChanges({ HAIR: '444' }, { HAIR: '444' });
    expect(changes).toEqual({ toApply: [], count: 0 });
  });

  it('mezcla de varias categorías', () => {
    const changes = computeChanges({ HAIR: '444', EYES: '10' }, { HAIR: '700', TOP: '900' });
    expect(changes.toApply.sort()).toEqual(['700', '900']);
    expect(changes.count).toBe(2);
  });
});

describe('planSignatures', () => {
  it('caso feliz de la maqueta: 2 altas, approval ya concedida → 1 firma', () => {
    const changes = computeChanges({}, { HAIR: '444', EYES: '10' });
    const plan = planSignatures(changes, false);
    expect(plan.signatureCount).toBe(1);
    expect(plan.steps).toEqual([{ type: 'apply', traitIds: ['444', '10'] }]);
  });

  it('sin approval concedida añade un paso más al principio', () => {
    const changes = computeChanges({}, { HAIR: '444' });
    const plan = planSignatures(changes, true);
    expect(plan.signatureCount).toBe(2);
    expect(plan.steps[0]).toEqual({ type: 'approval' });
    expect(plan.steps[1]).toEqual({ type: 'apply', traitIds: ['444'] });
  });

  it('sin cambios no pide ninguna firma', () => {
    const plan = planSignatures({ toApply: [], count: 0 }, false);
    expect(plan.signatureCount).toBe(0);
    expect(plan.steps).toEqual([]);
  });

  it('nunca hay un paso de tipo "remove" — el contrato no soporta desequipar (13-sep-2026)', () => {
    const changes = computeChanges({ HAIR: '444' }, { HAIR: '700', EYES: '10' });
    const plan = planSignatures(changes, true);
    expect(plan.steps.every((s) => s.type === 'approval' || s.type === 'apply')).toBe(true);
  });
});
