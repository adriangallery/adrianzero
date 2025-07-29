import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import sharp from 'sharp'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { svgData, designHash, walletAddress, transactionHash } = body

    // Validate required fields
    if (!svgData || !designHash || !walletAddress || !transactionHash) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate SVG data
    if (!svgData.startsWith('<svg') || !svgData.includes('</svg>')) {
      return NextResponse.json(
        { error: 'Invalid SVG data' },
        { status: 400 }
      )
    }

    // Create designs directory if it doesn't exist
    const designsDir = join(process.cwd(), 'public', 'designs')
    await mkdir(designsDir, { recursive: true })

    // Get next file number
    const fs = await import('fs/promises')
    const files = await fs.readdir(designsDir)
    const svgFiles = files.filter(file => file.endsWith('.svg'))
    const nextNumber = svgFiles.length + 1
    const fileName = `${nextNumber.toString().padStart(3, '0')}.svg`

    // Save SVG file
    const filePath = join(designsDir, fileName)
    await writeFile(filePath, svgData, 'utf-8')

    // Generate PNG preview
    const pngFileName = fileName.replace('.svg', '.png')
    const pngPath = join(designsDir, pngFileName)
    
    try {
      await sharp(Buffer.from(svgData))
        .resize(256, 256, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png()
        .toFile(pngPath)
    } catch (error) {
      console.warn('Failed to generate PNG preview:', error)
    }

    // Save metadata
    const metadata = {
      id: nextNumber,
      fileName,
      designHash,
      walletAddress,
      transactionHash,
      createdAt: new Date().toISOString(),
      svgSize: Buffer.byteLength(svgData, 'utf-8'),
    }

    const metadataPath = join(designsDir, `${nextNumber.toString().padStart(3, '0')}.json`)
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8')

    return NextResponse.json({
      success: true,
      designId: nextNumber,
      fileName,
      filePath: `/designs/${fileName}`,
      metadata,
    })

  } catch (error) {
    console.error('Error saving design:', error)
    return NextResponse.json(
      { error: 'Failed to save design' },
      { status: 500 }
    )
  }
} 