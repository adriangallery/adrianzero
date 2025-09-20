# AdrianLAB - OpenSea Integration Frontend

Este es un frontend completo que implementa las utilidades de la API de OpenSea para la colección AdrianLAB.

## 🚀 Características

### Funcionalidades Principales
- **Resumen de Colección**: Estadísticas completas, información de la colección y métricas clave
- **Explorador de NFTs**: Visualización de todos los NFTs con búsqueda y filtrado
- **Marketplace**: Listings activos y ofertas en tiempo real
- **Eventos**: Historial de transacciones y actividades
- **Analytics**: Gráficos y estadísticas de precios

### Integración con OpenSea API
- ✅ Información de colección (`/chain/ethereum/contract/{address}`)
- ✅ Estadísticas de colección (`/collections/{address}/stats`)
- ✅ NFTs de la colección (`/chain/ethereum/contract/{address}/nfts`)
- ✅ Eventos de la colección (`/events/collection/{address}`)
- ✅ Listings activos (`/orders/ethereum/seaport/listings`)
- ✅ Ofertas activas (`/orders/ethereum/seaport/offers`)

## 🛠️ Configuración

### Variables de Entorno
La aplicación utiliza la variable de entorno `OPENSEA_API_KEY` que debe estar configurada en GitHub Secrets.

### Configuración Local
1. Clona el repositorio
2. Configura tu API key de OpenSea en `config.js`
3. Abre `index.html` en tu navegador

### Configuración de Producción
1. Configura la variable de entorno `OPENSEA_API_KEY` en GitHub Secrets
2. La aplicación detectará automáticamente la clave del entorno

## 📁 Estructura del Proyecto

```
os/
├── index.html          # Página principal
├── styles.css          # Estilos CSS
├── app.js             # Lógica principal de la aplicación
├── config.js          # Configuración y constantes
└── README.md          # Este archivo
```

## 🎨 Diseño

### Características de UI/UX
- **Responsive Design**: Adaptable a todos los dispositivos
- **Tema Moderno**: Gradientes y sombras elegantes
- **Animaciones Suaves**: Transiciones fluidas entre estados
- **Iconografía**: Font Awesome para iconos consistentes
- **Tipografía**: Segoe UI para mejor legibilidad

### Componentes Principales
- **Header**: Información de la colección y navegación
- **Tabs**: Navegación entre secciones principales
- **Cards**: Presentación de NFTs y datos
- **Modals**: Detalles expandidos de NFTs
- **Charts**: Visualización de datos con Chart.js

## 🔧 API Endpoints Utilizados

### Colección
- `GET /chain/ethereum/contract/{address}` - Información de la colección
- `GET /collections/{address}/stats` - Estadísticas de la colección

### NFTs
- `GET /chain/ethereum/contract/{address}/nfts` - Lista de NFTs
- `GET /chain/ethereum/contract/{address}/nfts/{token_id}` - NFT específico

### Marketplace
- `GET /orders/ethereum/seaport/listings` - Listings activos
- `GET /orders/ethereum/seaport/offers` - Ofertas activas

### Eventos
- `GET /events/collection/{address}` - Eventos de la colección

## 📊 Funcionalidades por Tab

### 1. Resumen
- Estadísticas de la colección (supply, owners, floor price, volumen)
- Información detallada de la colección
- Enlaces a redes sociales y sitio web

### 2. NFTs
- Grid de NFTs con imágenes y metadatos
- Búsqueda por nombre o token ID
- Ordenamiento por diferentes criterios
- Modal con detalles completos y atributos
- Paginación para grandes colecciones

### 3. Marketplace
- Listings activos con precios y vendedores
- Ofertas activas con ofertantes
- Información de expiración
- Enlaces directos a OpenSea

### 4. Eventos
- Historial de transacciones recientes
- Filtrado por tipo de evento
- Información de fechas y participantes
- Detalles de cada transacción

### 5. Analytics
- Gráfico de evolución de precios
- Estadísticas de precios (promedio, máximo, mínimo)
- Métricas de rendimiento de la colección

## 🚨 Manejo de Errores

### Tipos de Errores
- **API Key inválida**: Error 401
- **Rate limit excedido**: Error 429
- **Recurso no encontrado**: Error 404
- **Error de servidor**: Error 500
- **Error de red**: Problemas de conectividad

### Fallbacks
- Datos de ejemplo cuando la API no está disponible
- Imágenes placeholder para NFTs sin imagen
- Mensajes informativos para el usuario

## 🔒 Seguridad

### API Key
- La API key se maneja de forma segura
- No se expone en el código del cliente
- Se utiliza solo para requests del servidor

### Rate Limiting
- Implementación de límites de rate
- Retry automático con backoff exponencial
- Manejo de errores 429

## 📱 Responsive Design

### Breakpoints
- **Desktop**: > 768px - Layout completo
- **Tablet**: 768px - Layout adaptado
- **Mobile**: < 480px - Layout vertical

### Adaptaciones
- Grid responsive para NFTs
- Navegación colapsable en móvil
- Modales adaptados a pantalla pequeña

## 🎯 Próximas Mejoras

### Funcionalidades Planificadas
- [ ] Integración con wallet (MetaMask, WalletConnect)
- [ ] Funcionalidad de compra/venta directa
- [ ] Notificaciones en tiempo real
- [ ] Filtros avanzados de NFTs
- [ ] Exportación de datos
- [ ] Modo oscuro
- [ ] Internacionalización

### Optimizaciones
- [ ] Lazy loading de imágenes
- [ ] Caché de datos
- [ ] Service Worker para offline
- [ ] Compresión de assets

## 🤝 Contribución

### Cómo Contribuir
1. Fork del repositorio
2. Crear rama para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

### Estándares de Código
- Usar ESLint para JavaScript
- Seguir convenciones de naming
- Documentar funciones complejas
- Mantener responsividad

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

**Adrian Zero**
- GitHub: [@adrianzero](https://github.com/adrianzero)
- Twitter: [@adrianzero](https://twitter.com/adrianzero)
- Website: [adrianzero.com](https://adrianzero.com)

## 🙏 Agradecimientos

- [OpenSea](https://opensea.io) por la API
- [Chart.js](https://chartjs.org) por los gráficos
- [Font Awesome](https://fontawesome.com) por los iconos
- Comunidad de desarrolladores Web3

---

**Nota**: Este frontend está diseñado específicamente para la colección AdrianLAB (0x90546848474FB3c9fda3fdAd887969bB244E7e58) pero puede ser adaptado para otras colecciones modificando la configuración en `config.js`.
