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
    <div className="min-h-screen bg-black text-retro-primary">
      <Header />
      
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Mobile Layout */}
        <div className="block lg:hidden">
          {/* Mobile Header Info */}
          <div className="retro-panel mb-4">
            <h3 className="text-lg font-pixel mb-2 neon-glow">TRAIT STUDIO</h3>
            <div className="text-xs font-pixel text-retro-gray">
              <p>• Touch-friendly drawing</p>
              <p>• Mobile optimized</p>
              <p>• Blockchain integration</p>
            </div>
          </div>
          
          {/* Mobile Canvas */}
          <div className="mb-4">
            <Canvas />
          </div>
          
          {/* Mobile Tools - Horizontal Scroll */}
          <div className="mb-4">
            <ToolPanel />
          </div>
          
          {/* Mobile Colors */}
          <div className="mb-4">
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
        
        {/* Desktop Layout */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-6">
          {/* Left Panel - Tools */}
          <div className="lg:col-span-1 space-y-4">
            <div className="retro-panel">
              <h3 className="text-xl font-pixel mb-4 neon-glow">TRAIT STUDIO</h3>
              <div className="text-sm font-pixel text-retro-gray">
                <p>• Blockchain integration</p>
                <p>• NFT minting</p>
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
          
          {/* Right Panel - Blockchain */}
          <div className="lg:col-span-1 space-y-4">
            <WalletConnector />
            <SaveAndMint />
          </div>
        </div>
      </main>
    </div>
  )
} // Vercel deployment test - Thu Jul 31 13:45:19 CEST 2025
