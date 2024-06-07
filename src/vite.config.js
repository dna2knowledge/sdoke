import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '',
  plugins: [react({
    jsxImportSource: '@emotion/react',
  })],
  optimizeDeps: {
    include: ["@emotion/react", "@emotion/styled"],
  },
  resolve: {
    alias: {
      '$': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: path.join('..', 'www'),
  },
})
