import { describe, it, expect } from 'vitest';
import { computeChanges, planSignatures, effectiveTraitIds } from '../lib/changes';

describe('computeChanges', () => {
  it('sin selecciones no hay cambios', () => {
    expect(computeChanges({ HAIR: '444' }, {})).toEqual({ toApply: [], toRemove: [], count: 0 });
  });

  it('elegir un trait nuevo en una categoría vacía cuenta como alta', () => {
    const changes = computeChanges({}, { HAIR: '444' });
    expect(changes).toEqual({ toApply: ['444'], toRemove: [], count: 1 });
  });

  it('sustituir lo equipado por otro trait de la misma categoría es solo un alta (sin removeTrait aparte)', () => {
    const changes = computeChanges({ HAIR: '444' }, { HAIR: '700' });
    expect(changes).toEqual({ toApply: ['700'], toRemove: [], count: 1 });
  });

  it('volver a elegir lo mismo que ya estaba puesto no es un cambio', () => {
    const changes = computeChanges({ HAIR: '444' }, { HAIR: '444' });
    expect(changes).toEqual({ toApply: [], toRemove: [], count: 0 });
  });

  it('quitar lo equipado sin poner nada genera un removeTrait', () => {
    const changes = computeChanges({ HAIR: '444' }, { HAIR: null });
    expect(changes).toEqual({ toApply: [], toRemove: ['444'], count: 1 });
  });

  it('quitar una categoría sin nada equipado no genera nada', () => {
    const changes = computeChanges({}, { HAIR: null });
    expect(changes).toEqual({ toApply: [], toRemove: [], count: 0 });
  });

  it('mezcla de varias categorías', () => {
    const changes = computeChanges(
      { HAIR: '444', EYES: '10' },
      { HAIR: '700', EYES: null, TOP: '900' }
    );
    expect(changes.toApply.sort()).toEqual(['700', '900']);
    expect(changes.toRemove).toEqual(['10']);
    expect(changes.count).toBe(3);
  });
});

describe('effectiveTraitIds', () => {
  it('devuelve lo equipado cuando no hay selección', () => {
    expect(effectiveTraitIds({ HAIR: '444', EYES: '10' }, {}).sort()).toEqual(['10', '444']);
  });

  it('la selección sustituye a lo equipado en su categoría', () => {
    expect(effectiveTraitIds({ HAIR: '444' }, { HAIR: '700' })).toEqual(['700']);
  });

  it('null quita la categoría del resultado', () => {
    expect(effectiveTraitIds({ HAIR: '444', EYES: '10' }, { HAIR: null })).toEqual(['10']);
  });

  it('añade categorías nuevas que no estaban equipadas', () => {
    expect(effectiveTraitIds({}, { HAIR: '444' })).toEqual(['444']);
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

  it('cada quita es su propia firma (removeTrait no tiene variante batch)', () => {
    const changes = computeChanges({ HAIR: '444', EYES: '10' }, { HAIR: null, EYES: null });
    const plan = planSignatures(changes, false);
    expect(plan.signatureCount).toBe(2);
    expect(plan.steps).toEqual([
      { type: 'remove', traitId: '444' },
      { type: 'remove', traitId: '10' },
    ]);
  });

  it('altas + quitas + approval combinan todos los pasos', () => {
    const changes = computeChanges({ HAIR: '444' }, { HAIR: null, EYES: '10' });
    const plan = planSignatures(changes, true);
    expect(plan.signatureCount).toBe(3);
    expect(plan.steps).toEqual([
      { type: 'approval' },
      { type: 'remove', traitId: '444' },
      { type: 'apply', traitIds: ['10'] },
    ]);
  });

  it('sin cambios no pide ninguna firma', () => {
    const plan = planSignatures({ toApply: [], toRemove: [], count: 0 }, false);
    expect(plan.signatureCount).toBe(0);
    expect(plan.steps).toEqual([]);
  });
});
