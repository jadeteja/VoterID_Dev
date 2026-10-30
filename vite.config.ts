import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-voters-json',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith('/data/ward81_voters.json') || req.url?.startsWith('/ward81_voters.json')) {
            const filePath = path.resolve(__dirname, 'public/data/ward81_voters.json');
            if (fs.existsSync(filePath)) {
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              fs.createReadStream(filePath).pipe(res);
              return;
            }
          }
          next();
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
