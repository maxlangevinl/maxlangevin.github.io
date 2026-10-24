import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Se publica como versiones/v7/ en GitHub Pages: rutas relativas.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: '../v7', emptyOutDir: true, chunkSizeWarningLimit: 1600 },
});
