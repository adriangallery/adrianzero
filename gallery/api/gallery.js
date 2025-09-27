// Gallery API - Main API for Trait Gallery
const { syncNFTData, getNFTs, getCategories, CONTRACTS } = require('./sync-nfts');
const { supabase } = require('./supabase-config');

// Admin address for authentication
const ADMIN_ADDRESS = '0x4943407105999e3e97efa2035f5cbc64d72581c6';

module.exports = async function handler(req, res) {
    try {
        // Enable CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.status(200).end();
            return;
        }

        if (req.method === 'GET') {
            const { action } = req.query;

            if (action === 'nfts') {
                // Get NFTs with filters
                const filters = {
                    categories: req.query.categories ? req.query.categories.split(',') : null,
                    contractAddress: req.query.contract,
                    minRarity: req.query.minRarity ? parseFloat(req.query.minRarity) : null,
                    search: req.query.search || null,
                    sortBy: req.query.sortBy || 'rarity_score',
                    sortDirection: req.query.sortDirection || 'desc',
                    limit: req.query.limit ? parseInt(req.query.limit) : 20,
                    offset: req.query.offset ? parseInt(req.query.offset) : 0
                };

                const nfts = await getNFTs(filters);
                
                return res.status(200).json({
                    success: true,
                    data: nfts,
                    filters: filters,
                    total: nfts.length
                });
            }

            if (action === 'categories') {
                // Get categories
                const categories = await getCategories();
                
                return res.status(200).json({
                    success: true,
                    data: categories
                });
            }

            if (action === 'stats') {
                // Get gallery statistics
                const { data: nftStats, error: nftError } = await supabase
                    .from('nft_metadata')
                    .select('contract_address, categories, rarity_score');

                if (nftError) {
                    throw new Error(`Error fetching stats: ${nftError.message}`);
                }

                // Calculate stats
                const stats = {
                    totalNFTs: nftStats.length,
                    contracts: {},
                    categories: {},
                    rarityDistribution: {
                        common: 0,
                        uncommon: 0,
                        rare: 0,
                        epic: 0,
                        legendary: 0
                    }
                };

                nftStats.forEach(nft => {
                    // Contract stats
                    if (!stats.contracts[nft.contract_address]) {
                        stats.contracts[nft.contract_address] = 0;
                    }
                    stats.contracts[nft.contract_address]++;

                    // Category stats
                    nft.categories.forEach(category => {
                        if (!stats.categories[category]) {
                            stats.categories[category] = 0;
                        }
                        stats.categories[category]++;
                    });

                    // Rarity distribution
                    const score = nft.rarity_score || 0;
                    if (score >= 100) {
                        stats.rarityDistribution.legendary++;
                    } else if (score >= 75) {
                        stats.rarityDistribution.epic++;
                    } else if (score >= 50) {
                        stats.rarityDistribution.rare++;
                    } else if (score >= 25) {
                        stats.rarityDistribution.uncommon++;
                    } else {
                        stats.rarityDistribution.common++;
                    }
                });

                return res.status(200).json({
                    success: true,
                    data: stats
                });
            }

            if (action === 'sync-status') {
                // Get sync status for all contracts
                const { data: syncStatus, error: syncError } = await supabase
                    .from('sync_status')
                    .select('*')
                    .order('updated_at', { ascending: false });

                if (syncError) {
                    throw new Error(`Error fetching sync status: ${syncError.message}`);
                }

                return res.status(200).json({
                    success: true,
                    data: syncStatus
                });
            }

            // Default: return basic info
            return res.status(200).json({
                success: true,
                message: 'Trait Gallery API',
                endpoints: {
                    'GET ?action=nfts': 'Get NFTs with filters',
                    'GET ?action=categories': 'Get categories',
                    'GET ?action=stats': 'Get gallery statistics',
                    'GET ?action=sync-status': 'Get sync status',
                    'POST /sync': 'Sync NFT data (admin only)',
                    'POST /admin': 'Admin actions (admin only)'
                }
            });
        }

        if (req.method === 'POST') {
            const { action, ...payload } = req.body;

            if (action === 'sync') {
                // Check admin authentication
                const { adminAddress } = payload;
                if (!adminAddress || adminAddress.toLowerCase() !== ADMIN_ADDRESS.toLowerCase()) {
                    return res.status(403).json({ error: 'Unauthorized' });
                }

                const { contractAddress, startTokenId, endTokenId } = payload;
                
                if (!contractAddress) {
                    return res.status(400).json({ error: 'Contract address is required' });
                }

                // Start sync process
                const result = await syncNFTData(contractAddress, startTokenId, endTokenId);
                
                return res.status(200).json({
                    success: result.success,
                    data: result,
                    message: result.success ? 'Sync completed successfully' : 'Sync failed'
                });
            }

            if (action === 'admin') {
                // Check admin authentication
                const { adminAddress, adminAction } = payload;
                if (!adminAddress || adminAddress.toLowerCase() !== ADMIN_ADDRESS.toLowerCase()) {
                    return res.status(403).json({ error: 'Unauthorized' });
                }

                if (adminAction === 'clear-cache') {
                    // Clear all NFT data
                    const { error: deleteError } = await supabase
                        .from('nft_metadata')
                        .delete()
                        .neq('id', 0);

                    if (deleteError) {
                        throw new Error(`Error clearing cache: ${deleteError.message}`);
                    }

                    // Log admin action
                    await supabase
                        .from('admin_logs')
                        .insert({
                            action: 'clear_cache',
                            details: { admin_address: adminAddress },
                            admin_address: adminAddress
                        });

                    return res.status(200).json({
                        success: true,
                        message: 'Cache cleared successfully'
                    });
                }

                if (adminAction === 'add-category') {
                    const { name, displayName, description, color } = payload;
                    
                    if (!name || !displayName) {
                        return res.status(400).json({ error: 'Name and display name are required' });
                    }

                    const { error: insertError } = await supabase
                        .from('trait_categories')
                        .insert({
                            name: name,
                            display_name: displayName,
                            description: description || '',
                            color: color || '#00ffff'
                        });

                    if (insertError) {
                        throw new Error(`Error adding category: ${insertError.message}`);
                    }

                    // Log admin action
                    await supabase
                        .from('admin_logs')
                        .insert({
                            action: 'add_category',
                            details: { name, display_name: displayName },
                            admin_address: adminAddress
                        });

                    return res.status(200).json({
                        success: true,
                        message: 'Category added successfully'
                    });
                }

                if (adminAction === 'get-logs') {
                    // Get admin logs
                    const { data: logs, error: logsError } = await supabase
                        .from('admin_logs')
                        .select('*')
                        .order('created_at', { ascending: false })
                        .limit(100);

                    if (logsError) {
                        throw new Error(`Error fetching logs: ${logsError.message}`);
                    }

                    return res.status(200).json({
                        success: true,
                        data: logs
                    });
                }

                return res.status(400).json({ error: 'Invalid admin action' });
            }

            return res.status(400).json({ error: 'Invalid action' });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('Gallery API Error:', error);
        return res.status(500).json({ 
            success: false,
            error: 'Internal server error',
            message: error.message 
        });
    }
};
