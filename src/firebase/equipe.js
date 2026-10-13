// FIRESTORE — equipe, caixa e painel administrativo
//
// Formato:
//
//   equipe/{email}         franqueado ou funcionário: loja, papel, ativo, meta
//   lojas/{id}             unidades da rede
//   config/regras          pontos por real, teto por compra, metas da equipe
//   config/catalogo        preço em pontos de cada recompensa
//   lancamentos/{id}       livro de auditoria: cada compra e cada voucher
//   missoesEquipe/{id}     missões que o franqueado dispara para a equipe
//
// As regras do Firestore conferem cada escrita daqui (ver firestore.rules).
// Por isso as operações do caixa são lotes: a carteira do cliente, o
// lançamento, o extrato e a meta do funcionário andam juntos ou nada anda.

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from './app.js'

// O dono do app. Precisa bater com `souAdmin()` em firestore.rules.
export const EMAIL_ADMIN = 'marcelinhojordao07@gmail.com'

// Usadas enquanto o admin ainda não salvou as dele no painel.
export const REGRAS_PADRAO = {
  pontosPorReal: 2,
  valorMaximo: 50000, // centavos: R$ 500,00 por compra
  metaPontosPorReal: 1, // pontos de meta da equipe por R$ vendido
  metaPontosPorVoucher: 10, // pontos de meta por voucher validado
}

export const normalizarEmail = (email) => String(email || '').trim().toLowerCase()

// QR Codes que o app gera. O do cliente é fixo (funciona offline); o do
// voucher aponta direto para o documento, sem precisar de busca.
export const qrDoCliente = (uid) => `pd:c:${uid}`
export const qrDoVoucher = (uid, id) => `pd:v:${uid}:${id}`

export function lerQR(texto) {
  const partes = String(texto || '').trim().split(':')
  if (partes[0] !== 'pd') return null
  if (partes[1] === 'c' && partes[2]) return { tipo: 'cliente', uid: partes[2] }
  if (partes[1] === 'v' && partes[2] && partes[3]) return { tipo: 'voucher', uid: partes[2], id: partes[3] }
  return null
}

// "2026-10-08" no fuso do aparelho. Serve para consultar o movimento de um
// dia só com filtros de igualdade — que o Firestore atende sem índice composto.
export const diaDeHoje = (data = new Date()) => {
  const p = (n) => String(n).padStart(2, '0')
  return `${data.getFullYear()}-${p(data.getMonth() + 1)}-${p(data.getDate())}`
}

const lista = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }))

// --- Quem sou eu ----------------------------------------------------------

export function observarMembro(email, aoMudar, aoFalhar) {
  return onSnapshot(
    doc(db, 'equipe', normalizarEmail(email)),
    (snap) => aoMudar(snap.exists() ? { id: snap.id, ...snap.data() } : null),
    aoFalhar,
  )
}

// --- Configuração do clube -------------------------------------------------

export function observarConfig(nome, aoMudar, aoFalhar) {
  return onSnapshot(doc(db, 'config', nome), (snap) => aoMudar(snap.exists() ? snap.data() : null), aoFalhar)
}

export function salvarRegras(regras) {
  return setDoc(doc(db, 'config', 'regras'), { ...regras, atualizadoEm: serverTimestamp() })
}

// `pontos` é um mapa { idDaRecompensa: preço }.
export function salvarCatalogo(pontos) {
  return setDoc(doc(db, 'config', 'catalogo'), { pontos, atualizadoEm: serverTimestamp() })
}

export function observarLojas(aoMudar, aoFalhar) {
  return onSnapshot(collection(db, 'lojas'), (snap) => aoMudar(lista(snap)), aoFalhar)
}

// Para o cliente, a lista de lojas muda raramente (loja nova, endereço) e
// não precisa de tempo real: ler as ~25 lojas a cada abertura do app era a
// maior fatia das leituras. Fica guardada no aparelho por 12 h. A equipe
// continua com `observarLojas`, ao vivo.
const CHAVE_LOJAS = 'pontos-dourados:lojas'
const VALIDADE_LOJAS = 12 * 60 * 60 * 1000

function lerLojasGuardadas() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE_LOJAS) || 'null')
    return salvo && Array.isArray(salvo.lojas) ? salvo : null
  } catch {
    return null
  }
}

export function carregarLojasComCache(aoMudar, aoFalhar) {
  const salvo = lerLojasGuardadas()
  if (salvo) aoMudar(salvo.lojas)
  if (salvo && Date.now() - salvo.em < VALIDADE_LOJAS) return () => {}
  let ativo = true
  getDocs(collection(db, 'lojas'))
    .then((snap) => {
      const lojas = lista(snap)
      try {
        localStorage.setItem(CHAVE_LOJAS, JSON.stringify({ em: Date.now(), lojas }))
      } catch {
        /* sem storage: na próxima abertura lê de novo, só isso */
      }
      if (ativo) aoMudar(lojas)
    })
    .catch((e) => ativo && aoFalhar?.(e))
  return () => {
    ativo = false
  }
}

