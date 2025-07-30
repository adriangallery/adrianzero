import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const { tokenId, svgContent } = await request.json()

    if (!tokenId || !svgContent) {
          return NextResponse.json(
      { error: 'Missing tokenId or svgContent' },
      { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    )
    }

    // Create designs directory if it doesn't exist
    const designsDir = join(process.cwd(), 'public', 'designs')
    try {
      await mkdir(designsDir, { recursive: true })
    } catch (error) {
      console.error('Error creating designs directory:', error)
    }

    // Save SVG file with token ID as filename
    const filename = `${tokenId}.svg`
    const filePath = join(designsDir, filename)
    
    await writeFile(filePath, svgContent, 'utf-8')

    // Return the public URL for the saved file
    const publicUrl = `/designs/${filename}`

    console.log(`SVG saved successfully: ${filePath}`)
    console.log(`Public URL: ${publicUrl}`)

    return NextResponse.json({
      success: true,
      tokenId,
      filename,
      publicUrl,
      message: `SVG saved for token ${tokenId}`
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })

  } catch (error) {
    console.error('Error saving SVG:', error)
    return NextResponse.json(
      { 
        error: 'Failed to save SVG',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    )
  }
} 