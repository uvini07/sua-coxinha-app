// CONFIGURAÇÃO DO FIREBASE
//
// Esta configuração é pública por natureza: ela viaja no bundle do navegador e
// o Firebase foi desenhado assim. O que protege os dados são as regras do
// Firestore (firestore.rules) e as regras de autenticação — não o segredo
// destas chaves.
//
// Os valores abaixo são o padrão do projeto `suacoxinhaapp`. Para apontar o app
// para outro projeto (staging, por exemplo), crie um `.env.local` com as
// variáveis VITE_FIREBASE_* — elas têm prioridade.

const env = import.meta.env

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyA1Be025Mhp9mcPOgCaJDml_dtIUP4hgwk',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'suacoxinhaapp.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'suacoxinhaapp',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'suacoxinhaapp.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '132936922966',
  appId: env.VITE_FIREBASE_APP_ID || '1:132936922966:web:c9e8685a094b8715a908f7',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || 'G-3QD746LZ4E',
}