export function salvarLoja(id, dados) {
  return setDoc(doc(db, 'lojas', id), { ...dados, atualizadoEm: serverTimestamp() }, { merge: true })
}

// --- Metas da equipe ---------------------------------------------------------

// Taxas de meta de uma loja: as que o franqueado escolheu ou, sem elas, o
// padrão da rede. Precisa dar o mesmo que `metaPorReal`/`metaPorVoucher` nas
// regras, senão o lançamento é recusado.
export function metaDaLoja(unidades, loja, regras) {
  const meta = unidades.find((u) => u.id === loja)?.meta || {}
  return {
    pontosPorReal: meta.pontosPorReal ?? regras.metaPontosPorReal,
    pontosPorVoucher: meta.pontosPorVoucher ?? regras.metaPontosPorVoucher,
  }
}

// `updateDoc`, não `setDoc`: o franqueado só pode tocar no campo `meta`.
export function salvarMetaDaLoja(loja, meta) {
  return updateDoc(doc(db, 'lojas', loja), { meta, atualizadoEm: serverTimestamp() })
}

// --- Missões da equipe -------------------------------------------------------

// O que cada tipo de missão conta, a partir dos contadores de `equipe/{email}`.
export const TIPOS_MISSAO = {
  vouchers: { rotulo: 'Vouchers validados', unidade: 'vouchers' },
  compras: { rotulo: 'Compras identificadas', unidade: 'compras' },
  vendas: { rotulo: 'Vendas identificadas (R$)', unidade: 'em vendas' },
}

// Missões prontas: o franqueado escolhe, ajusta o alvo e o prêmio e dispara.
// `alvo` de vendas em centavos.
export const MODELOS_MISSAO = [
  { id: 'leitor-vouchers', titulo: 'Leitor de vouchers', tipo: 'vouchers', alvo: 20, premio: '' },
  { id: 'maratona-vouchers', titulo: 'Maratona de vouchers', tipo: 'vouchers', alvo: 50, premio: '' },
  { id: 'caixa-fiel', titulo: 'Caixa fiel', tipo: 'compras', alvo: 30, premio: '' },
  { id: 'cem-clientes', titulo: '100 clientes no clube', tipo: 'compras', alvo: 100, premio: '' },
  { id: 'vendedor-ouro', titulo: 'Vendedor de ouro', tipo: 'vendas', alvo: 200000, premio: '' },
  { id: 'vendedor-diamante', titulo: 'Vendedor diamante', tipo: 'vendas', alvo: 500000, premio: '' },
]

export function observarMissoesEquipe(loja, aoMudar, aoFalhar) {
  return onSnapshot(
    query(collection(db, 'missoesEquipe'), where('loja', '==', loja)),
    (snap) => {
      const ms = (m) => m.criadoEm?.toMillis?.() ?? Date.now()
      aoMudar(lista(snap).sort((a, b) => ms(b) - ms(a)))
    },
    aoFalhar,
  )
}

// A largada de cada pessoa é o contador dela agora: o progresso é o que
// andar daqui em diante. Quem entrar na equipe depois parte do zero.
export function dispararMissao({ loja, titulo, tipo, alvo, premio, prazo, modelo }, equipe, quemDispara) {
  const base = Object.fromEntries(
    equipe.map((m) => [m.id, { vouchers: m.vouchers || 0, compras: m.compras || 0, vendas: m.vendas || 0 }]),
  )
  return setDoc(doc(collection(db, 'missoesEquipe')), {
    loja,
    titulo: titulo.trim(),
    tipo,
    alvo,
    premio: (premio || '').trim(),
    prazo: prazo || '',
    ativa: true,
    base,
    modelo: modelo || '',
    criadoPor: normalizarEmail(quemDispara),
    criadoEm: serverTimestamp(),
  })
}

export function encerrarMissao(id) {
  return updateDoc(doc(db, 'missoesEquipe', id), { ativa: false, atualizadoEm: serverTimestamp() })
}

export function apagarMissao(id) {
  return deleteDoc(doc(db, 'missoesEquipe', id))
}

// Quanto a pessoa já fez da missão. Nunca negativo (o admin pode zerar a
// meta de alguém depois de uma troca de prêmio).
export function progressoNaMissao(missao, membro) {
  const base = missao.base?.[membro.id]?.[missao.tipo] || 0
  const feito = Math.max(0, (membro[missao.tipo] || 0) - base)
  return { feito, fracao: Math.min(1, feito / missao.alvo), concluida: feito >= missao.alvo }
}

