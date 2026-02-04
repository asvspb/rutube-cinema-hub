import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    return {
      server: {
        // App runs on 9229 (DB planned for 9009).
        port: 9229,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://localhost:9230',
            changeOrigin: true,
          }
        },
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
