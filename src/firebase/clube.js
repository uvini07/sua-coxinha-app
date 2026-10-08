// FIRESTORE — os dados do clube de cada cliente
//
// Formato:
//
//   usuarios/{uid}                     perfil + saldo + progresso das missões
//   usuarios/{uid}/historico/{id}      extrato de pontos
//   usuarios/{uid}/vouchers/{id}       recompensas resgatadas
//   usuarios/{uid}/notificacoes/{id}   avisos do clube
//   telefones/{e164}                   reserva do número → uid do dono
//
// Saldo é dinheiro: toda escrita que mexe em pontos passa por uma transação,
// para que duas abas abertas (ou o caixa e o app ao mesmo tempo) não gravem
// uma sobre a outra. O cliente nunca "calcula" o saldo novo — ele manda o
// delta e o Firestore soma com `increment`.

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from './app.js'

const refUsuario = (uid) => doc(db, 'usuarios', uid)
const refColecao = (uid, nome) => collection(db, 'usuarios', uid, nome)

// Código de identificação no caixa. Derivado do uid para que seja sempre o
// mesmo em qualquer aparelho, sem precisar de outra coleção para garantir
// unicidade — o uid já é único.
function codigoDoCliente(uid) {
  let a = 0
  let b = 0
  for (let i = 0; i < uid.length; i++) {
    const c = uid.charCodeAt(i)
    if (i % 2) b = (b * 31 + c) % 10000
    else a = (a * 31 + c) % 10000
  }
  const p = (n) => String(n).padStart(4, '0')
  return `PD-${p(a)}-${p(b)}`
}

// Máscara brasileira para exibir o telefone que veio do Firebase em E.164.
function telefoneLegivel(e164) {
  if (!e164) return ''
  const d = String(e164).replace(/\D/g, '').replace(/^55/, '')
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return e164
}

// Conta nova entra com tudo zerado. Esta é a regra: ninguém começa com pontos.
export const PERFIL_ZERADO = {
  saldo: 0,
  pendentes: 0,
  aExpirar: 0,
  acumulado: 0,
  resgates: 0,
  missoes: {},
  cadastroCompleto: false,
}

// Cria o documento do cliente no primeiro login e devolve se ele é novo.
// `merge: true` com `setDoc` só nos campos de identidade: assim um login pelo
// Google depois de um login por telefone completa o perfil em vez de apagá-lo.
export async function garantirPerfil(user) {
  const ref = refUsuario(user.uid)

  return runTransaction(db, async (tx) => {
    const atual = await tx.get(ref)

    const identidade = {}
    if (user.phoneNumber) {
      identidade.telefoneE164 = user.phoneNumber
      identidade.telefone = telefoneLegivel(user.phoneNumber)
    }
    if (user.email) identidade.email = user.email
    if (user.photoURL) identidade.foto = user.photoURL

    if (atual.exists()) {
      // Não sobrescreve nome/telefone que o cliente já ajustou no app.
      const faltando = Object.fromEntries(
        Object.entries(identidade).filter(([chave]) => !atual.get(chave)),
      )
      if (Object.keys(faltando).length) {
        tx.update(ref, { ...faltando, atualizadoEm: serverTimestamp() })
      }
      return { novo: false, cadastroCompleto: !!atual.get('cadastroCompleto') }
    }

    const nome = user.displayName || ''
    tx.set(ref, {
      ...PERFIL_ZERADO,
      ...identidade,
      nome,
      primeiroNome: nome.trim().split(' ')[0] || '',
      cpf: '',
      nascimento: '',
      unidade: 'cajamar',
      codigo: codigoDoCliente(user.uid),
      provedores: user.providerData.map((p) => p.providerId),
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    })
    return { novo: true, cadastroCompleto: false }
  })
}

export function observarPerfil(uid, aoMudar, aoFalhar) {
  return onSnapshot(refUsuario(uid), (snap) => aoMudar(snap.exists() ? snap.data() : null), aoFalhar)
}

