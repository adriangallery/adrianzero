# OpenSea Test - Adrian Zero

Aplicación de prueba para integración con la API de OpenSea, desarrollada para explorar y mostrar NFTs de la dirección de wallet de Adrian Zero.

## 🚀 Características

- **Visualización de NFTs**: Muestra todos los NFTs asociados a la dirección de Adrian Zero
- **Búsqueda específica**: Busca NFTs individuales por contrato y token ID
- **Ofertas y Listings**: Visualiza ofertas y listings activos para NFTs específicos
- **Estadísticas**: Muestra contadores de NFTs totales, colecciones y ofertas
- **Interfaz responsive**: Diseño moderno y adaptable

## 🔧 Configuración

### API Key de OpenSea

Para usar la funcionalidad completa, necesitas configurar tu API key de OpenSea:

1. Obtén una API key de [OpenSea Developer Portal](https://docs.opensea.io/reference/api-keys)
2. Reemplaza `YOUR_OPENSEA_API_KEY_HERE` en el archivo `index.html` con tu API key real
3. En producción, considera usar variables de entorno para mayor seguridad

### Dirección de Wallet

La aplicación está configurada para mostrar NFTs de la dirección:
```
0x6e369bf0e4e0c106192d606fb6d85836d684da75
```

## 📋 Funcionalidades Implementadas

Basado en el `getting-started.md` guide, la aplicación incluye:

### ✅ Completado
- **Fetching NFTs**: Obtención de NFTs por cuenta usando `getNFTsByAccount`
- **NFT Details**: Vista detallada de NFTs individuales
- **Fetching Orders**: Obtención de ofertas y listings usando `getOrders`
- **Error Handling**: Manejo de errores y datos de ejemplo
- **Responsive UI**: Interfaz moderna y responsive

### 🔄 Funcionalidades del SDK Disponibles
- **Making Offers**: `openseaSDK.createOffer()` - Crear ofertas en NFTs
- **Making Listings**: `openseaSDK.createListing()` - Crear listings para vender
- **Buying Items**: `openseaSDK.fulfillOrder()` - Comprar NFTs
- **Accepting Offers**: Aceptar ofertas en NFTs propios
- **Collection Offers**: Ofertas en colecciones completas

## 🎯 Uso

1. Abre `index.html` en tu navegador
2. Haz clic en "Cargar NFTs" para ver los NFTs de Adrian Zero
3. Usa "Buscar NFT Específico" para buscar NFTs individuales
4. Explora las ofertas y listings disponibles
5. Las estadísticas se actualizan automáticamente

## 🛠️ Tecnologías

- **HTML5/CSS3**: Estructura y estilos
- **JavaScript ES6+**: Lógica de aplicación
- **OpenSea API v2**: Integración con OpenSea
- **Fetch API**: Llamadas HTTP
- **CSS Grid/Flexbox**: Layout responsive

## 📝 Notas Técnicas

- La aplicación incluye datos de ejemplo que se muestran si la API no está disponible
- Manejo de errores para diferentes códigos de respuesta (401, 429, etc.)
- Límite de 50 NFTs por carga inicial
- Formato de precios en ETH con 4 decimales

## 🔗 Enlaces Útiles

- [OpenSea API Documentation](https://docs.opensea.io/)
- [OpenSea SDK](https://github.com/ProjectOpenSea/opensea-js)
- [Getting Started Guide](./getting-started.md)

## 👨‍💻 Desarrollador

**Adrian Zero**  
Dirección: `0x6e369bf0e4e0c106192d606fb6d85836d684da75`

---

*Esta aplicación es una demostración técnica de integración con OpenSea API.*
