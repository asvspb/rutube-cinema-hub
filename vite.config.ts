import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    const proxyTarget = process.env.VITE_PROXY_TARGET || 'http://localhost:9230';

    return {
      server: {
        // App runs on 9229 (DB planned for 9009).
        port: 9229,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: proxyTarget,
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
