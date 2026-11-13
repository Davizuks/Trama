/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const server = 'http://127.0.0.1:4747'

export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    proxy: { '/api': { target: server, changeOrigin: true, ws: true } },
  },
  build: { outDir: 'dist', emptyOutDir: true },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
})
