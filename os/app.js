// Configuración de la aplicación AdrianLAB - API temporalmente deshabilitada
class AdrianLABApp {
    constructor() {
        // Configuración básica sin API
        this.config = {
            COLLECTION: {
                CONTRACT_ADDRESS: '0x90546848474FB3c9fda3fdAd887969bB244E7e58'
            }
        };
        
        this.apiKey = null; // API deshabilitada temporalmente
        this.contractAddress = this.config.COLLECTION.CONTRACT_ADDRESS;
        this.apiBaseUrl = null; // API deshabilitada
        this.proxyUrl = null; // Proxy deshabilitado
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.currentTab = 'overview';
        this.nfts = [];
        this.collection = null;
        this.events = [];
        this.listings = [];
        this.offers = [];
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.showApiDisabledMessage();
        this.showStatus('🚀 AdrianLAB App iniciada (API deshabilitada)', 'success');
    }

    showApiDisabledMessage() {
        const container = document.querySelector('.container');
        if (container) {
            const message = document.createElement('div');
            message.className = 'alert alert-warning';
            message.innerHTML = `
                <h4>⚠️ API Temporalmente Deshabilitada</h4>
                <p>La integración con OpenSea está temporalmente deshabilitada para evitar rate limiting.</p>
                <p>La funcionalidad se restaurará más adelante.</p>
            `;
            container.insertBefore(message, container.firstChild);
        }
    }

