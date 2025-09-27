// NFT Sync API - Sync NFT data from contracts to Supabase
const { supabase, CONTRACTS, ALCHEMY_BASE_URL } = require('./supabase-config');

// Admin address for authentication
const ADMIN_ADDRESS = '0x4943407105999e3e97efa2035f5cbc64d72581c6';

// Sync NFT data from contract
async function syncNFTData(contractAddress, startTokenId = 1, endTokenId = null) {
    try {
        console.log(`Starting sync for contract: ${contractAddress}`);
        
        // Get contract info from Supabase
        const { data: contractInfo, error: contractError } = await supabase
            .from('sync_status')
            .select('*')
            .eq('contract_address', contractAddress)
            .single();

        if (contractError && contractError.code !== 'PGRST116') {
            throw new Error(`Error getting contract info: ${contractError.message}`);
        }

        // If no contract info, create it
        if (!contractInfo) {
            const { error: insertError } = await supabase
                .from('sync_status')
                .insert({
                    contract_address: contractAddress,
                    sync_status: 'in_progress',
                    last_sync: new Date().toISOString()
                });

            if (insertError) {
                throw new Error(`Error creating contract info: ${insertError.message}`);
            }
        } else {
            // Update sync status
            await supabase
                .from('sync_status')
                .update({
                    sync_status: 'in_progress',
                    last_sync: new Date().toISOString()
                })
                .eq('contract_address', contractAddress);
        }

        // Get total supply from contract
        const totalSupply = await getTotalSupply(contractAddress);
        console.log(`Total supply: ${totalSupply}`);

        // Determine token range
        const startId = startTokenId || 1;
        const endId = endTokenId || totalSupply;

        let syncedCount = 0;
        let errorCount = 0;

        // Sync tokens in batches
        for (let tokenId = startId; tokenId <= endId; tokenId++) {
            try {
                const nftData = await fetchNFTData(contractAddress, tokenId);
                
                if (nftData) {
                    await saveNFTToSupabase(nftData);
                    syncedCount++;
                    console.log(`Synced token ${tokenId}/${endId}`);
                }
            } catch (error) {
                console.error(`Error syncing token ${tokenId}:`, error.message);
                errorCount++;
            }

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Update sync status
        await supabase
            .from('sync_status')
            .update({
                sync_status: 'completed',
                total_tokens: syncedCount,
                last_sync: new Date().toISOString()
            })
            .eq('contract_address', contractAddress);

        // Log admin action
        await supabase
            .from('admin_logs')
            .insert({
                action: 'sync_nfts',
                details: {
                    contract_address: contractAddress,
                    synced_count: syncedCount,
                    error_count: errorCount,
                    start_token: startId,
                    end_token: endId
                },
                admin_address: ADMIN_ADDRESS
            });

        return {
            success: true,
            syncedCount,
            errorCount,
            totalTokens: endId - startId + 1
        };

    } catch (error) {
        console.error('Sync error:', error);
        
        // Update sync status to error
        await supabase
            .from('sync_status')
            .update({
                sync_status: 'error',
                error_message: error.message
            })
            .eq('contract_address', contractAddress);

        return {
            success: false,
            error: error.message
        };
    }
}

// Get total supply from contract
async function getTotalSupply(contractAddress) {
    const response = await fetch(ALCHEMY_BASE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_call',
            params: [
                {
                    to: contractAddress,
                    data: '0x18160ddd' // totalSupply() function selector
                },
                'latest'
            ],
            id: 1
        })
    });

    const data = await response.json();
    return parseInt(data.result, 16);
}

// Fetch NFT data from Alchemy
async function fetchNFTData(contractAddress, tokenId) {
    try {
        // Get token URI
        const tokenUriResponse = await fetch(ALCHEMY_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_call',
                params: [
                    {
                        to: contractAddress,
                        data: `0xc87b56dd${tokenId.toString(16).padStart(64, '0')}` // tokenURI(uint256)
                    },
                    'latest'
                ],
                id: 1
            })
        });

        const tokenUriData = await tokenUriResponse.json();
        const tokenUri = tokenUriData.result;

        if (!tokenUri || tokenUri === '0x') {
            console.log(`No token URI for token ${tokenId}`);
            return null;
        }

        // Decode token URI
        const decodedUri = decodeTokenUri(tokenUri);
        
        // Fetch metadata
        const metadataResponse = await fetch(decodedUri);
        const metadata = await metadataResponse.json();

        // Convert image to base64 if it's a URL
        let imageBase64 = null;
        if (metadata.image) {
            try {
                const imageResponse = await fetch(metadata.image);
                const imageBuffer = await imageResponse.arrayBuffer();
                imageBase64 = `data:image/png;base64,${Buffer.from(imageBuffer).toString('base64')}`;
            } catch (error) {
                console.error(`Error converting image to base64 for token ${tokenId}:`, error);
            }
        }

        // Extract categories from attributes
        const categories = extractCategories(metadata.attributes || []);

        // Calculate rarity score
        const rarityScore = calculateRarityScore(metadata.attributes || []);

        return {
            token_id: tokenId,
            contract_address: contractAddress,
            name: metadata.name || `Token #${tokenId}`,
            description: metadata.description || '',
            image_url: metadata.image || '',
            image_base64: imageBase64,
            attributes: metadata.attributes || [],
            categories: categories,
            rarity_score: rarityScore,
            supply: 1
        };

    } catch (error) {
        console.error(`Error fetching NFT data for token ${tokenId}:`, error);
        return null;
    }
}

