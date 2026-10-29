import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Plugin to mirror static directory into dist/static and preserve exact asset references
function preserveStaticPlugin() {
  return {
    name: 'preserve-static-plugin',
    closeBundle() {
      const srcDir = path.resolve(__dirname, 'static');
      const destDir = path.resolve(__dirname, 'dist', 'static');
      if (fs.existsSync(srcDir)) {
        fs.cpSync(srcDir, destDir, { recursive: true });
      }

      const distIndex = path.resolve(__dirname, 'dist', 'index.html');
      if (fs.existsSync(distIndex)) {
        let content = fs.readFileSync(distIndex, 'utf-8');
        // Restore exact static logo paths
        content = content.replace(/srcset="\/assets\/logo-[^"]+\.avif"/g, 'srcset="/static/images/logo.avif"');
        content = content.replace(/srcset="\/assets\/logo-[^"]+\.webp"/g, 'srcset="/static/images/logo.webp"');
        content = content.replace(/src="\/assets\/logo-[^"]+\.png"/g, 'src="/static/images/logo.png"');
        fs.writeFileSync(distIndex, content, 'utf-8');
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), preserveStaticPlugin()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/static': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/paper.pdf': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
