import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/tokenizer-playground/',
  test: {
    globals: true,
    environment: 'node',
  },
})
