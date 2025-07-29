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

export interface AppState {
  design: DesignState
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
  saveDesign: () => Promise<string>
}

const CANVAS_WIDTH = 148
const CANVAS_HEIGHT = 148
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

  saveDesign: async () => {
    const state = get()
    const { pixels } = state.design
    
      // Load T-shirt SVG
  let tshirtSvg = ''
  try {
    const response = await fetch('/T-Shirt-148x148.svg')
    tshirtSvg = await response.text()
  } catch (error) {
    console.error('Error loading T-shirt SVG:', error)
  }
  
  // Create SVG content with T-shirt background and pixelated style
  const svgContent = `
    <svg width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" xmlns="http://www.w3.org/2000/svg" style="image-rendering: pixelated; shape-rendering: crispEdges;">
      ${tshirtSvg ? `<defs><pattern id="tshirt-pattern" patternUnits="userSpaceOnUse" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}">
        <image href="data:image/svg+xml;base64,${btoa(tshirtSvg)}" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}"/>
      </pattern></defs>
      <rect width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" fill="url(#tshirt-pattern)"/>` : ''}
      <g style="mix-blend-mode: multiply;">
        ${pixels.map(pixel => 
          `<rect x="${pixel.x}" y="${pixel.y}" width="1.025" height="1.025" fill="${pixel.color}" />`
        ).join('')}
      </g>
    </svg>
  `
    
    // Create blob and download
    const blob = new Blob([svgContent], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trait-design-${Date.now()}.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    return 'Design saved successfully!'
  },
}))

// Canvas constants
export const CANVAS_CONFIG = {
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  pixelSize: 3, // Reduced from 8 to 3 to fit 148x148 canvas
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