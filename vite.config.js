import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' deixa o build funcionar tanto na web quanto empacotado pelo Capacitor,
// onde os arquivos são servidos de um caminho local e não da raiz do domínio.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { host: true, port: 5180 },
  build: {
    target: 'es2020',
    assetsDir: 'estaticos',
    // O SDK do Firebase pesa mais que o app inteiro. Em pedaço separado ele
    // fica no cache do navegador entre deploys, em vez de ser baixado de novo
    // a cada mudança de tela.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
            return 'firebase'
          }
          return undefined
        },
      },
    },
  },
})
