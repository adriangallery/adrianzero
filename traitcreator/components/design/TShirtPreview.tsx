'use client'

import React, { useEffect, useState } from 'react'
import { useAppStore, CANVAS_CONFIG } from '@/lib/store-blockchain'

export function TShirtPreview() {
  const { design: { pixels } } = useAppStore()
  const [svgContent, setSvgContent] = useState('')
  const [tshirtSvg, setTshirtSvg] = useState('')

  useEffect(() => {
    // Load the base T-shirt SVG
    fetch('/T-Shirt-148x148.svg')
      .then(response => response.text())
      .then(svg => setTshirtSvg(svg))
      .catch(error => console.error('Error loading T-shirt SVG:', error))
  }, [])

  useEffect(() => {
    if (!tshirtSvg) return

    // Create SVG content for the design
    const designSvg = `
      <svg width="${CANVAS_CONFIG.width}" height="${CANVAS_CONFIG.height}" xmlns="http://www.w3.org/2000/svg">
        ${pixels.map(pixel => 
          `<rect x="${pixel.x}" y="${pixel.y}" width="1" height="1" fill="${pixel.color}" />`
        ).join('')}
      </svg>
    `

    // Insert the design into the T-shirt SVG
    const parser = new DOMParser()
    const tshirtDoc = parser.parseFromString(tshirtSvg, 'image/svg+xml')
    const designDoc = parser.parseFromString(designSvg, 'image/svg+xml')

    // Find the design area in the T-shirt (you may need to adjust this based on your SVG structure)
    const designArea = tshirtDoc.querySelector('#design-area') || tshirtDoc.querySelector('g')
    
    if (designArea) {
      // Clear existing design
      const existingDesign = designArea.querySelector('#user-design')
      if (existingDesign) {
        existingDesign.remove()
      }

      // Add new design
      const designGroup = designDoc.documentElement
      designGroup.id = 'user-design'
      designGroup.setAttribute('transform', 'scale(0.5) translate(32, 32)') // Adjust position and scale as needed
      
      designArea.appendChild(designGroup)
    }

    // Convert back to string
    const serializer = new XMLSerializer()
    setSvgContent(serializer.serializeToString(tshirtDoc))
  }, [pixels, tshirtSvg])

  const downloadSvg = () => {
    if (!svgContent) return

    const blob = new Blob([svgContent], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trait-design-${Date.now()}.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="retro-panel">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-pixel neon-glow">T-SHIRT PREVIEW</h3>
        <button
          className="retro-button text-sm"
          onClick={downloadSvg}
          disabled={!svgContent}
        >
          DOWNLOAD SVG
        </button>
      </div>
      
      <div className="flex justify-center">
        <div className="border-2 border-retro-primary bg-white p-4">
          {svgContent ? (
            <div
              className="w-64 h-64"
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          ) : (
            <div className="w-64 h-64 flex items-center justify-center text-retro-gray">
              Loading T-shirt...
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-4 text-center text-sm font-pixel text-retro-gray">
        Real-time preview of your design on the T-shirt
      </div>
    </div>
  )
} 