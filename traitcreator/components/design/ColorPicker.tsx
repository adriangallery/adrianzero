'use client'

import React, { useState } from 'react'
import { useAppStore, RETRO_COLORS } from '@/lib/store-blockchain'
import { Palette } from 'lucide-react'

export function ColorPicker() {
  const { design: { currentColor }, setCurrentColor } = useAppStore()
  const [customColor, setCustomColor] = useState('#00ff00')
  const [showCustomPicker, setShowCustomPicker] = useState(false)

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value
    setCustomColor(color)
    setCurrentColor(color)
  }

  const handleColorClick = (color: string) => {
    setCurrentColor(color)
    setCustomColor(color)
  }

  return (
    <div className="retro-panel">
      <h3 className="text-lg sm:text-xl font-pixel mb-4 neon-glow">COLORS</h3>
      
      {/* Current Color Display */}
      <div className="mb-4">
        <h4 className="text-xs sm:text-sm font-pixel text-retro-primary mb-2">CURRENT</h4>
        <div className="flex items-center space-x-2">
          <div
            className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-retro-primary"
            style={{ backgroundColor: currentColor }}
          />
          <span className="text-xs sm:text-sm font-pixel text-retro-primary">
            {currentColor.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Retro Color Palette */}
      <div className="mb-4">
        <h4 className="text-xs sm:text-sm font-pixel text-retro-primary mb-2">PALETTE</h4>
        <div className="grid grid-cols-8 gap-1">
          {RETRO_COLORS.map((color) => (
            <button
              key={color}
              className={`w-5 h-5 sm:w-6 sm:h-6 border-2 transition-all ${
                currentColor === color
                  ? 'border-retro-accent scale-110'
                  : 'border-retro-primary hover:border-retro-accent'
              }`}
              style={{ backgroundColor: color }}
              onClick={() => handleColorClick(color)}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Custom Color Picker */}
      <div className="mb-4">
        <h4 className="text-sm font-pixel text-retro-primary mb-2">CUSTOM</h4>
        <div className="flex items-center space-x-2">
          <input
            type="color"
            value={customColor}
            onChange={handleCustomColorChange}
            className="w-8 h-8 border-2 border-retro-primary cursor-pointer"
          />
          <input
            type="text"
            value={customColor}
            onChange={(e) => {
              const color = e.target.value
              setCustomColor(color)
              if (/^#[0-9A-F]{6}$/i.test(color)) {
                setCurrentColor(color)
              }
            }}
            className="retro-input text-sm flex-1"
            placeholder="#00ff00"
            maxLength={7}
          />
        </div>
      </div>

      {/* Recently Used Colors (placeholder) */}
      <div>
        <h4 className="text-sm font-pixel text-retro-primary mb-2">RECENT</h4>
        <div className="grid grid-cols-8 gap-1">
          {RETRO_COLORS.slice(0, 8).map((color) => (
            <button
              key={color}
              className="w-6 h-6 border-2 border-retro-primary hover:border-retro-accent transition-all"
              style={{ backgroundColor: color }}
              onClick={() => handleColorClick(color)}
              title={color}
            />
          ))}
        </div>
      </div>
    </div>
  )
} 