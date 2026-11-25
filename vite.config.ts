import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        // Raise the warning threshold — we now have many small chunks instead of one giant one
        chunkSizeWarningLimit: 600,
        rollupOptions: {
          output: {
            manualChunks(id) {
              // React core — loaded first, cached forever
              if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/scheduler/')) {
                return 'react-vendor';
              }
              // Animation library
              if (id.includes('node_modules/motion/')) {
                return 'motion';
              }
              // Supabase client
              if (id.includes('node_modules/@supabase/')) {
                return 'supabase';
              }
              // Chart.js + react-chartjs-2 — only needed in AdminDashboard
              if (id.includes('node_modules/chart.js/') || id.includes('node_modules/react-chartjs-2/')) {
                return 'charts';
              }
              // Markdown rendering + DOMPurify — only needed when dashboard content is shown
              if (id.includes('node_modules/react-markdown/') || id.includes('node_modules/dompurify/') || id.includes('node_modules/remark') || id.includes('node_modules/rehype') || id.includes('node_modules/unified') || id.includes('node_modules/micromark') || id.includes('node_modules/mdast') || id.includes('node_modules/hast') || id.includes('node_modules/vfile') || id.includes('node_modules/bail') || id.includes('node_modules/is-plain-obj') || id.includes('node_modules/trough') || id.includes('node_modules/extend')) {
                return 'markdown';
              }
              // Zustand state management — tiny, but keep separate for caching
              if (id.includes('node_modules/zustand/')) {
                return 'zustand';
              }
              // All other node_modules into a shared vendors chunk
              if (id.includes('node_modules/')) {
                return 'vendors';
              }
            }
          }
        }
      }
    };
});
