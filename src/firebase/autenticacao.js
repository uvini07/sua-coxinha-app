// AUTENTICAÇÃO — Google e Apple
//
// Não há login por SMS: cada verificação por SMS é cobrada por mensagem, e com
// o clube no tamanho projetado isso seria quase toda a conta do Firebase.
// Google e Apple não têm custo por uso.
//
// O telefone continua existindo — é por ele que o caixa identifica o cliente —
// mas como campo do cadastro, conferido no balcão na primeira compra. Quem
// garante que ninguém tome o número de outro é a coleção `telefones` com a
// regra em firestore.rules, não o SMS.

import {
  GoogleAuthProvider,
  OAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth'
import { auth } from './app.js'

const google = new GoogleAuthProvider()
// Força a escolha de conta: em aparelho compartilhado, entrar na conta errada
// sem perceber é pior do que um toque a mais.
google.setCustomParameters({ prompt: 'select_account' })

const apple = new OAuthProvider('apple.com')
apple.addScope('email')
apple.addScope('name')

const PROVEDORES = { google, apple }

export function observarSessao(aoMudar) {
  return onAuthStateChanged(auth, aoMudar)
}

// Dentro do Capacitor (app das lojas) a janela de popup não existe; lá o fluxo
// é por redirect e o resultado volta na próxima abertura do app.
const semPopup = () =>
  window.location.protocol === 'capacitor:' || /\bwv\b|Capacitor/i.test(navigator.userAgent)

async function entrarCom(nome) {
  const provedor = PROVEDORES[nome]
  if (!provedor) throw new Error(`provedor desconhecido: ${nome}`)

  if (semPopup()) {
    await signInWithRedirect(auth, provedor)
    return null
  }
  try {
    const { user } = await signInWithPopup(auth, provedor)
    return user
  } catch (erro) {
    // Popup bloqueado pelo navegador: tenta o caminho do redirect.
    if (
      erro.code === 'auth/popup-blocked' ||
      erro.code === 'auth/operation-not-supported-in-this-environment'
    ) {
      await signInWithRedirect(auth, provedor)
      return null
    }
    throw erro
  }
}

export const entrarComGoogle = () => entrarCom('google')
export const entrarComApple = () => entrarCom('apple')

// Chamado uma vez na subida do app, para fechar um login por redirect que
// começou antes de o app ser recarregado.
export async function concluirRedirecionamento() {
  try {
    const resultado = await getRedirectResult(auth)
    return resultado?.user || null
  } catch {
    return null
  }
}

export function sairDaConta() {
  return signOut(auth)
}

// Aceita o telefone como o cliente digitou e devolve em E.164, que é o formato
// que serve de chave na coleção `telefones`. Sem código de país, assume Brasil.
export function paraE164(bruto) {
  const d = String(bruto).replace(/\D/g, '')
  if (!d) return ''
  if (d.startsWith('55')) return `+${d}`
  return `+55${d}`
}

// ---- Erros ----------------------------------------------------------------

const MENSAGENS = {
  'auth/popup-closed-by-user': 'A janela de login foi fechada antes de concluir.',
  'auth/cancelled-popup-request': 'A janela de login foi fechada antes de concluir.',
  'auth/account-exists-with-different-credential':
    'Esse e-mail já entrou no clube por outro caminho. Use o mesmo botão da primeira vez.',
  'auth/network-request-failed': 'Sem conexão. Verifique a internet e tente de novo.',
  'auth/unauthorized-domain':
    'Este endereço não está liberado no Firebase (Authentication → Domínios autorizados).',
  'auth/operation-not-allowed': 'Esse método de login não está habilitado no Firebase.',
  'auth/too-many-requests': 'Muitas tentativas. Espere alguns minutos e tente novamente.',
  'permission-denied': 'Sem permissão para ler seus dados. Confira as regras do Firestore.',
  'telefone-em-uso': 'Esse telefone já está em uso por outra conta do clube.',
  unavailable: 'Sem conexão com o servidor. Seus dados aparecem assim que a internet voltar.',
}

export function mensagemDeErro(erro) {
  if (!erro) return ''
  return MENSAGENS[erro.code] || MENSAGENS[erro.message] || 'Não deu certo agora. Tente de novo em instantes.'
}
