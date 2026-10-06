import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.jsx'
import { ClubeProvider } from './estado/ClubeProvider.jsx'
import { registrarServiceWorker } from './pwa/registrar.js'

import './estilos/tokens.css'
import './estilos/base.css'
import './estilos/componentes.css'
import './estilos/telas.css'

createRoot(document.getElementById('raiz')).render(
  <StrictMode>
    <ClubeProvider>
      <App />
    </ClubeProvider>
  </StrictMode>,
)

registrarServiceWorker()
