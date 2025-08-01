'use client'

import React from 'react'
import { Canvas } from '../components/design/Canvas'
import { ToolPanel } from '../components/design/ToolPanel'
import { ColorPicker } from '../components/design/ColorPicker'
import { WalletConnector } from '../components/blockchain/WalletConnector'
import { SaveAndMint } from '../components/blockchain/SaveAndMint'
import { Header } from '../components/ui/Header'
import { useAppStore } from '../lib/store-blockchain'

export default function Home() {
  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Header - Always visible */}
      <Header />
      
      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Mobile Layout */}
        <div className="block lg:hidden w-full overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Mobile Header Info */}
            <div className="retro-panel">
              <h3 className="text-lg font-pixel mb-2 anaglyph-title">TRAIT STUDIO</h3>
              <div className="text-sm font-pixel text-gray-300">
                <p>• Touch-friendly drawing</p>
                <p>• Mobile optimized</p>
                <p>• Blockchain integration</p>
              </div>
            </div>
            
            {/* Mobile Canvas */}
            <div>
              <Canvas />
            </div>
            
            {/* Mobile Tools - Horizontal Scroll */}
            <div>
              <ToolPanel />
            </div>
            
            {/* Mobile Colors */}
            <div>
              <ColorPicker />
            </div>
            
            {/* Mobile Actions */}
            <div className="retro-panel">
              <h3 className="text-lg font-pixel mb-2 neon-glow">BLOCKCHAIN</h3>
              <div className="space-y-2">
                <WalletConnector />
                <SaveAndMint />
              </div>
            </div>
          </div>
        </div>
        
        {/* Desktop Layout - Professional Drawing App Style */}
        <div className="hidden lg:flex w-full">
          {/* Left Sidebar - Fixed width, scrollable */}
          <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <WalletConnector />
              <SaveAndMint />
              <ToolPanel />
              <ColorPicker />
            </div>
          </div>
          
          {/* Main Canvas Area - Takes remaining space */}
          <div className="flex-1 flex items-center justify-center bg-gray-950 p-4">
            <Canvas />
          </div>
        </div>
      </div>
    </div>
  )
} // Vercel deployment test - Thu Jul 31 13:45:19 CEST 2025
