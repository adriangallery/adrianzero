import { create } from 'zustand'
import { ethers } from 'ethers'
import { BLOCKCHAIN_CONFIG, formatTokenAmount, parseTokenAmount, shortenAddress } from './blockchain-config'
import { safeBtoa } from './utils'

export interface Pixel {
  x: number
  y: number
  color: string
}

export interface DesignState {
  pixels: Pixel[]
  currentColor: string
  brushSize: number
  tool: 'brush' | 'eraser' | 'fill'
  zoom: number
  showGrid: boolean
  history: Pixel[][]
  historyIndex: number
  isDrawing: boolean
}

export interface WalletState {
  address: string | null
  isConnected: boolean
  isConnecting: boolean
  balance: string
  allowance: string
  error: string | null
}

export interface ContractState {
  savePrice: string
  nextTokenId: string
  mintingEnabled: boolean
  isConfigured: boolean
  isLoading: boolean
  error: string | null
}

export interface AppState {
  design: DesignState
  wallet: WalletState
  contract: ContractState
  
  // Design actions
  setCurrentColor: (color: string) => void
  setBrushSize: (size: number) => void
  setTool: (tool: 'brush' | 'eraser' | 'fill') => void
  setZoom: (zoom: number) => void
  toggleGrid: () => void
  addPixel: (pixel: Pixel) => void
  removePixel: (x: number, y: number) => void
  clearCanvas: () => void
  undo: () => void
  redo: () => void
  
  // Wallet actions
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  checkAllowance: () => Promise<void>
  
  // Contract actions
  loadContractData: () => Promise<void>
  saveAndMintWithApproval: () => Promise<{ tokenId: string; mintSuccess: boolean } | null>
  saveDesign: () => Promise<string>
  generateSVGContent: () => string
  saveSVGToServer: (tokenId: string, svgContent: string) => Promise<any>
}

const CANVAS_WIDTH = 148
const CANVAS_HEIGHT = 148
const MAX_HISTORY = 20

