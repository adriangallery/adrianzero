import { create } from 'zustand'

export interface Pixel {
  x: number
  y: number
  color: string
}

export interface DesignState {
  pixels: Pixel[]
  currentColor: string
  brushSize: number
  tool: 'brush' | 'eraser' | 'fill'
  zoom: number
  showGrid: boolean
  history: Pixel[][]
  historyIndex: number
  isDrawing: boolean
}

export interface WalletState {
  address: string | null
  isConnected: boolean
  isConnecting: boolean
  chainId: number | null
}

export interface AppState {
  design: DesignState
  wallet: WalletState
  setCurrentColor: (color: string) => void
  setBrushSize: (size: number) => void
  setTool: (tool: 'brush' | 'eraser' | 'fill') => void
  setZoom: (zoom: number) => void
  toggleGrid: () => void
  addPixel: (pixel: Pixel) => void
  removePixel: (x: number, y: number) => void
  clearCanvas: () => void
  undo: () => void
  redo: () => void
  setWalletAddress: (address: string | null) => void
  setWalletConnected: (connected: boolean) => void
  setWalletConnecting: (connecting: boolean) => void
  setChainId: (chainId: number | null) => void
}

const CANVAS_WIDTH = 64
const CANVAS_HEIGHT = 64
const MAX_HISTORY = 20

export const useAppStore = create<AppState>((set, get) => ({
  design: {
    pixels: [],
    currentColor: '#00ff00',
    brushSize: 1,
    tool: 'brush',
    zoom: 1,
    showGrid: true,
    history: [],
    historyIndex: -1,
    isDrawing: false,
  },
  wallet: {
    address: null,
    isConnected: false,
    isConnecting: false,
    chainId: null,
  },

  // Design actions
  setCurrentColor: (color) =>
    set((state) => ({
      design: { ...state.design, currentColor: color }
    })),

  setBrushSize: (size) =>
    set((state) => ({
      design: { ...state.design, brushSize: size }
    })),

  setTool: (tool) =>
    set((state) => ({
      design: { ...state.design, tool }
    })),

  setZoom: (zoom) =>
    set((state) => ({
      design: { ...state.design, zoom }
    })),

  toggleGrid: () =>
    set((state) => ({
      design: { ...state.design, showGrid: !state.design.showGrid }
    })),

  addPixel: (pixel) => {
    const state = get()
    const newPixels = [...state.design.pixels]
    
    // Remove existing pixel at this position
    const existingIndex = newPixels.findIndex(p => p.x === pixel.x && p.y === pixel.y)
    if (existingIndex !== -1) {
      newPixels.splice(existingIndex, 1)
    }
    
    // Add new pixel
    newPixels.push(pixel)
    
    // Update history
    const newHistory = [...state.design.history.slice(0, state.design.historyIndex + 1), newPixels]
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift()
    }
    
    set((state) => ({
      design: {
        ...state.design,
        pixels: newPixels,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      }
    }))
  },

  removePixel: (x, y) => {
    const state = get()
    const newPixels = state.design.pixels.filter(p => !(p.x === x && p.y === y))
    
    // Update history
    const newHistory = [...state.design.history.slice(0, state.design.historyIndex + 1), newPixels]
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift()
    }
    
    set((state) => ({
      design: {
        ...state.design,
        pixels: newPixels,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      }
    }))
  },

  clearCanvas: () => {
    const state = get()
    const newHistory = [...state.design.history.slice(0, state.design.historyIndex + 1), []]
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift()
    }
    
    set((state) => ({
      design: {
        ...state.design,
        pixels: [],
        history: newHistory,
        historyIndex: newHistory.length - 1,
      }
    }))
  },

  undo: () => {
    const state = get()
    if (state.design.historyIndex > 0) {
      set((state) => ({
        design: {
          ...state.design,
          pixels: state.design.history[state.design.historyIndex - 1],
          historyIndex: state.design.historyIndex - 1,
        }
      }))
    }
  },

  redo: () => {
    const state = get()
    if (state.design.historyIndex < state.design.history.length - 1) {
      set((state) => ({
        design: {
          ...state.design,
          pixels: state.design.history[state.design.historyIndex + 1],
          historyIndex: state.design.historyIndex + 1,
        }
      }))
    }
  },

  // Wallet actions
  setWalletAddress: (address) =>
    set((state) => ({
      wallet: { ...state.wallet, address }
    })),

  setWalletConnected: (connected) =>
    set((state) => ({
      wallet: { ...state.wallet, isConnected: connected }
    })),

  setWalletConnecting: (connecting) =>
    set((state) => ({
      wallet: { ...state.wallet, isConnecting: connecting }
    })),

  setChainId: (chainId) =>
    set((state) => ({
      wallet: { ...state.wallet, chainId }
    })),
}))

// Canvas constants
export const CANVAS_CONFIG = {
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  pixelSize: 8,
  maxZoom: 4,
  minZoom: 0.5,
}

// Retro color palette
export const RETRO_COLORS = [
  '#000000', // Black
  '#ffffff', // White
  '#ff0000', // Red
  '#00ff00', // Green
  '#0000ff', // Blue
  '#ffff00', // Yellow
  '#ff00ff', // Magenta
  '#00ffff', // Cyan
  '#ff8000', // Orange
  '#8000ff', // Purple
  '#ff0080', // Pink
  '#80ff00', // Lime
  '#0080ff', // Sky Blue
  '#ff8080', // Light Red
  '#80ff80', // Light Green
  '#8080ff', // Light Blue
] 