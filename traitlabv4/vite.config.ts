import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Sin 'web3-vendor' (F11): forzar wagmi/viem/rainbowkit en un chunk metía también sus
          // dependencias, incluidas las 689 cadenas de viem que solo usa @base-org/account (214 KB gz
          // al arrancar). Sin forzarlo, Rollup deja cada módulo en el chunk de quien lo usa.
          'ui-vendor': ['framer-motion'],
          'query-vendor': ['@tanstack/react-query'],
          'state-vendor': ['zustand', 'date-fns'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
    minify: 'esbuild', // Use esbuild for faster builds
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'wagmi',
      '@rainbow-me/rainbowkit',
      '@wagmi/connectors',
      '@metamask/sdk',
      '@walletconnect/ethereum-provider',
    ],
  },
})
