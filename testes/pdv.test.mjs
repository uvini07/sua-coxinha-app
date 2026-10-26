// Regras do PDV (pdvmarkfy) no emulador: o que um token do PDV alcança no
// banco — e o que ninguém alcança, nem o admin do clube.
//
//   npm run testar:regras      (roda junto com os testes do clube)
//
// O login em si (PIN, bloqueio, quem dá acesso a quem) é testado nas funções:
// functions/pdv/servico.test.js (npm run testar:pdv).
import { readFileSync } from 'node:fs'
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing'
import { doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, collection, Timestamp } from 'firebase/firestore'

const env = await initializeTestEnvironment({
  projectId: 'suacoxinhaapp-pdv',
  firestore: { host: '127.0.0.1', port: 8085, rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
})

const daqui_a_1h = Timestamp.fromMillis(Date.now() + 3_600_000)

// Logins anônimos, como o navegador do PDV cria; quem cada um é está em
// pdv_sessoes (gravado pelas funções).
const anon = (uid) => env.authenticatedContext(uid, { firebase: { sign_in_provider: 'anonymous' } }).firestore()
const pessoa = anon('login-ana')
const vencida = anon('login-ana-velho')
const desligada = anon('login-rui')
const fantasma = anon('login-nada')
const computador = anon('login-pc')
const semSessao = anon('login-solto')
const adminClube = env.authenticatedContext('admin', { email: 'marcelinhojordao07@gmail.com', email_verified: true }).firestore()
const cliente = env.authenticatedContext('cli', { email: 'cli@ex.com', email_verified: true }).firestore()
const anonimo = env.unauthenticatedContext().firestore()

await env.withSecurityRulesDisabled(async (ctx) => {
  const d = ctx.firestore()
  await setDoc(doc(d, 'pdv_sessoes', 'login-ana'), { tipo: 'u', usuario: 'ana', ate: daqui_a_1h, modo: 'caixa', filial: 'f-a', terminal: 't1' })
  await setDoc(doc(d, 'pdv_sessoes', 'login-ana-velho'), { tipo: 'u', usuario: 'ana', ate: Timestamp.fromMillis(Date.now() - 1000) })
  await setDoc(doc(d, 'pdv_sessoes', 'login-rui'), { tipo: 'u', usuario: 'rui', ate: daqui_a_1h })
  await setDoc(doc(d, 'pdv_sessoes', 'login-nada'), { tipo: 'u', usuario: 'nada', ate: daqui_a_1h })
  await setDoc(doc(d, 'pdv_sessoes', 'login-pc'), { tipo: 't', terminal: 't1', filial: 'f-a' })
  await setDoc(doc(d, 'pdv_usuarios', 'ana'), { nome: 'Ana', perfilId: 'perfil-atendente', filiais: ['f-a'], ativo: true, temPin: true })
  await setDoc(doc(d, 'pdv_usuarios', 'rui'), { nome: 'Rui', perfilId: 'perfil-atendente', filiais: ['f-a'], ativo: false, temPin: true })
  await setDoc(doc(d, 'pdv_perfis', 'perfil-atendente'), { nome: 'Atendente', permissoes: ['caixa.vender'], sistema: false })
  await setDoc(doc(d, 'pdv_segredos', 'ana'), { pin: { hash: 'x', sal: 'y', iteracoes: 210000 }, tentativas: 0 })
  await setDoc(doc(d, 'pdv_terminais', 't1'), { filialId: 'f-a', pdvId: 'p1', nome: 'Caixa 1', ativo: true })
  await setDoc(doc(d, 'pdv_auditoria', 'r1'), { acao: 'acesso.entrou', usuarioId: 'ana' })
  await setDoc(doc(d, 'pdv_autorizacoes', 'z1'), { supervisorId: 'rui', usada: false })
  await setDoc(doc(d, 'pdv_config', 'sistema'), { permissoesAplicadas: [] })
  await setDoc(doc(d, 'lojas', 'cajamar'), { nome: 'Cajamar', ativa: true })
  await setDoc(doc(d, 'lancamentos', 'l1'), { tipo: 'compra', loja: 'cajamar', operador: 'x@ex.com' })
})

let falhas = 0
const teste = async (nome, fn) => {
  try { await fn(); console.log('  ok   ', nome) }
  catch (e) { falhas++; console.log('  FALHA', nome, '→', String(e.message).slice(0, 160)) }
}

console.log('\n== PDV: a própria ficha e os perfis ==')
await teste('pessoa lê a própria ficha', () => assertSucceeds(getDoc(doc(pessoa, 'pdv_usuarios', 'ana'))))
await teste('pessoa lê os perfis', () => assertSucceeds(getDocs(collection(pessoa, 'pdv_perfis'))))
await teste('RECUSA ler a ficha de outra pessoa', () => assertFails(getDoc(doc(pessoa, 'pdv_usuarios', 'rui'))))
await teste('RECUSA listar as pessoas', () => assertFails(getDocs(collection(pessoa, 'pdv_usuarios'))))
await teste('RECUSA mudar o próprio perfil', () => assertFails(updateDoc(doc(pessoa, 'pdv_usuarios', 'ana'), { perfilId: 'perfil-admin' })))
await teste('RECUSA criar outra pessoa', () => assertFails(setDoc(doc(pessoa, 'pdv_usuarios', 'novo'), { nome: 'X', ativo: true, perfilId: 'perfil-admin' })))
await teste('RECUSA dar permissão a um perfil', () => assertFails(updateDoc(doc(pessoa, 'pdv_perfis', 'perfil-atendente'), { permissoes: ['admin.usuarios'] })))

console.log('\n== PDV: sessões ==')
await teste('cada login lê a própria sessão', () => assertSucceeds(getDoc(doc(pessoa, 'pdv_sessoes', 'login-ana'))))
await teste('RECUSA ler a sessão de outro login', () => assertFails(getDoc(doc(pessoa, 'pdv_sessoes', 'login-pc'))))
await teste('RECUSA listar sessões', () => assertFails(getDocs(collection(pessoa, 'pdv_sessoes'))))
await teste('RECUSA criar a própria sessão (virar alguém sem PIN)', () => assertFails(setDoc(doc(semSessao, 'pdv_sessoes', 'login-solto'), { tipo: 'u', usuario: 'ana', ate: daqui_a_1h })))
await teste('RECUSA esticar a própria sessão', () => assertFails(updateDoc(doc(pessoa, 'pdv_sessoes', 'login-ana'), { ate: Timestamp.fromMillis(Date.now() + 99 * 3_600_000) })))
await teste('RECUSA trocar a pessoa da própria sessão', () => assertFails(updateDoc(doc(pessoa, 'pdv_sessoes', 'login-ana'), { usuario: 'rui' })))
await teste('RECUSA apagar a sessão de outro', () => assertFails(deleteDoc(doc(pessoa, 'pdv_sessoes', 'login-pc'))))
await teste('RECUSA login anônimo sem sessão ler perfis', () => assertFails(getDocs(collection(semSessao, 'pdv_perfis'))))

console.log('\n== PDV: sessão vencida, pessoa desligada, login estranho ==')
await teste('RECUSA sessão vencida', () => assertFails(getDoc(doc(vencida, 'pdv_usuarios', 'ana'))))
await teste('RECUSA perfis com sessão vencida', () => assertFails(getDocs(collection(vencida, 'pdv_perfis'))))
await teste('RECUSA pessoa desativada ler a ficha', () => assertFails(getDoc(doc(desligada, 'pdv_usuarios', 'rui'))))
await teste('RECUSA pessoa desativada ler perfis', () => assertFails(getDocs(collection(desligada, 'pdv_perfis'))))
await teste('RECUSA sessão de quem não existe', () => assertFails(getDocs(collection(fantasma, 'pdv_perfis'))))
await teste('RECUSA computador ler fichas', () => assertFails(getDoc(doc(computador, 'pdv_usuarios', 'ana'))))
await teste('RECUSA computador ler perfis', () => assertFails(getDocs(collection(computador, 'pdv_perfis'))))
await teste('RECUSA cliente do clube ler perfis', () => assertFails(getDocs(collection(cliente, 'pdv_perfis'))))
await teste('RECUSA anônimo ler perfis', () => assertFails(getDocs(collection(anonimo, 'pdv_perfis'))))

console.log('\n== PDV: só as funções alcançam ==')
for (const [nome, ctx] of [['pessoa', pessoa], ['computador', computador], ['admin do clube', adminClube], ['anônimo', anonimo]]) {
  await teste(`RECUSA ${nome} ler o hash do PIN`, () => assertFails(getDoc(doc(ctx, 'pdv_segredos', 'ana'))))
  await teste(`RECUSA ${nome} zerar as tentativas`, () => assertFails(setDoc(doc(ctx, 'pdv_segredos', 'ana'), { tentativas: 0, bloqueadoAte: null })))
}
for (const colecao of ['pdv_terminais', 'pdv_auditoria', 'pdv_autorizacoes', 'pdv_config']) {
  await teste(`RECUSA ler ${colecao}`, () => assertFails(getDocs(collection(pessoa, colecao))))
  await teste(`RECUSA gravar em ${colecao}`, () => assertFails(setDoc(doc(pessoa, colecao, 'novo'), { x: 1 })))
  await teste(`RECUSA admin do clube ler ${colecao}`, () => assertFails(getDocs(collection(adminClube, colecao))))
}
await teste('RECUSA apagar um registro de acesso', () => assertFails(setDoc(doc(adminClube, 'pdv_auditoria', 'r1'), { acao: 'nada' })))
await teste('RECUSA marcar uma autorização como não usada', () => assertFails(updateDoc(doc(pessoa, 'pdv_autorizacoes', 'z1'), { usada: false })))

console.log('\n== PDV não vira equipe do clube ==')
await teste('RECUSA login do PDV ler o livro de lançamentos', () => assertFails(getDoc(doc(pessoa, 'lancamentos', 'l1'))))
await teste('RECUSA login do PDV listar a equipe', () => assertFails(getDocs(collection(pessoa, 'equipe'))))
await teste('RECUSA login do PDV ler a carteira de um cliente', () => assertFails(getDoc(doc(pessoa, 'usuarios', 'cli'))))

await env.cleanup()
console.log(falhas ? `\n${falhas} FALHA(S) nas regras do PDV\n` : '\nRegras do PDV: todos passaram.\n')
process.exit(falhas ? 1 : 0)
