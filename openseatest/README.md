# AdrianZERO - OpenSea API Integration

Este proyecto integra la API de OpenSea para mostrar datos de la colección AdrianZERO.

## 🔑 Configuración de API Key

### 1. Obtener API Key de OpenSea

1. Ve a [OpenSea API Keys](https://opensea.io/account/api-keys)
2. Inicia sesión con tu cuenta
3. Crea una nueva API key
4. Copia la clave generada

### 2. Configurar en GitHub Secrets

Para usar la API key de forma segura en producción:

#### **Opción A: GitHub Secrets (Recomendado)**

1. Ve a tu repositorio en GitHub: `https://github.com/adriangallery/adrianzero`
2. Ve a **Settings** → **Secrets and variables** → **Actions**
3. Haz clic en **New repository secret**
4. Añade estos secrets:

```
OPENSEA_API_KEY = tu_api_key_aqui
```

#### **Opción B: Variables de Entorno Locales**

Crea un archivo `.env` en la carpeta `openseatest/`:

```bash
OPENSEA_API_KEY=tu_api_key_aqui
```

**⚠️ IMPORTANTE:** Nunca subas el archivo `.env` a GitHub. Añádelo a `.gitignore`.

### 3. Uso en el Código

```javascript
// En el HTML, la API key se almacena localmente
const apiKey = localStorage.getItem('opensea_api_key') || '';

// Para uso en servidor (Node.js)
const apiKey = process.env.OPENSEA_API_KEY;
```

## 🚀 Funcionalidades Implementadas

### ✅ Colección
- Información general de la colección
- Estadísticas (total supply, owners, floor price, volume)
- Metadatos de la colección

### ✅ NFTs
- Lista de NFTs de la colección
- Imágenes y metadatos
- Token IDs y nombres

### ✅ Ofertas (Offers)
- Ofertas activas en la colección
- Precios y expiraciones
- Información del oferente

### ✅ Listings
- Listados activos para venta
- Precios de venta
- Información del vendedor

## 🔧 Endpoints de la API Utilizados

### Collection Data
```
GET /api/v2/collection/{contract_address}
```

### NFTs
```
GET /api/v2/nfts?asset_contract_address={contract_address}&limit=20
```

### Orders (Offers/Listings)
```
GET /api/v2/orders?asset_contract_address={contract_address}&side=offer
GET /api/v2/orders?asset_contract_address={contract_address}&side=listing
```

## 📊 Datos Disponibles

### Collection Stats
- `total_supply`: Total de NFTs en la colección
- `num_owners`: Número de propietarios únicos
- `floor_price`: Precio mínimo actual
- `total_volume`: Volumen total de ventas

### NFT Data
- `token_id`: ID único del token
- `name`: Nombre del NFT
- `image_url`: URL de la imagen
- `description`: Descripción del NFT
- `attributes`: Atributos/traits del NFT

### Order Data
- `current_price`: Precio actual
- `maker`: Dirección del creador de la orden
- `expiration_time`: Tiempo de expiración
- `side`: Tipo de orden (offer/listing)

## 🛡️ Seguridad

- La API key se almacena localmente en el navegador
- No se envía a servidores externos
- Para producción, usar GitHub Secrets o variables de entorno del servidor

## 🎯 Próximas Funcionalidades

- [ ] Filtros por traits/atributos
- [ ] Búsqueda de NFTs específicos
- [ ] Historial de ventas
- [ ] Gráficos de precios
- [ ] Integración con wallet (MetaMask)
- [ ] Crear ofertas desde la interfaz
- [ ] Notificaciones de cambios de precio

## 📝 Notas

- La API de OpenSea tiene límites de rate limiting
- Plan gratuito: 1 request por segundo
- Plan Pro: 10 requests por segundo
- Algunos endpoints requieren API key para funcionar correctamente
