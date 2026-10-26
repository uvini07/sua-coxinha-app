// LOGIN DO PDV NO SERVIDOR (pdvmarkfy)
//
// Quem decide quem entra no PDV é este arquivo, não o navegador. O PIN e o
// bloqueio por tentativas moram em `pdv_segredos`, que as regras não deixam
// ninguém ler.
//
// Sessões, sem token assinado (e por isso sem precisar de permissão de IAM):
//   · Computador — entra com o login anônimo do Firebase. Um gerente libera
//     esse login uma vez: pdv_sessoes/{uid} = { tipo: 't', terminal }.
//   · Pessoa no caixa ou na cozinha — também entra anônima; o computador
//     manda o PIN dela e, se conferir, a função grava
//     pdv_sessoes/{uid} = { tipo: 'u', usuario, ate, ... } (vale 12 h).
//   · Retaguarda — entra com o Google; a sessão é gravada no uid do Google.
// As regras do Firestore conferem essa sessão em cada leitura.
//
// Coleções (todas fora do alcance do clube):
//   pdv_sessoes/{uid}      quem está logado com cada login do Firebase
//   pdv_usuarios/{id}      quem usa o PDV (sem segredo nenhum)
//   pdv_segredos/{id}      hash do PIN e tentativas — só as funções leem
//   pdv_perfis/{id}        perfis de acesso e permissões
//   pdv_terminais/{id}     computadores liberados
//   pdv_autorizacoes/{id}  cada autorização de supervisor dada com PIN
//   pdv_auditoria/{id}     acessos, só de inclusão (ninguém edita nem apaga)
//   pdv_config/{doc}       controle interno (perfis iniciais, dono da rede)
//
// Cada função recebe a requisição do onCall ({ auth, data }); `criarServico`
// recebe o banco e o Auth por parâmetro para os testes rodarem no emulador.

const { HttpsError } = require('firebase-functions/v2/https')
const { FieldValue, Timestamp } = require('firebase-admin/firestore')
const R = require('./regras.js')
const { PERFIS_PADRAO, PERMISSOES_NOVAS } = require('./permissoes.js')

// O dono do app e da rede. Precisa bater com `souAdmin()` em firestore.rules.
const EMAIL_ADMIN = 'marcelinhojordao07@gmail.com'

const MSG_PIN = 'PIN não confere.'

