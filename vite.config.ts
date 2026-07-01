import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Firm dashboards require a single self-contained .html file — no separate
// JS/CSS asset files. viteSingleFile inlines everything into dist/index.html.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  base: './',
  build: {
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
  },
})