export const useAppStore = create<AppState>((set, get) => ({
  design: {
    pixels: [],
    currentColor: '#00ff00',
    brushSize: 1,
    tool: 'brush',
    zoom: 1,
    showGrid: true,
    history: [],
    historyIndex: -1,
    isDrawing: false,
  },

  wallet: {
    address: null,
    isConnected: false,
    isConnecting: false,
    balance: '0',
    allowance: '0',
    error: null,
  },

  contract: {
    savePrice: '0',
    nextTokenId: '0',
    mintingEnabled: false,
    isConfigured: false,
    isLoading: false,
    error: null,
  },

  // Design actions
  setCurrentColor: (color) =>
    set((state) => ({
      design: { ...state.design, currentColor: color }
    })),

  setBrushSize: (size) =>
    set((state) => ({
      design: { ...state.design, brushSize: size }
    })),

  setTool: (tool) =>
    set((state) => ({
      design: { ...state.design, tool }
    })),

  setZoom: (zoom) =>
    set((state) => ({
      design: { ...state.design, zoom }
    })),

  toggleGrid: () =>
    set((state) => ({
      design: { ...state.design, showGrid: !state.design.showGrid }
    })),

  addPixel: (pixel) => {
    const state = get()
    const newPixels = [...state.design.pixels]
    
    const existingIndex = newPixels.findIndex(p => p.x === pixel.x && p.y === pixel.y)
    if (existingIndex !== -1) {
      newPixels.splice(existingIndex, 1)
    }
    
    newPixels.push(pixel)
    
    const newHistory = [...state.design.history.slice(0, state.design.historyIndex + 1), newPixels]
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift()
    }
    
    set((state) => ({
      design: {
        ...state.design,
        pixels: newPixels,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      }
    }))
  },

  removePixel: (x, y) => {
    const state = get()
    const newPixels = state.design.pixels.filter(p => !(p.x === x && p.y === y))
    
    const newHistory = [...state.design.history.slice(0, state.design.historyIndex + 1), newPixels]
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift()
    }
    
    set((state) => ({
      design: {
        ...state.design,
        pixels: newPixels,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      }
    }))
  },

  clearCanvas: () => {
    const state = get()
    const newHistory = [...state.design.history.slice(0, state.design.historyIndex + 1), []]
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift()
    }
    
    set((state) => ({
      design: {
        ...state.design,
        pixels: [],
        history: newHistory,
        historyIndex: newHistory.length - 1,
      }
    }))
  },

  undo: () => {
    const state = get()
    if (state.design.historyIndex > 0) {
      const newIndex = state.design.historyIndex - 1
      set((state) => ({
        design: {
          ...state.design,
          pixels: state.design.history[newIndex],
          historyIndex: newIndex,
        }
      }))
    }
  },

  redo: () => {
    const state = get()
    if (state.design.historyIndex < state.design.history.length - 1) {
      const newIndex = state.design.historyIndex + 1
      set((state) => ({
        design: {
          ...state.design,
          pixels: state.design.history[newIndex],
          historyIndex: newIndex,
        }
      }))
    }
  },

  // Wallet actions
  connectWallet: async () => {
    set((state) => ({
      wallet: { ...state.wallet, isConnecting: true, error: null }
    }))

    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed')
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await provider.send('eth_requestAccounts', [])
      
      if (accounts.length === 0) {
        throw new Error('No accounts found')
      }

      const address = accounts[0]
      const signer = await provider.getSigner()
      
      // Get token balance and allowance
      const tokenContract = new ethers.Contract(
        BLOCKCHAIN_CONFIG.ADRIAN_TOKEN,
        BLOCKCHAIN_CONFIG.ADRIAN_TOKEN_ABI,
        signer
      )

      const [balance, allowance] = await Promise.all([
        tokenContract.balanceOf(address),
        tokenContract.allowance(address, BLOCKCHAIN_CONFIG.ADRIAN_SIMPLE_SAVE)
      ])

      set((state) => ({
        wallet: {
          address,
          isConnected: true,
          isConnecting: false,
          balance: formatTokenAmount(balance),
          allowance: formatTokenAmount(allowance),
          error: null,
        }
      }))

      // Load contract data
      get().loadContractData()

    } catch (error) {
      console.error('Error connecting wallet:', error)
      set((state) => ({
        wallet: {
          ...state.wallet,
          isConnecting: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }))
    }
  },

  disconnectWallet: () => {
    set((state) => ({
      wallet: {
        address: null,
        isConnected: false,
        isConnecting: false,
        balance: '0',
        allowance: '0',
        error: null,
      }
    }))
  },

  checkAllowance: async () => {
    const state = get()
    if (!state.wallet.isConnected || !state.wallet.address) return

    try {
      const provider = new ethers.BrowserProvider(window.ethereum!)
      const signer = await provider.getSigner()
      
      const tokenContract = new ethers.Contract(
        BLOCKCHAIN_CONFIG.ADRIAN_TOKEN,
        BLOCKCHAIN_CONFIG.ADRIAN_TOKEN_ABI,
        signer
      )

      const allowance = await tokenContract.allowance(
        state.wallet.address,
        BLOCKCHAIN_CONFIG.ADRIAN_SIMPLE_SAVE
      )

      set((state) => ({
        wallet: {
          ...state.wallet,
          allowance: formatTokenAmount(allowance)
        }
      }))

    } catch (error) {
      console.error('Error checking allowance:', error)
      // Set allowance to 0 on error to prevent issues
      set((state) => ({
        wallet: {
          ...state.wallet,
          allowance: '0'
        }
      }))
    }
  },

  // Contract actions
  loadContractData: async () => {
    set((state) => ({
      contract: { ...state.contract, isLoading: true, error: null }
    }))

    try {
      const provider = new ethers.BrowserProvider(window.ethereum!)
      
      const saveContract = new ethers.Contract(
        BLOCKCHAIN_CONFIG.ADRIAN_SIMPLE_SAVE,
        BLOCKCHAIN_CONFIG.ADRIAN_SIMPLE_SAVE_ABI,
        provider
      )

      const [config, isConfigured] = await Promise.all([
        saveContract.getConfig(),
        saveContract.isConfigured()
      ])

      set((state) => ({
        contract: {
          savePrice: formatTokenAmount(config.currentSavePrice),
          nextTokenId: config.nextId.toString(),
          mintingEnabled: config.mintingEnabled_,
          isConfigured: isConfigured.treasurySet && isConfigured.traitsCoreSet,
          isLoading: false,
          error: null,
        }
      }))

    } catch (error) {
      console.error('Error loading contract data:', error)
      set((state) => ({
        contract: {
          ...state.contract,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Error loading contract data'
        }
      }))
    }
  },

  generateSVGContent: () => {
    const state = get()
    const { pixels } = state.design
    
    // Create SVG content with T-shirt background and pixelated style
    const svgContent = `
      <svg width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" xmlns="http://www.w3.org/2000/svg" style="image-rendering: pixelated; shape-rendering: crispEdges;">
        <defs>
          <pattern id="tshirt-pattern" patternUnits="userSpaceOnUse" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}">
            <image href="data:image/svg+xml;base64,${safeBtoa('<svg width="148" height="148" xmlns="http://www.w3.org/2000/svg"><rect width="148" height="148" fill="white"/></svg>')}" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}"/>
          </pattern>
        </defs>
        <rect width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" fill="url(#tshirt-pattern)"/>
        <g style="mix-blend-mode: multiply;">
          ${pixels.map(pixel => 
            `<rect x="${pixel.x}" y="${pixel.y}" width="1.025" height="1.025" fill="${pixel.color}" />`
          ).join('')}
        </g>
      </svg>
    `
    
    return svgContent
  },

  saveAndMintWithApproval: async () => {
    const state = get()
    if (!state.wallet.isConnected || !state.wallet.address) {
      throw new Error('Wallet not connected')
    }

    if (!state.contract.isConfigured) {
      throw new Error('Contract not configured')
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum!)
      const signer = await provider.getSigner()
      
      const tokenContract = new ethers.Contract(
        BLOCKCHAIN_CONFIG.ADRIAN_TOKEN,
        BLOCKCHAIN_CONFIG.ADRIAN_TOKEN_ABI,
        signer
      )

      const saveContract = new ethers.Contract(
        BLOCKCHAIN_CONFIG.ADRIAN_SIMPLE_SAVE,
        BLOCKCHAIN_CONFIG.ADRIAN_SIMPLE_SAVE_ABI,
        signer
      )

      const savePrice = parseTokenAmount(state.contract.savePrice)
      const currentAllowance = parseTokenAmount(state.wallet.allowance)

      // Check if approval is needed
      if (currentAllowance < savePrice) {
        console.log('Approval needed, requesting approval...')
        
        // Request approval for the save price
        const approveTx = await tokenContract.approve(BLOCKCHAIN_CONFIG.ADRIAN_SIMPLE_SAVE, savePrice)
        console.log('Approval transaction sent:', approveTx.hash)
        
        // Wait for approval confirmation
        const approveReceipt = await approveTx.wait()
        console.log('Approval confirmed:', approveReceipt.hash)
        
        // Update allowance in state
        await get().checkAllowance()
      }

      // Now proceed with save and mint
      console.log('Proceeding with save and mint...')
      const saveTx = await saveContract.payForSave()
      console.log('Save transaction sent:', saveTx.hash)
      
      const saveReceipt = await saveTx.wait()
      console.log('Save confirmed:', saveReceipt.hash)

      // Find the SavePaid event
      const savePaidEvent = saveReceipt.logs.find((log: any) => {
        try {
          const parsed = saveContract.interface.parseLog(log)
          return parsed?.name === 'SavePaid'
        } catch {
          return false
        }
      })

      if (savePaidEvent) {
        const parsed = saveContract.interface.parseLog(savePaidEvent)
        if (parsed) {
          const tokenId = parsed.args.tokenId.toString()
          const mintSuccess = parsed.args.mintSuccess
          
          // Save SVG file with token ID
          try {
            const svgContent = get().generateSVGContent()
            await get().saveSVGToServer(tokenId, svgContent)
            console.log(`SVG saved for token ${tokenId}`)
          } catch (svgError) {
            console.error('Error saving SVG:', svgError)
            // Don't throw error here, as the transaction was successful
          }
          
          return {
            tokenId,
            mintSuccess
          }
        }
      }

      return null

    } catch (error) {
      console.error('Error in saveAndMintWithApproval:', error)
      throw error
    }
  },

  saveSVGToServer: async (tokenId: string, svgContent: string) => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('Starting automatic SVG save process...');
        
        // Method 1: Try to get token from Vercel API automatically
        let token = null;
        try {
          console.log('Attempting to get token from Vercel API...');
          const currentOrigin = window.location.origin;
          const tokenResponse = await fetch(`${currentOrigin}/api/get-github-token`);
          
          if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            if (tokenData.token) {
              token = tokenData.token;
              console.log('Token obtained from Vercel API successfully');
            }
          } else {
            console.log('Token API response not ok:', tokenResponse.status);
          }
        } catch (tokenError) {
          console.log('Could not get token from Vercel API, trying fallback methods...', tokenError);
        }
        
        // Method 2: Fallback to localStorage if available
        if (!token) {
          const savedToken = localStorage.getItem('github_token');
          if (savedToken) {
            token = savedToken;
            console.log('Using token from localStorage');
          }
        }
        
        if (!token) {
          throw new Error('No GitHub token available for SVG save');
        }
        
        // Now save the SVG using the GitHub API directly
        console.log('Saving SVG to GitHub via API...');
        
        const githubApiUrl = `https://api.github.com/repos/adriangallery/adrianzero/contents/designs/${tokenId}.svg`;
        
        // Get current file content to get SHA (required for updates)
        let currentSha = null;
        try {
          const getResponse = await fetch(githubApiUrl, {
            headers: {
              'Authorization': `token ${token}`,
              'Accept': 'application/vnd.github.v3+json',
            },
          });
          
          if (getResponse.ok) {
            const fileData = await getResponse.json();
            currentSha = fileData.sha;
            console.log('File exists, will update with SHA:', currentSha);
          }
        } catch (error) {
          console.log('File does not exist, will create new file');
        }
        
        // Prepare the commit data
        const commitData: any = {
          message: `Add SVG design for token ${tokenId}`,
          content: safeBtoa(svgContent), // Base64 encode the SVG content
          branch: 'main',
        };
        
        // Add SHA if updating existing file
        if (currentSha) {
          commitData.sha = currentSha;
        }
        
        // Commit the file
        const commitResponse = await fetch(githubApiUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(commitData),
        });
        
        if (!commitResponse.ok) {
          const errorData = await commitResponse.json();
          throw new Error(`GitHub API error: ${errorData.message}`);
        }
        
        const result = await commitResponse.json();
        console.log('SVG saved successfully to GitHub:', result);
        
        // Return the result with URLs
        resolve({
          success: true,
          tokenId,
          url: `https://adrianzero.com/designs/${tokenId}.svg`,
          downloadUrl: `https://raw.githubusercontent.com/adriangallery/adrianzero/main/designs/${tokenId}.svg`,
          sha: result.content.sha,
          commit: result.commit.sha,
        });
        
      } catch (error) {
        console.error('Error in saveSVGToServer:', error);
        reject(error);
      }
    });
  },

  saveDesign: async () => {
    const state = get()
    const { pixels } = state.design
    
    const svgContent = get().generateSVGContent()
    
    // Create blob and download
    const blob = new Blob([svgContent], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trait-design-${Date.now()}.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    return 'Design saved successfully!'
  },
}))

// Canvas constants
export const CANVAS_CONFIG = {
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  pixelSize: 3,
  maxZoom: 4,
  minZoom: 0.5,
}

// Retro color palette
export const RETRO_COLORS = [
  '#000000', // Black
  '#ffffff', // White
  '#ff0000', // Red
  '#00ff00', // Green
  '#0000ff', // Blue
  '#ffff00', // Yellow
  '#ff00ff', // Magenta
  '#00ffff', // Cyan
  '#ff8000', // Orange
  '#8000ff', // Purple
  '#ff0080', // Pink
  '#80ff00', // Lime
  '#0080ff', // Sky Blue
  '#ff8080', // Light Red
  '#80ff80', // Light Green
  '#8080ff', // Light Blue
]
