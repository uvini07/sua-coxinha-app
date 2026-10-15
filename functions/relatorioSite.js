// RELATÓRIO DO SITE — painel do franqueado em www.suacoxinhaloja.com.br/painel
//
// O site manda para o Google Analytics 4 todo evento marcado com `loja`
// (cajamar, jundiai... — o mesmo id de `lojas/{id}` aqui no app). Esta função é
// a ponte entre os dois: confere quem está pedindo pelo cadastro em
// `equipe/{email}` (o mesmo que o app usa) e devolve os números SÓ da loja dele.
//
//   · Admin master  → qualquer loja, ou a rede toda.
//   · Franqueado    → só `equipe/{email}.loja`. O parâmetro `loja` é ignorado.
//   · Funcionário / cliente / anônimo → recusado.
//
// A chave do Analytics nunca sai do servidor: a função usa a conta de serviço
// padrão do Firebase. Ela precisa estar como "Leitor" na propriedade do GA4
// (passo a passo em firebase/LEIA-ME-ANALYTICS.md).
//
// Configuração (functions/.env, escrito pelo workflow):
//   GA_PROPERTY_ID  número da propriedade do GA4 (ex.: 412345678)

const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { getFirestore } = require('firebase-admin/firestore')
const { BetaAnalyticsDataClient } = require('@google-analytics/data')

const EMAIL_ADMIN = 'marcelinhojordao07@gmail.com' // igual a souAdmin() em firestore.rules
const PERIODOS = [7, 28, 90]
const CACHE_MS = 10 * 60 * 1000 // o GA4 atualiza devagar; poupa a cota da API

// Eventos que o site envia (src/analytics/ga.js no repositório do site).
const ACOES = [
  'pedido_ifood',
  'pedido_food99',
  'abrir_whatsapp',
  'pedido_whatsapp',
  'contato_mapa',
  'contato_whatsapp',
  'contato_telefone',
  'contato_instagram',
]
const PEDIDOS = ['pedido_ifood', 'pedido_food99', 'pedido_whatsapp']

let cliente = null
const cache = new Map()

const numero = (v) => Number(v ?? 0) || 0

