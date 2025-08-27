/**
 * TRAITLAB - Módulo de ZERO
 * Maneja la gestión completa de tokens AdrianZERO (ERC721)
 */

class ZeroManager {
    constructor() {
        this.selectedERC721 = null;
        this.selectedTokenForRename = null;
        this.namePrice = null;
        this.eventListeners = new Map();
        
        // Bind methods
        this.loadTokens = this.loadTokens.bind(this);
        this.loadCustomNames = this.loadCustomNames.bind(this);
        this.refreshMetadata = this.refreshMetadata.bind(this);
        this.activateToken = this.activateToken.bind(this);
        this.loadNamePrice = this.loadNamePrice.bind(this);
        this.approveRename = this.approveRename.bind(this);
        this.renameToken = this.renameToken.bind(this);
        this.refreshAdrianZeroToken = this.refreshAdrianZeroToken.bind(this);
        this.setSelectedERC721 = this.setSelectedERC721.bind(this);
        this.getSelectedERC721 = this.getSelectedERC721.bind(this);
        this.clearSelection = this.clearSelection.bind(this);
        this.isAdrianZeroToken = this.isAdrianZeroToken.bind(this);
    }

    /**
     * Initialize zero manager
     */
    init() {
        console.log('🚀 ZeroManager inicializado');
    }

    /**
     * Set selected ERC721 token
     */
    setSelectedERC721(token) {
        this.selectedERC721 = token;
        this.emit('erc721Selected', { token });
    }

    /**
     * Get selected ERC721 token
     */
    getSelectedERC721() {
        return this.selectedERC721;
    }

    /**
     * Clear ERC721 selection
     */
    clearSelection() {
        this.selectedERC721 = null;
        this.selectedTokenForRename = null;
        this.emit('erc721SelectionCleared');
    }

    /**
     * Check if token is an AdrianZERO token
     */
    isAdrianZeroToken(token) {
        return token && token.tokenType === 'ERC721' && 
               token.contract.toLowerCase() === window.TraitLABConfig.CONTRACTS.ERC721.toLowerCase();
    }

