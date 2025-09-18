# 🔧 Configurar GitHub Secret para SVG Saving

## **Paso 1: Generar GitHub Token**

1. Ve a [https://github.com/settings/tokens](https://github.com/settings/tokens)
2. Click en "Generate new token (classic)"
3. **Nombre**: `TraitCreator SVG Save`
4. **Expiración**: `No expiration` (o 90 días)
5. **Permisos necesarios**:
   - ☑️ `repo` (Full control of private repositories)
   - ☑️ `workflow` (Update GitHub Action workflows)

## **Paso 2: Configurar Secret en el Repositorio**

1. Ve a tu repositorio: [https://github.com/adriangallery/adrianzero](https://github.com/adriangallery/adrianzero)
2. Click en **Settings** (pestaña)
3. En el menú lateral, click en **Secrets and variables** → **Actions**
4. Click en **New repository secret**
5. **Name**: `SVG_SAVE_TOKEN`
6. **Value**: Pega tu token generado
7. Click **Add secret**

## **Paso 3: Configurar en Vercel (Opcional)**

Si usas Vercel, también puedes configurar la variable de entorno:

1. Ve a tu proyecto en [Vercel](https://vercel.com)
2. **Settings** → **Environment Variables**
3. **Name**: `SVG_SAVE_TOKEN`
4. **Value**: Tu token
5. **Environment**: Production, Preview, Development
6. Click **Add**

## **✅ Verificación**

Una vez configurado:

1. El token se cargará automáticamente desde GitHub Secrets
2. No necesitas modificar ningún archivo de código
3. El SVG saving funcionará desde `adrianzero.com/traitcreator/`
4. Los archivos se guardarán en `adrianzero.com/designs/{tokenId}.svg`

## **🔒 Seguridad**

- ✅ El token nunca aparece en el código
- ✅ Solo se usa en el servidor
- ✅ Fácil de rotar sin tocar código
- ✅ Acceso controlado por GitHub

## **🚀 ¡Listo!**

Después de configurar el secret, el sistema funcionará automáticamente sin configuración adicional. 