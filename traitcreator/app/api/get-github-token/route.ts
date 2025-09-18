import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get token from environment variable
    const token = process.env.SVG_SAVE_TOKEN

    if (!token) {
      return NextResponse.json(
        { 
          error: 'GitHub token not configured',
          message: 'SVG_SAVE_TOKEN environment variable is not set'
        },
        { status: 500 }
      )
    }

    // Return token (this will be used by the client-side handler)
    return NextResponse.json({
      success: true,
      token: token,
      message: 'GitHub token loaded from environment'
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })

  } catch (error) {
    console.error('Error getting GitHub token:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get GitHub token',
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