import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: { port: 3000, strictPort: true },
  plugins: [react()],
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.js$/, // allow JSX in .js while we migrate
  },
});