// Prazo vencido: a missão sai das ativas, mesmo sem ninguém encerrar.
export const missaoVencida = (missao, hoje = diaDeHoje()) => !!missao.prazo && missao.prazo < hoje

// --- Pontos em dobro ---------------------------------------------------------
//
// `config/dobro`: o admin escolhe um produto e lança. Enquanto estiver ativo,
// o caixa informa quanto da compra foi desse produto e essa parte rende o
// dobro. Lançar dispara a notificação para todos os clientes (functions/).

// "2026-10-20" ou '' (sem data de fim). Vale até o fim do dia informado.
export const dobroVigente = (dobro, hoje = diaDeHoje()) =>
  !!dobro?.ativo && !!dobro.produtoId && (!dobro.ate || dobro.ate >= hoje)

export function lancarDobro({ produtoId, produtoNome, ate }) {
  return setDoc(doc(db, 'config', 'dobro'), {
    ativo: true,
    produtoId,
    produtoNome,
    ate: ate || '',
    lancadoEm: serverTimestamp(),
  })
}

export function encerrarDobro() {
  return updateDoc(doc(db, 'config', 'dobro'), { ativo: false, encerradoEm: serverTimestamp() })
}

// --- Pessoas da equipe -----------------------------------------------------

export function observarEquipe(loja, aoMudar, aoFalhar) {
  const consulta = loja
    ? query(collection(db, 'equipe'), where('loja', '==', loja))
    : collection(db, 'equipe')
  return onSnapshot(consulta, (snap) => aoMudar(lista(snap)), aoFalhar)
}

export async function cadastrarMembro({ email, nome, papel, loja }, quemCadastra) {
  const id = normalizarEmail(email)
  const ref = doc(db, 'equipe', id)
  // Recadastrar alguém apagaria a meta acumulada dele.
  const atual = await getDoc(ref).catch(() => null)
  if (atual?.exists()) {
    const erro = new Error('membro-existente')
    erro.code = 'membro-existente'
    throw erro
  }
  await setDoc(ref, {
    email: id,
    nome: nome.trim(),
    papel,
    loja,
    ativo: true,
    pontos: 0,
    vendas: 0,
    compras: 0,
    vouchers: 0,
    criadoPor: normalizarEmail(quemCadastra),
    criadoEm: serverTimestamp(),
  })
}

export function atualizarMembro(email, campos) {
  return updateDoc(doc(db, 'equipe', normalizarEmail(email)), { ...campos, atualizadoEm: serverTimestamp() })
}

export function removerMembro(email) {
  return deleteDoc(doc(db, 'equipe', normalizarEmail(email)))
}

// --- Caixa: achar o cliente ------------------------------------------------

export async function buscarCliente(uid) {
  const snap = await getDoc(doc(db, 'usuarios', uid))
  return snap.exists() ? { uid, ...snap.data() } : null
}

export async function buscarClientePorTelefone(e164) {
  const reserva = await getDoc(doc(db, 'telefones', e164))
  if (!reserva.exists()) return null
  return buscarCliente(reserva.get('uid'))
}

export async function vouchersDisponiveis(uid) {
  const snap = await getDocs(
    query(collection(db, 'usuarios', uid, 'vouchers'), where('estado', '==', 'disponivel')),
  )
  return lista(snap)
}

export async function buscarVoucher(uid, id) {
  const snap = await getDoc(doc(db, 'usuarios', uid, 'vouchers', id))
  return snap.exists() ? { id, ...snap.data() } : null
}

// --- Caixa: as duas operações ---------------------------------------------

// Pontos de uma compra. Mesma conta que a regra do Firestore confere:
// piso(centavos × taxa ÷ 100), só com inteiros.
export const pontosDaCompra = (centavos, taxa) => Math.floor((centavos * taxa) / 100)