// Histórico, vouchers e notificações: sempre do mais novo para o mais velho.
// O limite existe para que uma conta de anos não baixe tudo no celular.
export function observarColecao(uid, nome, aoMudar, aoFalhar, quantidade = 200) {
  const consulta = query(refColecao(uid, nome), orderBy('criadoEm', 'desc'), limit(quantidade))
  return onSnapshot(
    consulta,
    (snap) => aoMudar(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    aoFalhar,
  )
}

// RESERVA DO TELEFONE
//
// Sem login por SMS, nada impede duas pessoas de digitarem o mesmo número — e
// como o caixa identifica o cliente pelo telefone, número repetido credita
// ponto na conta errada. A unicidade passa a vir daqui: `telefones/{e164}` é
// um documento por número, e a regra do Firestore só deixa criar o que ainda
// não existe. O primeiro que reivindica fica com ele.
//
// Não dá para "perguntar antes" se o número está livre: ler a coleção deixaria
// qualquer cliente logado descobrir quais telefones estão no clube. Então a
// tentativa de escrita é a própria checagem, e a recusa vira 'telefone-em-uso'.
export async function reservarTelefone(uid, e164) {
  try {
    await setDoc(doc(db, 'telefones', e164), { uid, criadoEm: serverTimestamp() })
  } catch (erro) {
    if (erro.code === 'permission-denied') {
      const meu = new Error('telefone-em-uso')
      meu.code = 'telefone-em-uso'
      throw meu
    }
    throw erro
  }
}

export function liberarTelefone(e164) {
  return deleteDoc(doc(db, 'telefones', e164))
}

export function salvarPerfil(uid, campos) {
  return updateDoc(refUsuario(uid), { ...campos, atualizadoEm: serverTimestamp() })
}

// Compra identificada no caixa: credita pontos e lança no extrato.
export async function creditarCompra(uid, { pontos, valor, unidade, detalhe }) {
  const lancamento = doc(refColecao(uid, 'historico'))
  const lote = writeBatch(db)

  lote.update(refUsuario(uid), {
    saldo: increment(pontos),
    acumulado: increment(pontos),
    atualizadoEm: serverTimestamp(),
  })
  lote.set(lancamento, {
    tipo: 'ganho',
    titulo: 'Compra na Sua Coxinha',
    detalhe,
    pontos,
    valor,
    unidade,
    data: new Date().toISOString().slice(0, 10),
    criadoEm: serverTimestamp(),
  })

  await lote.commit()
  return pontos
}

// Resgate: a transação é obrigatória aqui. Sem ela, dois toques rápidos no
// botão gerariam dois vouchers com um saldo que só paga um.
export async function resgatarRecompensa(uid, recompensa, codigo) {
  const refVoucher = doc(refColecao(uid, 'vouchers'))
  const refLancamento = doc(refColecao(uid, 'historico'))

  const voucher = await runTransaction(db, async (tx) => {
    const snap = await tx.get(refUsuario(uid))
    if (!snap.exists()) throw new Error('perfil-inexistente')
    if ((snap.get('saldo') || 0) < recompensa.pontos) return null

    const dados = {
      recompensaId: recompensa.id,
      nome: recompensa.nome,
      descricao: recompensa.descricao,
      imagem: recompensa.imagem,
      pontos: recompensa.pontos,
      codigo,
      estado: 'disponivel',
      validade: 'Vence em 7 dias',
      criadoEm: serverTimestamp(),
    }

    tx.update(refUsuario(uid), {
      saldo: increment(-recompensa.pontos),
      resgates: increment(1),
      atualizadoEm: serverTimestamp(),
    })
    tx.set(refVoucher, dados)
    tx.set(refLancamento, {
      tipo: 'resgate',
      titulo: 'Resgate de recompensa',
      detalhe: recompensa.nome,
      pontos: -recompensa.pontos,
      data: new Date().toISOString().slice(0, 10),
      criadoEm: serverTimestamp(),
    })

    return { id: refVoucher.id, ...dados, criadoEm: Date.now() }
  })

  return voucher
}

// Avança uma missão e, se ela fechar, paga o bônus. Transação pelo mesmo
// motivo do resgate: o bônus não pode cair duas vezes.
export async function avancarMissaoNoBanco(uid, base) {
  const refLancamento = doc(refColecao(uid, 'historico'))

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(refUsuario(uid))
    if (!snap.exists()) return null

    const salvas = snap.get('missoes') || {}
    const atual = salvas[base.id] || { feito: 0, concluida: false }
    if (atual.concluida) return null

    const feito = Math.min(base.meta, (atual.feito || 0) + 1)
    const concluida = feito >= base.meta

    const campos = {
      [`missoes.${base.id}`]: { feito, concluida },
      atualizadoEm: serverTimestamp(),
    }
    if (concluida) {
      campos.saldo = increment(base.recompensa)
      campos.acumulado = increment(base.recompensa)
      tx.set(refLancamento, {
        tipo: 'bonus',
        titulo: 'Missão Dourada concluída',
        detalhe: base.titulo,
        pontos: base.recompensa,
        data: new Date().toISOString().slice(0, 10),
        criadoEm: serverTimestamp(),
      })
    }
    tx.update(refUsuario(uid), campos)

    return { feito, concluida, bonus: concluida ? base.recompensa : 0 }
  })
}

export function marcarVoucherUsado(uid, id) {
  return updateDoc(doc(db, 'usuarios', uid, 'vouchers', id), {
    estado: 'utilizado',
    usadoEm: serverTimestamp(),
  })
}

export async function marcarNotificacoesLidas(uid, ids) {
  if (!ids.length) return
  const lote = writeBatch(db)
  ids.forEach((id) => lote.update(doc(db, 'usuarios', uid, 'notificacoes', id), { nova: false }))
  await lote.commit()
}

// Zera a conta mantendo o login: apaga extrato, vouchers, avisos e devolve o
// saldo a zero. É o "reiniciar demonstração" da tela de configurações.
export async function zerarConta(uid) {
  for (const nome of ['historico', 'vouchers', 'notificacoes']) {
    const snap = await getDocs(refColecao(uid, nome))
    for (let i = 0; i < snap.docs.length; i += 400) {
      const lote = writeBatch(db)
      snap.docs.slice(i, i + 400).forEach((d) => lote.delete(d.ref))
      await lote.commit()
    }
  }
  await updateDoc(refUsuario(uid), {
    saldo: 0,
    pendentes: 0,
    aExpirar: 0,
    acumulado: 0,
    resgates: 0,
    missoes: {},
    atualizadoEm: serverTimestamp(),
  })
}

// Apaga a conta inteira (perfil incluído). Fica disponível para a exigência de
// exclusão de dados da LGPD e das lojas de aplicativo.
export async function apagarConta(uid) {
  const snap = await getDoc(refUsuario(uid))
  const e164 = snap.exists() ? snap.get('telefoneE164') : null
  await zerarConta(uid)
  await deleteDoc(refUsuario(uid))
  // Libera o número para que a pessoa consiga voltar ao clube depois.
  if (e164) await liberarTelefone(e164)
}

export { codigoDoCliente, telefoneLegivel }