    /**
     * Load tokens for specific contract using direct API calls with pagination
     */
    async loadTokens(userAddress, contractAddress) {
        console.log('loadTokens called with:', { userAddress, contractAddress });
        
        if (!userAddress) {
            throw new Error('User address is required');
        }

        try {
            // Determine token type based on contract address
            const isERC721 = contractAddress.toLowerCase() === window.TraitLABConfig.CONTRACTS.ERC721.toLowerCase(); // AdrianZERO
            const tokenType = isERC721 ? "ERC721" : "ERC1155";
            
            console.log(`Loading ${tokenType} tokens from contract: ${contractAddress}`);
            
            // Load all tokens with pagination
            let allNfts = [];
            let pageKey = null;
            let hasMore = true;
            let pageCount = 0;
            
            while (hasMore) {
                pageCount++;
                console.log(`Loading page ${pageCount}...`);
                
                // Build URL with pagination and correct endpoint
                let alchemyUrl = `https://base-mainnet.g.alchemy.com/nft/v3/${window.TraitLABConfig.ALCHEMY_API_KEY}/getNFTsForOwner?owner=${userAddress}&contractAddresses[]=${contractAddress}&withMetadata=true&pageSize=100&tokenType=${tokenType}`;
                
                if (pageKey) {
                    alchemyUrl += `&pageKey=${pageKey}`;
                }
                
                console.log(`Requesting NFTs with URL: ${alchemyUrl}`);
                
                const alchemyResponse = await fetch(alchemyUrl);
                
                if (!alchemyResponse.ok) {
                    throw new Error(`Error getting NFTs from Alchemy API: ${alchemyResponse.status}`);
                }
                
                const nftsData = await alchemyResponse.json();
                console.log(`Page ${pageCount}: ${nftsData.ownedNfts?.length || 0} tokens received`);
                
                // Add tokens from this page
                if (nftsData.ownedNfts && nftsData.ownedNfts.length > 0) {
                    allNfts = allNfts.concat(nftsData.ownedNfts);
                }
                
                // Check if there are more pages
                pageKey = nftsData.pageKey;
                hasMore = !!pageKey;
                
                console.log(`Total tokens loaded so far: ${allNfts.length}. Has more: ${hasMore}`);
                
                // Optional: Add a small delay to avoid rate limiting
                if (hasMore) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
            
            console.log(`Total tokens loaded: ${allNfts.length} from ${pageCount} pages`);
            
            if (allNfts.length === 0) {
                console.log('No NFTs found for this user');
                this.emit('noTokensFound', { userAddress, contractAddress });
                return [];
            }
            
                            // Process all NFTs
                const tokens = allNfts.map(nft => {
                    try {
                        // Extract tokenId
                        let tokenId;
                        if (nft.tokenId) {
                            tokenId = nft.tokenId;
                        } else if (nft.id && nft.id.tokenId) {
                            tokenId = nft.id.tokenId;
                        } else {
                            console.error("No tokenId found in NFT:", nft);
                            return null;
                        }
                        
                        // Convert tokenId to integer
                        let tokenIdInt;
                        if (typeof tokenId === 'number') {
                            tokenIdInt = tokenId;
                        } else if (tokenId.startsWith('0x')) {
                            tokenIdInt = parseInt(tokenId, 16);
                        } else {
                            tokenIdInt = parseInt(tokenId, 10);
                        }
                        
                        if (isNaN(tokenIdInt)) {
                            console.error("Invalid tokenId format:", tokenId);
                            return null;
                        }
                        
                        // Extract title/name
                        let title = `Token #${tokenIdInt}`;
                        
                        if (nft.title) {
                            title = nft.title;
                        } else if (nft.name) {
                            title = nft.name;
                        } else if (nft.metadata && nft.metadata.name) {
                            title = nft.metadata.name;
                        } else if (nft.contract && nft.contract.name) {
                            title = `${nft.contract.name} #${tokenIdInt}`;
                        }
                        
                        // Extract image URL
                        let mediaUrl = "";
                        
                        // For ERC721 tokens (AdrianZERO), use the specific render API format
                        if (isERC721) {
                            // Use the working format for AdrianZERO tokens
                            mediaUrl = `https://adrianlab.vercel.app/api/render/${tokenIdInt}.png`;
                        } else {
                            // For ERC1155 tokens, use the original logic
                            // Try multiple locations for image URL
                            if (nft.raw && nft.raw.metadata && nft.raw.metadata.image) {
                                mediaUrl = nft.raw.metadata.image;
                            } else if (nft.media && Array.isArray(nft.media) && nft.media.length > 0) {
                                mediaUrl = nft.media[0].gateway || nft.media[0].raw || '';
                            } else if (nft.metadata && nft.metadata.image) {
                                mediaUrl = nft.metadata.image;
                            }
                        }
                        
                        // Extract balance
                        const balance = nft.balance || '1';
                        
                        // Extract category
                        let category = '';
                        if (nft.metadata) {
                            category = nft.metadata.category || nft.metadata.Category || '';
                            
                            if (!category && nft.metadata.attributes) {
                                const categoryAttr = nft.metadata.attributes.find(attr => 
                                    attr.trait_type && attr.trait_type.toLowerCase() === 'category'
                                );
                                if (categoryAttr) {
                                    category = categoryAttr.value.toLowerCase();
                                }
                            }
                        }
                        
                        return {
                            tokenId: tokenIdInt,
                            title: title,
                            imageUrl: mediaUrl,
                            contract: nft.contract.address,
                            contractName: nft.contract.name || 'Unknown Contract',
                            tokenType: tokenType,
                            category: category,
                            balance: balance,
                            metadata: nft.metadata || {}
                        };
                    } catch (err) {
                        console.error("Error processing NFT:", err, nft);
                        return null;
                    }
                }).filter(token => token !== null);

                // Apply filtering based on current filter (if provided)
                let filteredTokens = tokens;
                
                // If we have a filter context, apply it
                if (this.currentFilter) {
                    console.log(`Applying filter: ${this.currentFilter}`);
                    filteredTokens = tokens.filter(token => {
                        if (token.tokenType === 'ERC1155') {
                            if (this.currentFilter === 'floppy') {
                                // Floppy discs filter: show only tokens 10000-10007, 15000-15015
                                const isFloppy = (token.tokenId >= 10000 && token.tokenId <= 10007) || 
                                               (token.tokenId >= 15000 && token.tokenId <= 15015);
                                console.log(`Token ${token.tokenId} floppy filter: ${isFloppy}`);
                                return isFloppy;
                            } else if (this.currentFilter === 'serum') {
                                // Serums filter: show tokens 262144-262147
                                const isSerum = token.tokenId >= 262144 && token.tokenId <= 262147;
                                console.log(`Token ${token.tokenId} serum filter: ${isSerum}`);
                                return isSerum;
                            } else if (this.currentFilter === 'traits' || !this.currentFilter) {
                                // Normal filter: exclude floppy & serum tokens
                                const isExcluded = (token.tokenId >= 10000 && token.tokenId <= 10007) || 
                                                 (token.tokenId >= 15000 && token.tokenId <= 15015) ||
                                                 (token.tokenId >= 262144 && token.tokenId <= 262147);
                                console.log(`Token ${token.tokenId} normal filter: ${!isExcluded}`);
                                return !isExcluded;
                            }
                        }
                        return true; // Keep all ERC721 tokens
                    });
                } else {
                    // Default filter: exclude floppy & serum tokens
                    console.log('No filter specified, applying default filter');
                    filteredTokens = tokens.filter(token => {
                        if (token.tokenType === 'ERC1155') {
                            const isExcluded = (token.tokenId >= 10000 && token.tokenId <= 10007) || 
                                             (token.tokenId >= 15000 && token.tokenId <= 15015) ||
                                             (token.tokenId >= 262144 && token.tokenId <= 262147);
                            console.log(`Token ${token.tokenId} default filter: ${!isExcluded}`);
                            return !isExcluded;
                        }
                        return true;
                    });
                }
            
            console.log('Processed tokens:', filteredTokens);
            
            // For ERC1155 tokens, fetch individual metadata if it's empty
            if (tokenType === 'ERC1155') {
                const tokensWithMetadata = await Promise.all(
                    filteredTokens.map(async (token) => {
                        if (!token.metadata || Object.keys(token.metadata).length === 0) {
                            console.log(`Fetching individual metadata for token ${token.tokenId}`);
                            try {
                                const metadataUrl = `https://base-mainnet.g.alchemy.com/nft/v3/${window.TraitLABConfig.ALCHEMY_API_KEY}/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${token.tokenId}&tokenType=ERC1155`;
                                const metadataResponse = await fetch(metadataUrl);
                                
                                if (metadataResponse.ok) {
                                    const metadataData = await metadataResponse.json();
                                    console.log(`Metadata for token ${token.tokenId}:`, metadataData);
                                    
                                    // Extract category from the new metadata
                                    let category = '';
                                    if (metadataData.metadata) {
                                        category = metadataData.metadata.category || metadataData.metadata.Category || '';
                                        
                                        if (!category && metadataData.metadata.attributes) {
                                            const categoryAttr = metadataData.metadata.attributes.find(attr => 
                                                attr.trait_type && attr.trait_type.toLowerCase() === 'category'
                                            );
                                            if (categoryAttr) {
                                                category = categoryAttr.value.toLowerCase();
                                            }
                                        }
                                    }
                                    
                                    return {
                                        ...token,
                                        metadata: metadataData.metadata || {},
                                        category: category
                                    };
                                }
                            } catch (error) {
                                console.error(`Error fetching metadata for token ${token.tokenId}:`, error);
                            }
                        }
                        // Return the token as is, preserving the balance
                        console.log(`Returning token ${token.tokenId} with balance: ${token.balance}`);
                        return token;
                    })
                );
                
                console.log(`Tokens with metadata:`, tokensWithMetadata);
                this.emit('tokensLoaded', { tokens: tokensWithMetadata, contractAddress, tokenType });
                return tokensWithMetadata;
            } else {
                // For ERC721 tokens, load custom names
                const nameMap = await this.loadCustomNames(tokens);
                if (nameMap) {
                    tokens.forEach(t => {
                        const n = nameMap.get(t.tokenId);
                        if (n) t.title = n; // Override displayed name
                    });
                }
                this.emit('tokensLoaded', { tokens, contractAddress, tokenType });
                return tokens;
            }

        } catch (error) {
            console.error("Error loading tokens:", error);
            this.emit('tokensLoadError', { error: error.message, contractAddress });
            throw error;
        }
    }

    /**
     * Load custom names from AdrianNameRegistry contract with cascading approach
     */
    async loadCustomNames(tokens) {
        // Only process AdrianZERO tokens (ERC721)
        const adrianZeroTokens = tokens.filter(token => 
            this.isAdrianZeroToken(token)
        );
        
        if (adrianZeroTokens.length === 0) {
            console.log('No AdrianZERO tokens to process for custom names');
            return tokens;
        }

        console.log(`Loading custom names for ${adrianZeroTokens.length} AdrianZERO tokens with cascading approach...`);

        try {
            // Load ethers dynamically if not available
            let ethers = window.ethers;
            if (typeof ethers === 'undefined') {
                console.log('Ethers not available, loading dynamically...');
                try {
                    // Load ethers dynamically
                    const script = document.createElement('script');
                    script.src = 'https://unpkg.com/ethers@5.7.2/dist/ethers.umd.min.js';
                    script.onload = () => {
                        console.log('Ethers loaded successfully for custom names');
                    };
                    script.onerror = () => {
                        console.log('Failed to load ethers for custom names');
                    };
                    document.head.appendChild(script);
                    
                    // Wait a bit for ethers to load
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    ethers = window.ethers;
                    if (typeof ethers === 'undefined') {
                        console.log('Ethers still not available after loading, skipping custom names');
                        return tokens;
                    }
                } catch (loadError) {
                    console.log('Error loading ethers dynamically:', loadError.message);
                    return tokens;
                }
            }

            // Check if wallet is connected
            if (!window.ethereum) {
                console.log('Wallet not connected, skipping custom names');
                return tokens;
            }

            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const network = await provider.getNetwork();
            
            // Only proceed if on Base network
            if (network.chainId !== 8453) {
                console.log('Not on Base network, skipping custom names');
                return tokens;
            }

            // Try to load ABI from config first, fallback to local file
            let contractABI;
            try {
                if (window.TraitLABConfig?.ADRIAN_NAME_REGISTRY_ABI) {
                    contractABI = window.TraitLABConfig.ADRIAN_NAME_REGISTRY_ABI;
                    console.log('Using ABI from config');
                } else {
                    // Fallback to local ABI file
                    const response = await fetch('./adrian-name-registry-abi.json');
                    if (!response.ok) {
                        throw new Error('Failed to load local ABI');
                    }
                    contractABI = await response.json();
                    console.log('Using local ABI file');
                }
            } catch (abiError) {
                console.log('Failed to load ABI, skipping custom names:', abiError.message);
                return tokens;
            }

            // Create contract instance
            const nameRegistryContract = new ethers.Contract(
                window.TraitLABConfig?.ADRIAN_NAME_REGISTRY_CONTRACT || '0x...', // Add your contract address here
                contractABI, 
                provider
            );

            // First, display all tokens with Alchemy names immediately
            console.log('🔄 Displaying tokens with Alchemy names first...');
            // Emit event to trigger display update
            this.emit('tokensReadyForDisplay', { tokens, skipSelectionUpdate: true });

            // Then, get custom names with delays to avoid rate limiting
            const nameMap = new Map();
            let processedCount = 0;

            // Process tokens in batches with delays
            const batchSize = 5; // Process 5 tokens at a time
            const delayBetweenBatches = 2000; // 2 seconds between batches

            for (let i = 0; i < adrianZeroTokens.length; i += batchSize) {
                const batch = adrianZeroTokens.slice(i, i + batchSize);
                
                console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(adrianZeroTokens.length/batchSize)} (${batch.length} tokens)`);
                
                // Process batch with individual delays
                const batchPromises = batch.map(async (token, index) => {
                    // Add delay between individual requests
                    await new Promise(resolve => setTimeout(resolve, index * 500)); // 500ms between each request
                    
                    try {
                        const customName = await nameRegistryContract.getTokenName(token.tokenId);
                        if (customName && customName.trim()) {
                            nameMap.set(token.tokenId, customName.trim());
                            console.log(`✅ Custom name found for token ${token.tokenId}: "${customName.trim()}"`);
                        }
                    } catch (error) {
                        console.log(`No custom name for token ${token.tokenId}:`, error.message);
                    }
                    
                    processedCount++;
                    console.log(`📊 Progress: ${processedCount}/${adrianZeroTokens.length} tokens processed`);
                });

                await Promise.all(batchPromises);

                // Update display with any custom names found so far
                if (nameMap.size > 0) {
                    // Update tokens array with new names
                    tokens.forEach(token => {
                        if (this.isAdrianZeroToken(token) && nameMap.has(token.tokenId)) {
                            const customName = nameMap.get(token.tokenId);
                            token.title = customName;
                            token.originalTitle = token.originalTitle || token.title; // Keep original title as backup
                        }
                    });

                    console.log(`🔄 Updating display with ${nameMap.size} custom names found so far...`);
                    // Emit event to update names progressively
                    this.emit('customNamesProgressUpdate', { nameMap, tokens });
                }

                // Add delay between batches (except for the last batch)
                if (i + batchSize < adrianZeroTokens.length) {
                    console.log(`⏳ Waiting ${delayBetweenBatches}ms before next batch...`);
                    await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
                }
            }

            // Final update with all custom names
            const finalUpdatedTokens = tokens.map(token => {
                if (this.isAdrianZeroToken(token) && nameMap.has(token.tokenId)) {
                    const customName = nameMap.get(token.tokenId);
                    return {
                        ...token,
                        title: customName,
                        originalTitle: token.title // Keep original title as backup
                    };
                }
                return token;
            });

            console.log(`✅ Custom names loading complete: ${nameMap.size} tokens updated`);
            
            // Emit final event with complete name map
            this.emit('customNamesLoaded', { nameMap, tokens: finalUpdatedTokens });
            
            return finalUpdatedTokens;

        } catch (error) {
            console.error('Error loading custom names:', error);
            // Return original tokens if custom names fail
            return tokens;
        }
    }

    /**
     * Refresh metadata by calling Vercel endpoints
     */
    async refreshMetadata() {
        console.log('refreshMetadata called');
        
        if (!this.selectedERC721) {
            throw new Error('Please select an AdrianZERO token first.');
        }

        try {
            const tokenId = this.selectedERC721.tokenId;
            const renderUrl = `https://adrianlab.vercel.app/api/render/${tokenId}`;
            const metadataUrl = `https://adrianlab.vercel.app/api/metadata/${tokenId}`;

            console.log('Calling render URL:', renderUrl);
            console.log('Calling metadata URL:', metadataUrl);

            // Make both requests in parallel
            const [renderResponse, metadataResponse] = await Promise.all([
                fetch(renderUrl),
                fetch(metadataUrl)
            ]);

            console.log('Render response status:', renderResponse.status);
            console.log('Metadata response status:', metadataResponse.status);

            // Check if both requests were successful
            if (renderResponse.ok && metadataResponse.ok) {
                console.log('Both endpoints called successfully');
                
                // Emit success event
                this.emit('metadataRefreshed', { 
                    tokenId, 
                    renderStatus: 'success', 
                    metadataStatus: 'success' 
                });
                
                return { success: true, message: `Metadata refreshed successfully for token ${tokenId}!` };
            } else {
                let errorMessage = 'Failed to refresh metadata.';
                if (!renderResponse.ok) {
                    errorMessage += ` Render endpoint returned ${renderResponse.status}.`;
                }
                if (!metadataResponse.ok) {
                    errorMessage += ` Metadata endpoint returned ${metadataResponse.status}.`;
                }
                
                throw new Error(errorMessage);
            }

        } catch (error) {
            console.error('Error refreshing metadata:', error);
            
            // Check if it's a CORS error
            if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
                throw new Error('❌ CORS Error: Server needs to be configured to allow requests from this domain. Please contact the server administrator.');
            } else {
                throw error;
            }
        }
    }

