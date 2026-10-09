// Roda as operações reais do app contra firestore.rules, no emulador.
//
//   npm run testar:regras      (precisa de Java; emulador na porta 8085)
//
// As escritas do caixa abaixo repetem as de src/firebase/equipe.js campo a
// campo — se mudar lá, mude aqui.
import { readFileSync } from 'node:fs'
import {
  initializeTestEnvironment, assertSucceeds, assertFails,
} from '@firebase/rules-unit-testing'
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs,
  query, where, orderBy, limit, increment, serverTimestamp, runTransaction, writeBatch,
} from 'firebase/firestore'

const env = await initializeTestEnvironment({
  projectId: 'suacoxinhaapp',
  firestore: { host: '127.0.0.1', port: 8085, rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
})

// --- Pessoas -----------------------------------------------------------------

const conta = (uid, email, verificado = true) =>
  env.authenticatedContext(uid, email ? { email, email_verified: verificado } : {}).firestore()

const ADMIN_EMAIL = 'marcelinhojordao07@gmail.com'
const admin = conta('admin', ADMIN_EMAIL)
const adminSemVerificar = conta('admin-falso', ADMIN_EMAIL, false)
const franq = conta('franq', 'franq@ex.com')            // franqueado de Cajamar
const func = conta('func', 'func@ex.com')               // funcionário de Cajamar
const funcJ = conta('funcj', 'funcj@ex.com')            // funcionário de Jundiaí
const inativo = conta('inativo', 'inativo@ex.com')      // funcionário desligado
const cli = conta('cli', 'cli@ex.com')                  // cliente
const outro = conta('outro', 'outro@ex.com')            // outro cliente
const anonimo = env.unauthenticatedContext().firestore()

const REGRAS = { pontosPorReal: 2, valorMaximo: 50000, metaPontosPorReal: 1, metaPontosPorVoucher: 10 }
const CATALOGO = { pontos: { 'coxinha-g': 300, 'combo-casal': 2400 } }

const ZERADO = {
  saldo: 0, pendentes: 0, aExpirar: 0, acumulado: 0, resgates: 0,
  missoes: {}, cadastroCompleto: false,
  nome: '', primeiroNome: '', telefone: '(11) 90000-0000', unidade: 'cajamar',
  codigo: 'PD-0001-0002', criadoEm: serverTimestamp(), atualizadoEm: serverTimestamp(),
}

const membro = (email, papel, loja, ativo = true) => ({
  email, nome: email.split('@')[0], papel, loja, ativo,
  pontos: 0, vendas: 0, compras: 0, vouchers: 0, criadoPor: ADMIN_EMAIL,
})

await env.withSecurityRulesDisabled(async (ctx) => {
  const d = ctx.firestore()
  await setDoc(doc(d, 'lojas', 'cajamar'), { nome: 'Cajamar', ativa: true })
  await setDoc(doc(d, 'lojas', 'jundiai'), { nome: 'Jundiaí', ativa: true })
  await setDoc(doc(d, 'config', 'regras'), REGRAS)
  await setDoc(doc(d, 'config', 'catalogo'), CATALOGO)
  await setDoc(doc(d, 'equipe', 'franq@ex.com'), membro('franq@ex.com', 'franqueado', 'cajamar'))
  await setDoc(doc(d, 'equipe', 'func@ex.com'), membro('func@ex.com', 'funcionario', 'cajamar'))
  await setDoc(doc(d, 'equipe', 'funcj@ex.com'), membro('funcj@ex.com', 'funcionario', 'jundiai'))
  await setDoc(doc(d, 'equipe', 'inativo@ex.com'), membro('inativo@ex.com', 'funcionario', 'cajamar', false))
  await setDoc(doc(d, 'usuarios', 'func'), { ...ZERADO, saldo: 0 })
  await setDoc(doc(d, 'telefones', '+5511911112222'), { uid: 'cli' })
})

let falhas = 0
const teste = async (nome, fn) => {
  try { await fn(); console.log('  ok   ', nome) }
  catch (e) { falhas++; console.log('  FALHA', nome, '→', String(e.message).slice(0, 160)) }
}

const ler = async (caminho) => {
  let dados
  await env.withSecurityRulesDisabled(async (ctx) => {
    const s = await getDoc(doc(ctx.firestore(), ...caminho))
    dados = s.exists() ? s.data() : null
  })
  return dados
}

// --- As escritas do app (espelho de src/firebase/equipe.js e clube.js) ---------

const hoje = '2026-10-08'
const piso = (centavos, taxa) => Math.floor((centavos * taxa) / 100)

function loteDeCompra(db, { cliente, valor, loja, email, uid, comMeta = true, pontos, pontosEquipe }) {
  const ref = doc(collection(db, 'lancamentos'))
  const id = ref.id
  pontos ??= piso(valor, REGRAS.pontosPorReal)
  pontosEquipe ??= piso(valor, REGRAS.metaPontosPorReal)
  const lote = writeBatch(db)
  lote.set(ref, {
    tipo: 'compra', cliente, clienteNome: 'Cliente', loja, valor, pontos, pontosEquipe,
    operador: email, operadorUid: uid, operadorNome: 'x', dia: hoje, criadoEm: serverTimestamp(),
  })
  lote.update(doc(db, 'usuarios', cliente), {
    saldo: increment(pontos), acumulado: increment(pontos), ultimoLancamento: id, atualizadoEm: serverTimestamp(),
  })
  lote.set(doc(db, 'usuarios', cliente, 'historico', id), {
    tipo: 'ganho', titulo: 'Compra', detalhe: loja, pontos, valor, unidade: loja, data: hoje, criadoEm: serverTimestamp(),
  })
  lote.set(doc(db, 'usuarios', cliente, 'notificacoes', id), {
    titulo: `+${pontos} pontos`, texto: 'Compra', icone: 'brilho', nova: true, criadoEm: serverTimestamp(),
  })
  if (comMeta) {
    lote.update(doc(db, 'equipe', email), {
      pontos: increment(pontosEquipe), vendas: increment(valor), compras: increment(1), ultimoLancamento: id,
    })
  }
  return { lote, id }
}

function loteDeVoucher(db, { cliente, voucher, loja, email, uid, comMeta = true, pontosEquipe }) {
  const ref = doc(collection(db, 'lancamentos'))
  const id = ref.id
  pontosEquipe ??= REGRAS.metaPontosPorVoucher
  const lote = writeBatch(db)
  lote.set(ref, {
    tipo: 'voucher', cliente, clienteNome: 'Cliente', voucher, voucherNome: 'x', loja, valor: 0, pontos: 0,
    pontosEquipe, operador: email, operadorUid: uid, operadorNome: 'x',
    dia: hoje, criadoEm: serverTimestamp(),
  })
  lote.update(doc(db, 'usuarios', cliente, 'vouchers', voucher), {
    estado: 'utilizado', usadoEm: serverTimestamp(), usadoPor: email, lojaUso: loja, lancamento: id,
  })
  if (comMeta) {
    lote.update(doc(db, 'equipe', email), {
      pontos: increment(pontosEquipe), vouchers: increment(1), ultimoLancamento: id,
    })
  }
  return { lote, id }
}

function resgatar(db, uid, recompensaId, pontos) {
  const refVoucher = doc(collection(db, 'usuarios', uid, 'vouchers'))
  return runTransaction(db, async (tx) => {
    const s = await tx.get(doc(db, 'usuarios', uid))
    if ((s.get('saldo') || 0) < pontos) throw new Error('saldo insuficiente')
    tx.update(doc(db, 'usuarios', uid), {
      saldo: increment(-pontos), resgates: increment(1), ultimoVoucher: refVoucher.id, atualizadoEm: serverTimestamp(),
    })
    tx.set(refVoucher, {
      recompensaId, nome: recompensaId, pontos, codigo: 'PD-AAAA-BBBB', estado: 'disponivel', criadoEm: serverTimestamp(),
    })
    tx.set(doc(db, 'usuarios', uid, 'historico', refVoucher.id), {
      tipo: 'resgate', titulo: 'Resgate', detalhe: recompensaId, pontos: -pontos, data: hoje, criadoEm: serverTimestamp(),
    })
  }).then(() => refVoucher.id)
}

// =============================================================================

console.log('\n== cliente: criação da conta ==')
await teste('cria o próprio documento zerado', () =>
  assertSucceeds(setDoc(doc(cli, 'usuarios', 'cli'), ZERADO)))
await teste('outro cliente cria o dele (transação do garantirPerfil)', () =>
  assertSucceeds(runTransaction(outro, async (tx) => {
    const s = await tx.get(doc(outro, 'usuarios', 'outro'))
    if (!s.exists()) tx.set(doc(outro, 'usuarios', 'outro'), ZERADO)
  })))
await teste('RECUSA criar já com pontos', () =>
  assertFails(setDoc(doc(conta('novo', 'n@ex.com'), 'usuarios', 'novo'), { ...ZERADO, saldo: 5000 })))
await teste('RECUSA criar documento de outra pessoa', () =>
  assertFails(setDoc(doc(cli, 'usuarios', 'zzz'), ZERADO)))
await teste('RECUSA criação sem login', () =>
  assertFails(setDoc(doc(anonimo, 'usuarios', 'qualquer'), ZERADO)))

console.log('\n== cliente: o que ele pode e não pode mudar ==')
await teste('lê o próprio perfil', () => assertSucceeds(getDoc(doc(cli, 'usuarios', 'cli'))))
await teste('RECUSA ler a carteira alheia', () => assertFails(getDoc(doc(outro, 'usuarios', 'cli'))))
await teste('RECUSA ler sem login', () => assertFails(getDoc(doc(anonimo, 'usuarios', 'cli'))))
await teste('edita o próprio cadastro', () =>
  assertSucceeds(updateDoc(doc(cli, 'usuarios', 'cli'), { nome: 'Ana Cliente', cadastroCompleto: true, atualizadoEm: serverTimestamp() })))
await teste('RECUSA se dar pontos (o furo antigo)', () =>
  assertFails(updateDoc(doc(cli, 'usuarios', 'cli'), { saldo: increment(1000), acumulado: increment(1000) })))
await teste('RECUSA mexer no acumulado (nível)', () =>
  assertFails(updateDoc(doc(cli, 'usuarios', 'cli'), { acumulado: 9000 })))
await teste('RECUSA completar missão sozinho', () =>
  assertFails(updateDoc(doc(cli, 'usuarios', 'cli'), { 'missoes.sequencia': { feito: 4, concluida: true } })))
await teste('RECUSA creditar compra na própria conta, mesmo com lançamento', () =>
  assertFails(loteDeCompra(cli, { cliente: 'cli', valor: 1000, loja: 'cajamar', email: 'cli@ex.com', uid: 'cli', comMeta: false }).lote.commit()))
await teste('RECUSA escrever aviso para si mesmo', () =>
  assertFails(setDoc(doc(cli, 'usuarios', 'cli', 'notificacoes', 'x'), { titulo: 'oi', nova: true })))
await teste('RECUSA ler o livro de lançamentos', () =>
  assertFails(getDocs(query(collection(cli, 'lancamentos'), where('dia', '==', hoje)))))
await teste('RECUSA se cadastrar como funcionário', () =>
  assertFails(setDoc(doc(cli, 'equipe', 'cli@ex.com'), { ...membro('cli@ex.com', 'funcionario', 'cajamar'), criadoPor: 'cli@ex.com' })))
await teste('RECUSA mudar as regras do clube', () =>
  assertFails(setDoc(doc(cli, 'config', 'regras'), { ...REGRAS, pontosPorReal: 100 })))
await teste('lê as regras e o catálogo', async () => {
  await assertSucceeds(getDoc(doc(cli, 'config', 'regras')))
  await assertSucceeds(getDoc(doc(cli, 'config', 'catalogo')))
})
await teste('RECUSA ler a reserva de telefone (não dá para sondar)', () =>
  assertFails(getDoc(doc(cli, 'telefones', '+5511911112222'))))

console.log('\n== caixa: funcionário registra compra ==')
await teste('funcionário lê a carteira do cliente', () => assertSucceeds(getDoc(doc(func, 'usuarios', 'cli'))))
await teste('funcionário acha o cliente pelo telefone', () => assertSucceeds(getDoc(doc(func, 'telefones', '+5511911112222'))))
await teste('RECUSA funcionário listar todos os clientes', () =>
  assertFails(getDocs(query(collection(func, 'usuarios'), limit(5)))))

let compraId
await teste('registra compra de R$ 59,80 (119 pts)', async () => {
  const { lote, id } = loteDeCompra(func, { cliente: 'cli', valor: 5980, loja: 'cajamar', email: 'func@ex.com', uid: 'func' })
  compraId = id
  await assertSucceeds(lote.commit())
})
await teste('saldo, extrato, aviso e meta conferem', async () => {
  const u = await ler(['usuarios', 'cli'])
  const m = await ler(['equipe', 'func@ex.com'])
  const h = await ler(['usuarios', 'cli', 'historico', compraId])
  const n = await ler(['usuarios', 'cli', 'notificacoes', compraId])
  if (u.saldo !== 119 || u.acumulado !== 119) throw new Error(`saldo ${u.saldo}/${u.acumulado}`)
  if (m.vendas !== 5980 || m.compras !== 1 || m.pontos !== 59) throw new Error(JSON.stringify(m))
  if (!h || h.pontos !== 119 || !n) throw new Error('extrato/aviso ausente')
})
await teste('cliente vê o aviso e marca como lido', async () => {
  await assertSucceeds(getDocs(query(collection(cli, 'usuarios', 'cli', 'notificacoes'), orderBy('criadoEm', 'desc'), limit(30))))
  await assertSucceeds(updateDoc(doc(cli, 'usuarios', 'cli', 'notificacoes', compraId), { nova: false }))
})
await teste('RECUSA cliente reescrever o texto do aviso', () =>
  assertFails(updateDoc(doc(cli, 'usuarios', 'cli', 'notificacoes', compraId), { titulo: '+9999 pontos' })))
await teste('RECUSA pontos acima do que a compra vale', () =>
  assertFails(loteDeCompra(func, { cliente: 'cli', valor: 1000, loja: 'cajamar', email: 'func@ex.com', uid: 'func', pontos: 500 }).lote.commit()))
await teste('RECUSA meta da equipe inflada', () =>
  assertFails(loteDeCompra(func, { cliente: 'cli', valor: 1000, loja: 'cajamar', email: 'func@ex.com', uid: 'func', pontosEquipe: 999 }).lote.commit()))
await teste('RECUSA compra acima do teto (R$ 500)', () =>
  assertFails(loteDeCompra(func, { cliente: 'cli', valor: 50001, loja: 'cajamar', email: 'func@ex.com', uid: 'func' }).lote.commit()))
await teste('RECUSA valor zero ou negativo', () =>
  assertFails(loteDeCompra(func, { cliente: 'cli', valor: -100, loja: 'cajamar', email: 'func@ex.com', uid: 'func' }).lote.commit()))
await teste('RECUSA funcionário creditar a própria conta', () =>
  assertFails(loteDeCompra(func, { cliente: 'func', valor: 1000, loja: 'cajamar', email: 'func@ex.com', uid: 'func' }).lote.commit()))
await teste('RECUSA lançar em outra loja', () =>
  assertFails(loteDeCompra(func, { cliente: 'cli', valor: 1000, loja: 'jundiai', email: 'func@ex.com', uid: 'func' }).lote.commit()))
await teste('RECUSA funcionário desligado', () =>
  assertFails(loteDeCompra(inativo, { cliente: 'cli', valor: 1000, loja: 'cajamar', email: 'inativo@ex.com', uid: 'inativo' }).lote.commit()))
await teste('RECUSA assinar o lançamento com o e-mail de outro', () =>
  assertFails(loteDeCompra(func, { cliente: 'cli', valor: 1000, loja: 'cajamar', email: 'franq@ex.com', uid: 'func', comMeta: false }).lote.commit()))
await teste('RECUSA crédito sem lançamento novo (reaproveitar o antigo)', () =>
  assertFails(updateDoc(doc(func, 'usuarios', 'cli'), { saldo: increment(119), acumulado: increment(119), ultimoLancamento: compraId })))
await teste('RECUSA lançamento solto, sem creditar o cliente', () =>
  assertFails(setDoc(doc(func, 'lancamentos', 'solto'), {
    tipo: 'compra', cliente: 'cli', loja: 'cajamar', valor: 1000, pontos: 20, pontosEquipe: 10,
    operador: 'func@ex.com', operadorUid: 'func', dia: hoje, criadoEm: serverTimestamp(),
  })))
await teste('RECUSA funcionário mexer na própria meta à mão', () =>
  assertFails(updateDoc(doc(func, 'equipe', 'func@ex.com'), { pontos: increment(1000) })))
await teste('RECUSA editar ou apagar lançamento', async () => {
  await assertFails(updateDoc(doc(func, 'lancamentos', compraId), { valor: 1 }))
  await assertFails(deleteDoc(doc(func, 'lancamentos', compraId)))
})
await teste('franqueado também registra compra (e soma na meta dele)', () =>
  assertSucceeds(loteDeCompra(franq, { cliente: 'cli', valor: 2000, loja: 'cajamar', email: 'franq@ex.com', uid: 'franq' }).lote.commit()))
await teste('funcionário de Jundiaí registra na loja dele', () =>
  assertSucceeds(loteDeCompra(funcJ, { cliente: 'outro', valor: 3000, loja: 'jundiai', email: 'funcj@ex.com', uid: 'funcj' }).lote.commit()))

console.log('\n== resgate do cliente ==')
let voucherId
await teste('resgata pelo preço do catálogo', async () => {
  // saldo agora: 119 + 40 = 159; dá um empurrão para alcançar a Coxinha G.
  await assertSucceeds(loteDeCompra(func, { cliente: 'cli', valor: 10000, loja: 'cajamar', email: 'func@ex.com', uid: 'func' }).lote.commit())
  voucherId = await assertSucceeds(resgatar(cli, 'cli', 'coxinha-g', 300))
  const u = await ler(['usuarios', 'cli'])
  if (u.saldo !== 59 || u.resgates !== 1) throw new Error(`saldo ${u.saldo}, resgates ${u.resgates}`)
})
await teste('RECUSA resgatar mais barato que o catálogo', () =>
  assertFails(resgatar(cli, 'cli', 'combo-casal', 1)))
await teste('RECUSA recompensa fora do catálogo', () =>
  assertFails(resgatar(cli, 'cli', 'inventada', 10)))
await teste('RECUSA cliente dar baixa no próprio voucher', () =>
  assertFails(updateDoc(doc(cli, 'usuarios', 'cli', 'vouchers', voucherId), { estado: 'utilizado' })))
await teste('RECUSA saldo negativo', async () => {
  await env.withSecurityRulesDisabled((ctx) => updateDoc(doc(ctx.firestore(), 'usuarios', 'outro'), { saldo: 100 }))
  const refV = doc(collection(outro, 'usuarios', 'outro', 'vouchers'))
  const lote = writeBatch(outro)
  lote.update(doc(outro, 'usuarios', 'outro'), { saldo: increment(-300), resgates: increment(1), ultimoVoucher: refV.id })
  lote.set(refV, { recompensaId: 'coxinha-g', pontos: 300, estado: 'disponivel' })
  await assertFails(lote.commit())
})

console.log('\n== caixa: validar voucher ==')
await teste('funcionário lista os vouchers do cliente', () =>
  assertSucceeds(getDocs(query(collection(func, 'usuarios', 'cli', 'vouchers'), where('estado', '==', 'disponivel')))))
await teste('RECUSA validar em outra loja', () =>
  assertFails(loteDeVoucher(func, { cliente: 'cli', voucher: voucherId, loja: 'jundiai', email: 'func@ex.com', uid: 'func' }).lote.commit()))
await teste('valida o voucher e soma 10 na meta', async () => {
  await assertSucceeds(loteDeVoucher(func, { cliente: 'cli', voucher: voucherId, loja: 'cajamar', email: 'func@ex.com', uid: 'func' }).lote.commit())
  const v = await ler(['usuarios', 'cli', 'vouchers', voucherId])
  const m = await ler(['equipe', 'func@ex.com'])
  if (v.estado !== 'utilizado' || v.usadoPor !== 'func@ex.com') throw new Error(JSON.stringify(v))
  if (m.vouchers !== 1 || m.pontos !== 59 + 100 + 10) throw new Error(JSON.stringify(m))
})
await teste('RECUSA validar o mesmo voucher duas vezes', () =>
  assertFails(loteDeVoucher(franq, { cliente: 'cli', voucher: voucherId, loja: 'cajamar', email: 'franq@ex.com', uid: 'franq' }).lote.commit()))
await teste('RECUSA funcionário validar voucher da própria conta', async () => {
  await env.withSecurityRulesDisabled((ctx) =>
    setDoc(doc(ctx.firestore(), 'usuarios', 'func', 'vouchers', 'v-func'), { recompensaId: 'coxinha-g', pontos: 300, estado: 'disponivel' }))
  await assertFails(loteDeVoucher(func, { cliente: 'func', voucher: 'v-func', loja: 'cajamar', email: 'func@ex.com', uid: 'func' }).lote.commit())
})

console.log('\n== livro e ranking ==')
await teste('funcionário vê o que ele lançou hoje', () =>
  assertSucceeds(getDocs(query(collection(func, 'lancamentos'), where('dia', '==', hoje), where('operador', '==', 'func@ex.com')))))
await teste('RECUSA funcionário ver o livro da loja inteira', () =>
  assertFails(getDocs(query(collection(func, 'lancamentos'), where('dia', '==', hoje), where('loja', '==', 'cajamar')))))
await teste('franqueado vê o livro da loja dele', () =>
  assertSucceeds(getDocs(query(collection(franq, 'lancamentos'), where('dia', '==', hoje), where('loja', '==', 'cajamar')))))
await teste('RECUSA franqueado ver outra loja', () =>
  assertFails(getDocs(query(collection(franq, 'lancamentos'), where('dia', '==', hoje), where('loja', '==', 'jundiai')))))
await teste('admin vê o livro de todas as lojas', () =>
  assertSucceeds(getDocs(query(collection(admin, 'lancamentos'), where('dia', '==', hoje)))))
await teste('funcionário vê o ranking da própria loja', () =>
  assertSucceeds(getDocs(query(collection(func, 'equipe'), where('loja', '==', 'cajamar')))))
await teste('RECUSA ver a equipe de outra loja', () =>
  assertFails(getDocs(query(collection(func, 'equipe'), where('loja', '==', 'jundiai')))))
await teste('cada um lê o próprio cadastro de equipe (ou a ausência dele)', async () => {
  await assertSucceeds(getDoc(doc(func, 'equipe', 'func@ex.com')))
  await assertSucceeds(getDoc(doc(cli, 'equipe', 'cli@ex.com')))
})
await teste('RECUSA cliente ler a equipe', () =>
  assertFails(getDoc(doc(cli, 'equipe', 'func@ex.com'))))

console.log('\n== franqueado gerencia a equipe dele ==')
const novoFunc = (email, loja = 'cajamar', papel = 'funcionario') =>
  ({ ...membro(email, papel, loja), criadoPor: 'franq@ex.com', criadoEm: serverTimestamp() })
await teste('cadastra funcionário na própria loja', () =>
  assertSucceeds(setDoc(doc(franq, 'equipe', 'novo@ex.com'), novoFunc('novo@ex.com'))))
await teste('RECUSA cadastrar em outra loja', () =>
  assertFails(setDoc(doc(franq, 'equipe', 'x@ex.com'), novoFunc('x@ex.com', 'jundiai'))))
await teste('RECUSA cadastrar outro franqueado', () =>
  assertFails(setDoc(doc(franq, 'equipe', 'y@ex.com'), novoFunc('y@ex.com', 'cajamar', 'franqueado'))))
await teste('RECUSA cadastrar já com meta', () =>
  assertFails(setDoc(doc(franq, 'equipe', 'z@ex.com'), { ...novoFunc('z@ex.com'), pontos: 500 })))
await teste('RECUSA e-mail com maiúscula (o login não acharia)', () =>
  assertFails(setDoc(doc(franq, 'equipe', 'Maiuscula@ex.com'), novoFunc('Maiuscula@ex.com'))))
await teste('desliga e religa funcionário', async () => {
  await assertSucceeds(updateDoc(doc(franq, 'equipe', 'novo@ex.com'), { ativo: false, atualizadoEm: serverTimestamp() }))
  await assertSucceeds(updateDoc(doc(franq, 'equipe', 'novo@ex.com'), { ativo: true, atualizadoEm: serverTimestamp() }))
})
await teste('RECUSA franqueado mexer na meta do funcionário', () =>
  assertFails(updateDoc(doc(franq, 'equipe', 'func@ex.com'), { pontos: 99999 })))
await teste('RECUSA franqueado se promover ou trocar de loja', () =>
  assertFails(updateDoc(doc(franq, 'equipe', 'franq@ex.com'), { loja: 'jundiai' })))
await teste('RECUSA franqueado mexer em gente de outra loja', () =>
  assertFails(updateDoc(doc(franq, 'equipe', 'funcj@ex.com'), { ativo: false })))
await teste('RECUSA funcionário cadastrar gente', () =>
  assertFails(setDoc(doc(func, 'equipe', 'w@ex.com'), { ...novoFunc('w@ex.com'), criadoPor: 'func@ex.com' })))
await teste('remove funcionário da própria loja', () =>
  assertSucceeds(deleteDoc(doc(franq, 'equipe', 'novo@ex.com'))))

console.log('\n== admin master ==')
await teste('cadastra franqueado para Jundiaí', () =>
  assertSucceeds(setDoc(doc(admin, 'equipe', 'fj@ex.com'), { ...membro('fj@ex.com', 'franqueado', 'jundiai'), criadoEm: serverTimestamp() })))
await teste('RECUSA cadastrar em loja que não existe', () =>
  assertFails(setDoc(doc(admin, 'equipe', 'q@ex.com'), membro('q@ex.com', 'funcionario', 'atlantida'))))
await teste('tira e devolve permissão (troca papel e desliga)', async () => {
  await assertSucceeds(updateDoc(doc(admin, 'equipe', 'fj@ex.com'), { papel: 'funcionario' }))
  await assertSucceeds(updateDoc(doc(admin, 'equipe', 'fj@ex.com'), { ativo: false }))
})
await teste('muda as regras do clube e o catálogo', async () => {
  await assertSucceeds(setDoc(doc(admin, 'config', 'regras'), { ...REGRAS, atualizadoEm: serverTimestamp() }))
  await assertSucceeds(setDoc(doc(admin, 'config', 'catalogo'), { ...CATALOGO, atualizadoEm: serverTimestamp() }))
})
await teste('cria loja', () => assertSucceeds(setDoc(doc(admin, 'lojas', 'campinas'), { nome: 'Campinas', ativa: true })))
await teste('registra compra em qualquer loja (sem meta própria)', () =>
  assertSucceeds(loteDeCompra(admin, { cliente: 'cli', valor: 1500, loja: 'jundiai', email: ADMIN_EMAIL, uid: 'admin', comMeta: false }).lote.commit()))
await teste('RECUSA o e-mail do admin sem verificação', () =>
  assertFails(setDoc(doc(adminSemVerificar, 'config', 'regras'), REGRAS)))

console.log('\n== metas da loja (franqueado) ==')
const META = { pontosPorReal: 3, pontosPorVoucher: 25 }
await teste('franqueado define as metas da própria loja', () =>
  assertSucceeds(updateDoc(doc(franq, 'lojas', 'cajamar'), { meta: META, atualizadoEm: serverTimestamp() })))
await teste('RECUSA franqueado mexer nas metas de outra loja', () =>
  assertFails(updateDoc(doc(franq, 'lojas', 'jundiai'), { meta: META })))
await teste('RECUSA franqueado renomear a loja', () =>
  assertFails(updateDoc(doc(franq, 'lojas', 'cajamar'), { nome: 'Outra' })))
await teste('RECUSA funcionário mexer nas metas', () =>
  assertFails(updateDoc(doc(func, 'lojas', 'cajamar'), { meta: { pontosPorReal: 99, pontosPorVoucher: 999 } })))
await teste('RECUSA meta fora do formato', async () => {
  await assertFails(updateDoc(doc(franq, 'lojas', 'cajamar'), { meta: { pontosPorReal: -1, pontosPorVoucher: 10 } }))
  await assertFails(updateDoc(doc(franq, 'lojas', 'cajamar'), { meta: { pontosPorReal: 2, pontosPorVoucher: 10, extra: 1 } }))
})
await teste('compra na loja usa a meta dela (3 por real)', () =>
  assertSucceeds(loteDeCompra(func, { cliente: 'cli', valor: 2000, loja: 'cajamar', email: 'func@ex.com', uid: 'func',
    pontosEquipe: piso(2000, META.pontosPorReal) }).lote.commit()))
await teste('RECUSA meta calculada com a taxa da rede', () =>
  assertFails(loteDeCompra(func, { cliente: 'cli', valor: 2000, loja: 'cajamar', email: 'func@ex.com', uid: 'func' }).lote.commit()))
await teste('loja sem meta própria segue a da rede', () =>
  assertSucceeds(loteDeCompra(funcJ, { cliente: 'cli', valor: 2000, loja: 'jundiai', email: 'funcj@ex.com', uid: 'funcj' }).lote.commit()))
await teste('voucher na loja usa a meta dela (25)', async () => {
  await env.withSecurityRulesDisabled((ctx) =>
    setDoc(doc(ctx.firestore(), 'usuarios', 'cli', 'vouchers', 'v-meta'), { recompensaId: 'coxinha-g', pontos: 300, estado: 'disponivel' }))
  await assertFails(loteDeVoucher(func, { cliente: 'cli', voucher: 'v-meta', loja: 'cajamar', email: 'func@ex.com', uid: 'func' }).lote.commit())
  await assertSucceeds(loteDeVoucher(func, { cliente: 'cli', voucher: 'v-meta', loja: 'cajamar', email: 'func@ex.com', uid: 'func',
    pontosEquipe: META.pontosPorVoucher }).lote.commit())
})

console.log('\n== missões da equipe ==')
const missao = (extra = {}) => ({
  loja: 'cajamar', titulo: 'Leitor de vouchers', tipo: 'vouchers', alvo: 20, premio: 'Folga extra', prazo: '',
  ativa: true, base: { 'func@ex.com': { vouchers: 1, compras: 2, vendas: 9980 } }, modelo: 'leitor-vouchers',
  criadoPor: 'franq@ex.com', criadoEm: serverTimestamp(), ...extra,
})
await teste('franqueado dispara missão para a loja dele', () =>
  assertSucceeds(setDoc(doc(franq, 'missoesEquipe', 'm1'), missao())))
await teste('RECUSA disparar missão em outra loja', () =>
  assertFails(setDoc(doc(franq, 'missoesEquipe', 'm2'), missao({ loja: 'jundiai' }))))
await teste('RECUSA funcionário disparar missão', () =>
  assertFails(setDoc(doc(func, 'missoesEquipe', 'm3'), missao({ criadoPor: 'func@ex.com' }))))
await teste('RECUSA missão com tipo ou alvo inválido', async () => {
  await assertFails(setDoc(doc(franq, 'missoesEquipe', 'm4'), missao({ tipo: 'pontos' })))
  await assertFails(setDoc(doc(franq, 'missoesEquipe', 'm5'), missao({ alvo: 0 })))
})
await teste('funcionário vê as missões da loja dele', () =>
  assertSucceeds(getDocs(query(collection(func, 'missoesEquipe'), where('loja', '==', 'cajamar')))))
await teste('RECUSA ver missões de outra loja', () =>
  assertFails(getDocs(query(collection(funcJ, 'missoesEquipe'), where('loja', '==', 'cajamar')))))
await teste('RECUSA cliente ver missões', () =>
  assertFails(getDocs(query(collection(cli, 'missoesEquipe'), where('loja', '==', 'cajamar')))))
await teste('RECUSA funcionário mexer na missão', () =>
  assertFails(updateDoc(doc(func, 'missoesEquipe', 'm1'), { alvo: 1 })))
await teste('RECUSA trocar a largada (base) depois de disparada', () =>
  assertFails(updateDoc(doc(franq, 'missoesEquipe', 'm1'), { base: {} })))
await teste('franqueado encerra e apaga a missão', async () => {
  await assertSucceeds(updateDoc(doc(franq, 'missoesEquipe', 'm1'), { ativa: false, atualizadoEm: serverTimestamp() }))
  await assertSucceeds(deleteDoc(doc(franq, 'missoesEquipe', 'm1')))
})
await teste('admin dispara missão em qualquer loja', () =>
  assertSucceeds(setDoc(doc(admin, 'missoesEquipe', 'm6'), missao({ loja: 'jundiai', criadoPor: ADMIN_EMAIL }))))

console.log('\n== reserva de telefone ==')
const NUM = '+5511971813986'
await teste('reserva um número livre', () =>
  assertSucceeds(setDoc(doc(cli, 'telefones', NUM), { uid: 'cli', criadoEm: serverTimestamp() })))
await teste('RECUSA tomar número já reservado', () =>
  assertFails(setDoc(doc(outro, 'telefones', NUM), { uid: 'outro', criadoEm: serverTimestamp() })))
await teste('RECUSA reservar apontando para outro uid', () =>
  assertFails(setDoc(doc(cli, 'telefones', '+5511900000001'), { uid: 'outro' })))
await teste('RECUSA liberar número de outro', () =>
  assertFails(deleteDoc(doc(outro, 'telefones', NUM))))
await teste('libera o próprio número', () => assertSucceeds(deleteDoc(doc(cli, 'telefones', NUM))))

console.log('\n== apagar conta ==')
await teste('apaga extrato, vouchers, avisos e a conta', async () => {
  for (const nome of ['historico', 'vouchers', 'notificacoes']) {
    const snap = await getDocs(collection(cli, 'usuarios', 'cli', nome))
    const lote = writeBatch(cli)
    snap.docs.forEach((d) => lote.delete(d.ref))
    await assertSucceeds(lote.commit())
  }
  await assertSucceeds(deleteDoc(doc(cli, 'usuarios', 'cli')))
})

console.log('\n== fora do previsto ==')
await teste('RECUSA qualquer outra coleção', () =>
  assertFails(setDoc(doc(cli, 'segredo', 'x'), { x: 1 })))
await teste('RECUSA subcoleção fora da lista', () =>
  assertFails(setDoc(doc(outro, 'usuarios', 'outro', 'secreto', 'x'), { x: 1 })))

await env.cleanup()
console.log(falhas ? `\n${falhas} FALHA(S)\n` : '\nTodos passaram.\n')
process.exit(falhas ? 1 : 0)
