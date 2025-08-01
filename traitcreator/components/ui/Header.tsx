'use client'

import React from 'react'
import { useAppStore } from '@/lib/store-blockchain'

export function Header() {
  const { wallet: { isConnected, address }, contract: { isConfigured } } = useAppStore()

  return (
    <header className="bg-gray-900 py-6 anaglyph-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-4">
              <img 
                src="/traitstudio.png" 
                alt="TraitStudio Logo" 
                className="h-16 w-auto anaglyph-glow"
                style={{ 
                  filter: 'drop-shadow(0 0 8px #0080ff) drop-shadow(0 0 15px #0080ff) drop-shadow(3px 3px 0px #ff0080) drop-shadow(6px 6px 0px #ff0080)' 
                }}
              />
              <div className="text-xl font-pixel text-white">
                v2.0.0
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-lg font-pixel text-white">
              <span className="animate-blink text-retro-primary">●</span> ONLINE
            </div>
            <div className="text-lg font-pixel text-white">
              {isConnected ? 'WALLET CONNECTED' : 'CONNECT WALLET'}
            </div>
            {isConnected && (
              <div className="text-lg font-pixel text-retro-accent">
                {isConfigured ? 'CONTRACT READY' : 'CONTRACT LOADING'}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
} 