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
            <h1 className="text-3xl font-retro text-retro-primary neon-glow">
              TRAIT CREATOR
            </h1>
            <div className="text-sm font-pixel text-retro-gray">
              v2.0.0
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