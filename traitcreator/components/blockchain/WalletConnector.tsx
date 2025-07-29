'use client'

import React from 'react'
import { useAppStore } from '@/lib/store-blockchain'
import { shortenAddress } from '@/lib/blockchain-config'
import { Wallet, LogOut, RefreshCw } from 'lucide-react'

export function WalletConnector() {
  const {
    wallet: { address, isConnected, isConnecting, error },
    connectWallet,
    disconnectWallet,
  } = useAppStore()

  const handleConnect = async () => {
    await connectWallet()
  }

  const handleDisconnect = () => {
    disconnectWallet()
  }

  return (
    <div className="retro-panel">
      <h3 className="text-lg sm:text-xl font-pixel mb-4 neon-glow">WALLET</h3>
      
      {!isConnected ? (
        <div className="space-y-4">
          <button
            className="retro-button w-full py-3 text-sm"
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
                CONNECTING...
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4 inline mr-2" />
                CONNECT WALLET
              </>
            )}
          </button>
          
          {error && (
            <div className="text-red-400 text-xs font-pixel bg-red-900/20 p-2 border border-red-500">
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Connected Address */}
          <div className="bg-retro-dark/20 p-3 border border-retro-primary">
            <div className="flex items-center justify-between">
              <span className="text-xs font-pixel text-retro-gray">ADDRESS:</span>
              <span className="text-xs font-pixel text-retro-primary">
                {shortenAddress(address!)}
              </span>
            </div>
          </div>
          
          {/* Disconnect Button */}
          <button
            className="retro-button w-full py-2 text-sm bg-red-900/20 border-red-500 text-red-400 hover:bg-red-900/40"
            onClick={handleDisconnect}
          >
            <LogOut className="w-4 h-4 inline mr-2" />
            DISCONNECT
          </button>
        </div>
      )}
    </div>
  )
} 