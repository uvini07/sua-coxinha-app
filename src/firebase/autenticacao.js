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

import { Capacitor } from '@capacitor/core'
import { FirebaseAuthentication } from '@capacitor-firebase/authentication'
import {
  GoogleAuthProvider,
  OAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithCredential,
  signInWithPopup,
  signInWithRedirect,
  deleteUser,
  signOut,
} from 'firebase/auth'
import { auth } from './app.js'

// Na web o login é do navegador. Dentro do app das lojas ele TEM de ser nativo:
// o Google recusa OAuth em WebView embutida (erro `disallowed_useragent`), e
// tanto o popup quanto o redirect do SDK web morrem ali — o popup não existe e
// o redirect não tem como voltar para `capacitor://localhost`, que não é um
// domínio que o Firebase aceite autorizar.
//
// Então no nativo quem abre a tela de login é o plugin, usando a conta do
// próprio aparelho. Ele devolve os tokens, e a credencial é montada aqui com o
// SDK do app — assim o Firestore e o resto do código continuam vendo uma sessão
// normal do `firebase/auth`, sem saber de onde ela veio.
const nativo = () => Capacitor.isNativePlatform()

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

// Navegador embutido fora do Capacitor (o WebView do Instagram, por exemplo):
// não há popup, mas o redirect ainda funciona porque a origem é um domínio de
// verdade, autorizado no Firebase.
const semPopup = () => /\bwv\b|FBAN|FBAV|Instagram/i.test(navigator.userAgent)

// Caminho nativo: o plugin abre o seletor de contas do aparelho e devolve os
// tokens; o `signInWithCredential` transforma isso na sessão que o app usa.
async function entrarNativo(nome) {
  const resultado =
    nome === 'apple'
      ? await FirebaseAuthentication.signInWithApple({ skipNativeAuth: false })
      : await FirebaseAuthentication.signInWithGoogle({ skipNativeAuth: false })

  const { idToken, nonce, accessToken } = resultado.credential || {}
  if (!idToken) throw new Error('sem-credencial-nativa')

  const credencial =
    nome === 'apple'
      ? new OAuthProvider('apple.com').credential({ idToken, rawNonce: nonce })
      : GoogleAuthProvider.credential(idToken, accessToken)

  const { user } = await signInWithCredential(auth, credencial)
  return user
}

async function entrarCom(nome) {
  const provedor = PROVEDORES[nome]
  if (!provedor) throw new Error(`provedor desconhecido: ${nome}`)

  if (nativo()) return entrarNativo(nome)

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
  if (nativo()) return null
  try {
    const resultado = await getRedirectResult(auth)
    return resultado?.user || null
  } catch {
    return null
  }
}

export async function sairDaConta() {
  // No nativo a sessão existe em dois lugares: no plugin (conta do aparelho) e
  // no SDK web. Encerrar só um deixaria o próximo login entrar sozinho na conta
  // anterior, sem passar pelo seletor.
  if (nativo()) {
    try {
      await FirebaseAuthentication.signOut()
    } catch {
      /* se o plugin já estava deslogado, segue */
    }
  }
  await signOut(auth)
}

// Exclui a conta de login (o registro no Firebase Authentication). Os dados
// do clube têm de ser apagados antes: sem sessão, as regras não deixam.
// Se o login for antigo, o Firebase recusa com `auth/requires-recent-login`;
// quem chama decide o que fazer.
export async function excluirUsuario() {
  if (auth.currentUser) await deleteUser(auth.currentUser)
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
  'sem-credencial-nativa': 'O login do aparelho não devolveu as credenciais. Tente de novo.',
  'auth/too-many-requests': 'Muitas tentativas. Espere alguns minutos e tente novamente.',
  'permission-denied': 'O servidor recusou a operação. Confira as regras do Firestore no console.',
  'saldo-insuficiente': 'Seu saldo não cobre esta recompensa. Atualize a tela e confira os pontos.',
  'catalogo-ausente': 'O catálogo de recompensas ainda não foi publicado. Avise a Sua Coxinha.',
  'membro-existente': 'Esse e-mail já está cadastrado na equipe.',
  'telefone-em-uso': 'Esse telefone já está em uso por outra conta do clube.',
  unavailable: 'Sem conexão com o servidor. Seus dados aparecem assim que a internet voltar.',
}

export function mensagemDeErro(erro) {
  if (!erro) return ''
  return MENSAGENS[erro.code] || MENSAGENS[erro.message] || 'Não deu certo agora. Tente de novo em instantes.'
}
