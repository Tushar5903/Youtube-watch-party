import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // This stops the 1,000+ errors by excluding the icon library from pre-bundling
    exclude: ['@tabler/icons-react']
  }
})