// Compra identificada: credita o cliente, lança no livro, avisa o cliente e
// soma na meta de quem registrou. `operador` é { email, uid, membro } — sem
// `membro` (o admin) não há meta para somar.
// `meta` são as taxas de meta da loja (ver `metaDaLoja`).
// `valorDobro` (centavos): a parte da compra que foi do produto em dobro.
// Rende pontos de novo, por cima dos normais. 0 quando não há promoção.
export async function registrarCompraNoCaixa({ cliente, valor, valorDobro = 0, dobro, loja, lojaNome, regras, meta, operador }) {
  const ref = doc(collection(db, 'lancamentos'))
  const id = ref.id
  const pontosBase = pontosDaCompra(valor, regras.pontosPorReal)
  const pontosDobro = valorDobro > 0 ? pontosDaCompra(valorDobro, regras.pontosPorReal) : 0
  const pontos = pontosBase + pontosDobro
  const pontosEquipe = pontosDaCompra(valor, meta.pontosPorReal)
  const lote = writeBatch(db)

  lote.set(ref, {
    tipo: 'compra',
    cliente: cliente.uid,
    clienteNome: cliente.nome || '',
    loja,
    valor,
    pontos,
    pontosBase,
    valorDobro: pontosDobro ? valorDobro : 0,
    pontosDobro,
    produtoDobro: pontosDobro ? dobro?.produtoNome || '' : '',
    pontosEquipe,
    operador: normalizarEmail(operador.email),
    operadorUid: operador.uid,
    operadorNome: operador.membro?.nome || 'Admin',
    dia: diaDeHoje(),
    criadoEm: serverTimestamp(),
  })
  lote.update(doc(db, 'usuarios', cliente.uid), {
    saldo: increment(pontos),
    acumulado: increment(pontos),
    ultimoLancamento: id,
    atualizadoEm: serverTimestamp(),
  })
  lote.set(doc(db, 'usuarios', cliente.uid, 'historico', id), {
    tipo: 'ganho',
    titulo: 'Compra na Sua Coxinha',
    detalhe: lojaNome,
    pontos,
    valor,
    unidade: lojaNome,
    data: new Date().toISOString().slice(0, 10),
    criadoEm: serverTimestamp(),
  })
  lote.set(doc(db, 'usuarios', cliente.uid, 'notificacoes', id), {
    titulo: `+${pontos} pontos`,
    texto: `Compra de ${(valor / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} na unidade ${lojaNome}.${
      pontosDobro ? ` Inclui +${pontosDobro} em dobro no ${dobro?.produtoNome || 'produto da promoção'}.` : ''
    }`,
    icone: 'brilho',
    nova: true,
    criadoEm: serverTimestamp(),
  })
  if (operador.membro) {
    lote.update(doc(db, 'equipe', normalizarEmail(operador.email)), {
      pontos: increment(pontosEquipe),
      vendas: increment(valor),
      compras: increment(1),
      ultimoLancamento: id,
    })
  }

  await lote.commit()
  return { id, pontos, pontosEquipe }
}

// Voucher entregue no balcão: baixa única, lançada no livro e na meta.
export async function validarVoucherNoCaixa({ cliente, voucher, loja, meta, operador }) {
  const ref = doc(collection(db, 'lancamentos'))
  const id = ref.id
  const pontosEquipe = meta.pontosPorVoucher
  const email = normalizarEmail(operador.email)
  const lote = writeBatch(db)

  lote.set(ref, {
    tipo: 'voucher',
    cliente: cliente.uid,
    clienteNome: cliente.nome || '',
    voucher: voucher.id,
    voucherNome: voucher.nome || '',
    loja,
    valor: 0,
    pontos: 0,
    pontosEquipe,
    operador: email,
    operadorUid: operador.uid,
    operadorNome: operador.membro?.nome || 'Admin',
    dia: diaDeHoje(),
    criadoEm: serverTimestamp(),
  })
  lote.update(doc(db, 'usuarios', cliente.uid, 'vouchers', voucher.id), {
    estado: 'utilizado',
    usadoEm: serverTimestamp(),
    usadoPor: email,
    lojaUso: loja,
    lancamento: id,
  })
  if (operador.membro) {
    lote.update(doc(db, 'equipe', email), {
      pontos: increment(pontosEquipe),
      vouchers: increment(1),
      ultimoLancamento: id,
    })
  }

  await lote.commit()
  return { id, pontosEquipe }
}

// --- Livro -----------------------------------------------------------------

// Movimento de um dia. Admin: tudo (ou uma loja). Franqueado: a loja dele.
// Funcionário: só o que ele mesmo lançou — a regra recusa consulta mais larga.
// Só igualdades e ordenação no aparelho: assim não há índice para criar no
// console, e um dia de uma loja é pequeno o bastante para vir inteiro.
export function observarLancamentos({ dia, loja, operador }, aoMudar, aoFalhar) {
  const filtros = [where('dia', '==', dia)]
  if (loja) filtros.push(where('loja', '==', loja))
  if (operador) filtros.push(where('operador', '==', normalizarEmail(operador)))
  return onSnapshot(
    query(collection(db, 'lancamentos'), ...filtros),
    (snap) => {
      const itens = lista(snap)
      const ms = (l) => l.criadoEm?.toMillis?.() ?? Date.now()
      aoMudar(itens.sort((a, b) => ms(b) - ms(a)))
    },
    aoFalhar,
  )
}
