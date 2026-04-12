import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api/paysgator': {
            target: 'https://paysgator.com/api/v1',
            changeOrigin: true,
            secure: false,
            headers: {
              'X-Api-Key': env.PAYSGATOR_API_KEY || 'mk_test_39226af9_08c7386dae020f4e3d6589e0c46c624c123d7722dbe4a03b34426f199fab2579'
            },
            rewrite: (path) => path.replace(/^\/api\/paysgator/, '')
          }
        }
      },
      plugins: [
        react(),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
