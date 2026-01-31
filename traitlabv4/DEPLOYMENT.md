# Deployment Guide - TraitLAB V4

## Seguridad: .env y secretos

- **`.env` está en `.gitignore`** — No se sube a GitHub. Las variables sensibles se configuran solo en Vercel (o en tu máquina local).
- No hagas commit de `.env` ni de archivos con claves. Usa siempre `.env.example` como plantilla sin valores reales.

---

## Pasos que debes hacer tú (punto a punto)

### A. Subir el código a GitHub

1. **Si traitlabv4 es una carpeta dentro de otro repo** (como parece por tu `git status`):
   - Opción 1: Añadir solo la carpeta al repo actual:
     ```bash
     cd /ruta/al/repo/padre
     git add traitlabv4/
     git status   # Comprueba que NO aparezca .env
     git commit -m "Add traitlabv4 app"
     git push origin main
     ```
   - Opción 2: Crear un repo nuevo solo para traitlabv4:
     - En GitHub: New repository → nombre `traitlabv4` (o el que quieras).
     - En tu máquina, desde la carpeta del repo padre:
       ```bash
       cd traitlabv4
       git init
       git remote add origin https://github.com/TU_USUARIO/traitlabv4.git
       git add .
       git status   # Comprueba que .env NO esté en la lista
       git commit -m "Initial commit traitlabv4"
       git branch -M main
       git push -u origin main
       ```

2. **Comprobar siempre antes de push**: `git status` no debe mostrar `.env`. Si aparece, no hagas `git add .env` y confirma que `.gitignore` contiene `.env`.

### B. Configurar el deploy en Vercel

1. Entra en [vercel.com](https://vercel.com) e inicia sesión (con GitHub si quieres deploy automático al hacer push).

2. **Add New Project** → **Import Git Repository** y elige el repo donde está traitlabv4.

3. **Configuración del proyecto**:
   - **Root Directory**: Si el repo es solo traitlabv4, déjalo vacío. Si el repo es el padre y traitlabv4 es una subcarpeta, pon `traitlabv4`.
   - **Framework Preset**: Vite (Vercel lo detecta).
   - **Build Command**: `npm run build` (o vacío si usas `vercel.json`).
   - **Output Directory**: `dist`.
   - **Install Command**: `npm install --legacy-peer-deps`.

4. **Variables de entorno** (Settings → Environment Variables). Añade estas para **Production** (y opcionalmente Preview):
   - `VITE_ALCHEMY_API_KEY` = (tu clave Alchemy).
   - `VITE_WALLETCONNECT_PROJECT_ID` = (tu WalletConnect Project ID).
   - `VITE_VERCEL_API_URL` = `https://adrianlab.vercel.app/api` (o la URL de tu API).

5. **Deploy**: Guarda y lanza el deploy. Vercel hará build y te dará una URL.

### C. Después del primer deploy

- Revisa que la app cargue, que la wallet conecte y que no haya errores en la consola del navegador.
- Si cambias variables en Vercel, haz un **Redeploy** desde el dashboard (Deployments → ⋮ → Redeploy).

---

## Pre-Deployment Checklist

- [ ] All environment variables configured (in Vercel, not in repo)
- [ ] Production build successful
- [ ] Bundle size under target (< 200KB main bundle)
- [ ] All modules tested
- [ ] Mobile wallet compatibility verified
- [ ] Error boundaries in place

## Production Build

```bash
# Clean install dependencies
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Build for production
npm run build

# Preview build locally
npm run preview
```

## Environment Variables

Required environment variables for production:

```
VITE_ALCHEMY_API_KEY=<your_key>
VITE_WALLETCONNECT_PROJECT_ID=<your_id>
VITE_VERCEL_API_URL=https://adrianlab.vercel.app/api
```

## Deployment Options

### Option 1: Vercel (Recommended)

#### Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

#### Via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Import Git repository
3. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install --legacy-peer-deps`
4. Add environment variables
5. Deploy

### Option 2: Netlify

#### Netlify CLI

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

#### Build Settings

- Build command: `npm run build`
- Publish directory: `dist`
- Node version: 20.x or higher

### Option 3: GitHub Pages

```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json scripts:
# "deploy": "vite build && gh-pages -d dist"

# Deploy
npm run deploy
```

**Note**: Update `vite.config.ts` with `base: '/repo-name/'` for GitHub Pages.

### Option 4: Cloudflare Pages

1. Connect GitHub repository
2. Build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment variables: Add all VITE_* variables
3. Deploy

## Post-Deployment

### Verification Checklist

- [ ] Homepage loads correctly
- [ ] Wallet connection works (MetaMask, Trust Wallet, etc.)
- [ ] All routes accessible
- [ ] NFT data loads from Alchemy
- [ ] Transaction signing works
- [ ] Mobile responsiveness verified
- [ ] Error handling works correctly
- [ ] Console has no critical errors

### Performance Monitoring

- Check bundle sizes: All chunks under 600KB
- Verify Lighthouse score: Target >90 on mobile
- Test on real mobile devices
- Monitor Web3 RPC response times

### Troubleshooting

**Issue**: Build fails with "Cannot find module"
- Solution: Run `npm install --legacy-peer-deps`

**Issue**: Environment variables not loading
- Solution: Ensure all vars start with `VITE_` prefix

**Issue**: Wallet not connecting
- Solution: Verify WalletConnect Project ID is correct

**Issue**: NFT images not loading
- Solution: Check Alchemy API key and rate limits

## Continuous Deployment

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install --legacy-peer-deps

      - name: Build
        run: npm run build
        env:
          VITE_ALCHEMY_API_KEY: ${{ secrets.VITE_ALCHEMY_API_KEY }}
          VITE_WALLETCONNECT_PROJECT_ID: ${{ secrets.VITE_WALLETCONNECT_PROJECT_ID }}

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## Rollback Procedure

If deployment fails or causes issues:

1. **Vercel**: Rollback to previous deployment in dashboard
2. **Netlify**: Use "Rollback to this deploy" button
3. **Manual**: Redeploy previous git commit

## Support

For deployment issues, check:
- Build logs in deployment platform
- Browser console for runtime errors
- Network tab for API/RPC failures
