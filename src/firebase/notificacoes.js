// NOTIFICAÇÕES PUSH (app nativo)
//
// Quem envia é o servidor (functions/index.js), em dois casos:
//   · o cliente ganhou pontos numa compra  → só para os aparelhos dele
//   · o admin lançou pontos em dobro       → para todo mundo, pelo tópico
//
// Aqui o app só faz a parte dele: pede permissão, guarda o token do aparelho
// no perfil (`usuarios/{uid}.pushTokens`) e se inscreve no tópico. Na web e no
// PWA não há push por enquanto — os avisos aparecem dentro do app.

import { Capacitor } from '@capacitor/core'
import { arrayUnion, doc, updateDoc } from 'firebase/firestore'
import { db } from './app.js'

export const TOPICO_PROMOCOES = 'promocoes'

let ativado = false

// Abre a tela certa ao tocar na notificação (o servidor manda `rota`).
async function ouvirToques(FirebaseMessaging) {
  await FirebaseMessaging.addListener('notificationActionPerformed', (evento) => {
    const rota = evento?.notification?.data?.rota
    if (typeof rota === 'string' && rota.startsWith('/')) window.location.hash = rota
  })
}

export async function ativarPush(uid) {
  if (ativado || !uid || !Capacitor.isNativePlatform()) return false
  ativado = true
  try {
    const { FirebaseMessaging } = await import('@capacitor-firebase/messaging')
    const permissao = await FirebaseMessaging.requestPermissions()
    if (permissao.receive !== 'granted') return false

    await ouvirToques(FirebaseMessaging)
    const { token } = await FirebaseMessaging.getToken()
    if (token) await updateDoc(doc(db, 'usuarios', uid), { pushTokens: arrayUnion(token) })
    await FirebaseMessaging.subscribeToTopic({ topic: TOPICO_PROMOCOES })

    // O token pode mudar (reinstalação, limpeza de dados): guarda o novo.
    await FirebaseMessaging.addListener('tokenReceived', ({ token: novo }) => {
      if (novo) updateDoc(doc(db, 'usuarios', uid), { pushTokens: arrayUnion(novo) }).catch(() => {})
    })
    return true
  } catch {
    // Sem Google Play Services, permissão negada, sem rede: o app segue normal.
    ativado = false
    return false
  }
}
