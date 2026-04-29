import { describe, it, expect, beforeEach } from 'vitest';
import { useTShitStore, selectVisiblePixels } from '../store/tshitStore';

beforeEach(() => {
  useTShitStore.getState().clear();
});

describe('tshitStore', () => {
  it('starts with an empty canvas and brush tool', () => {
    const s = useTShitStore.getState();
    expect(s.layers.length).toBe(0);
    expect(s.tool).toBe('brush');
  });

  it('commits a stroke as a single layer (one undo step)', () => {
    const { beginStroke, addPendingPixel, commitStroke } = useTShitStore.getState();
    beginStroke();
    addPendingPixel({ x: 0, y: 0, color: '#000' });
    addPendingPixel({ x: 1, y: 0, color: '#000' });
    commitStroke();
    expect(useTShitStore.getState().layers.length).toBe(1);
    expect(useTShitStore.getState().getAllPixels().length).toBe(2);
  });

  it('undo pops the latest layer onto the redo stack', () => {
    const { beginStroke, addPendingPixel, commitStroke, undo, redo } = useTShitStore.getState();
    beginStroke();
    addPendingPixel({ x: 0, y: 0, color: '#000' });
    commitStroke();
    expect(useTShitStore.getState().layers.length).toBe(1);
    undo();
    expect(useTShitStore.getState().layers.length).toBe(0);
    expect(useTShitStore.getState().redoStack.length).toBe(1);
    redo();
    expect(useTShitStore.getState().layers.length).toBe(1);
  });

  it('eraser sentinel removes existing pixels', () => {
    const { applyLayer } = useTShitStore.getState();
    applyLayer({ pixels: [{ x: 0, y: 0, color: '#fff' }] });
    expect(useTShitStore.getState().getAllPixels().length).toBe(1);
    applyLayer({ pixels: [{ x: 0, y: 0, color: '__erase__' }] });
    expect(useTShitStore.getState().getAllPixels().length).toBe(0);
  });

  it('selectVisiblePixels merges committed layers with in-progress stroke', () => {
    const { applyLayer, beginStroke, addPendingPixel } = useTShitStore.getState();
    applyLayer({ pixels: [{ x: 0, y: 0, color: '#000' }] });
    beginStroke();
    addPendingPixel({ x: 5, y: 5, color: '#fff' });
    const visible = selectVisiblePixels(useTShitStore.getState());
    expect(visible.length).toBe(2);
  });

  it('clear resets layers and redo stack', () => {
    const { applyLayer, undo, clear } = useTShitStore.getState();
    applyLayer({ pixels: [{ x: 0, y: 0, color: '#000' }] });
    undo();
    expect(useTShitStore.getState().redoStack.length).toBe(1);
    clear();
    expect(useTShitStore.getState().layers.length).toBe(0);
    expect(useTShitStore.getState().redoStack.length).toBe(0);
  });

  it('loadFromPixels replaces canvas content with a single paste layer', () => {
    const { loadFromPixels } = useTShitStore.getState();
    loadFromPixels([
      { x: 1, y: 1, color: '#abc' },
      { x: 2, y: 2, color: '#def' },
    ]);
    expect(useTShitStore.getState().layers.length).toBe(1);
    expect(useTShitStore.getState().getAllPixels().length).toBe(2);
  });
});
