import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: process.env.ATLAS_API_URL || 'http://localhost:8080',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
