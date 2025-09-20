// Backend proxy para OpenSea API
// Este archivo maneja la API key de forma segura

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de OpenSea
const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY;
const OPENSEA_BASE_URL = 'https://api.opensea.io/api/v2';

// Función para hacer requests a OpenSea
async function makeOpenSeaRequest(endpoint) {
    const url = `${OPENSEA_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
        headers: {
            'X-API-KEY': OPENSEA_API_KEY,
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`OpenSea API error: ${response.status} - ${response.statusText}`);
    }

    return await response.json();
}

// Endpoints del proxy

// Información de la colección
app.get('/api/collection/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const data = await makeOpenSeaRequest(`/chain/ethereum/contract/${address}`);
        res.json(data);
    } catch (error) {
        console.error('Error fetching collection:', error);
        res.status(500).json({ error: error.message });
    }
});

// Estadísticas de la colección
app.get('/api/collection/:address/stats', async (req, res) => {
    try {
        const { address } = req.params;
        const data = await makeOpenSeaRequest(`/collections/${address}/stats`);
        res.json(data);
    } catch (error) {
        console.error('Error fetching collection stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// NFTs de la colección
app.get('/api/collection/:address/nfts', async (req, res) => {
    try {
        const { address } = req.params;
        const { limit = 20, offset = 0 } = req.query;
        const data = await makeOpenSeaRequest(`/chain/ethereum/contract/${address}/nfts?limit=${limit}&offset=${offset}`);
        res.json(data);
    } catch (error) {
        console.error('Error fetching NFTs:', error);
        res.status(500).json({ error: error.message });
    }
});

// Eventos de la colección
app.get('/api/collection/:address/events', async (req, res) => {
    try {
        const { address } = req.params;
        const { limit = 50 } = req.query;
        const data = await makeOpenSeaRequest(`/events/collection/${address}?limit=${limit}`);
        res.json(data);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: error.message });
    }
});

// Listings
app.get('/api/listings', async (req, res) => {
    try {
        const { contract_address, limit = 20 } = req.query;
        const data = await makeOpenSeaRequest(`/orders/ethereum/seaport/listings?asset_contract_address=${contract_address}&limit=${limit}`);
        res.json(data);
    } catch (error) {
        console.error('Error fetching listings:', error);
        res.status(500).json({ error: error.message });
    }
});

// Ofertas
app.get('/api/offers', async (req, res) => {
    try {
        const { contract_address, limit = 20 } = req.query;
        const data = await makeOpenSeaRequest(`/orders/ethereum/seaport/offers?asset_contract_address=${contract_address}&limit=${limit}`);
        res.json(data);
    } catch (error) {
        console.error('Error fetching offers:', error);
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        hasApiKey: !!OPENSEA_API_KEY
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 AdrianLAB API Proxy running on port ${PORT}`);
    console.log(`🔑 API Key configured: ${OPENSEA_API_KEY ? 'Yes' : 'No'}`);
});

module.exports = app;
