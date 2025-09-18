'use client'

import React from 'react'
import { Canvas } from '@/components/design/Canvas'
import { ToolPanel } from '@/components/design/ToolPanel'
import { ColorPicker } from '@/components/design/ColorPicker'
import { Header } from '@/components/ui/Header'
import { useAppStore } from '@/lib/store-simple'

export default function HomeBeta() {
  const { saveDesign } = useAppStore()

  const handleSave = async () => {
    try {
      await saveDesign()
      alert('Design saved successfully!')
    } catch (error) {
      alert('Error saving design: ' + error)
    }
  }

  return (
    <div className="min-h-screen bg-black text-retro-primary">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Tools */}
          <div className="lg:col-span-1 space-y-4">
            <div className="retro-panel">
              <h3 className="text-xl font-pixel mb-4 neon-glow">BETA VERSION</h3>
              <div className="text-sm font-pixel text-retro-gray">
                <p>• No blockchain integration</p>
                <p>• Local SVG export</p>
                <p>• Full drawing tools</p>
                <p>• Retro theme active</p>
              </div>
            </div>
            <ToolPanel />
            <ColorPicker />
          </div>
          
          {/* Center - Canvas */}
          <div className="lg:col-span-2 flex justify-center">
            <Canvas />
          </div>
          
          {/* Right Panel - Actions */}
          <div className="lg:col-span-1 space-y-4">
            <div className="retro-panel">
              <h3 className="text-xl font-pixel mb-4 neon-glow">ACTIONS</h3>
              <div className="space-y-2">
                <button 
                  className="retro-button w-full"
                  onClick={handleSave}
                >
                  SAVE DESIGN (SVG)
                </button>
              </div>
            </div>
            
            <div className="retro-panel">
              <h3 className="text-xl font-pixel mb-4 neon-glow">INFO</h3>
              <div className="space-y-2 text-sm">
                <p>Canvas: 64x64 pixels</p>
                <p>Format: SVG</p>
                <p>Status: Beta Testing</p>
                <p>Tools: Brush, Eraser, Colors</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 