// Decode token URI from hex
function decodeTokenUri(hexUri) {
    try {
        // Remove 0x prefix and convert to string
        const hex = hexUri.slice(2);
        let result = '';
        for (let i = 0; i < hex.length; i += 2) {
            const hexByte = hex.substr(i, 2);
            const charCode = parseInt(hexByte, 16);
            if (charCode !== 0) {
                result += String.fromCharCode(charCode);
            }
        }
        return result;
    } catch (error) {
        console.error('Error decoding token URI:', error);
        return null;
    }
}

// Extract categories from attributes
function extractCategories(attributes) {
    const categoryMap = {
        'Background': 'background',
        'Character': 'character',
        'Accessory': 'accessories',
        'Clothing': 'clothing',
        'Special': 'special',
        'Glitch': 'glitch'
    };

    const categories = new Set();
    
    attributes.forEach(attr => {
        if (attr.trait_type && categoryMap[attr.trait_type]) {
            categories.add(categoryMap[attr.trait_type]);
        }
    });

    return Array.from(categories);
}

// Calculate rarity score based on attributes
function calculateRarityScore(attributes) {
    // Simple rarity calculation - can be improved
    let score = 0;
    
    attributes.forEach(attr => {
        if (attr.value) {
            // Higher score for rarer values
            const value = attr.value.toString().toLowerCase();
            if (value.includes('legendary') || value.includes('mythic')) {
                score += 100;
            } else if (value.includes('rare') || value.includes('epic')) {
                score += 50;
            } else if (value.includes('uncommon')) {
                score += 25;
            } else {
                score += 10;
            }
        }
    });

    return score;
}

// Save NFT data to Supabase
async function saveNFTToSupabase(nftData) {
    const { error } = await supabase
        .from('nft_metadata')
        .upsert({
            token_id: nftData.token_id,
            contract_address: nftData.contract_address,
            name: nftData.name,
            description: nftData.description,
            image_url: nftData.image_url,
            image_base64: nftData.image_base64,
            attributes: nftData.attributes,
            categories: nftData.categories,
            rarity_score: nftData.rarity_score,
            supply: nftData.supply,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'token_id,contract_address'
        });

    if (error) {
        throw new Error(`Error saving NFT to Supabase: ${error.message}`);
    }
}

// Get NFT data from Supabase
async function getNFTs(filters = {}) {
    let query = supabase
        .from('nft_metadata')
        .select('*');

    // Apply filters
    if (filters.categories && filters.categories.length > 0) {
        query = query.overlaps('categories', filters.categories);
    }

    if (filters.contractAddress) {
        query = query.eq('contract_address', filters.contractAddress);
    }

    if (filters.minRarity) {
        query = query.gte('rarity_score', filters.minRarity);
    }

    if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    // Apply sorting
    if (filters.sortBy) {
        const direction = filters.sortDirection || 'desc';
        query = query.order(filters.sortBy, { ascending: direction === 'asc' });
    } else {
        query = query.order('rarity_score', { ascending: false });
    }

    // Apply pagination
    if (filters.limit) {
        query = query.limit(filters.limit);
    }

    if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
    }

    const { data, error } = await query;

    if (error) {
        throw new Error(`Error fetching NFTs: ${error.message}`);
    }

    return data;
}

// Get categories from Supabase
async function getCategories() {
    const { data, error } = await supabase
        .from('trait_categories')
        .select('*')
        .order('name');

    if (error) {
        throw new Error(`Error fetching categories: ${error.message}`);
    }

    return data;
}

module.exports = {
    syncNFTData,
    getNFTs,
    getCategories,
    CONTRACTS
};
