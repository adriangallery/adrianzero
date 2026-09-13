import { describe, it, expect, beforeEach } from 'vitest';
import { useTraitlabStore, selectTraitlabChanges } from '../store/traitlabStore';

beforeEach(() => {
  useTraitlabStore.setState({
    selectedTokenId: null,
    equipped: {},
    selections: {},
    history: [],
    lockedReasons: {},
  });
});

describe('traitlabStore', () => {
  it('setSelectedToken resetea equipped/selections/history del token anterior', () => {
    const { setSelectedToken, selectTrait } = useTraitlabStore.getState();
    setSelectedToken('146');
    selectTrait('HAIR', '444');
    expect(useTraitlabStore.getState().selections.HAIR).toBe('444');

    setSelectedToken('999');
    expect(useTraitlabStore.getState().selections).toEqual({});
    expect(useTraitlabStore.getState().history).toEqual([]);
  });

  it('selectTrait elige un trait nuevo para su categoría', () => {
    useTraitlabStore.getState().selectTrait('HAIR', '444');
    expect(useTraitlabStore.getState().selections).toEqual({ HAIR: '444' });
  });

  it('tocar dos veces el mismo trait lo deselecciona (vuelve a "sin cambio")', () => {
    const { selectTrait } = useTraitlabStore.getState();
    selectTrait('HAIR', '444');
    selectTrait('HAIR', '444');
    expect(useTraitlabStore.getState().selections.HAIR).toBeUndefined();
  });

  it('undo deshace el último cambio de selección', () => {
    const { selectTrait, undo } = useTraitlabStore.getState();
    selectTrait('HAIR', '444');
    selectTrait('EYES', '10');
    expect(useTraitlabStore.getState().selections).toEqual({ HAIR: '444', EYES: '10' });
    undo();
    expect(useTraitlabStore.getState().selections).toEqual({ HAIR: '444' });
    undo();
    expect(useTraitlabStore.getState().selections).toEqual({});
  });

  it('undo sin historial no revienta', () => {
    expect(() => useTraitlabStore.getState().undo()).not.toThrow();
  });

  it('selectTraitlabChanges deriva de equipped+selections', () => {
    useTraitlabStore.setState({ equipped: { HAIR: '444' }, selections: { HAIR: '700', EYES: '10' } });
    expect(selectTraitlabChanges(useTraitlabStore.getState())).toEqual({
      toApply: ['700', '10'],
      count: 2,
    });
  });

  it('setLockedReason añade y limpia motivos por traitId', () => {
    const { setLockedReason } = useTraitlabStore.getState();
    setLockedReason('444', 'Solo Gen 2');
    expect(useTraitlabStore.getState().lockedReasons['444']).toBe('Solo Gen 2');
    setLockedReason('444', null);
    expect(useTraitlabStore.getState().lockedReasons['444']).toBeUndefined();
  });
});
