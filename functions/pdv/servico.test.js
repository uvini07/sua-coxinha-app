// Testes do login do PDV no emulador (Firestore + Auth), chamando o serviço
// como o onCall chamaria. Cada bloco tenta o que um atacante tentaria.
//
//   npm run testar:pdv      (na raiz do app; precisa de Java)

process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8085'

const { test, before } = require('node:test')
const assert = require('node:assert/strict')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const { criarServico, EMAIL_ADMIN } = require('./servico.js')

const PROJETO = 'suacoxinhaapp'
initializeApp({ projectId: PROJETO })
const db = getFirestore()

let relogio = Date.parse('2026-10-26T12:00:00Z')
// O navegador manda o token do login anônimo; aqui "anon:<uid>" faz o papel
// dele. Qualquer outro token (ou de outro provedor) é recusado, como no real.
const authFalso = {
  verifyIdToken: async (t) => {
    if (typeof t === 'string' && t.startsWith('anon:')) return { uid: t.slice(5), firebase: { sign_in_provider: 'anonymous' } }
    if (typeof t === 'string' && t.startsWith('google:')) return { uid: t.slice(7), firebase: { sign_in_provider: 'google.com' } }
    throw new Error('token inválido')
  },
}
const s = criarServico({ db, auth: authFalso, agora: () => relogio })

// --- Quem chama ----------------------------------------------------------------

const google = (email, { verificado = true, nome = 'Fulano' } = {}) => ({
  auth: { uid: `g_${email}`, token: { email, email_verified: verificado, name: nome, firebase: { sign_in_provider: 'google.com' } } },
})

// Um login anônimo do navegador (computador ou pessoa)
const anonimo = (uid) => ({ auth: { uid, token: { firebase: { sign_in_provider: 'anonymous' } } } })
const sessao = async (uid) => (await db.doc(`pdv_sessoes/${uid}`).get()).data()
let seq = 0
// A pessoa entra com PIN num computador: o navegador cria um login anônimo
// novo e manda o token dele junto.
async function entrarPin(terminal, dados) {
  const uid = `pessoa-${++seq}`
  const r = await s.entrarPin(chamar(terminal, { ...dados, tokenPessoa: `anon:${uid}` }))
  return { r, quem: anonimo(uid) }
}
const chamar = (quem, data) => ({ ...quem, data })

async function recusa(promessa, codigo, trecho) {
  await assert.rejects(promessa, (e) => {
    assert.equal(e.code, codigo, `esperava ${codigo}, veio ${e.code}: ${e.message}`)
    if (trecho) assert.match(e.message, trecho)
    return true
  })
}

const auditoria = async (acao) => (await db.collection('pdv_auditoria').where('acao', '==', acao).get()).docs.map((d) => d.data())

// --- Cenário: a rede com duas lojas ---------------------------------------------

const A = 'f-max-morumbi'
const B = 'f-penha'
const pessoas = {}

