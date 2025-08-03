'use client'

import React from 'react'
import { useAppStore, CANVAS_CONFIG } from '@/lib/store-blockchain'
import { Brush, Eraser, RotateCcw, RotateCw, Grid, Trash2 } from 'lucide-react'

export function ToolPanel() {
  const {
    design: { tool, brushSize, showGrid, brushSoftness },
    setTool,
    setBrushSize, setBrushSoftness,
    toggleGrid,
    undo,
    redo,
    clearCanvas,
  } = useAppStore()

  const brushSizes = [1, 2, 4, 8]

  return (
    <div className="retro-panel">
      <h3 className="text-lg sm:text-xl font-pixel mb-4 neon-glow">TOOLS</h3>
      
      {/* Drawing Tools */}
      <div className="space-y-4">
        <div>
          <h4 className="text-xs sm:text-sm font-pixel text-retro-primary mb-2">DRAWING</h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              className={`retro-button text-xs sm:text-sm py-2 ${tool === 'brush' ? 'bg-retro-primary text-retro-dark' : ''}`}
              onClick={() => setTool('brush')}
            >
              <Brush className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
              BRUSH
            </button>
            <button
              className={`retro-button text-xs sm:text-sm py-2 ${tool === 'eraser' ? 'bg-retro-primary text-retro-dark' : ''}`}
              onClick={() => setTool('eraser')}
            >
              <Eraser className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
              ERASER
            </button>
          </div>
        </div>

        {/* Brush Size */}
        <div>
          <h4 className="text-xs sm:text-sm font-pixel text-retro-primary mb-2">BRUSH SIZE</h4>
          <div className="grid grid-cols-4 gap-1">
            {brushSizes.map((size) => (
              <button
                key={size}
                className={`retro-button text-xs py-1 ${brushSize === size ? 'bg-retro-primary text-retro-dark' : ''}`}
                onClick={() => setBrushSize(size)}
              >
                {size}x{size}
              </button>
            ))}

        {/* Brush Softness */}
        <div>
          <h4 className="text-xs sm:text-sm font-pixel text-retro-primary mb-2">BRUSH OPACITY</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-retro-gray">
              <span>Hard</span>
              <span>{brushSoftness}%</span>
              <span>Soft</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={brushSoftness}
              onChange={(e) => setBrushSoftness(Number(e.target.value))}
              className="w-full h-2 bg-retro-dark rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #ff6b6b 0%, #4ecdc4 ${brushSoftness}%, #2c3e50 ${brushSoftness}%, #2c3e50 100%)`
              }}
            />
          </div>
        </div>
          </div>
        </div>


        {/* Grid Toggle */}
        <div>
          <button
            className={`retro-button w-full text-sm ${showGrid ? 'bg-retro-primary text-retro-dark' : ''}`}
            onClick={toggleGrid}
          >
            <Grid className="w-4 h-4 inline mr-1" />
            {showGrid ? 'HIDE GRID' : 'SHOW GRID'}
          </button>
        </div>

        {/* History Controls */}
        <div>
          <h4 className="text-sm font-pixel text-retro-primary mb-2">HISTORY</h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              className="retro-button text-sm"
              onClick={undo}
            >
              <RotateCcw className="w-4 h-4 inline mr-1" />
              UNDO
            </button>
            <button
              className="retro-button text-sm"
              onClick={redo}
            >
              <RotateCw className="w-4 h-4 inline mr-1" />
              REDO
            </button>
          </div>
        </div>

        {/* Clear Canvas */}
        <div>
          <button
            className="retro-button-secondary w-full text-sm"
            onClick={clearCanvas}
          >
            <Trash2 className="w-4 h-4 inline mr-1" />
            CLEAR CANVAS
          </button>
        </div>
      </div>
    </div>
  )
} 