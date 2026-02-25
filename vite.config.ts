import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(() => {
  const proxyTarget = process.env.VITE_PROXY_TARGET || 'http://localhost:9230';

  return {
    server: {
      // App runs on 9229 (DB planned for 9009).
      port: 9229,
      host: '0.0.0.0',
      strictPort: true,
      hmr: {
        port: 9229,
        host: 'localhost',
      },
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
    plugins: [
      react(),
      ...(process.env.ANALYZE_BUNDLE === 'true'
        ? [
            visualizer({
              filename: './dist/stats.html',
              gzipSize: true,
              brotliSize: true,
            }),
          ]
        : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
  };
});
