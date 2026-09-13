import { describe, it, expect, beforeEach } from 'vitest';
import { useTraitlabStore, selectTraitlabChanges } from '../store/traitlabStore';

/**
 * Regresión del error de producción 13-sep-2026: `/traitlab` reventaba al
 * montar (sin wallet, sin token elegido) con React error #185 "Maximum
 * update depth exceeded". Causa: `TraitLabModule` leía
 * `useTraitlabStore(selectTraitlabChanges)` — `selectTraitlabChanges`
 * llama a `computeChanges`, que construye un objeto/arrays NUEVOS en cada
 * invocación. `useSyncExternalStoreWithSelector` (lo que zustand usa por
 * debajo de `useStore(selector)`) compara el resultado del selector con
 * `Object.is` para decidir si re-renderizar; como esa comparación daba
 * "distinto" SIEMPRE —incluso con `equipped`/`selections` vacíos y sin
 * cambiar—, entraba en un bucle infinito de renders.
 *
 * Fix: `TraitLabModule` ya no usa `selectTraitlabChanges` como selector de
 * `useTraitlabStore()` — lee los campos crudos (`equipped`, `selections`,
 * estables por referencia) y deriva `changes` con `useMemo` en React.
 * `selectTraitlabChanges` se mantiene como función pura para tests/usos
 * fuera de un hook de suscripción.
 *
 * Sin jsdom/RTL en el lockfile (`vitest` lo pide como peer opcional, no
 * está instalado), este test no monta el componente: reproduce la
 * comprobación de estabilidad que hace `useSyncExternalStoreWithSelector`
 * por debajo, llamando al selector varias veces sobre el MISMO estado.
 */

beforeEach(() => {
  useTraitlabStore.setState({
    selectedTokenId: null,
    equipped: {},
    selections: {},
    history: [],
    lockedReasons: {},
  });
});

describe('estabilidad de selectores de traitlabStore (regresión React #185)', () => {
  it('selectTraitlabChanges NO es referencialmente estable — nunca debe usarse como selector de useTraitlabStore()', () => {
    const state = useTraitlabStore.getState();
    const a = selectTraitlabChanges(state);
    const b = selectTraitlabChanges(state);
    const c = selectTraitlabChanges(state);

    // Mismo estado exacto, tres llamadas: cada una crea un objeto/arrays nuevos.
    // Si esto empezara a dar `true`, alguien memoizó computeChanges y el
    // comentario de arriba (y el uso con useMemo en el componente) hay que
    // revisarlo — pero el peligro real es lo contrario: que esta función
    // vuelva a usarse como selector de un hook de store sin useMemo.
    expect(a).not.toBe(b);
    expect(b).not.toBe(c);
    expect(a.toApply).not.toBe(b.toApply);

    // El contenido sí es equivalente — por eso el bug no lo cazan los tests
    // de valor (`toEqual`) de traitlabStore.test.ts; hace falta uno de identidad.
    expect(a).toEqual(b);
    expect(b).toEqual(c);

    // Reproduce sin wallet / sin token: con estado vacío el bug igual disparaba,
    // porque {toApply:[],count:0} también es una instancia nueva cada vez.
    expect(state.equipped).toEqual({});
    expect(state.selections).toEqual({});
  });

  it('los campos crudos (equipped/selections/history/lockedReasons) SÍ son estables entre lecturas sin mutar — el patrón que usa TraitLabModule', () => {
    useTraitlabStore.setState({ equipped: { HAIR: '444' }, selections: { EYES: '10' } });
    const s1 = useTraitlabStore.getState();
    const s2 = useTraitlabStore.getState();
    const s3 = useTraitlabStore.getState();

    expect(s1.equipped).toBe(s2.equipped);
    expect(s2.equipped).toBe(s3.equipped);
    expect(s1.selections).toBe(s2.selections);
    expect(s1.history).toBe(s2.history);
    expect(s1.lockedReasons).toBe(s2.lockedReasons);
  });

  it('tras una acción, los campos tocados cambian de referencia y los demás no (zustand solo reemplaza lo que se setea)', () => {
    useTraitlabStore.setState({ equipped: { HAIR: '444' } });
    const before = useTraitlabStore.getState();

    useTraitlabStore.getState().selectTrait('EYES', '10');
    const after = useTraitlabStore.getState();

    expect(after.selections).not.toBe(before.selections); // se tocó
    expect(after.equipped).toBe(before.equipped); // no se tocó, misma referencia
  });
});
