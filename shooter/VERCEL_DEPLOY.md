# 🚀 Guía de Deploy en Vercel - Shooter Game Onchain

Esta guía te ayudará a deployar tu juego shooter con integración blockchain en Vercel.

## 📋 Prerrequisitos

1. Cuenta en [Vercel](https://vercel.com)
2. Repositorio de GitHub con el código
3. Wallet privada para el backend signer
4. Contratos deployados en Base mainnet

## 🔧 Configuración Paso a Paso

### 1. Preparar el Repositorio

El proyecto ya está configurado con:
- ✅ `vercel.json` optimizado
- ✅ Rutas de archivos corregidas
- ✅ Backend adaptado para serverless functions
- ✅ Configuración de CORS

### 2. Conectar a Vercel

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Haz clic en "Add New Project"
3. Conecta tu repositorio de GitHub
4. Selecciona el repositorio `shooter`

### 3. Configurar Variables de Entorno

En el dashboard de Vercel, ve a **Settings > Environment Variables** y agrega:

#### Variables Requeridas:
```
CONTRACT_ADDRESS=0x90546848474fb3c9fda3fdad887969bb244e7e58
SHOOTER_CONTRACT=0xea1d57fa135b661dd77fb7187e6b366c25fd085f
ADMIN_WALLET=0x4943407105999e3E97EFA2035F5cbC64D72581C6
RPC_URL=https://mainnet.base.org
CHAIN_ID=8453
NODE_ENV=production
BACKEND_SIGNER_KEY=tu_private_key_aqui
```

#### Variables Opcionales:
```
CORS_ORIGIN=https://tu-dominio.vercel.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

### 4. Configuración de Deploy

Vercel detectará automáticamente:
- **Build Command**: No necesario (archivos estáticos)
- **Output Directory**: Raíz del proyecto
- **Install Command**: `npm install` en `onchain/backend/`

### 5. Estructura de URLs

Una vez deployado, tendrás:

- **Juego Principal**: `https://tu-proyecto.vercel.app/`
- **API Backend**: `https://tu-proyecto.vercel.app/api/*`
- **Archivos Estáticos**: 
  - Imágenes: `https://tu-proyecto.vercel.app/images/*`
  - Música: `https://tu-proyecto.vercel.app/music/*`
  - Estilos: `https://tu-proyecto.vercel.app/styles.css`

### 6. Endpoints de API Disponibles

- `GET /api/health` - Health check
- `GET /api/config` - Configuración del juego
- `POST /api/sign-reward` - Firmar recompensas
- `POST /api/submit-score` - Enviar puntuación
- `GET /api/leaderboard` - Tabla de líderes

## 🔒 Seguridad

### Variables Sensibles
- `BACKEND_SIGNER_KEY`: Debe ser una wallet dedicada solo para el backend
- Nunca commitees claves privadas al repositorio
- Usa el sistema de secrets de Vercel para variables sensibles

### CORS Configuration
- Actualiza `CORS_ORIGIN` con tu dominio de Vercel
- Para desarrollo local, también funciona con `http://localhost:3000`

## 🧪 Testing

### Después del Deploy:

1. **Verificar Health Check**:
   ```bash
   curl https://tu-proyecto.vercel.app/api/health
   ```

2. **Probar el Juego**:
   - Visita `https://tu-proyecto.vercel.app/`
   - Conecta tu wallet
   - Verifica que los assets cargan correctamente

3. **Verificar API**:
   ```bash
   curl https://tu-proyecto.vercel.app/api/config
   ```

## 🐛 Troubleshooting

### Problemas Comunes:

1. **Assets no cargan**:
   - Verifica que las rutas en `shooter-onchain.html` usen `/` absoluto
   - Revisa la configuración de rutas en `vercel.json`

2. **Backend no responde**:
   - Verifica variables de entorno en Vercel dashboard
   - Revisa logs en Vercel Functions tab

3. **CORS errors**:
   - Actualiza `CORS_ORIGIN` con tu dominio correcto
   - Verifica headers en `vercel.json`

4. **Wallet connection issues**:
   - Verifica que `BACKEND_SIGNER_KEY` esté configurado
   - Revisa que los contratos estén en la red correcta

## 📝 Logs y Monitoreo

- Ve a tu proyecto en Vercel Dashboard
- Sección **Functions** para logs del backend
- Sección **Deployments** para logs de build

## 🔄 Updates

Para actualizar el deploy:
1. Push cambios a tu repositorio
2. Vercel auto-deployrá automáticamente
3. Verifica en la sección **Deployments**

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs en Vercel Dashboard
2. Verifica que todas las variables de entorno estén configuradas
3. Testea localmente primero con `npm run dev`

---

**Nota**: Este proyecto usa Vercel Serverless Functions para el backend, lo que significa que cada endpoint de API se ejecuta como una función independiente. Esto es perfecto para la escalabilidad pero diferente a un servidor tradicional.
