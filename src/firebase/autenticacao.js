// AUTENTICAÇÃO — Google e telefone (SMS)
//
// Os dois provedores já estão habilitados no console do Firebase. Aqui mora só
// o que o app precisa: entrar, confirmar código, sair, e traduzir os erros do
// Firebase para frases que um cliente entende.

import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  getRedirectResult,
  onAuthStateChanged,
  signInWithCredential,
  signInWithPhoneNumber,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth'
import { auth } from './app.js'

const google = new GoogleAuthProvider()
// Força a escolha de conta: em aparelho compartilhado, entrar na conta errada
// sem perceber é pior do que um toque a mais.
google.setCustomParameters({ prompt: 'select_account' })

export function observarSessao(aoMudar) {
  return onAuthStateChanged(auth, aoMudar)
}

// Dentro do Capacitor (app das lojas) a janela de popup não existe; lá o fluxo
// é por redirect e o resultado volta na próxima abertura do app.
const semPopup = () =>
  window.location.protocol === 'capacitor:' || /\bwv\b|Capacitor/i.test(navigator.userAgent)

export async function entrarComGoogle() {
  if (semPopup()) {
    await signInWithRedirect(auth, google)
    return null
  }
  try {
    const { user } = await signInWithPopup(auth, google)
    return user
  } catch (erro) {
    // Popup bloqueado pelo navegador: tenta o caminho do redirect.
    if (
      erro.code === 'auth/popup-blocked' ||
      erro.code === 'auth/operation-not-supported-in-this-environment'
    ) {
      await signInWithRedirect(auth, google)
      return null
    }
    throw erro
  }
}

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

// ---- Telefone -------------------------------------------------------------

let verificador = null

// O reCAPTCHA invisível precisa de um elemento no DOM. Criamos um só, fora das
// telas, para que ele sobreviva à navegação entre /entrar e /codigo.
function obterVerificador() {
  if (verificador) return verificador
  let alvo = document.getElementById('recaptcha-telefone')
  if (!alvo) {
    alvo = document.createElement('div')
    alvo.id = 'recaptcha-telefone'
    document.body.appendChild(alvo)
  }
  verificador = new RecaptchaVerifier(auth, alvo, { size: 'invisible' })
  return verificador
}

// Depois de um envio com erro o widget fica "gasto" e o próximo envio falha.
export function limparVerificador() {
  try {
    verificador?.clear()
  } catch {
    /* já estava limpo */
  }
  verificador = null
}

// Aceita o telefone como o usuário digitou e devolve no formato E.164 que o
// Firebase exige. Sem código de país, assume Brasil.
export function paraE164(bruto) {
  const d = String(bruto).replace(/\D/g, '')
  if (!d) return ''
  if (d.startsWith('55')) return `+${d}`
  return `+55${d}`
}

// Devolve o `confirmationResult` do Firebase, que é quem sabe confirmar o
// código. Guardamos ele em memória no provider — não dá para serializar.
export async function enviarCodigo(telefone) {
  try {
    return await signInWithPhoneNumber(auth, paraE164(telefone), obterVerificador())
  } catch (erro) {
    limparVerificador()
    throw erro
  }
}

export async function confirmarCodigo(confirmacao, codigo) {
  const { user } = await confirmacao.confirm(codigo)
  limparVerificador()
  return user
}

// Caminho alternativo: quando o SMS é lido pelo próprio aparelho (Android) e o
// app recebe só a credencial.
export async function entrarComCredencial(credencial) {
  const { user } = await signInWithCredential(auth, credencial)
  return user
}

export function sairDaConta() {
  limparVerificador()
  return signOut(auth)
}

// ---- Erros ----------------------------------------------------------------

const MENSAGENS = {
  'auth/invalid-phone-number': 'Esse número não parece válido. Confira o DDD e tente de novo.',
  'auth/missing-phone-number': 'Digite seu telefone para continuar.',
  'auth/too-many-requests': 'Muitas tentativas. Espere alguns minutos e tente novamente.',
  'auth/quota-exceeded': 'O limite de envios de hoje acabou. Tente mais tarde.',
  'auth/invalid-verification-code': 'Código incorreto. Confira os números do SMS.',
  'auth/code-expired': 'O código expirou. Peça um novo.',
  'auth/popup-closed-by-user': 'A janela do Google foi fechada antes de concluir.',
  'auth/cancelled-popup-request': 'A janela do Google foi fechada antes de concluir.',
  'auth/account-exists-with-different-credential':
    'Esse e-mail já entrou no clube por outro caminho. Use o telefone cadastrado.',
  'auth/network-request-failed': 'Sem conexão. Verifique a internet e tente de novo.',
  'auth/unauthorized-domain': 'Este endereço não está liberado no Firebase (Authentication → Domínios autorizados).',
  'auth/operation-not-allowed': 'Esse método de login não está habilitado no Firebase.',
  'permission-denied': 'Sem permissão para ler seus dados. Confira as regras do Firestore.',
  unavailable: 'Sem conexão com o servidor. Seus dados aparecem assim que a internet voltar.',
}

export function mensagemDeErro(erro) {
  if (!erro) return ''
  return MENSAGENS[erro.code] || 'Não deu certo agora. Tente de novo em instantes.'
}