    /**
     * Activate AdrianZERO token using AdrianLabCore contract
     */
    async activateToken() {
        console.log('activateToken called');
        
        if (!this.selectedERC721) {
            throw new Error('Please select an AdrianZERO token first.');
        }

        if (!window.TraitLABWallet || !window.TraitLABWallet.isWalletConnected()) {
            throw new Error('Please connect your wallet first.');
        }

        // Check if user owns the token
        if (this.selectedERC721.owner && this.selectedERC721.owner.toLowerCase() !== window.TraitLABWallet.getCurrentAccount().toLowerCase()) {
            throw new Error('❌ You must own this token to activate it.');
        }

        try {
            // Load ethers dynamically only when needed
            let ethers;
            if (typeof window.ethers === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/ethers@5.7.2/dist/ethers.umd.min.js';
                
                return new Promise((resolve, reject) => {
                    script.onload = () => {
                        ethers = window.ethers;
                        console.log('Ethers loaded successfully');
                        this.executeActivateTokenTransaction(ethers)
                            .then(resolve)
                            .catch(reject);
                    };
                    script.onerror = () => {
                        reject(new Error('Failed to load ethers library. Please refresh the page.'));
                    };
                    document.head.appendChild(script);
                });
            } else {
                ethers = window.ethers;
                return await this.executeActivateTokenTransaction(ethers);
            }
        } catch (error) {
            console.error('Error in activateToken:', error);
            throw error;
        }
    }

