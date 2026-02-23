import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
    // Prevent duplicate React instances in iframe environments (Figma Make)
    // Also dedupe motion/framer-motion to avoid resolution split
    dedupe: ['react', 'react-dom', 'react-router', 'motion', 'framer-motion'],
  },
  optimizeDeps: {
    // Force all critical deps into the pre-bundle so they resolve
    // to the exact same copy across the entire app
    include: [
      'react',
      'react-dom',
      'react-router',
      'motion',
      'motion/react',
      'framer-motion',
    ],
    // Force Vite to re-prebundle deps (clears stale cache)
    force: true,
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