before(async () => {
  await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${PROJETO}/databases/(default)/documents`, { method: 'DELETE' })
})

test('primeiro login do dono cria os perfis e o administrador', async () => {
  const r = await s.entrarGoogle(google(EMAIL_ADMIN, { nome: 'Marcelo' }))
  pessoas.admin = google(EMAIL_ADMIN)
  assert.equal(r.usuario.dono, true)
  assert.equal(r.usuario.perfilId, 'perfil-admin')
  const v = await sessao(pessoas.admin.auth.uid)
  assert.equal(v.modo, 'admin')
  assert.equal(v.ate.toMillis(), relogio + 12 * 3_600_000)
  const perfis = await db.collection('pdv_perfis').get()
  assert.deepEqual(perfis.docs.map((d) => d.id).sort(), ['perfil-admin', 'perfil-atendente', 'perfil-cozinha', 'perfil-gerente'])

  // Segundo login: o mesmo dono, sem criar outro
  const de_novo = await s.entrarGoogle(google(EMAIL_ADMIN))
  assert.equal(de_novo.usuario.id, r.usuario.id)
  assert.equal((await db.collection('pdv_usuarios').get()).size, 1)
})

test('Google: recusa e-mail não verificado, outro provedor e quem não está cadastrado', async () => {
  await recusa(s.entrarGoogle(google(EMAIL_ADMIN, { verificado: false })), 'permission-denied')
  await recusa(s.entrarGoogle({ auth: { uid: 'x', token: { email: EMAIL_ADMIN, email_verified: true, firebase: { sign_in_provider: 'password' } } } }), 'unauthenticated')
  await recusa(s.entrarGoogle({}), 'unauthenticated')
  await recusa(s.entrarGoogle(google('estranho@ex.com')), 'permission-denied', /não tem acesso/)
  assert.ok((await auditoria('acesso.falhou')).some((r) => r.detalhe.includes('estranho@ex.com')))
})

test('administrador cadastra gerente e atendentes; o hash do PIN fica só em pdv_segredos', async () => {
  const novo = (dados) => s.salvarUsuario(chamar(pessoas.admin, dados))
  pessoas.gerenteA = (await novo({ nome: 'Bruno Lima', email: 'Bruno@Ex.com', perfilId: 'perfil-gerente', filiais: [A], pin: '7392' })).usuario
  pessoas.atendA = (await novo({ nome: 'Ana Souza', perfilId: 'perfil-atendente', filiais: [A], pin: '4821' })).usuario
  pessoas.atendB = (await novo({ nome: 'Paula Penha', perfilId: 'perfil-atendente', filiais: [B], pin: '5170' })).usuario
  pessoas.cozinhaA = (await novo({ nome: 'Cozinha Morumbi', perfilId: 'perfil-cozinha', filiais: [A], pin: '6284' })).usuario

  assert.equal(pessoas.gerenteA.email, 'bruno@ex.com')
  const doc = (await db.doc(`pdv_usuarios/${pessoas.atendA.id}`).get()).data()
  assert.equal(doc.pin, undefined)
  assert.equal(doc.temPin, true)
  assert.equal(doc.pinDigitos, 4)
  const segredo = (await db.doc(`pdv_segredos/${pessoas.atendA.id}`).get()).data()
  assert.equal(segredo.pin.iteracoes, 210_000)
  assert.notEqual(segredo.pin.hash, '4821')
})

test('cadastro: recusa PIN fraco, e-mail repetido e usuário sem PIN nem e-mail', async () => {
  const novo = (dados) => s.salvarUsuario(chamar(pessoas.admin, { perfilId: 'perfil-atendente', filiais: [A], ...dados }))
  await recusa(novo({ nome: 'X', pin: '1234' }), 'invalid-argument', /sequência/)
  await recusa(novo({ nome: 'X', pin: '0000' }), 'invalid-argument', /repetir/)
  await recusa(novo({ nome: 'X', email: 'bruno@ex.com', pin: '8361' }), 'invalid-argument', /e-mail/)
  await recusa(novo({ nome: 'X' }), 'invalid-argument', /PIN/)
  await recusa(novo({ nome: '', pin: '8361' }), 'invalid-argument', /nome/)
})

test('liberar o computador: só pela retaguarda, com admin.config e na própria filial', async () => {
  const r = await s.parear(chamar(pessoas.admin, { filialId: A, pdvId: 'pdv-f-max-morumbi-1', nome: 'Caixa 1', tokenComputador: 'anon:pc-a' }))
  pessoas.terminalA = anonimo('pc-a')
  const v = await sessao('pc-a')
  assert.equal(v.tipo, 't')
  assert.equal(v.terminal, r.terminal.id)
  assert.equal(v.filial, A)

  // Só um login anônimo vira computador (não dá para "liberar" a conta de alguém)
  await recusa(s.parear(chamar(pessoas.admin, { filialId: A, pdvId: 'p', nome: 'Caixa 2', tokenComputador: 'google:outra' })), 'unauthenticated')
  await recusa(s.parear(chamar(pessoas.admin, { filialId: A, pdvId: 'p', nome: 'Caixa 2' })), 'invalid-argument')
  // Gerente entra na retaguarda com o Google, mas o perfil padrão não tem admin.config
  const gerente = google('bruno@ex.com')
  await s.entrarGoogle(gerente)
  await recusa(s.parear(chamar(gerente, { filialId: A, pdvId: 'p', nome: 'Caixa 2', tokenComputador: 'anon:pc-x' })), 'permission-denied')
  // Um computador liberado não libera outro
  await recusa(s.parear(chamar(pessoas.terminalA, { filialId: A, pdvId: 'p', nome: 'Caixa 2', tokenComputador: 'anon:pc-x' })), 'unauthenticated')
  // Login anônimo qualquer não é computador
  await recusa(s.operadores(anonimo('pc-x')), 'unauthenticated')
})

test('computador lista só quem atende naquela filial e tem PIN', async () => {
  const { terminal, pessoas: lista } = await s.operadores(pessoas.terminalA)
  assert.equal(terminal.filialId, A)
  assert.deepEqual(lista.map((p) => p.nome), ['Ana Souza', 'Bruno Lima', 'Cozinha Morumbi'])
  assert.equal(lista.find((p) => p.nome === 'Cozinha Morumbi').caixa, false)
  // Sem identidade de computador, nada feito
  await recusa(s.operadores(pessoas.admin), 'unauthenticated')
  await recusa(s.operadores({}), 'unauthenticated')
})

test('PIN certo entra; errado não; pessoa de outra filial responde igual a PIN errado', async () => {
  const { r, quem } = await entrarPin(pessoas.terminalA, { usuarioId: pessoas.atendA.id, pin: '4821', modo: 'caixa' })
  const v = await sessao(quem.auth.uid)
  assert.equal(v.usuario, pessoas.atendA.id)
  assert.equal(v.filial, A)
  assert.equal(v.terminal, (await sessao('pc-a')).terminal)
  assert.equal(v.modo, 'caixa')
  assert.equal(r.filialId, A)
  pessoas.sessaoAtendA = quem
  // Sem o token do login anônimo da pessoa, não abre sessão
  await recusa(s.entrarPin(chamar(pessoas.terminalA, { usuarioId: pessoas.atendA.id, pin: '4821', modo: 'caixa' })), 'invalid-argument')

  await recusa(s.entrarPin(chamar(pessoas.terminalA, { usuarioId: pessoas.atendA.id, pin: '4822', modo: 'caixa' })), 'permission-denied', /PIN não confere/)
  await recusa(s.entrarPin(chamar(pessoas.terminalA, { usuarioId: pessoas.atendB.id, pin: '5170', modo: 'caixa' })), 'permission-denied', /PIN não confere/)
  await recusa(s.entrarPin(chamar(pessoas.terminalA, { usuarioId: 'nao-existe', pin: '5170', modo: 'caixa' })), 'permission-denied', /PIN não confere/)
  // Cozinha não registra pedidos no caixa (mesmo com o PIN certo)
  await recusa(s.entrarPin(chamar(pessoas.terminalA, { usuarioId: pessoas.cozinhaA.id, pin: '6284', modo: 'caixa' })), 'permission-denied', /não registra pedidos/)
  assert.ok(await entrarPin(pessoas.terminalA, { usuarioId: pessoas.cozinhaA.id, pin: '6284', modo: 'cozinha' }))
})

test('força bruta: 5 erros bloqueiam; nem o PIN certo entra até passar o tempo', async () => {
  const tentar = (pin) => entrarPin(pessoas.terminalA, { usuarioId: pessoas.gerenteA.id, pin, modo: 'caixa' })
  for (const pin of ['1111', '2222', '3333', '4444']) await recusa(tentar(pin), 'permission-denied')
  await recusa(tentar('5555'), 'resource-exhausted', /1 min/)
  await recusa(tentar('7392'), 'resource-exhausted')

  const { pessoas: lista } = await s.operadores(pessoas.terminalA)
  assert.equal(lista.find((p) => p.id === pessoas.gerenteA.id).bloqueado, true)
  assert.equal((await auditoria('acesso.bloqueado')).length, 1)

  relogio += 61_000
  // Depois do bloqueio, o próximo erro já bloqueia de novo, por mais tempo
  await recusa(tentar('6666'), 'resource-exhausted', /2 min/)
  relogio += 121_000
  assert.ok(await tentar('7392'))
  const segredo = (await db.doc(`pdv_segredos/${pessoas.gerenteA.id}`).get()).data()
  assert.equal(segredo.tentativas, 0)
})

test('tentativas em paralelo não furam o limite', async () => {
  await s.desbloquearUsuario(chamar(pessoas.admin, { id: pessoas.atendA.id }))
  const tentar = (pin) => entrarPin(pessoas.terminalA, { usuarioId: pessoas.atendA.id, pin, modo: 'caixa' }).catch((e) => e.code)
  const chutes = ['1357', '2468', '3579', '4680', '5791', '6802', '7913', '8024', '9135', '1470']
  const respostas = await Promise.all(chutes.map(tentar))
  assert.equal(respostas.filter((c) => c === 'permission-denied').length, 4)
  const segredo = (await db.doc(`pdv_segredos/${pessoas.atendA.id}`).get()).data()
  assert.equal(segredo.tentativas, 5)
  relogio += 61_000
  await s.desbloquearUsuario(chamar(pessoas.admin, { id: pessoas.atendA.id }))
})

test('desbloqueio de tela confere o PIN da própria pessoa', async () => {
  assert.deepEqual(await s.conferirPin(chamar(pessoas.sessaoAtendA, { pin: '4821' })), { ok: true })
  await recusa(s.conferirPin(chamar(pessoas.sessaoAtendA, { pin: '7392' })), 'permission-denied')
})

test('autorização de supervisor: só quem tem a permissão, da mesma filial, com o PIN dele', async () => {
  const { pessoas: lista } = await s.supervisores(chamar(pessoas.sessaoAtendA, { permissao: 'caixa.cancelarVenda', filialId: A }))
  assert.deepEqual(lista.map((p) => p.nome), ['Bruno Lima'])
  await recusa(s.supervisores(chamar(pessoas.sessaoAtendA, { permissao: 'caixa.cancelarVenda', filialId: B })), 'permission-denied')

  const pedir = (supervisorId, pin, permissao = 'caixa.cancelarVenda') =>
    s.autorizar(chamar(pessoas.sessaoAtendA, { supervisorId, pin, permissao, filialId: A, acao: 'Cancelar o pedido 12' }))
  const ok = await pedir(pessoas.gerenteA.id, '7392')
  assert.equal(ok.usuario.nome, 'Bruno Lima')
  const registro = (await db.doc(`pdv_autorizacoes/${ok.autorizacaoId}`).get()).data()
  assert.equal(registro.solicitanteId, pessoas.atendA.id)
  assert.equal(registro.usada, false)

  await recusa(pedir(pessoas.gerenteA.id, '7393'), 'permission-denied', /PIN não confere/)
  // Atendente com o próprio PIN não se autoriza a cancelar venda
  await recusa(pedir(pessoas.atendA.id, '4821'), 'permission-denied', /não tem permissão/)
  // Gerente de outra filial nem entra na conta
  await recusa(pedir(pessoas.atendB.id, '5170'), 'permission-denied', /PIN não confere/)
  assert.equal((await auditoria('autorizacao.negada')).length, 1)
})

test('escalada de privilégio: quem cuida de usuários só dá o que tem, onde tem', async () => {
  // Perfil de "gerente de RH" da loja A: cadastra usuários, mas não é admin
  const { perfil } = await s.salvarPerfil(chamar(pessoas.admin, { nome: 'Gerente RH', permissoes: ['admin.usuarios', 'caixa.vender', 'caixa.abrir', 'caixa.fechar', 'caixa.cancelarItem', 'caixa.reimprimir', 'caixa.pausarProduto', 'caixa.desconto', 'cozinha.ver'] }))
  const rh = (await s.salvarUsuario(chamar(pessoas.admin, { nome: 'Rita RH', email: 'rita@ex.com', perfilId: perfil.id, filiais: [A], pin: '2580' }))).usuario
  const sessaoRh = google('rita@ex.com')
  await s.entrarGoogle(sessaoRh)
  const salvar = (dados) => s.salvarUsuario(chamar(sessaoRh, dados))

  await recusa(salvar({ nome: 'Hacker', perfilId: 'perfil-admin', filiais: [A], pin: '8642' }), 'invalid-argument', /mais acesso/)
  await recusa(salvar({ nome: 'Hacker', perfilId: 'perfil-gerente', filiais: [A], pin: '8642' }), 'invalid-argument', /mais acesso/)
  await recusa(salvar({ nome: 'Hacker', perfilId: 'perfil-atendente', todasFiliais: true, pin: '8642' }), 'invalid-argument', /filiais/)
  await recusa(salvar({ nome: 'Hacker', perfilId: 'perfil-atendente', filiais: [B], pin: '8642' }), 'invalid-argument', /filiais/)
  // Trocar o PIN do dono ou de alguém de outra loja para entrar no lugar dele
  const dono = (await db.collection('pdv_usuarios').where('dono', '==', true).get()).docs[0]
  await recusa(salvar({ id: dono.id, nome: 'Marcelo', perfilId: 'perfil-admin', todasFiliais: true, pin: '8642' }), 'invalid-argument', /mais acesso|filiais/)
  await recusa(salvar({ id: pessoas.atendB.id, nome: 'Paula Penha', perfilId: 'perfil-atendente', filiais: [A], pin: '8642' }), 'permission-denied')
  // Perfis valem para a rede: gerente de loja não mexe
  await recusa(s.salvarPerfil(chamar(sessaoRh, { id: 'perfil-atendente', nome: 'Atendente', permissoes: ['caixa.vender'] })), 'permission-denied', /franqueadora/)
  // Nem desativa a si mesmo
  await recusa(salvar({ id: rh.id, nome: 'Rita RH', perfilId: perfil.id, filiais: [A], ativo: false }), 'invalid-argument', /próprio acesso/)

  // O que está no alcance funciona
  const nova = await salvar({ nome: 'Nina Nova', perfilId: 'perfil-atendente', filiais: [A], pin: '3691' })
  assert.equal(nova.usuario.filiais[0], A)
  const { usuarios: visiveis } = await s.listarUsuarios(sessaoRh)
  assert.ok(!visiveis.some((u) => u.id === pessoas.atendB.id), 'não vê a equipe de outra loja')
  assert.ok(!visiveis.some((u) => u.dono), 'não vê o dono')
})

test('o dono continua administrador de todas as filiais', async () => {
  const dono = (await db.collection('pdv_usuarios').where('dono', '==', true).get()).docs[0]
  await recusa(s.salvarUsuario(chamar(pessoas.admin, { id: dono.id, nome: 'Marcelo', email: EMAIL_ADMIN, perfilId: 'perfil-gerente', todasFiliais: true })), 'invalid-argument', /continua administrador/)
  await recusa(s.salvarUsuario(chamar(pessoas.admin, { id: dono.id, nome: 'Marcelo', email: EMAIL_ADMIN, perfilId: 'perfil-admin', filiais: [A] })), 'invalid-argument', /todas as filiais/)
  const ok = await s.salvarUsuario(chamar(pessoas.admin, { id: dono.id, nome: 'Marcelo Jordão', email: EMAIL_ADMIN, perfilId: 'perfil-admin', todasFiliais: true, pin: '9517' }))
  assert.equal(ok.usuario.temPin, true)
})

test('perfil em uso não é apagado; o Administrador é fixo', async () => {
  await recusa(s.removerPerfil(chamar(pessoas.admin, { id: 'perfil-atendente' })), 'failed-precondition')
  await recusa(s.removerPerfil(chamar(pessoas.admin, { id: 'perfil-admin' })), 'permission-denied')
  await recusa(s.salvarPerfil(chamar(pessoas.admin, { id: 'perfil-admin', nome: 'Admin', permissoes: [] })), 'permission-denied', /fixo/)
  await recusa(s.salvarPerfil(chamar(pessoas.admin, { nome: 'Esquisito', permissoes: ['tudo.liberado'] })), 'invalid-argument')
})

test('desativar a pessoa derruba a sessão dela na hora', async () => {
  await s.salvarUsuario(chamar(pessoas.admin, { id: pessoas.atendA.id, nome: 'Ana Souza', perfilId: 'perfil-atendente', filiais: [A], ativo: false }))
  // A sessão dela foi apagada junto: o login dela não vale mais nada
  await recusa(s.conferirPin(chamar(pessoas.sessaoAtendA, { pin: '4821' })), 'unauthenticated')
  await recusa(entrarPin(pessoas.terminalA, { usuarioId: pessoas.atendA.id, pin: '4821', modo: 'caixa' }), 'permission-denied', /PIN não confere/)
  assert.equal((await db.collection('pdv_sessoes').where('usuario', '==', pessoas.atendA.id).get()).size, 0, 'sessões dela apagadas')
})

test('sair apaga a sessão na hora', async () => {
  const { quem } = await entrarPin(pessoas.terminalA, { usuarioId: pessoas.gerenteA.id, pin: '7392', modo: 'caixa' })
  await s.sair(quem)
  assert.equal(await sessao(quem.auth.uid), undefined)
  await recusa(s.conferirPin(chamar(quem, { pin: '7392' })), 'unauthenticated')
})

test('sessão vence em 12 horas', async () => {
  const { quem } = await entrarPin(pessoas.terminalA, { usuarioId: pessoas.gerenteA.id, pin: '7392', modo: 'caixa' })
  relogio += 12 * 3_600_000 + 1
  await recusa(s.conferirPin(chamar(quem, { pin: '7392' })), 'unauthenticated', /expirou/)
})

test('computador desligado pela retaguarda para de funcionar', async () => {
  await s.entrarGoogle(pessoas.admin)
  const { terminais } = await s.listarTerminais(pessoas.admin)
  assert.equal(terminais.length, 1)
  await s.desativarTerminal(chamar(pessoas.admin, { id: terminais[0].id }))
  await recusa(s.operadores(pessoas.terminalA), 'unauthenticated', /não está liberado/)
  await recusa(entrarPin(pessoas.terminalA, { usuarioId: pessoas.gerenteA.id, pin: '7392', modo: 'caixa' }), 'unauthenticated', /não está liberado/)
  assert.equal(await sessao('pc-a'), undefined, 'a liberação do computador some')
})

test('registro de acessos: o administrador vê; a auditoria é do servidor', async () => {
  const { registros } = await s.acessos(pessoas.admin)
  const acoes = new Set(registros.map((r) => r.acao))
  for (const a of ['acesso.entrou', 'acesso.falhou', 'acesso.bloqueado', 'autorizacao.concedida', 'usuario.criado', 'terminal.liberado', 'terminal.desligado']) assert.ok(acoes.has(a), a)
  const gerente = google('bruno@ex.com')
  await s.entrarGoogle(gerente)
  await recusa(s.acessos(gerente), 'permission-denied')
})