    /**
     * Execute the activate token transaction
     */
    async executeActivateTokenTransaction(ethers) {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            // AdrianLabCore contract address - using AdrianZERO contract for now
            const ADRIAN_LAB_CORE_CONTRACT = window.TraitLABConfig.ADRIAN_LAB_CORE_CONTRACT;
            
            // Contract ABI for assignTokenAttributes function
            const contractABI = [
                {
                    "inputs": [
                        {
                            "internalType": "uint256",
                            "name": "tokenId",
                            "type": "uint256"
                        }
                    ],
                    "name": "assignTokenAttributes",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                }
            ];

            // Create contract instance
            const contract = new ethers.Contract(ADRIAN_LAB_CORE_CONTRACT, contractABI, signer);

            // Prepare parameters
            const tokenId = this.selectedERC721.tokenId;

            console.log('Contract address:', ADRIAN_LAB_CORE_CONTRACT);
            console.log('Token ID:', tokenId);

            // Call the contract function
            const tx = await contract.assignTokenAttributes(tokenId);
            
            console.log('Transaction hash:', tx.hash);

            // Wait for transaction confirmation
            const receipt = await tx.wait();
            
            console.log('Transaction confirmed:', receipt);

            // Emit success event
            this.emit('tokenActivated', { 
                tokenId, 
                transactionHash: receipt.transactionHash 
            });

            return receipt;

        } catch (error) {
            console.error('Error in transaction:', error);
            
            let errorMessage = 'Failed to assign SKIN.';
            
            // Handle specific error cases
            if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
                errorMessage = '❌ Transaction was cancelled by user.';
            } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
                // Check for specific revert reasons
                if (error.reason && error.reason.includes('already assigned')) {
                    errorMessage = '❌ This token has already been activated!';
                } else if (error.reason && error.reason.includes('not owner')) {
                    errorMessage = '❌ You must own this token to activate it.';
                } else if (error.reason && error.reason.includes('token does not exist')) {
                    errorMessage = '❌ Token does not exist.';
                } else if (error.reason && error.reason.includes('not authorized')) {
                    errorMessage = '❌ You are not authorized to activate this token.';
                } else {
                    errorMessage = `❌ Transaction failed: ${error.reason}`;
                }
            } else if (error.code === 'INSUFFICIENT_FUNDS') {
                errorMessage = '❌ Insufficient funds for gas fees.';
            } else if (error.message) {
                errorMessage = `❌ Error: ${error.message}`;
            }
            
            throw new Error(errorMessage);
        }
    }

    /**
     * Load name price from AdrianNameRegistry contract
     */
    async loadNamePrice() {
        try {
            // Load ethers dynamically only when needed
            let ethers;
            if (typeof window.ethers === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/ethers@5.7.2/dist/ethers.umd.min.js';
                
                return new Promise((resolve, reject) => {
                    script.onload = () => {
                        ethers = window.ethers;
                        this.executeLoadPrice(ethers)
                            .then(resolve)
                            .catch(reject);
                    };
                    script.onerror = () => {
                        reject(new Error('Failed to load ethers library'));
                    };
                    document.head.appendChild(script);
                });
            } else {
                ethers = window.ethers;
                return await this.executeLoadPrice(ethers);
            }
        } catch (error) {
            console.error('Error in loadNamePrice:', error);
            throw error;
        }
    }

    /**
     * Execute the load price transaction
     */
    async executeLoadPrice(ethers) {
        try {
            console.log('🔍 executeLoadPrice - window.TraitLABConfig:', window.TraitLABConfig);
            console.log('🔍 executeLoadPrice - ADRIAN_NAME_REGISTRY_ABI:', window.TraitLABConfig?.ADRIAN_NAME_REGISTRY_ABI);
            
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            
            // Check if we're on the correct network (Base)
            const network = await provider.getNetwork();
            console.log('Current network:', network);
            
            if (network.chainId !== 8453) { // Base mainnet
                throw new Error('Please switch to Base network to use this feature.');
            }
            
            console.log('Contract address:', window.TraitLABConfig.ADRIAN_NAME_REGISTRY_CONTRACT);
            
            // Check if contract exists
            const code = await provider.getCode(window.TraitLABConfig.ADRIAN_NAME_REGISTRY_CONTRACT);
            if (code === '0x') {
                throw new Error('Contract not found at specified address');
            }
            
            // Use ABI from config
            const contractABI = window.TraitLABConfig.ADRIAN_NAME_REGISTRY_ABI;

            // Create contract instance
            const contract = new ethers.Contract(window.TraitLABConfig.ADRIAN_NAME_REGISTRY_CONTRACT, contractABI, provider);

            // Mostrar el coreContract configurado
            try {
                const coreContract = await contract.getCoreContract();
                console.log('AdrianNameRegistry coreContract:', coreContract);
            } catch (e) {
                console.warn('No se pudo leer el coreContract:', e);
            }
            
            // Get the name price
            console.log('Calling namePrice()...');
            const price = await contract.namePrice();
            this.namePrice = price;
            
            console.log('Name price loaded:', ethers.utils.formatEther(price), 'ADRIAN');
            
            // Emit success event
            this.emit('namePriceLoaded', { 
                price: ethers.utils.formatEther(price), 
                rawPrice: price 
            });
            
            return ethers.utils.formatEther(price);
            
        } catch (error) {
            console.error('Error loading name price:', error);
            // Use default price if contract call fails
            this.namePrice = ethers.utils.parseEther("10000"); // 10000 ADRIAN default
            
            // Emit event with default price
            this.emit('namePriceLoaded', { 
                price: "10000", 
                rawPrice: this.namePrice,
                isDefault: true 
            });
            
            return "10000";
        }
    }

    /**
     * Approve ADRIAN tokens for rename
     */
    async approveRename(userAddress) {
        console.log('Approving ADRIAN tokens for rename...');
        
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            
            // ADRIAN token contract
            const adrianToken = new ethers.Contract(
                window.TraitLABConfig.ADRIAN_TOKEN,
                window.TraitLABConfig.ERC20_ABI,
                signer
            );
            
            // Check current allowance
            const allowance = await adrianToken.allowance(
                userAddress, 
                window.TraitLABConfig.ADRIAN_NAME_REGISTRY_CONTRACT
            );
            
            if (allowance.gte(this.namePrice)) {
                console.log('Allowance already sufficient');
                return true;
            }
            
            console.log('Approving ADRIAN tokens...');
            const tx = await adrianToken.approve(
                window.TraitLABConfig.ADRIAN_NAME_REGISTRY_CONTRACT, 
                this.namePrice
            );
            
            console.log('Approval transaction:', tx.hash);
            await tx.wait();
            
            console.log('Approval successful');
            return true;
            
        } catch (error) {
            console.error('Error in approval:', error);
            throw error;
        }
    }

    /**
     * Execute rename transaction
     */
    async executeRename(userAddress, tokenId, newName) {
        console.log('Executing rename transaction...');
        
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            
            const contract = new ethers.Contract(
                window.TraitLABConfig.ADRIAN_NAME_REGISTRY_CONTRACT,
                window.TraitLABConfig.ADRIAN_NAME_REGISTRY_ABI,
                signer
            );
            
            console.log('Contract address:', window.TraitLABConfig.ADRIAN_NAME_REGISTRY_CONTRACT);
            console.log('Token ID:', tokenId);
            console.log('New name:', newName);
            
            const tx = await contract.rename(tokenId, newName);
            console.log('Rename transaction:', tx.hash);
            
            const receipt = await tx.wait();
            console.log('Rename successful:', receipt);
            
            return receipt;
            
        } catch (error) {
            console.error('Error in rename:', error);
            throw error;
        }
    }

    /**
     * Approve $ADRIAN tokens for rename
     */
    async approveRename() {
        console.log('approveRename called');
        
        if (!this.selectedERC721) {
            throw new Error('Please select an AdrianZERO token first.');
        }

        if (!window.TraitLABWallet || !window.TraitLABWallet.isWalletConnected()) {
            throw new Error('Please connect your wallet first.');
        }

        if (!this.namePrice) {
            throw new Error('Loading name price...');
        }

        try {
            // Load ethers dynamically only when needed
            let ethers;
            if (typeof window.ethers === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/ethers@5.7.2/dist/ethers.umd.min.js';
                
                return new Promise((resolve, reject) => {
                    script.onload = () => {
                        ethers = window.ethers;
                        console.log('Ethers loaded successfully');
                        this.executeApproval(ethers)
                            .then(resolve)
                            .catch(reject);
                    };
                    script.onerror = () => {
                        reject(new Error('Failed to load ethers library. Please refresh the page.'));
                    };
                    document.head.appendChild(script);
                });
            } else {
                ethers = window.ethers;
                return await this.executeApproval(ethers);
            }
        } catch (error) {
            console.error('Error in approveRename:', error);
            throw error;
        }
    }

    /**
     * Execute the approval transaction
     */
    async executeApproval(ethers) {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            // ADRIAN token contract
            const ADRIAN_TOKEN = window.TraitLABConfig.ADRIAN_TOKEN;
            
            // ERC20 ABI for approve function
            const erc20ABI = [
                "function approve(address spender, uint256 amount) returns (bool)",
                "function allowance(address owner, address spender) view returns (uint256)"
            ];

            // Create contract instance
            const contract = new ethers.Contract(ADRIAN_TOKEN, erc20ABI, signer);

            // Check current allowance
            const userAddress = await signer.getAddress();
            const currentAllowance = await contract.allowance(userAddress, window.TraitLABConfig.ADRIAN_NAME_REGISTRY_CONTRACT);
            
            console.log('Current allowance:', ethers.utils.formatEther(currentAllowance));
            console.log('Required amount:', ethers.utils.formatEther(this.namePrice));

            // Check if approval is needed
            if (currentAllowance.gte(this.namePrice)) {
                console.log('Sufficient allowance already exists');
                
                // Emit event
                this.emit('renameApproved', { 
                    allowance: ethers.utils.formatEther(currentAllowance),
                    required: ethers.utils.formatEther(this.namePrice)
                });
                
                return { approved: true, message: 'Sufficient allowance already exists' };
            }

            // Approve the required amount
            console.log('Approving ADRIAN tokens...');
            const tx = await contract.approve(window.TraitLABConfig.ADRIAN_NAME_REGISTRY_CONTRACT, this.namePrice);
            
            console.log('Approval transaction hash:', tx.hash);

            // Wait for transaction confirmation
            const receipt = await tx.wait();
            
            console.log('Approval confirmed:', receipt);

            // Emit success event
            this.emit('renameApproved', { 
                transactionHash: receipt.transactionHash,
                amount: ethers.utils.formatEther(this.namePrice)
            });

            return receipt;

        } catch (error) {
            console.error('Error in approval transaction:', error);
            
            let errorMessage = 'Failed to approve ADRIAN tokens.';
            
            if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
                errorMessage = '❌ Transaction was cancelled by user.';
            } else if (error.code === 'INSUFFICIENT_FUNDS') {
                errorMessage = '❌ Insufficient funds for gas fees.';
            } else if (error.message) {
                errorMessage = `❌ Error: ${error.message}`;
            }
            
            throw new Error(errorMessage);
        }
    }

    /**
     * Rename token using AdrianNameRegistry contract
     */
    async renameToken(newName) {
        console.log('renameToken called with name:', newName);
        
        if (!this.selectedERC721) {
            throw new Error('Please select an AdrianZERO token first.');
        }

        if (!newName || newName.trim() === '') {
            throw new Error('Please provide a valid name.');
        }

        if (!window.TraitLABWallet || !window.TraitLABWallet.isWalletConnected()) {
            throw new Error('Please connect your wallet first.');
        }

        if (!this.namePrice) {
            throw new Error('Name price not loaded. Please try again.');
        }

        try {
            // Load ethers dynamically only when needed
            let ethers;
            if (typeof window.ethers === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/ethers@5.7.2/dist/ethers.umd.min.js';
                
                return new Promise((resolve, reject) => {
                    script.onload = () => {
                        ethers = window.ethers;
                        console.log('Ethers loaded successfully');
                        this.executeRename(ethers, newName)
                            .then(resolve)
                            .catch(reject);
                    };
                    script.onerror = () => {
                        reject(new Error('Failed to load ethers library. Please refresh the page.'));
                    };
                    document.head.appendChild(script);
                });
            } else {
                ethers = window.ethers;
                return await this.executeRename(ethers, newName);
            }
        } catch (error) {
            console.error('Error in renameToken:', error);
            throw error;
        }
    }



    /**
     * Refresh AdrianZERO token image
     */
    refreshAdrianZeroToken(tokenId, buttonElement) {
        console.log('🔄 Refreshing AdrianZERO token:', tokenId);
        
        // Add loading class to button
        buttonElement.classList.add('refreshing');
        buttonElement.title = 'Actualizando...';
        
        // Find token image
        const tokenCard = buttonElement.closest('.token-card');
        const img = tokenCard.querySelector('.token-image');
        
        if (img) {
            // Create new URL with timestamp to force refresh
            const timestamp = Date.now();
            const newUrl = `https://adrianlab.vercel.app/api/render/${tokenId}.png?v=${timestamp}`;
            
            // Preload new image
            const preloadImg = new Image();
            preloadImg.onload = function() {
                // Update main image when loaded
                img.src = newUrl;
                
                // Remove loading class after delay
                setTimeout(() => {
                    buttonElement.classList.remove('refreshing');
                    buttonElement.title = 'Actualizar imagen';
                    console.log('✅ Token image refreshed:', tokenId);
                }, 500);
            };
            
            preloadImg.onerror = function() {
                console.error('❌ Error refreshing token:', tokenId);
                buttonElement.classList.remove('refreshing');
                buttonElement.title = 'Actualizar imagen';
            };
            
            preloadImg.src = newUrl;
        }

        // Emit event
        this.emit('tokenImageRefreshed', { tokenId });
    }

    /**
     * Set the current filter for token filtering
     */
    setCurrentFilter(filter) {
        this.currentFilter = filter;
        console.log('ZeroManager: Filter set to:', filter);
    }

    /**
     * Event system for communication with other modules
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }
}

// Export for browser environment
if (typeof window !== 'undefined') {
    window.TraitLABZero = ZeroManager;
}

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ZeroManager;
}
