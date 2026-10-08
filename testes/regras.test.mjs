// Roda as operações reais do app contra firestore.rules, no emulador.
import { readFileSync } from 'node:fs'
import {
  initializeTestEnvironment, assertSucceeds, assertFails,
} from '@firebase/rules-unit-testing'
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, collection, addDoc, getDocs,
  query, orderBy, limit, increment, serverTimestamp, runTransaction, writeBatch,
} from 'firebase/firestore'

const env = await initializeTestEnvironment({
  projectId: 'suacoxinhaapp',
  firestore: { host: '127.0.0.1', port: 8085, rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
})

const EU = 'cliente-A'
const OUTRO = 'cliente-B'
const meu = env.authenticatedContext(EU).firestore()
const alheio = env.authenticatedContext(OUTRO).firestore()
const anonimo = env.unauthenticatedContext().firestore()

const ZERADO = {
  saldo: 0, pendentes: 0, aExpirar: 0, acumulado: 0, resgates: 0,
  missoes: {}, cadastroCompleto: false,
  nome: '', primeiroNome: '', telefone: '(11) 90000-0000', unidade: 'cajamar',
  codigo: 'PD-0001-0002', criadoEm: serverTimestamp(), atualizadoEm: serverTimestamp(),
}

let falhas = 0
const teste = async (nome, fn) => {
  try { await fn(); console.log('  ok   ', nome) }
  catch (e) { falhas++; console.log('  FALHA', nome, '→', String(e.message).slice(0, 150)) }
}

console.log('\n== criação da conta ==')
await teste('cria o próprio documento zerado', () =>
  assertSucceeds(setDoc(doc(meu, 'usuarios', EU), ZERADO)))
await teste('RECUSA criar já com pontos', () =>
  assertFails(setDoc(doc(alheio, 'usuarios', OUTRO), { ...ZERADO, saldo: 5000 })))
await teste('RECUSA criar documento de outra pessoa', () =>
  assertFails(setDoc(doc(meu, 'usuarios', OUTRO), ZERADO)))
await teste('RECUSA criação sem login', () =>
  assertFails(setDoc(doc(anonimo, 'usuarios', 'qualquer'), ZERADO)))

console.log('\n== leitura ==')
await teste('lê o próprio perfil', () => assertSucceeds(getDoc(doc(meu, 'usuarios', EU))))
await teste('RECUSA ler a carteira alheia', () => assertFails(getDoc(doc(alheio, 'usuarios', EU))))
await teste('RECUSA ler sem login', () => assertFails(getDoc(doc(anonimo, 'usuarios', EU))))

console.log('\n== garantirPerfil: transação que lê e cria ==')
await teste('transação cria conta nova zerada', () =>
  assertSucceeds(runTransaction(alheio, async (tx) => {
    const s = await tx.get(doc(alheio, 'usuarios', OUTRO))
    if (!s.exists()) tx.set(doc(alheio, 'usuarios', OUTRO), ZERADO)
  })))

console.log('\n== creditarCompra: lote com increment + extrato ==')
await teste('credita pontos e lança no extrato', () => {
  const lote = writeBatch(meu)
  lote.update(doc(meu, 'usuarios', EU), { saldo: increment(120), acumulado: increment(120), atualizadoEm: serverTimestamp() })
  lote.set(doc(collection(meu, 'usuarios', EU, 'historico')), { tipo: 'ganho', pontos: 120, criadoEm: serverTimestamp() })
  return assertSucceeds(lote.commit())
})
await teste('RECUSA creditar na conta alheia', () =>
  assertFails(updateDoc(doc(alheio, 'usuarios', EU), { saldo: increment(999) })))

console.log('\n== resgate: transação que lê saldo e debita ==')
await teste('resgata com saldo suficiente', () =>
  assertSucceeds(runTransaction(meu, async (tx) => {
    const s = await tx.get(doc(meu, 'usuarios', EU))
    if ((s.get('saldo') || 0) < 60) throw new Error('saldo')
    tx.update(doc(meu, 'usuarios', EU), { saldo: increment(-60), resgates: increment(1) })
    tx.set(doc(collection(meu, 'usuarios', EU, 'vouchers')), { codigo: 'PD-AAAA-BBBB', estado: 'disponivel', criadoEm: serverTimestamp() })
  })))

console.log('\n== missões: campo aninhado ==')
await teste('avança missão com caminho pontilhado', () =>
  assertSucceeds(updateDoc(doc(meu, 'usuarios', EU), { 'missoes.sequencia': { feito: 1, concluida: false } })))

console.log('\n== subcoleções: as consultas que o app faz ==')
for (const nome of ['historico', 'vouchers', 'notificacoes']) {
  await teste(`lista ${nome} ordenado por criadoEm`, () =>
    assertSucceeds(getDocs(query(collection(meu, 'usuarios', EU, nome), orderBy('criadoEm', 'desc'), limit(200)))))
  await teste(`RECUSA listar ${nome} alheio`, () =>
    assertFails(getDocs(query(collection(alheio, 'usuarios', EU, nome), orderBy('criadoEm', 'desc'), limit(200)))))
}
await teste('escreve notificação própria', () =>
  assertSucceeds(addDoc(collection(meu, 'usuarios', EU, 'notificacoes'), { titulo: 'oi', nova: true, criadoEm: serverTimestamp() })))
await teste('RECUSA subcoleção fora da lista prevista', () =>
  assertFails(addDoc(collection(meu, 'usuarios', EU, 'secreto'), { x: 1 })))

console.log('\n== zerarConta / apagarConta ==')
await teste('apaga os próprios lançamentos', async () => {
  const snap = await getDocs(collection(meu, 'usuarios', EU, 'historico'))
  const lote = writeBatch(meu)
  snap.docs.forEach((d) => lote.delete(d.ref))
  return assertSucceeds(lote.commit())
})
await teste('apaga a própria conta', () => assertSucceeds(deleteDoc(doc(meu, 'usuarios', EU))))
await teste('RECUSA apagar conta alheia', () => assertFails(deleteDoc(doc(alheio, 'usuarios', OUTRO + 'x'))))

console.log('\n== fora do previsto ==')
await teste('RECUSA qualquer outra coleção', () =>
  assertFails(setDoc(doc(meu, 'config', 'global'), { x: 1 })))

await env.cleanup()
console.log(falhas ? `\n${falhas} FALHA(S)\n` : '\nTodos passaram.\n')
process.exit(falhas ? 1 : 0)
