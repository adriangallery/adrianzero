'use client'

import { useState } from 'react'

export default function TestSVGSave() {
  const [logs, setLogs] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [tokenId, setTokenId] = useState('test-123')
  const [githubToken, setGithubToken] = useState('')

  const addLog = (message: string, type: 'info' | 'error' | 'success' | 'warning' = 'info') => {
    const timestamp = new Date().toISOString()
    const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}`
    setLogs(prev => [...prev, logEntry])
    console.log(logEntry)
  }

  const clearLogs = () => {
    setLogs([])
  }

  const generateTestSVG = () => {
    addLog('Generating test SVG content...', 'info')
    
    // Create a simple test SVG with some pixels
    const svgContent = `
      <svg width="148" height="148" xmlns="http://www.w3.org/2000/svg" style="image-rendering: pixelated; shape-rendering: crispEdges;">
        <defs>
          <pattern id="tshirt-pattern" patternUnits="userSpaceOnUse" width="148" height="148">
            <image href="data:image/svg+xml;base64,${btoa('<svg width="148" height="148" xmlns="http://www.w3.org/2000/svg"><rect width="148" height="148" fill="white"/></svg>')}" width="148" height="148"/>
          </pattern>
        </defs>
        <rect width="148" height="148" fill="url(#tshirt-pattern)"/>
        <rect x="50" y="50" width="10" height="10" fill="#ff0000"/>
        <rect x="60" y="50" width="10" height="10" fill="#00ff00"/>
        <rect x="70" y="50" width="10" height="10" fill="#0000ff"/>
        <rect x="50" y="60" width="10" height="10" fill="#ffff00"/>
        <rect x="60" y="60" width="10" height="10" fill="#ff00ff"/>
        <rect x="70" y="60" width="10" height="10" fill="#00ffff"/>
      </svg>
    `
    
    addLog('Test SVG generated successfully', 'success')
    return svgContent
  }

  const testTokenFromAPI = async () => {
    addLog('=== TESTING TOKEN FROM API ===', 'info')
    setIsLoading(true)
    
    try {
      addLog('Attempting to get token from current origin API...', 'info')
      const currentOrigin = window.location.origin
      addLog(`Current origin: ${currentOrigin}`, 'info')
      
      const apiUrl = `${currentOrigin}/api/get-github-token`
      addLog(`API URL: ${apiUrl}`, 'info')
      
      // Follow redirects automatically
      const response = await fetch(apiUrl, {
        redirect: 'follow'
      })
      addLog(`Response status: ${response.status}`, 'info')
      addLog(`Response ok: ${response.ok}`, 'info')
      
      if (response.ok) {
        const contentType = response.headers.get('content-type')
        addLog(`Response content-type: ${contentType}`, 'info')
        
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          addLog(`Response data: ${JSON.stringify(data, null, 2)}`, 'info')
          
          if (data.token) {
            addLog('✅ Token obtained successfully from API', 'success')
            setGithubToken(data.token)
            return data.token
          } else {
            addLog('❌ No token in response data', 'error')
            return null
          }
        } else {
          const text = await response.text()
          addLog(`❌ Response is not JSON: ${text.substring(0, 200)}...`, 'error')
          return null
        }
      } else {
        addLog(`❌ API request failed: ${response.status} ${response.statusText}`, 'error')
        return null
      }
    } catch (error) {
      addLog(`❌ Error getting token from API: ${error}`, 'error')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const testTokenFromLocalStorage = () => {
    addLog('=== TESTING TOKEN FROM LOCALSTORAGE ===', 'info')
    
    try {
      const savedToken = localStorage.getItem('github_token')
      addLog(`localStorage key: github_token`, 'info')
      
      if (savedToken) {
        addLog('✅ Token found in localStorage', 'success')
        addLog(`Token length: ${savedToken.length}`, 'info')
        setGithubToken(savedToken)
        return savedToken
      } else {
        addLog('❌ No token found in localStorage', 'error')
        return null
      }
    } catch (error) {
      addLog(`❌ Error accessing localStorage: ${error}`, 'error')
      return null
    }
  }

  const testGitHubAPI = async (token: string) => {
    addLog('=== TESTING GITHUB API ===', 'info')
    
    try {
      addLog('Testing GitHub API authentication...', 'info')
      
      const testUrl = 'https://api.github.com/user'
      addLog(`Test URL: ${testUrl}`, 'info')
      
      const response = await fetch(testUrl, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      })
      
      addLog(`GitHub API response status: ${response.status}`, 'info')
      
      if (response.ok) {
        const userData = await response.json()
        addLog(`✅ GitHub API authentication successful`, 'success')
        addLog(`User: ${userData.login}`, 'info')
        return true
      } else {
        const errorData = await response.json()
        addLog(`❌ GitHub API authentication failed: ${errorData.message}`, 'error')
        return false
      }
    } catch (error) {
      addLog(`❌ Error testing GitHub API: ${error}`, 'error')
      return false
    }
  }

  const testSVGSave = async () => {
    addLog('=== TESTING SVG SAVE ===', 'info')
    setIsLoading(true)
    
    try {
      // Generate test SVG
      const svgContent = generateTestSVG()
      addLog(`SVG content length: ${svgContent.length}`, 'info')
      
      // Get token
      let token = githubToken
      if (!token) {
        addLog('No token in state, trying to get from API...', 'info')
        token = await testTokenFromAPI()
      }
      
      if (!token) {
        addLog('No token from API, trying localStorage...', 'info')
        const localStorageToken = testTokenFromLocalStorage()
        if (localStorageToken) {
          token = localStorageToken
        }
      }
      
      if (!token) {
        throw new Error('No GitHub token available')
      }
      
      // Test GitHub API
      const apiValid = await testGitHubAPI(token)
      if (!apiValid) {
        throw new Error('GitHub API authentication failed')
      }
      
      // Save SVG
      addLog('Saving SVG to GitHub...', 'info')
      const githubApiUrl = `https://api.github.com/repos/adriangallery/adrianzero/contents/designs/${tokenId}.svg`
      addLog(`GitHub API URL: ${githubApiUrl}`, 'info')
      
      // Check if file exists
      let currentSha = null
      try {
        addLog('Checking if file exists...', 'info')
        const getResponse = await fetch(githubApiUrl, {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        })
        
        addLog(`Get file response status: ${getResponse.status}`, 'info')
        
        if (getResponse.ok) {
          const fileData = await getResponse.json()
          currentSha = fileData.sha
          addLog(`File exists, SHA: ${currentSha}`, 'info')
        } else {
          addLog('File does not exist, will create new', 'info')
        }
      } catch (error) {
        addLog(`Error checking file: ${error}`, 'warning')
      }
      
      // Prepare commit data
      const commitData: any = {
        message: `Test SVG save for token ${tokenId}`,
        content: btoa(svgContent),
        branch: 'main',
      }
      
      if (currentSha) {
        commitData.sha = currentSha
        addLog('Will update existing file', 'info')
      } else {
        addLog('Will create new file', 'info')
      }
      
      addLog(`Commit data: ${JSON.stringify(commitData, null, 2)}`, 'info')
      
      // Commit the file
      const commitResponse = await fetch(githubApiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commitData),
      })
      
      addLog(`Commit response status: ${commitResponse.status}`, 'info')
      
      if (!commitResponse.ok) {
        const errorData = await commitResponse.json()
        addLog(`❌ GitHub API error: ${JSON.stringify(errorData, null, 2)}`, 'error')
        throw new Error(`GitHub API error: ${errorData.message}`)
      }
      
      const result = await commitResponse.json()
      addLog('✅ SVG saved successfully!', 'success')
      addLog(`Result: ${JSON.stringify(result, null, 2)}`, 'info')
      
      // Show URLs
      const svgUrl = `https://adrianzero.com/designs/${tokenId}.svg`
      const rawUrl = `https://raw.githubusercontent.com/adriangallery/adrianzero/main/designs/${tokenId}.svg`
      
      addLog(`SVG URL: ${svgUrl}`, 'success')
      addLog(`Raw URL: ${rawUrl}`, 'success')
      
    } catch (error) {
      addLog(`❌ Error in SVG save test: ${error}`, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const runFullTest = async () => {
    addLog('🚀 STARTING FULL SVG SAVE TEST', 'info')
    addLog('='.repeat(50), 'info')
    
    await testSVGSave()
    
    addLog('='.repeat(50), 'info')
    addLog('🏁 FULL TEST COMPLETED', 'info')
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🧪 SVG Save Test Page</h1>
        
        {/* Controls */}
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Controls</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Token ID:</label>
              <input
                type="text"
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                placeholder="test-123"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">GitHub Token (optional):</label>
              <input
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                placeholder="ghp_..."
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={testTokenFromAPI}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded"
            >
              🔍 Test API Token
            </button>
            
            <button
              onClick={testTokenFromLocalStorage}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded"
            >
              💾 Test localStorage Token
            </button>
            
            <button
              onClick={testSVGSave}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded"
            >
              💾 Test SVG Save
            </button>
            
            <button
              onClick={runFullTest}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded"
            >
              🚀 Run Full Test
            </button>
            
            <button
              onClick={clearLogs}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
            >
              🗑️ Clear Logs
            </button>
          </div>
        </div>
        
        {/* Logs */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Logs ({logs.length})</h2>
            {isLoading && <div className="text-yellow-400">⏳ Loading...</div>}
          </div>
          
          <div className="bg-black p-4 rounded font-mono text-sm h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet. Run a test to see results.</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log.includes('[ERROR]') ? (
                    <span className="text-red-400">{log}</span>
                  ) : log.includes('[SUCCESS]') ? (
                    <span className="text-green-400">{log}</span>
                  ) : log.includes('[WARNING]') ? (
                    <span className="text-yellow-400">{log}</span>
                  ) : (
                    <span className="text-gray-300">{log}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 