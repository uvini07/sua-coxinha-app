// Ponto único de inicialização do Firebase.
//
// `getApps()` evita reinicializar no hot-reload do Vite e no StrictMode, que
// monta os componentes duas vezes em desenvolvimento.

import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'
import { firebaseConfig } from './config.js'

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

export const auth = getAuth(app)
// Cache persistente no aparelho (IndexedDB). Ao reabrir o app, o Firestore
// mostra o que já tinha guardado e, nas consultas retomadas, só cobra pelo que
// mudou — em vez de reler perfil, extrato e vouchers inteiros a cada abertura.
// Se o navegador não suportar (modo privado, IndexedDB bloqueado) ou o
// Firestore já tiver sido iniciado (hot-reload), cai no modo normal.
function iniciarFirestore() {
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    })
  } catch {
    return getFirestore(app)
  }
}

export const db = iniciarFirestore()

// O idioma vale para as telas de login do Google e da Apple.
auth.languageCode = 'pt-BR'

// Analytics só carrega onde é suportado (não funciona no WebView do Capacitor
// nem em modo privado) e nunca em desenvolvimento, para não poluir os dados.
export async function iniciarAnalytics() {
  if (import.meta.env.DEV) return null
  try {
    const { getAnalytics, isSupported } = await import('firebase/analytics')
    if (!(await isSupported())) return null
    return getAnalytics(app)
  } catch {
    return null
  }
}