// Quem é a pessoa logada e a qual loja ela tem direito.
async function autorizar(auth, lojaPedida) {
  const email = String(auth?.token?.email || '').toLowerCase()
  if (!auth || !email) throw new HttpsError('unauthenticated', 'Entre com a sua conta Google.')
  if (auth.token.email_verified !== true) throw new HttpsError('permission-denied', 'E-mail não verificado.')

  const db = getFirestore()
  if (email === EMAIL_ADMIN) {
    const snap = await db.collection('lojas').get()
    const lojas = snap.docs
      .map((d) => ({ id: d.id, nome: d.get('nome') || d.id }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    const loja = lojaPedida === 'todas' || lojas.some((l) => l.id === lojaPedida) ? lojaPedida : lojas[0]?.id || 'todas'
    return { email, papel: 'admin', nome: 'Administrador', loja, lojas }
  }

  const membro = await db.collection('equipe').doc(email).get()
  if (!membro.exists || membro.get('ativo') !== true || membro.get('papel') !== 'franqueado') {
    throw new HttpsError('permission-denied', 'Esta conta não é de franqueado. Use o e-mail cadastrado no app.')
  }
  const loja = membro.get('loja')
  const doc = await db.collection('lojas').doc(loja).get()
  return {
    email,
    papel: 'franqueado',
    nome: membro.get('nome') || email,
    loja,
    lojas: [{ id: loja, nome: doc.get('nome') || loja }],
  }
}

// "todas" = as lojas cadastradas no app (deixa de fora a página de escolha, "rede").
const filtroLoja = (loja, todas) =>
  loja === 'todas'
    ? { filter: { fieldName: 'customEvent:loja', inListFilter: { values: todas } } }
    : { filter: { fieldName: 'customEvent:loja', stringFilter: { matchType: 'EXACT', value: loja } } }

const e = (...exprs) => (exprs.length === 1 ? exprs[0] : { andGroup: { expressions: exprs } })

const filtroEventos = (nomes) => ({
  filter: { fieldName: 'eventName', inListFilter: { values: nomes } },
})

const linhas = (resp) =>
  (resp?.rows || []).map((r) => ({
    d: (r.dimensionValues || []).map((v) => v.value),
    m: (r.metricValues || []).map((v) => numero(v.value)),
  }))

async function consultar(propriedade, loja, todas, dias) {
  const property = `properties/${propriedade}`
  const atual = { startDate: `${dias}daysAgo`, endDate: 'today', name: 'atual' }
  const anterior = { startDate: `${dias * 2}daysAgo`, endDate: `${dias + 1}daysAgo`, name: 'anterior' }
  const doSite = filtroLoja(loja, todas)

  const [[lote]] = await Promise.all([
    cliente.batchRunReports({
      property,
      requests: [
        // 0. Resumo, período atual x anterior
        {
          dateRanges: [atual, anterior],
          metrics: [
            { name: 'activeUsers' },
            { name: 'newUsers' },
            { name: 'sessions' },
            { name: 'screenPageViews' },
            { name: 'engagementRate' },
            { name: 'averageSessionDuration' },
          ],
          dimensionFilter: doSite,
        },
        // 1. Ações (cliques nos botões de pedido e contato), atual x anterior
        {
          dateRanges: [atual, anterior],
          dimensions: [{ name: 'eventName' }],
          metrics: [{ name: 'eventCount' }, { name: 'eventValue' }],
          dimensionFilter: e(doSite, filtroEventos(ACOES)),
        },
        // 2. Dia a dia
        {
          dateRanges: [atual],
          dimensions: [{ name: 'date' }],
          metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }],
          dimensionFilter: doSite,
          orderBys: [{ dimension: { dimensionName: 'date' } }],
        },
        // 3. De onde vêm (Google, Instagram, direto...)
        {
          dateRanges: [atual],
          dimensions: [{ name: 'sessionDefaultChannelGroup' }],
          metrics: [{ name: 'activeUsers' }],
          dimensionFilter: doSite,
          orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
          limit: 6,
        },
        // 4. Aparelho
        {
          dateRanges: [atual],
          dimensions: [{ name: 'deviceCategory' }],
          metrics: [{ name: 'activeUsers' }],
          dimensionFilter: doSite,
          orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        },
      ],
    }),
  ])

  const [rResumo, rAcoes, rDia, rOrigem, rAparelho] = lote.reports
  const [rCidade, rPedidosDia, rItens] = await Promise.all([
    cliente
      .runReport({
        property,
        dateRanges: [atual],
        dimensions: [{ name: 'city' }],
        metrics: [{ name: 'activeUsers' }],
        dimensionFilter: doSite,
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit: 6,
      })
      .then((r) => r[0]),
    cliente
      .runReport({
        property,
        dateRanges: [atual],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: e(doSite, filtroEventos(PEDIDOS)),
      })
      .then((r) => r[0]),
    // Produtos mais clicados. Só funciona com a dimensão "item" cadastrada no GA4;
    // sem ela, o painel apenas esconde este quadro.
    cliente
      .runReport({
        property,
        dateRanges: [atual],
        dimensions: [{ name: 'customEvent:item' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: e(doSite, filtroEventos(['pedido_ifood', 'pedido_food99', 'abrir_whatsapp'])),
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        limit: 8,
      })
      .then((r) => r[0])
      .catch(() => null),
  ])

  // Com dois períodos o GA4 acrescenta a dimensão dateRange no fim de cada linha.
  const porPeriodo = (resp) => {
    const out = { atual: [], anterior: [] }
    linhas(resp).forEach((l) => out[l.d[l.d.length - 1]]?.push(l))
    return out
  }

  const resumo = porPeriodo(rResumo)
  const montarResumo = (l) => {
    const m = l?.m || []
    return {
      visitantes: m[0] || 0,
      novos: m[1] || 0,
      sessoes: m[2] || 0,
      visualizacoes: m[3] || 0,
      engajamento: m[4] || 0,
      duracaoMedia: m[5] || 0,
    }
  }

  const acoes = porPeriodo(rAcoes)
  const montarAcoes = (ls) => {
    const out = Object.fromEntries(ACOES.map((a) => [a, 0]))
    let valorWhatsapp = 0
    ls.forEach((l) => {
      out[l.d[0]] = l.m[0]
      if (l.d[0] === 'pedido_whatsapp') valorWhatsapp = l.m[1]
    })
    return { ...out, valorWhatsapp }
  }

  const pedidosPorDia = Object.fromEntries(linhas(rPedidosDia).map((l) => [l.d[0], l.m[0]]))
  const formatarData = (yyyymmdd) => `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`
  const lista = (resp) => linhas(resp).map((l) => ({ nome: l.d[0], valor: l.m[0] }))

  return {
    resumo: { atual: montarResumo(resumo.atual[0]), anterior: montarResumo(resumo.anterior[0]) },
    acoes: { atual: montarAcoes(acoes.atual), anterior: montarAcoes(acoes.anterior) },
    diario: linhas(rDia).map((l) => ({
      data: formatarData(l.d[0]),
      visitantes: l.m[0],
      visualizacoes: l.m[1],
      pedidos: pedidosPorDia[l.d[0]] || 0,
    })),
    origens: lista(rOrigem),
    aparelhos: lista(rAparelho),
    cidades: lista(rCidade).filter((c) => c.nome !== '(not set)'),
    itens: rItens ? lista(rItens).filter((i) => i.nome && i.nome !== '(not set)') : null,
  }
}

exports.relatorioSite = onCall(
  {
    // Só o site e o próprio app chamam. Localhost para testar o painel com `npm run dev`.
    cors: [/suacoxinhaloja\.com\.br$/, /sua-coxinha-cajamar.*\.vercel\.app$/, /^http:\/\/localhost(:\d+)?$/],
    memory: '256MiB',
    timeoutSeconds: 30,
  },
  async (req) => {
    const propriedade = process.env.GA_PROPERTY_ID
    if (!propriedade) throw new HttpsError('failed-precondition', 'Analytics ainda não configurado (GA_PROPERTY_ID).')

    const dias = PERIODOS.includes(Number(req.data?.dias)) ? Number(req.data.dias) : 28
    const quem = await autorizar(req.auth, String(req.data?.loja || ''))

    const chave = `${quem.loja}:${dias}`
    const guardado = cache.get(chave)
    let dados = guardado && Date.now() - guardado.em < CACHE_MS ? guardado.dados : null
    if (!dados) {
      cliente ??= new BetaAnalyticsDataClient()
      try {
        dados = await consultar(propriedade, quem.loja, quem.lojas.map((l) => l.id), dias)
      } catch (erro) {
        console.error('GA4', erro)
        throw new HttpsError('unavailable', 'Não foi possível ler o Google Analytics agora. Tente de novo em instantes.')
      }
      cache.set(chave, { em: Date.now(), dados })
    }

    return {
      usuario: { email: quem.email, nome: quem.nome, papel: quem.papel },
      loja: quem.loja,
      lojas: quem.lojas,
      dias,
      geradoEm: new Date(guardado && dados === guardado.dados ? guardado.em : Date.now()).toISOString(),
      ...dados,
    }
  },
)
