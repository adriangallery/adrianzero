'use client'

import React from 'react'
import { useAppStore } from '@/lib/store-blockchain'

export function Header() {
  const { wallet: { isConnected, address }, contract: { isConfigured } } = useAppStore()

  return (
    <header className="border-b-2 border-retro-primary bg-black py-4">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <img 
                src="/traitstudio.png" 
                alt="TraitStudio Logo" 
                className="h-12 w-auto anaglyph-glow"
                style={{ 
                  filter: 'drop-shadow(0 0 5px #0080ff) drop-shadow(0 0 10px #0080ff) drop-shadow(1px 1px 0px #ff0080)' 
                }}
              />
              <div className="text-sm font-pixel text-retro-gray">
                v2.0.0
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm font-pixel text-retro-primary">
              <span className="animate-blink">●</span> ONLINE
            </div>
            <div className="text-sm font-pixel text-retro-gray">
              {isConnected ? 'WALLET CONNECTED' : 'CONNECT WALLET'}
            </div>
            {isConnected && (
              <div className="text-sm font-pixel text-retro-accent">
                {isConfigured ? 'CONTRACT READY' : 'CONTRACT LOADING'}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
} 