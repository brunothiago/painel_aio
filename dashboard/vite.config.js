import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages: repositório "painel_aio" → https://usuario.github.io/painel_aio/
// Para publicar na raiz do domínio, use: base: '/'
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || '/painel_aio/',
});
