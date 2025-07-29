'use client'

import React, { useState } from 'react'
import { useAppStore } from '@/lib/store-blockchain'
import { Save, Coins, CheckCircle, AlertCircle, Loader, ExternalLink } from 'lucide-react'

export function SaveAndMint() {
  const {
    wallet: { isConnected, balance, allowance },
    contract: { savePrice, isConfigured, isLoading },
    design: { pixels },
    saveAndMintWithApproval,
    saveDesign,
  } = useAppStore()

  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string; svgUrl?: string } | null>(null)

  const hasDesign = pixels.length > 0
  const hasEnoughBalance = parseFloat(balance) >= parseFloat(savePrice)
  const hasEnoughAllowance = parseFloat(allowance) >= parseFloat(savePrice)
  const needsApproval = !hasEnoughAllowance && hasEnoughBalance

  const handleSaveAndMint = async () => {
    try {
      setIsSaving(true)
      setMessage(null)
      
      // Show initial message
      setMessage({ type: 'info', text: 'Starting transaction...' })
      
      const result = await saveAndMintWithApproval()
      
      if (result) {
        const { tokenId, mintSuccess } = result
        const svgUrl = `/designs/${tokenId}.svg`
        
        if (mintSuccess) {
          setMessage({ 
            type: 'success', 
            text: `Success! Token ID: ${tokenId} - NFT minted successfully.`,
            svgUrl
          })
        } else {
          setMessage({ 
            type: 'info', 
            text: `Save successful. Token ID: ${tokenId} - Mint will be retried automatically.`,
            svgUrl
          })
        }
      } else {
        setMessage({ type: 'error', text: 'Error: Could not process transaction.' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="retro-panel">
      <h3 className="text-lg sm:text-xl font-pixel mb-4 neon-glow">SAVE & MINT</h3>
      
      {/* Status Indicators */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center space-x-2">
          {hasDesign ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-yellow-400" />
          )}
          <span className="text-xs font-pixel text-retro-gray">
            {hasDesign ? 'Design ready' : 'No design'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400" />
          )}
          <span className="text-xs font-pixel text-retro-gray">
            {isConnected ? 'Wallet connected' : 'Wallet disconnected'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {hasEnoughBalance ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400" />
          )}
          <span className="text-xs font-pixel text-retro-gray">
            Balance: {parseFloat(balance).toFixed(2)} $ADRIAN
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {isConfigured ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400" />
          )}
          <span className="text-xs font-pixel text-retro-gray">
            {isConfigured ? 'Contract configured' : 'Contract not configured'}
          </span>
        </div>
      </div>

      {/* Action Button */}
      <div className="space-y-3">
        {/* Save & Mint Button */}
        {isConnected && isConfigured ? (
          <button
            className="retro-button w-full py-3 text-sm bg-green-900/20 border-green-500 text-green-400 hover:bg-green-900/40"
            onClick={handleSaveAndMint}
            disabled={!hasDesign || !hasEnoughBalance || isSaving}
          >
            {isSaving ? (
              <>
                <Loader className="w-4 h-4 inline mr-2 animate-spin" />
                {needsApproval ? 'APPROVING & MINTING...' : 'SAVING & MINTING...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 inline mr-2" />
                SAVE & MINT ({parseFloat(savePrice).toFixed(2)} $ADRIAN)
              </>
            )}
          </button>
        ) : (
          <button
            className="retro-button w-full py-3 text-sm bg-gray-900/20 border-gray-500 text-gray-400 cursor-not-allowed"
            disabled
          >
            <AlertCircle className="w-4 h-4 inline mr-2" />
            CONNECT WALLET TO MINT
          </button>
        )}
      </div>

      {/* Message Display */}
      {message && (
        <div className={`mt-4 p-3 border text-xs font-pixel ${
          message.type === 'success' 
            ? 'bg-green-900/20 border-green-500 text-green-400'
            : message.type === 'error'
            ? 'bg-red-900/20 border-red-500 text-red-400'
            : 'bg-blue-900/20 border-blue-500 text-blue-400'
        }`}>
          <div>{message.text}</div>
          
          {/* SVG URL Link */}
          {message.svgUrl && (
            <div className="mt-2 pt-2 border-t border-current">
              <a
                href={message.svgUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-retro-accent hover:text-retro-primary transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                <span>View SVG File</span>
              </a>
              <div className="text-xs text-retro-gray mt-1">
                URL: {window.location.origin}{message.svgUrl}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="mt-4 text-xs font-pixel text-retro-gray">
        <p>• SAVE & MINT: Approve and mint automatically</p>
        <p>• Cascade transaction: Approve → Save → Mint</p>
        <p>• SVG saved with token ID as filename</p>
        <p>• Accessible from external servers</p>
      </div>
    </div>
  )
} 