    setupEventListeners() {
        // Navegación de tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Tabs del marketplace
        document.querySelectorAll('.market-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchMarketTab(e.target.dataset.market);
            });
        });

        // Búsqueda de NFTs
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchNFTs(e.target.value);
            });
        }

        // Ordenamiento de NFTs
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortNFTs(e.target.value);
            });
        }

        // Filtro de eventos
        const eventTypeFilter = document.getElementById('eventTypeFilter');
        if (eventTypeFilter) {
            eventTypeFilter.addEventListener('change', (e) => {
                this.filterEvents(e.target.value);
            });
        }

        // Rango de tiempo para analytics
        const timeRange = document.getElementById('timeRange');
        if (timeRange) {
            timeRange.addEventListener('change', (e) => {
                this.updateAnalytics(e.target.value);
            });
        }

        // Modal
        const modal = document.getElementById('nftModal');
        const closeBtn = document.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    switchTab(tabName) {
        // Ocultar todos los tabs
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        // Mostrar tab seleccionado
        document.getElementById(tabName).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        this.currentTab = tabName;

        // Cargar datos específicos del tab
        switch (tabName) {
            case 'nfts':
                this.loadNFTs();
                break;
            case 'marketplace':
                this.loadMarketplaceData();
                break;
            case 'events':
                this.loadEvents();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
        }
    }

    switchMarketTab(tabName) {
        document.querySelectorAll('.market-section').forEach(section => {
            section.classList.remove('active');
        });
        document.querySelectorAll('.market-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        document.getElementById(tabName).classList.add('active');
        document.querySelector(`[data-market="${tabName}"]`).classList.add('active');
    }

    async loadCollectionData() {
        try {
            this.showStatus('Cargando información de la colección...', 'info');
            
            // Cargar información de la colección usando el proxy
            const collectionResponse = await this.proxyCall(`/collection/${this.contractAddress}`);
            this.collection = collectionResponse.contract;
            
            // Cargar estadísticas de la colección
            const statsResponse = await this.proxyCall(`/collection/${this.contractAddress}/stats`);
            const stats = statsResponse.stats;
            
            // Actualizar UI
            this.updateCollectionInfo();
            this.updateCollectionStats(stats);
            
            this.showStatus('✅ Información de la colección cargada', 'success');
            
        } catch (error) {
            console.error('Error cargando colección:', error);
            this.showStatus(`❌ Error cargando colección: ${error.message}`, 'error');
            this.loadExampleData();
        }
    }

    async loadNFTs() {
        try {
            this.showStatus('Cargando NFTs...', 'info');
            
            const response = await this.proxyCall(`/collection/${this.contractAddress}/nfts?limit=${this.itemsPerPage}&offset=${(this.currentPage - 1) * this.itemsPerPage}`);
            this.nfts = response.nfts || [];
            
            this.displayNFTs(this.nfts);
            this.updatePagination();
            
            this.showStatus(`✅ ${this.nfts.length} NFTs cargados`, 'success');
            
        } catch (error) {
            console.error('Error cargando NFTs:', error);
            this.showStatus(`❌ Error cargando NFTs: ${error.message}`, 'error');
            this.loadExampleNFTs();
        }
    }

    async loadMarketplaceData() {
        try {
            this.showStatus('Cargando datos del marketplace...', 'info');
            
            // Cargar listings
            const listingsResponse = await this.proxyCall(`/listings?contract_address=${this.contractAddress}&limit=20`);
            this.listings = listingsResponse.orders || [];
            
            // Cargar ofertas
            const offersResponse = await this.proxyCall(`/offers?contract_address=${this.contractAddress}&limit=20`);
            this.offers = offersResponse.orders || [];
            
            this.displayListings(this.listings);
            this.displayOffers(this.offers);
            
            this.showStatus('✅ Datos del marketplace cargados', 'success');
            
        } catch (error) {
            console.error('Error cargando marketplace:', error);
            this.showStatus(`❌ Error cargando marketplace: ${error.message}`, 'error');
        }
    }

    async loadEvents() {
        try {
            this.showStatus('Cargando eventos...', 'info');
            
            const response = await this.proxyCall(`/collection/${this.contractAddress}/events?limit=50`);
            this.events = response.asset_events || [];
            
            this.displayEvents(this.events);
            
            this.showStatus(`✅ ${this.events.length} eventos cargados`, 'success');
            
        } catch (error) {
            console.error('Error cargando eventos:', error);
            this.showStatus(`❌ Error cargando eventos: ${error.message}`, 'error');
        }
    }

    async loadAnalytics() {
        try {
            this.showStatus('Cargando analytics...', 'info');
            
            // Cargar estadísticas de la colección para analytics
            const response = await this.proxyCall(`/collection/${this.contractAddress}/stats`);
            const stats = response.stats;
            
            this.updateAnalyticsData(stats);
            this.createPriceChart(stats);
            
            this.showStatus('✅ Analytics cargados', 'success');
            
        } catch (error) {
            console.error('Error cargando analytics:', error);
            this.showStatus(`❌ Error cargando analytics: ${error.message}`, 'error');
        }
    }

    async apiCall(endpoint) {
        const url = `${this.apiBaseUrl}${endpoint}`;
        
        const response = await fetch(url, {
            headers: {
                'X-API-KEY': this.apiKey,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('API Key inválida o faltante');
            } else if (response.status === 429) {
                throw new Error('Límite de rate excedido');
            } else {
                throw new Error(`Error de API: ${response.status} - ${response.statusText}`);
            }
        }

        return await response.json();
    }

    async proxyCall(endpoint) {
        console.log('API deshabilitada temporalmente:', endpoint);
        throw new Error('API deshabilitada temporalmente');
    }

    updateCollectionInfo() {
        if (!this.collection) return;

        document.getElementById('collectionName').textContent = this.collection.name || 'AdrianLAB';
        document.getElementById('collectionDescription').textContent = this.collection.description || 'Colección NFT de AdrianLAB';
        document.getElementById('collectionWebsite').innerHTML = this.collection.external_link ? 
            `<a href="${this.collection.external_link}" target="_blank">${this.collection.external_link}</a>` : 'No disponible';
        document.getElementById('collectionTwitter').innerHTML = this.collection.twitter_username ? 
            `<a href="https://twitter.com/${this.collection.twitter_username}" target="_blank">@${this.collection.twitter_username}</a>` : 'No disponible';
    }

    updateCollectionStats(stats) {
        if (!stats) return;

        document.getElementById('totalSupply').textContent = stats.total_supply || '0';
        document.getElementById('owners').textContent = stats.num_owners || '0';
        document.getElementById('floorPrice').textContent = stats.floor_price ? 
            `${parseFloat(stats.floor_price).toFixed(4)} ETH` : 'N/A';
        document.getElementById('volume').textContent = stats.total_volume ? 
            `${parseFloat(stats.total_volume).toFixed(2)} ETH` : '0 ETH';
    }

    displayNFTs(nfts) {
        const grid = document.getElementById('nftsGrid');
        
        if (nfts.length === 0) {
            grid.innerHTML = '<div class="text-center"><p>No se encontraron NFTs</p></div>';
            return;
        }

        grid.innerHTML = nfts.map(nft => `
            <div class="nft-card" onclick="app.showNFTDetails('${nft.identifier}', '${nft.contract}')">
                <img class="nft-image" 
                     src="${nft.image_url || 'https://via.placeholder.com/280x250?text=Sin+Imagen'}" 
                     alt="${nft.name || `Token #${nft.identifier}`}"
                     onerror="this.src='https://via.placeholder.com/280x250?text=Error+Imagen'">
                <div class="nft-info">
                    <div class="nft-name">${nft.name || `Token #${nft.identifier}`}</div>
                    <div class="nft-token-id">Token ID: ${nft.identifier}</div>
                    <div class="nft-price">Click para ver detalles</div>
                    ${nft.traits ? this.renderTraits(nft.traits) : ''}
                </div>
            </div>
        `).join('');
    }

    renderTraits(traits) {
        if (!traits || traits.length === 0) return '';
        
        return `
            <div class="nft-attributes">
                ${traits.slice(0, 3).map(trait => `
                    <div class="attribute">
                        <span class="attribute-trait">${trait.trait_type}:</span>
                        <span class="attribute-value">${trait.value}</span>
                    </div>
                `).join('')}
                ${traits.length > 3 ? `<div class="attribute"><span class="attribute-trait">+${traits.length - 3} más...</span></div>` : ''}
            </div>
        `;
    }

    showNFTDetails(tokenId, contractAddress) {
        const nft = this.nfts.find(n => n.identifier === tokenId && n.contract === contractAddress);
        if (!nft) return;

        const modal = document.getElementById('nftModal');
        const content = document.getElementById('nftModalContent');
        
        content.innerHTML = `
            <div class="nft-details">
                <img src="${nft.image_url || 'https://via.placeholder.com/400x400?text=Sin+Imagen'}" 
                     alt="${nft.name || `Token #${tokenId}`}" 
                     style="width: 100%; max-width: 400px; border-radius: 15px; margin-bottom: 20px;">
                
                <h2>${nft.name || `Token #${tokenId}`}</h2>
                <p><strong>Token ID:</strong> ${tokenId}</p>
                <p><strong>Contrato:</strong> ${contractAddress}</p>
                <p><strong>Estándar:</strong> ${nft.token_standard || 'ERC721'}</p>
                
                ${nft.description ? `<p><strong>Descripción:</strong> ${nft.description}</p>` : ''}
                
                ${nft.traits && nft.traits.length > 0 ? `
                    <h3>Atributos</h3>
                    <div class="traits-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin: 20px 0;">
                        ${nft.traits.map(trait => `
                            <div style="background: #f8f9fa; padding: 10px; border-radius: 8px; text-align: center;">
                                <div style="font-weight: 600; color: #667eea;">${trait.trait_type}</div>
                                <div style="color: #333;">${trait.value}</div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                <div style="margin-top: 20px;">
                    <a href="${nft.opensea_url || '#'}" target="_blank" class="btn btn-primary">
                        <i class="fab fa-opensea"></i> Ver en OpenSea
                    </a>
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
    }

    displayListings(listings) {
        const grid = document.getElementById('listingsGrid');
        
        if (listings.length === 0) {
            grid.innerHTML = '<div class="text-center"><p>No hay listings activos</p></div>';
            return;
        }

        grid.innerHTML = listings.map(listing => `
            <div class="market-item">
                <h4>Token #${listing.protocol_data?.parameters?.offer?.[0]?.identifier || 'N/A'}</h4>
                <div class="market-price">
                    ${this.formatPrice(listing.current_price)}
                </div>
                <div class="market-details">
                    <strong>Vendedor:</strong> ${this.formatAddress(listing.maker?.address)}
                </div>
                <div class="market-details">
                    <strong>Expira:</strong> ${this.formatDate(listing.expiration_time)}
                </div>
            </div>
        `).join('');
    }

    displayOffers(offers) {
        const grid = document.getElementById('offersGrid');
        
        if (offers.length === 0) {
            grid.innerHTML = '<div class="text-center"><p>No hay ofertas activas</p></div>';
            return;
        }

        grid.innerHTML = offers.map(offer => `
            <div class="market-item">
                <h4>Token #${offer.protocol_data?.parameters?.offer?.[0]?.identifier || 'N/A'}</h4>
                <div class="market-price">
                    ${this.formatPrice(offer.current_price)}
                </div>
                <div class="market-details">
                    <strong>Ofertante:</strong> ${this.formatAddress(offer.maker?.address)}
                </div>
                <div class="market-details">
                    <strong>Expira:</strong> ${this.formatDate(offer.expiration_time)}
                </div>
            </div>
        `).join('');
    }

    displayEvents(events) {
        const container = document.getElementById('eventsList');
        
        if (events.length === 0) {
            container.innerHTML = '<div class="text-center"><p>No hay eventos recientes</p></div>';
            return;
        }

        container.innerHTML = events.map(event => `
            <div class="event-item">
                <div class="event-info">
                    <div class="event-type">${this.getEventTypeName(event.event_type)}</div>
                    <div class="event-details">
                        Token #${event.asset?.token_id || 'N/A'} - 
                        ${event.asset?.name || 'NFT'}
                    </div>
                </div>
                <div class="event-time">
                    ${this.formatDate(event.created_date)}
                </div>
            </div>
        `).join('');
    }

    updateAnalyticsData(stats) {
        if (!stats) return;

        document.getElementById('avgPrice').textContent = stats.average_price ? 
            `${parseFloat(stats.average_price).toFixed(4)} ETH` : 'N/A';
        document.getElementById('maxPrice').textContent = stats.highest_price ? 
            `${parseFloat(stats.highest_price).toFixed(4)} ETH` : 'N/A';
        document.getElementById('minPrice').textContent = stats.floor_price ? 
            `${parseFloat(stats.floor_price).toFixed(4)} ETH` : 'N/A';
    }

    createPriceChart(stats) {
        const ctx = document.getElementById('priceChart');
        if (!ctx) return;

        // Datos de ejemplo para el gráfico
        const data = {
            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
            datasets: [{
                label: 'Precio Floor (ETH)',
                data: [0.1, 0.15, 0.12, 0.18, 0.22, stats.floor_price || 0.2],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4
            }]
        };

        new Chart(ctx, {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Evolución del Precio Floor'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    searchNFTs(query) {
        if (!query) {
            this.displayNFTs(this.nfts);
            return;
        }

        const filtered = this.nfts.filter(nft => 
            (nft.name && nft.name.toLowerCase().includes(query.toLowerCase())) ||
            nft.identifier.includes(query)
        );

        this.displayNFTs(filtered);
    }

    sortNFTs(sortBy) {
        const sorted = [...this.nfts].sort((a, b) => {
            switch (sortBy) {
                case 'token_id':
                    return parseInt(a.identifier) - parseInt(b.identifier);
                case 'name':
                    return (a.name || '').localeCompare(b.name || '');
                case 'rarity':
                    return (b.traits?.length || 0) - (a.traits?.length || 0);
                default:
                    return 0;
            }
        });

        this.displayNFTs(sorted);
    }

    filterEvents(eventType) {
        if (!eventType) {
            this.displayEvents(this.events);
            return;
        }

        const filtered = this.events.filter(event => 
            event.event_type === eventType
        );

        this.displayEvents(filtered);
    }

    updatePagination() {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;

        const totalPages = Math.ceil(this.nfts.length / this.itemsPerPage);
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let html = '';
        
        // Botón anterior
        html += `<button ${this.currentPage === 1 ? 'disabled' : ''} onclick="app.changePage(${this.currentPage - 1})">Anterior</button>`;
        
        // Números de página
        for (let i = 1; i <= totalPages; i++) {
            html += `<button class="${i === this.currentPage ? 'active' : ''}" onclick="app.changePage(${i})">${i}</button>`;
        }
        
        // Botón siguiente
        html += `<button ${this.currentPage === totalPages ? 'disabled' : ''} onclick="app.changePage(${this.currentPage + 1})">Siguiente</button>`;
        
        pagination.innerHTML = html;
    }

    changePage(page) {
        this.currentPage = page;
        this.loadNFTs();
    }

    showStatus(message, type = 'info') {
        const statusContainer = document.getElementById('status');
        const className = `status-${type}`;
        statusContainer.innerHTML = `<div class="status-message ${className}">${message}</div>`;
        
        // Auto-hide después de 5 segundos
        setTimeout(() => {
            statusContainer.innerHTML = '';
        }, 5000);
    }

    formatPrice(price) {
        if (!price) return 'N/A';
        return `${(parseInt(price) / 1e18).toFixed(4)} ETH`;
    }

    formatAddress(address) {
        if (!address) return 'N/A';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    formatDate(timestamp) {
        if (!timestamp) return 'N/A';
        return new Date(timestamp * 1000).toLocaleDateString('es-ES');
    }

    getEventTypeName(eventType) {
        const types = {
            'sale': 'Venta',
            'transfer': 'Transferencia',
            'listing': 'Listado',
            'offer': 'Oferta',
            'bid': 'Puja'
        };
        return types[eventType] || eventType;
    }

    openOpenSea() {
        window.open(`https://opensea.io/collection/${this.contractAddress}`, '_blank');
    }

    // Datos de ejemplo para cuando la API no esté disponible
    loadExampleData() {
        this.collection = {
            name: 'AdrianLAB',
            description: 'Colección NFT experimental de AdrianLAB',
            external_link: 'https://adrianzero.com',
            twitter_username: 'adrianzero'
        };

        this.updateCollectionInfo();
        this.updateCollectionStats({
            total_supply: 1000,
            num_owners: 150,
            floor_price: '0.05',
            total_volume: '25.5'
        });
    }

    loadExampleNFTs() {
        this.nfts = [
            {
                identifier: '1',
                contract: this.contractAddress,
                name: 'AdrianLAB #1',
                description: 'Primer NFT de la colección AdrianLAB',
                image_url: 'https://via.placeholder.com/280x250?text=AdrianLAB+1',
                token_standard: 'ERC721',
                traits: [
                    { trait_type: 'Rareza', value: 'Común' },
                    { trait_type: 'Color', value: 'Azul' },
                    { trait_type: 'Tipo', value: 'Experimental' }
                ]
            },
            {
                identifier: '2',
                contract: this.contractAddress,
                name: 'AdrianLAB #2',
                description: 'Segundo NFT de la colección AdrianLAB',
                image_url: 'https://via.placeholder.com/280x250?text=AdrianLAB+2',
                token_standard: 'ERC721',
                traits: [
                    { trait_type: 'Rareza', value: 'Raro' },
                    { trait_type: 'Color', value: 'Rojo' },
                    { trait_type: 'Tipo', value: 'Especial' }
                ]
            }
        ];

        this.displayNFTs(this.nfts);
    }
}

// Inicializar la aplicación cuando se carga la página
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new AdrianLABApp();
});

// Funciones globales para los botones
function loadCollectionData() {
    app.loadCollectionData();
}

function openOpenSea() {
    app.openOpenSea();
}
