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
          'web3-vendor': ['ethers', 'wagmi', 'viem', '@rainbow-me/rainbowkit'],
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
    include: ['react', 'react-dom', 'ethers', 'wagmi'],
  },
})
