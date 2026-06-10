import { defineConfig } from 'vite';

// En dev, on proxifie les appels /api vers le backend Express (port 5000)
// pour éviter les soucis de CORS et garder des URLs relatives dans le code.
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.BACKEND_URL || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
