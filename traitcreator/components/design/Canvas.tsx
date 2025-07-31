'use client'

import React, { useRef, useEffect, useState } from 'react'
import { useAppStore, CANVAS_CONFIG, type Pixel } from '../../lib/store-blockchain'
import { safeBtoa } from '../../lib/utils'

export function Canvas() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [tshirtSvg, setTshirtSvg] = useState('')
  const [tshirtMask, setTshirtMask] = useState<boolean[][]>([])

  // Load T-shirt SVG and create mask on component mount
  useEffect(() => {
    fetch('/T-Shirt-148x148.svg')
      .then(response => response.text())
      .then(svg => {
        setTshirtSvg(svg)
        createTshirtMask(svg)
      })
      .catch(error => console.error('Error loading T-shirt SVG:', error))
  }, [])

  // Create a mask from the T-shirt SVG to determine paintable areas
  const createTshirtMask = (svgContent: string) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgContent, 'image/svg+xml')
    const rects = doc.querySelectorAll('rect')
    
    // Initialize mask array
    const mask: boolean[][] = Array(148).fill(null).map(() => Array(148).fill(false))
    
    rects.forEach(rect => {
      const x = Math.floor(parseFloat(rect.getAttribute('x') || '0'))
      const y = Math.floor(parseFloat(rect.getAttribute('y') || '0'))
      const width = Math.ceil(parseFloat(rect.getAttribute('width') || '0'))
      const height = Math.ceil(parseFloat(rect.getAttribute('height') || '0'))
      const fill = rect.getAttribute('fill') || ''
      
      // Check if the pixel has any color (not transparent)
      if (fill && fill !== 'transparent' && fill !== 'rgba(0,0,0,0)') {
        // Mark all pixels in this rect as paintable
        for (let px = x; px < x + width && px < 148; px++) {
          for (let py = y; py < y + height && py < 148; py++) {
            if (px >= 0 && py >= 0) {
              mask[py][px] = true
            }
          }
        }
      }
    })
    
    setTshirtMask(mask)
  }
  
  const {
    design: { pixels, currentColor, brushSize, tool, zoom, showGrid },
    addPixel,
    removePixel,
  } = useAppStore()

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDrawing(true)
    handlePixelClick(e)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDrawing) {
      handlePixelClick(e)
    }
  }

  const handleMouseUp = () => {
    setIsDrawing(false)
  }

  // Touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    setIsDrawing(true)
    handleTouchPixelClick(e)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()
    if (isDrawing) {
      handleTouchPixelClick(e)
    }
  }

  const handleTouchEnd = () => {
    setIsDrawing(false)
  }

  const handleTouchPixelClick = (e: React.TouchEvent) => {
    if (!canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const touch = e.touches[0]
    const x = Math.floor((touch.clientX - rect.left) / (CANVAS_CONFIG.pixelSize * zoom))
    const y = Math.floor((touch.clientY - rect.top) / (CANVAS_CONFIG.pixelSize * zoom))

    // Check if coordinates are within canvas bounds
    if (x >= 0 && x < CANVAS_CONFIG.width && y >= 0 && y < CANVAS_CONFIG.height) {
      // Check if the pixel is in a paintable area (using T-shirt mask)
      const isPaintable = tshirtMask.length > 0 && tshirtMask[y] && tshirtMask[y][x]
      
      if (isPaintable) {
        if (tool === 'eraser') {
          removePixel(x, y)
        } else {
          // Add pixels for brush size
          for (let dx = 0; dx < brushSize; dx++) {
            for (let dy = 0; dy < brushSize; dy++) {
              const px = x + dx
              const py = y + dy
              if (px < CANVAS_CONFIG.width && py < CANVAS_CONFIG.height) {
                // Check if each brush pixel is also paintable
                const isBrushPixelPaintable = tshirtMask[py] && tshirtMask[py][px]
                if (isBrushPixelPaintable) {
                  addPixel({ x: px, y: py, color: currentColor })
                }
              }
            }
          }
        }
      }
    }
  }

  const handlePixelClick = (e: React.MouseEvent) => {
    if (!canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = Math.floor((e.clientX - rect.left) / (CANVAS_CONFIG.pixelSize * zoom))
    const y = Math.floor((e.clientY - rect.top) / (CANVAS_CONFIG.pixelSize * zoom))

    // Check if coordinates are within canvas bounds
    if (x >= 0 && x < CANVAS_CONFIG.width && y >= 0 && y < CANVAS_CONFIG.height) {
      // Check if the pixel is in a paintable area (using T-shirt mask)
      const isPaintable = tshirtMask.length > 0 && tshirtMask[y] && tshirtMask[y][x]
      
      if (isPaintable) {
        if (tool === 'eraser') {
          removePixel(x, y)
        } else {
          // Add pixels for brush size
          for (let dx = 0; dx < brushSize; dx++) {
            for (let dy = 0; dy < brushSize; dy++) {
              const px = x + dx
              const py = y + dy
              if (px < CANVAS_CONFIG.width && py < CANVAS_CONFIG.height) {
                // Check if each brush pixel is also paintable
                const isBrushPixelPaintable = tshirtMask[py] && tshirtMask[py][px]
                if (isBrushPixelPaintable) {
                  addPixel({ x: px, y: py, color: currentColor })
                }
              }
            }
          }
        }
      }
    }
  }

  const getPixelColor = (x: number, y: number) => {
    const pixel = pixels.find((p: Pixel) => p.x === x && p.y === y)
    return pixel ? pixel.color : 'transparent'
  }

  // Debug function to visualize the mask (optional)
  const isPixelPaintable = (x: number, y: number) => {
    return tshirtMask.length > 0 && tshirtMask[y] && tshirtMask[y][x]
  }

  return (
    <div className="retro-panel">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-pixel neon-glow">T-SHIRT CANVAS</h2>
        <div className="text-sm font-pixel text-retro-gray">
          {CANVAS_CONFIG.width}x{CANVAS_CONFIG.height} • Zoom: {zoom}x
        </div>
      </div>
      
      <div className="flex justify-center">
        <div
          ref={canvasRef}
          className="relative border-2 border-retro-primary bg-white cursor-crosshair touch-none select-none"
          style={{
            width: CANVAS_CONFIG.width * CANVAS_CONFIG.pixelSize * zoom,
            height: CANVAS_CONFIG.height * CANVAS_CONFIG.pixelSize * zoom,
            maxWidth: '100vw',
            maxHeight: '60vh',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* T-shirt background */}
          {tshirtSvg && (
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{ 
                backgroundImage: `url('data:image/svg+xml;base64,${safeBtoa(tshirtSvg)}')`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                opacity: 0.4
              }}
            />
          )}
          
          {/* Grid overlay */}
          {showGrid && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(0, 255, 0, 0.1) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(0, 255, 0, 0.1) 1px, transparent 1px)
                `,
                backgroundSize: `${CANVAS_CONFIG.pixelSize * zoom}px ${CANVAS_CONFIG.pixelSize * zoom}px`,
              }}
            />
          )}
          
          {/* Pixels with mix-blend-mode */}
          <div 
            className="absolute inset-0"
            style={{ mixBlendMode: 'multiply' }}
          >
            {Array.from({ length: CANVAS_CONFIG.height }, (_, y) =>
              Array.from({ length: CANVAS_CONFIG.width }, (_, x) => {
                const color = getPixelColor(x, y)
                if (color === 'transparent') return null
                
                return (
                  <div
                    key={`${x}-${y}`}
                    className="absolute pixel-perfect"
                    style={{
                      left: x * CANVAS_CONFIG.pixelSize * zoom,
                      top: y * CANVAS_CONFIG.pixelSize * zoom,
                      width: CANVAS_CONFIG.pixelSize * zoom,
                      height: CANVAS_CONFIG.pixelSize * zoom,
                      backgroundColor: color,
                      border: showGrid ? '1px solid rgba(0, 255, 0, 0.2)' : 'none',
                    }}
                  />
                )
              })
            )}
          </div>
        </div>
      </div>
      
                   <div className="mt-4 text-center text-sm font-pixel text-retro-gray">
               Draw directly on the T-shirt • {pixels.length} pixels placed
               {tshirtMask.length > 0 && (
                 <span className="ml-2 text-retro-primary">• Mask loaded</span>
               )}
             </div>
    </div>
  )
} 