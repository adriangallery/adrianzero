// Supabase configuration for Trait Gallery
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Contract addresses
const CONTRACTS = {
    ADRIANZERO: '0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea', // AdrianZERO contract
    TRAITLAB: '0x...', // TraitLAB contract (to be updated)
    FLOPPY: '0x...', // Floppy contract (to be updated)
};

// Alchemy configuration
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const ALCHEMY_BASE_URL = `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

module.exports = {
    supabase,
    CONTRACTS,
    ALCHEMY_BASE_URL,
    ALCHEMY_API_KEY
};
