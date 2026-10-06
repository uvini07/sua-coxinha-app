import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.jsx'
import { ClubeProvider } from './estado/ClubeProvider.jsx'
import { registrarServiceWorker } from './pwa/registrar.js'
import { acompanharAlturaDaJanela } from './pwa/altura.js'

import './estilos/tokens.css'
import './estilos/base.css'
import './estilos/componentes.css'
import './estilos/telas.css'

// antes de renderizar: a moldura precisa da altura certa no primeiro quadro
acompanharAlturaDaJanela()

createRoot(document.getElementById('raiz')).render(
  <StrictMode>
    <ClubeProvider>
      <App />
    </ClubeProvider>
  </StrictMode>,
)

registrarServiceWorker()
