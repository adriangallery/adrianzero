'use client'

import React, { useState } from 'react'
import { useAppStore } from '@/lib/store-blockchain'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { wallet: { isConnected, address }, contract: { isConfigured } } = useAppStore()

  const externalLinks = [
    { name: 'Home', url: 'https://adrianzero.com' },
    { name: 'Buy $ADRIAN', url: 'https://adrianpunks.com/swap' },
    { name: 'Mint with $ADRIAN', url: 'https://adrianzero.com/mintwithadrian.html' },
    { name: 'TraitLAB', url: 'https://adrianzero.com/traitlab' },
    { name: 'Adventure', url: 'https://adrianzero.com/' },
    { name: 'TraitSHOP', url: 'https://adrianzero.com/shop' },
    { name: 'PatientZERO', url: 'https://adrianzero.com/patientzero' },
    { name: 'AdrianGALLERY', url: 'https://adriangallery.com' },
    { name: 'AdrianPUNKS', url: 'https://adrianpunks.com' },
    { name: 'DISCORD', url: 'https://discord.gg/ZtyBkXGtwd' },
    { name: 'X', url: 'https://x.com/adriancerda' }
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-800/95 backdrop-blur-md border-b-2 border-retro-primary">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Logo en su posición original */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-4">
              <img 
                src="/traitstudio.png" 
                alt="TraitStudio Logo" 
                className="h-16 w-auto"
              />
              <div className="text-xl font-pixel text-white">
                v2.0.0
              </div>
            </div>
          </div>

          {/* Menú hamburguesa en el centro */}
          <div className="flex items-center">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 border border-retro-primary bg-transparent hover:bg-retro-primary/20 transition-colors"
              aria-label="Toggle menu"
            >
              <div className="w-6 h-0.5 bg-retro-primary mb-1 transition-all"></div>
              <div className="w-6 h-0.5 bg-retro-primary mb-1 transition-all"></div>
              <div className="w-6 h-0.5 bg-retro-primary transition-all"></div>
            </button>
            <span className="text-retro-primary font-pixel text-xl ml-2">$ADRIAN</span>
          </div>
          
          {/* Wallet info en su posición original */}
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
        
        {/* Menú desplegable */}
        {isMenuOpen && (
          <div className="border-t border-gray-700 bg-gray-800/95 backdrop-blur-md">
            <div className="py-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {externalLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 font-pixel text-sm hover:text-retro-primary hover:shadow-lg hover:shadow-retro-primary/50 transition-all duration-200 p-2 rounded border border-transparent hover:border-retro-primary/30"
                  >
                    {link.name}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
} 