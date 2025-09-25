# 🚀 Builder Battle - Setup Instructions

## ✅ Configuración Completada

### 1. **Supabase** ✅
- **URL**: `https://ngfroppprerduwnyyewi.supabase.co`
- **API Key**: `sb_publishable_SF3FSZ-yXWXLpZq2v5M3lg_eS-OmcDD`
- **Admin Address**: `0x4943407105999e3E97EFA2035F5cbC64D72581C6`

### 2. **GitHub Pages** 🔄
- **URL**: `https://adriangallery.github.io/adrianzero-1/bb/`
- **Status**: Pendiente de habilitar

## 🔧 Pasos Restantes

### **A. Habilitar GitHub Pages**
1. Ve a tu repositorio: `https://github.com/adriangallery/adrianzero-1`
2. Click en **Settings** > **Pages**
3. En **Source**, selecciona **Deploy from a branch**
4. Selecciona **main** branch y carpeta **/bb**
5. Click **Save**

### **B. Configurar Supabase RLS**
1. Ve a tu proyecto Supabase: `https://ngfroppprerduwnyyewi.supabase.co`
2. Ve a **SQL Editor**
3. Ejecuta el archivo `supabase-setup.sql`
4. Ve a **Settings** > **API**
5. Añade a **Site URL**: `https://adriangallery.github.io`
6. Añade a **Additional redirect URLs**: `https://adriangallery.github.io/adrianzero-1/bb/`

### **C. Probar la Aplicación**
1. Una vez habilitado GitHub Pages, ve a: `https://adriangallery.github.io/adrianzero-1/bb/`
2. Conecta tu wallet MetaMask
3. Prueba votar y añadir participantes (si eres admin)

## 🎯 Funcionalidades

- ✅ **Votación**: Los usuarios pueden votar por participantes
- ✅ **Administración**: Solo la dirección `0x4943407105999e3E97EFA2035F5cbC64D72581C6` puede administrar
- ✅ **Persistencia**: Todo se guarda en Supabase
- ✅ **Compartir**: URLs individuales para cada participante
- ✅ **Meta tags**: Optimizado para redes sociales

## 🔄 Migración desde Vercel

Una vez que confirmes que la versión estática funciona:
1. **Probar** todas las funcionalidades
2. **Verificar** que los datos se guardan correctamente
3. **Confirmar** que el compartir en redes sociales funciona
4. **Eliminar** el directorio `builderbattle/` (versión de Vercel)

## 📱 URLs Importantes

- **Aplicación principal**: `https://adriangallery.github.io/adrianzero-1/bb/`
- **Participante específico**: `https://adriangallery.github.io/adrianzero-1/bb/?participant=1`
- **Supabase Dashboard**: `https://ngfroppprerduwnyyewi.supabase.co`

## 🆘 Troubleshooting

### **Error de CORS**
- Verificar que los dominios estén añadidos en Supabase Settings > API

### **Error de RLS**
- Verificar que las políticas estén creadas correctamente

### **Error de conexión**
- Verificar que las credenciales en `config.js` sean correctas

### **Error de wallet**
- Verificar que MetaMask esté instalado y conectado