function criarServico({ db, auth, agora = () => Date.now() }) {
  const usuarios = db.collection('pdv_usuarios')
  const segredos = db.collection('pdv_segredos')
  const perfis = db.collection('pdv_perfis')
  const terminais = db.collection('pdv_terminais')
  const sessoes = db.collection('pdv_sessoes')

  const falha = (codigo, mensagem, detalhes) => new HttpsError(codigo, mensagem, detalhes)
  const invalido = (erros) => falha('invalid-argument', Object.values(erros)[0], { erros })

  const ler = async (ref) => {
    const s = await ref.get()
    return s.exists ? { id: s.id, ...s.data() } : null
  }
  const lerUsuario = (id) => (R.idValido(id) ? ler(usuarios.doc(id)) : null)
  const lerPerfil = (id) => (R.idValido(id) ? ler(perfis.doc(id)) : null)

  async function mapaPerfis() {
    const s = await perfis.get()
    return new Map(s.docs.map((d) => [d.id, { id: d.id, ...d.data() }]))
  }

  async function todosUsuarios(soAtivos) {
    const s = await (soAtivos ? usuarios.where('ativo', '==', true) : usuarios).get()
    return s.docs.map((d) => ({ id: d.id, ...d.data() }))
  }

  const ms = (t) => t?.toMillis?.() || 0
  const bloqueado = (u) => ms(u.bloqueadoAte) > agora()

  // O que a tela pode ver de um usuário: nunca o hash.
  const publico = (u) => ({
    id: u.id,
    nome: u.nome,
    email: u.email || '',
    perfilId: u.perfilId,
    todasFiliais: Boolean(u.todasFiliais),
    filiais: u.filiais || [],
    ativo: Boolean(u.ativo),
    temPin: Boolean(u.temPin),
    pinDigitos: u.pinDigitos || null,
    bloqueado: bloqueado(u),
    dono: Boolean(u.dono),
    criadoEm: u.criadoEm?.toDate?.().toISOString() || null,
  })

  async function registrar(acao, detalhe, { usuario, filialId, terminalId } = {}) {
    await db.collection('pdv_auditoria').add({
      em: FieldValue.serverTimestamp(),
      acao,
      detalhe: R.texto(detalhe, 500),
      usuarioId: usuario?.id || null,
      usuarioNome: usuario?.nome || 'Sistema',
      filialId: filialId || null,
      terminalId: terminalId || null,
    })
  }

  // --- Quem está chamando ----------------------------------------------------

  function exigirGoogle(req) {
    const t = req.auth?.token
    if (!t || t.firebase?.sign_in_provider !== 'google.com') throw falha('unauthenticated', 'Entre com a conta Google.')
    if (t.email_verified !== true || !t.email) throw falha('permission-denied', 'O e-mail desta conta Google não está verificado.')
    return R.email(t.email)
  }

  async function sessaoDe(req) {
    const uid = req.auth?.uid
    return uid ? ler(sessoes.doc(uid)) : null
  }

  async function exigirTerminal(req) {
    const v = await sessaoDe(req)
    if (v?.tipo !== 't' || !R.idValido(v.terminal)) throw falha('unauthenticated', 'Este computador não está liberado como caixa.', { motivo: 'sem-terminal' })
    const terminal = await ler(terminais.doc(v.terminal))
    if (!terminal?.ativo) throw falha('permission-denied', 'Este computador foi desligado do PDV. Peça a um gerente para liberar de novo.', { motivo: 'terminal-inativo' })
    return terminal
  }

  async function exigirOperador(req, permissao) {
    const v = await sessaoDe(req)
    if (v?.tipo !== 'u' || !R.idValido(v.usuario)) throw falha('unauthenticated', 'Entre no PDV de novo.', { motivo: 'sem-sessao' })
    if (!(ms(v.ate) > agora())) throw falha('unauthenticated', 'A sessão expirou. Entre de novo.', { motivo: 'sessao-expirada' })
    const usuario = await lerUsuario(v.usuario)
    if (!usuario?.ativo) throw falha('permission-denied', 'Seu acesso ao PDV foi desativado.', { motivo: 'usuario-inativo' })
    const perfil = await lerPerfil(usuario.perfilId)
    if (permissao && !R.pode(usuario, perfil, permissao)) throw falha('permission-denied', 'Seu perfil não pode fazer isso.')
    return { usuario, perfil, sessao: v }
  }

  // O login anônimo que o navegador criou para a pessoa ou para o computador.
  // O token prova que ele é dono daquele uid (conferência com chave pública:
  // não precisa de permissão de IAM).
  async function uidAnonimo(token) {
    if (typeof token !== 'string' || !token) throw falha('invalid-argument', 'Entre de novo.')
    const d = await auth.verifyIdToken(token).catch(() => null)
    if (d?.firebase?.sign_in_provider !== 'anonymous') throw falha('unauthenticated', 'Entre de novo.')
    return d.uid
  }

  async function abrirSessao(uid, usuario, extra) {
    const ate = agora() + R.SESSAO_HORAS * 3_600_000
    await sessoes.doc(uid).set({ tipo: 'u', usuario: usuario.id, ate: Timestamp.fromMillis(ate), filial: null, terminal: null, ...extra, criadoEm: FieldValue.serverTimestamp() })
    return ate
  }

  // --- PIN com bloqueio --------------------------------------------------------
  //
  // A conferência roda numa transação: duas tentativas ao mesmo tempo (dois
  // computadores, ou alguém disparando em paralelo) leem e gravam o contador
  // uma depois da outra, então não dá para testar mais PINs que o limite.

  const mensagemBloqueio = (ate) => `Muitas tentativas erradas. Tente de novo em ${R.minutosAte(ate, agora())} min ou peça a um gerente.`

  async function exigirPin(usuario, pin, { contexto, filialId, terminalId }) {
    if (!usuario.temPin) throw falha('failed-precondition', `${usuario.nome} não tem PIN cadastrado.`)
    if (typeof pin !== 'string' || !/^\d{4,6}$/.test(pin)) throw falha('invalid-argument', MSG_PIN, { motivo: 'pin' })

    const ref = segredos.doc(usuario.id)
    const r = await db.runTransaction(async (tx) => {
      const s = (await tx.get(ref)).data() || {}
      const momento = agora()
      const ate = ms(s.bloqueadoAte)
      if (ate > momento) return { jaBloqueado: true, bloqueadoAte: ate }
      if (await R.conferirCredencial(pin, s.pin)) {
        if (s.tentativas || ate) tx.set(ref, { tentativas: 0, bloqueadoAte: null }, { merge: true })
        return { ok: true, limpou: Boolean(ate) }
      }
      const tentativas = (s.tentativas || 0) + 1
      const espera = R.tempoDeBloqueio(tentativas)
      const bloqueadoAte = espera ? momento + espera : 0
      tx.set(ref, { tentativas, bloqueadoAte: bloqueadoAte ? Timestamp.fromMillis(bloqueadoAte) : null }, { merge: true })
      return { tentativas, bloqueadoAte }
    })

    const ctx = { usuario, filialId, terminalId }
    if (r.ok) {
      if (r.limpou || usuario.bloqueadoAte) await usuarios.doc(usuario.id).update({ bloqueadoAte: null })
      return
    }
    if (r.jaBloqueado) throw falha('resource-exhausted', mensagemBloqueio(r.bloqueadoAte), { motivo: 'bloqueado', ate: r.bloqueadoAte })
    await registrar('acesso.falhou', `${usuario.nome} (${contexto}), tentativa ${r.tentativas}`, ctx)
    if (r.bloqueadoAte) {
      await usuarios.doc(usuario.id).update({ bloqueadoAte: Timestamp.fromMillis(r.bloqueadoAte) })
      await registrar('acesso.bloqueado', `${usuario.nome} bloqueado por ${R.minutosAte(r.bloqueadoAte, agora())} min`, ctx)
      throw falha('resource-exhausted', mensagemBloqueio(r.bloqueadoAte), { motivo: 'bloqueado', ate: r.bloqueadoAte })
    }
    throw falha('permission-denied', MSG_PIN, { motivo: 'pin' })
  }

  // --- Primeiro acesso -----------------------------------------------------------

  // Grava os perfis padrão na primeira vez e, depois, leva as permissões novas
  // para os perfis padrão uma única vez (se o admin tirar, não voltam).
  async function garantirPerfis() {
    const cfgRef = db.doc('pdv_config/sistema')
    await db.runTransaction(async (tx) => {
      const cfg = (await tx.get(cfgRef)).data()
      if (!cfg) {
        for (const { id, ...dados } of PERFIS_PADRAO) tx.set(perfis.doc(id), { ...dados, criadoEm: FieldValue.serverTimestamp() })
        tx.set(cfgRef, { criadoEm: FieldValue.serverTimestamp(), permissoesAplicadas: PERMISSOES_NOVAS.map((n) => n.chave) })
        return
      }
      const feitas = cfg.permissoesAplicadas || []
      const pendentes = PERMISSOES_NOVAS.filter((n) => !feitas.includes(n.chave))
      if (!pendentes.length) return
      const ids = [...new Set(pendentes.flatMap((n) => n.perfis))]
      const lidos = await Promise.all(ids.map((id) => tx.get(perfis.doc(id))))
      const atual = new Map(lidos.filter((s) => s.exists).map((s) => [s.id, s.get('permissoes') || []]))
      for (const n of pendentes)
        for (const id of n.perfis) if (atual.has(id) && !atual.get(id).includes(n.chave)) atual.set(id, [...atual.get(id), n.chave])
      for (const [id, permissoes] of atual) tx.update(perfis.doc(id), { permissoes })
      tx.update(cfgRef, { permissoesAplicadas: [...feitas, ...pendentes.map((n) => n.chave)] })
    })
  }

  // O administrador da rede nasce uma vez só, no primeiro login dele com o Google.
  async function criarDono(email, nome) {
    const ref = usuarios.doc()
    const marca = db.doc('pdv_config/dono')
    await db.runTransaction(async (tx) => {
      if ((await tx.get(marca)).exists) throw falha('failed-precondition', 'O administrador do PDV já existe com outro e-mail.')
      tx.set(ref, {
        nome: R.texto(nome, 60) || 'Administrador',
        email,
        perfilId: 'perfil-admin',
        todasFiliais: true,
        filiais: [],
        ativo: true,
        temPin: false,
        pinDigitos: null,
        bloqueadoAte: null,
        dono: true,
        criadoEm: FieldValue.serverTimestamp(),
        criadoPor: null,
      })
      tx.set(marca, { usuarioId: ref.id, em: FieldValue.serverTimestamp() })
    })
    const dono = await ler(ref)
    await registrar('usuario.criado', `${dono.nome} (administrador principal)`, { usuario: dono })
    return dono
  }

  async function porEmail(email) {
    const s = await usuarios.where('email', '==', email).limit(2).get()
    return s.size === 1 ? { id: s.docs[0].id, ...s.docs[0].data() } : null
  }

  // --- Entrar --------------------------------------------------------------------

  async function entrarGoogle(req) {
    const email = exigirGoogle(req)
    await garantirPerfis()
    let usuario = await porEmail(email)
    if (!usuario && email === EMAIL_ADMIN) usuario = await criarDono(email, req.auth.token.name)
    if (!usuario?.ativo) {
      await registrar('acesso.falhou', `Google ${email}: sem acesso à retaguarda`)
      throw falha('permission-denied', 'Esta conta Google não tem acesso à retaguarda do PDV. Peça ao administrador para cadastrar o seu e-mail em Usuários.')
    }
    const perfil = await lerPerfil(usuario.perfilId)
    if (!R.temRetaguarda(perfil)) throw falha('permission-denied', 'Seu perfil não tem acesso à retaguarda.')
    const ate = await abrirSessao(req.auth.uid, usuario, { modo: 'admin' })
    await registrar('acesso.entrou', 'Retaguarda (Google)', { usuario })
    return { ate, usuario: publico(usuario) }
  }

  async function operadores(req) {
    const terminal = await exigirTerminal(req)
    const [lista, todos] = await Promise.all([todosUsuarios(true), mapaPerfis()])
    const pessoas = lista
      .filter((u) => u.temPin && R.acessaFilial(u, terminal.filialId))
      .map((u) => {
        const p = todos.get(u.perfilId)
        return { id: u.id, nome: u.nome, pinDigitos: u.pinDigitos || null, bloqueado: bloqueado(u), caixa: R.pode(u, p, 'caixa.vender'), cozinha: R.pode(u, p, 'cozinha.ver') }
      })
      .filter((u) => u.caixa || u.cozinha)
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    return { terminal: { id: terminal.id, filialId: terminal.filialId, pdvId: terminal.pdvId, nome: terminal.nome }, pessoas }
  }

  async function entrarPin(req) {
    const terminal = await exigirTerminal(req)
    const { usuarioId, pin, modo } = req.data || {}
    if (!R.idValido(usuarioId) || !['caixa', 'cozinha'].includes(modo)) throw falha('invalid-argument', 'Escolha quem vai entrar.')
    const ctx = { filialId: terminal.filialId, terminalId: terminal.id }
    const usuario = await lerUsuario(usuarioId)
    // Mesma resposta para quem não existe, saiu da loja ou é de outra filial.
    if (!usuario?.ativo || !R.acessaFilial(usuario, terminal.filialId)) throw falha('permission-denied', MSG_PIN, { motivo: 'pin' })
    await exigirPin(usuario, pin, { contexto: 'PIN', ...ctx })
    const perfil = await lerPerfil(usuario.perfilId)
    if (!R.pode(usuario, perfil, modo === 'caixa' ? 'caixa.vender' : 'cozinha.ver'))
      throw falha('permission-denied', modo === 'caixa' ? 'Seu perfil não registra pedidos no caixa.' : 'Seu perfil não tem acesso à cozinha.')
    const ate = await abrirSessao(await uidAnonimo(req.data?.tokenPessoa), usuario, { modo, filial: terminal.filialId, terminal: terminal.id })
    await Promise.all([
      terminais.doc(terminal.id).update({ ultimoUso: FieldValue.serverTimestamp() }),
      registrar('acesso.entrou', `${modo === 'caixa' ? 'Caixa' : 'Cozinha'} (${terminal.nome})`, { usuario, ...ctx }),
    ])
    return { ate, usuario: publico(usuario), filialId: terminal.filialId, pdvId: terminal.pdvId }
  }

  // Tela bloqueada por inatividade: a própria pessoa destrava com o PIN dela.
  async function conferirPin(req) {
    const { usuario, sessao } = await exigirOperador(req)
    await exigirPin(usuario, String(req.data?.pin ?? ''), { contexto: 'desbloqueio de tela', filialId: sessao.filial, terminalId: sessao.terminal })
    return { ok: true }
  }

  // --- Autorização de supervisor --------------------------------------------------

  async function supervisores(req) {
    const { usuario } = await exigirOperador(req)
    const { permissao, filialId } = req.data || {}
    if (!R.permissaoValida(permissao) || !R.idValido(filialId)) throw falha('invalid-argument', 'Pedido de autorização inválido.')
    if (!R.acessaFilial(usuario, filialId)) throw falha('permission-denied', 'Você não opera esta filial.')
    const [lista, todos] = await Promise.all([todosUsuarios(true), mapaPerfis()])
    const pessoas = lista
      .filter((u) => u.temPin && R.acessaFilial(u, filialId) && R.pode(u, todos.get(u.perfilId), permissao))
      .map((u) => ({ id: u.id, nome: u.nome, pinDigitos: u.pinDigitos || null, bloqueado: bloqueado(u) }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    return { pessoas }
  }

  async function autorizar(req) {
    const { usuario: solicitante, sessao } = await exigirOperador(req)
    const { supervisorId, pin, permissao, filialId } = req.data || {}
    const acao = R.texto(req.data?.acao, 200)
    if (!R.idValido(supervisorId) || !R.permissaoValida(permissao) || !R.idValido(filialId) || !acao) throw falha('invalid-argument', 'Pedido de autorização inválido.')
    if (!R.acessaFilial(solicitante, filialId)) throw falha('permission-denied', 'Você não opera esta filial.')
    const ctx = { filialId, terminalId: sessao.terminal || null }
    const supervisor = await lerUsuario(supervisorId)
    if (!supervisor?.ativo || !R.acessaFilial(supervisor, filialId)) throw falha('permission-denied', MSG_PIN, { motivo: 'pin' })
    await exigirPin(supervisor, pin, { contexto: 'autorização', ...ctx })
    if (!R.pode(supervisor, await lerPerfil(supervisor.perfilId), permissao)) {
      await registrar('autorizacao.negada', `${supervisor.nome} não tem permissão para: ${acao}`, { usuario: supervisor, ...ctx })
      throw falha('permission-denied', `${supervisor.nome} não tem permissão para autorizar isso.`)
    }
    const ref = await db.collection('pdv_autorizacoes').add({
      supervisorId: supervisor.id,
      supervisorNome: supervisor.nome,
      solicitanteId: solicitante.id,
      solicitanteNome: solicitante.nome,
      permissao,
      acao,
      filialId,
      terminalId: ctx.terminalId,
      em: FieldValue.serverTimestamp(),
      usada: false,
    })
    await registrar('autorizacao.concedida', `${acao} (pedido por ${solicitante.nome})`, { usuario: supervisor, ...ctx })
    return { autorizacaoId: ref.id, usuario: { id: supervisor.id, nome: supervisor.nome } }
  }

  // --- Usuários -------------------------------------------------------------------
  //
  // Ninguém dá o que não tem: perfil com mais permissões que o seu, filial que
  // não é sua ou "todas as filiais" sem ter. E ninguém mexe em quem está fora
  // do seu alcance — senão um gerente trocaria o PIN de um administrador.

  async function listarUsuarios(req) {
    const { usuario: autor, perfil: autorPerfil } = await exigirOperador(req, 'admin.usuarios')
    const [lista, todos] = await Promise.all([todosUsuarios(false), mapaPerfis()])
    const visiveis = lista.filter(
      (u) => autor.todasFiliais || u.id === autor.id || (!u.todasFiliais && (u.filiais || []).some((f) => (autor.filiais || []).includes(f))),
    )
    return {
      usuarios: visiveis.map((u) => ({ ...publico(u), editavel: R.alcancaUsuario({ autor, autorPerfil }, { alvo: u, alvoPerfil: todos.get(u.perfilId) }) })),
    }
  }

  async function salvarUsuario(req) {
    const { usuario: autor, perfil: autorPerfil, sessao } = await exigirOperador(req, 'admin.usuarios')
    const d = req.data || {}
    const novo = !d.id
    const erros = {}

    const nome = R.texto(d.nome, 60)
    if (!nome) erros.nome = 'Informe o nome.'
    const email = d.email ? R.email(d.email) : ''
    if (email && !R.emailValido(email)) erros.email = 'E-mail inválido.'
    const todasFiliais = d.todasFiliais === true
    const filiais = todasFiliais ? [] : [...new Set(Array.isArray(d.filiais) ? d.filiais : [])]
    if (!todasFiliais && (!filiais.length || !filiais.every(R.idValido))) erros.filiais = 'Escolha ao menos uma filial.'
    const pin = d.pin ? String(d.pin) : ''
    if (pin) {
      const problema = R.problemaNoPin(pin)
      if (problema) erros.pin = problema
    }
    if (novo && !pin && !email) erros.pin = 'Cadastre um PIN (caixa e cozinha) ou um e-mail (retaguarda).'
    const ativo = d.ativo !== false
    const alvoPerfil = await lerPerfil(d.perfilId)
    if (!alvoPerfil) erros.perfilId = 'Escolha o perfil.'
    if (Object.keys(erros).length) throw invalido(erros)

    if (!R.alcancaPerfil(autorPerfil, alvoPerfil)) throw invalido({ perfilId: 'Você não pode dar um perfil com mais acesso que o seu.' })
    if (!R.alcancaFiliais(autor, { todasFiliais, filiais })) throw invalido({ filiais: 'Você só pode dar acesso às filiais que são suas.' })

    let atual = null
    if (!novo) {
      atual = await lerUsuario(d.id)
      if (!atual) throw falha('not-found', 'Usuário não encontrado.')
      if (!R.alcancaUsuario({ autor, autorPerfil }, { alvo: atual, alvoPerfil: await lerPerfil(atual.perfilId) }))
        throw falha('permission-denied', 'Você não pode alterar este usuário.')
      if (atual.id === autor.id && !ativo) erros.ativo = 'Você não pode desativar o próprio acesso.'
      if (atual.dono && d.perfilId !== 'perfil-admin') erros.perfilId = 'O administrador principal continua administrador.'
      if (atual.dono && !todasFiliais) erros.filiais = 'O administrador principal vê todas as filiais.'
    }
    if (email) {
      const mesmo = await usuarios.where('email', '==', email).limit(2).get()
      if (mesmo.docs.some((x) => x.id !== d.id)) erros.email = 'Já existe um usuário com este e-mail.'
    }
    if (Object.keys(erros).length) throw invalido(erros)

    const ref = novo ? usuarios.doc() : usuarios.doc(atual.id)
    const dados = { nome, email: email || null, perfilId: alvoPerfil.id, todasFiliais, filiais, ativo, atualizadoEm: FieldValue.serverTimestamp(), atualizadoPor: autor.id }
    if (pin) Object.assign(dados, { temPin: true, pinDigitos: pin.length, bloqueadoAte: null })
    else if (d.removerPin) Object.assign(dados, { temPin: false, pinDigitos: null, bloqueadoAte: null })

    const lote = db.batch()
    if (novo) lote.set(ref, { temPin: false, pinDigitos: null, bloqueadoAte: null, dono: false, ...dados, criadoEm: FieldValue.serverTimestamp(), criadoPor: autor.id })
    else lote.update(ref, dados)
    if (pin) lote.set(segredos.doc(ref.id), { pin: await R.criarCredencial(pin), tentativas: 0, bloqueadoAte: null })
    else if (d.removerPin) lote.set(segredos.doc(ref.id), { pin: null, tentativas: 0, bloqueadoAte: null })
    await lote.commit()

    // Desativado: as sessões abertas dele somem (e as regras já recusam na hora).
    if (atual?.ativo && !ativo) await apagarSessoes('usuario', ref.id)

    const ctx = { usuario: autor, filialId: sessao.filial || null }
    await registrar(novo ? 'usuario.criado' : 'usuario.alterado', nome, ctx)
    if (!novo && (pin || d.removerPin)) await registrar('usuario.credencial', `${pin ? 'PIN trocado' : 'PIN removido'}: ${nome}`, ctx)
    return { usuario: publico(await ler(ref)) }
  }

  async function desbloquearUsuario(req) {
    const { usuario: autor, perfil: autorPerfil, sessao } = await exigirOperador(req, 'admin.usuarios')
    const alvo = await lerUsuario(req.data?.id)
    if (!alvo) throw falha('not-found', 'Usuário não encontrado.')
    if (!R.alcancaUsuario({ autor, autorPerfil }, { alvo, alvoPerfil: await lerPerfil(alvo.perfilId) })) throw falha('permission-denied', 'Você não pode alterar este usuário.')
    const lote = db.batch()
    lote.set(segredos.doc(alvo.id), { tentativas: 0, bloqueadoAte: null }, { merge: true })
    lote.update(usuarios.doc(alvo.id), { bloqueadoAte: null })
    await lote.commit()
    await registrar('usuario.alterado', `${alvo.nome} desbloqueado`, { usuario: autor, filialId: sessao.filial || null })
    return { ok: true }
  }

  // --- Perfis ----------------------------------------------------------------------
  //
  // Um perfil vale para a rede inteira: mudar o "Atendente" muda o de todas as
  // lojas. Por isso só quem cuida de todas as filiais mexe em perfis.

  async function exigirGestorDePerfis(req) {
    const r = await exigirOperador(req, 'admin.usuarios')
    if (!r.usuario.todasFiliais) throw falha('permission-denied', 'Perfis valem para todas as lojas: só a franqueadora altera.')
    return r
  }

  async function salvarPerfil(req) {
    const { usuario: autor, perfil: autorPerfil } = await exigirGestorDePerfis(req)
    const d = req.data || {}
    const nome = R.texto(d.nome, 40)
    if (!nome) throw invalido({ nome: 'Dê um nome ao perfil.' })
    const permissoes = [...new Set(Array.isArray(d.permissoes) ? d.permissoes : [])]
    if (!permissoes.every(R.permissaoValida)) throw invalido({ permissoes: 'Permissão desconhecida.' })
    if (!R.alcancaPerfil(autorPerfil, { permissoes })) throw invalido({ permissoes: 'Você não pode dar permissões que não tem.' })
    if (d.id) {
      const atual = await lerPerfil(d.id)
      if (!atual) throw falha('not-found', 'Perfil não encontrado.')
      if (atual.sistema) throw falha('permission-denied', 'O perfil Administrador é fixo.')
      if (!R.alcancaPerfil(autorPerfil, atual)) throw falha('permission-denied', 'Você não pode alterar um perfil com mais acesso que o seu.')
    }
    const ref = d.id ? perfis.doc(d.id) : perfis.doc()
    const dados = { nome, descricao: R.texto(d.descricao, 140), permissoes, sistema: false, atualizadoEm: FieldValue.serverTimestamp() }
    await ref.set(d.id ? dados : { ...dados, criadoEm: FieldValue.serverTimestamp() }, { merge: true })
    await registrar(d.id ? 'cadastro.alterado' : 'cadastro.criado', `Perfil: ${nome} (${permissoes.length} permissões)`, { usuario: autor })
    return { perfil: { id: ref.id, nome, descricao: dados.descricao, permissoes, sistema: false } }
  }

  async function removerPerfil(req) {
    const { usuario: autor, perfil: autorPerfil } = await exigirGestorDePerfis(req)
    const perfil = await lerPerfil(req.data?.id)
    if (!perfil) throw falha('not-found', 'Perfil não encontrado.')
    if (perfil.sistema) throw falha('permission-denied', 'O perfil Administrador não pode ser apagado.')
    if (!R.alcancaPerfil(autorPerfil, perfil)) throw falha('permission-denied', 'Você não pode apagar um perfil com mais acesso que o seu.')
    const emUso = await usuarios.where('perfilId', '==', perfil.id).limit(1).get()
    if (!emUso.empty) throw falha('failed-precondition', 'Há usuários com este perfil. Troque o perfil deles antes.')
    await perfis.doc(perfil.id).delete()
    await registrar('cadastro.removido', `Perfil: ${perfil.nome}`, { usuario: autor })
    return { ok: true }
  }

  // --- Computadores (terminais) -----------------------------------------------------

  async function parear(req) {
    const { usuario, sessao } = await exigirOperador(req, 'admin.config')
    if (sessao.modo !== 'admin') throw falha('permission-denied', 'Libere o computador entrando pela retaguarda.')
    const { filialId, pdvId } = req.data || {}
    const nome = R.texto(req.data?.nome, 40)
    if (!R.idValido(filialId) || !R.idValido(pdvId) || !nome) throw falha('invalid-argument', 'Escolha a loja e o caixa deste computador.')
    if (!R.acessaFilial(usuario, filialId)) throw falha('permission-denied', 'Você não tem acesso a esta filial.')
    const uidComputador = await uidAnonimo(req.data?.tokenComputador)
    const ref = terminais.doc()
    const lote = db.batch()
    lote.set(ref, { filialId, pdvId, nome, ativo: true, criadoPor: usuario.id, criadoPorNome: usuario.nome, criadoEm: FieldValue.serverTimestamp(), ultimoUso: null })
    lote.set(sessoes.doc(uidComputador), { tipo: 't', terminal: ref.id, filial: filialId, criadoEm: FieldValue.serverTimestamp() })
    await lote.commit()
    await registrar('terminal.liberado', `${nome} (caixa ${pdvId})`, { usuario, filialId, terminalId: ref.id })
    return { terminal: { id: ref.id, filialId, pdvId, nome } }
  }

  async function listarTerminais(req) {
    const { usuario } = await exigirOperador(req, 'admin.config')
    const s = await terminais.get()
    return {
      terminais: s.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((t) => R.acessaFilial(usuario, t.filialId))
        .map((t) => ({ id: t.id, nome: t.nome, filialId: t.filialId, pdvId: t.pdvId, ativo: Boolean(t.ativo), criadoPorNome: t.criadoPorNome || '', criadoEm: t.criadoEm?.toDate?.().toISOString() || null, ultimoUso: t.ultimoUso?.toDate?.().toISOString() || null })),
    }
  }

  async function desativarTerminal(req) {
    const { usuario, sessao } = await exigirOperador(req, 'admin.config')
    const id = req.data?.id
    const terminal = R.idValido(id) ? await ler(terminais.doc(id)) : null
    if (!terminal) throw falha('not-found', 'Computador não encontrado.')
    if (!R.acessaFilial(usuario, terminal.filialId)) throw falha('permission-denied', 'Você não tem acesso a esta filial.')
    await terminais.doc(id).update({ ativo: false, desativadoPor: usuario.id, desativadoEm: FieldValue.serverTimestamp() })
    await apagarSessoes('terminal', id)
    await registrar('terminal.desligado', terminal.nome, { usuario, filialId: terminal.filialId, terminalId: sessao.terminal || null })
    return { ok: true }
  }

  async function apagarSessoes(campo, id) {
    const s = await sessoes.where(campo, '==', id).get()
    if (s.empty) return
    const lote = db.batch()
    s.docs.forEach((d) => lote.delete(d.ref))
    await lote.commit()
  }

  // Sair: a sessão daquele login some na hora (não fica valendo até vencer).
  async function sair(req) {
    const v = await sessaoDe(req)
    if (v?.tipo === 'u') await sessoes.doc(req.auth.uid).delete()
    return { ok: true }
  }

  // --- Registro de acessos ----------------------------------------------------------

  async function acessos(req) {
    const { usuario } = await exigirOperador(req, 'admin.auditoria')
    const s = await db.collection('pdv_auditoria').orderBy('em', 'desc').limit(500).get()
    return {
      registros: s.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((r) => usuario.todasFiliais || (r.filialId && (usuario.filiais || []).includes(r.filialId)))
        .map((r) => ({ id: r.id, em: r.em?.toDate?.().toISOString() || null, acao: r.acao, detalhe: r.detalhe, usuarioNome: r.usuarioNome, filialId: r.filialId, terminalId: r.terminalId })),
    }
  }

  return {
    entrarGoogle,
    operadores,
    entrarPin,
    conferirPin,
    supervisores,
    autorizar,
    listarUsuarios,
    salvarUsuario,
    desbloquearUsuario,
    salvarPerfil,
    removerPerfil,
    parear,
    listarTerminais,
    desativarTerminal,
    acessos,
    sair,
  }
}

module.exports = { criarServico, EMAIL_ADMIN }
