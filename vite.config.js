import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/dieta2025/',
  server: { port: Number(process.env.PORT) || 5173 },
});
