import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  
  build: {
    // Otimizações para produção
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs em produção
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      }
    },
    
    // Otimização de chunks
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom']
        }
      }
    },
    
    // Compressão e otimização
    cssCodeSplit: true,
    sourcemap: false, // Desabilitar sourcemaps em produção
    chunkSizeWarningLimit: 1000,
    
    // Cache busting
    assetsInlineLimit: 4096
  },
  
  // Server config
  server: {
    port: 5173,
    strictPort: true,
    host: true
  },
  
  preview: {
    port: 4173,
    strictPort: true,
    host: true
  }
});
