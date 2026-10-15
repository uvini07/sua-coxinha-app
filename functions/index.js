// FUNÇÕES NO SERVIDOR — notificações push
//
// O app não pode mandar push sozinho (precisaria da chave do servidor, que não
// pode viajar dentro do APK). Estas funções rodam no Firebase e reagem a
// escritas que as regras do Firestore já conferiram:
//
//   avisarPontos  lançamento de compra criado no caixa → push para o cliente
//   avisarDobro   admin lançou pontos em dobro         → push para todos
//   relatorioSite painel do franqueado no site          → números do GA4 da loja
//                 (relatorioSite.js)
//
// Exigem o plano Blaze (pago por uso; nesse volume, centavos por mês).
// Publicação: workflow .github/workflows/firebase.yml.
//
// REGIÃO: tem de ser a mesma do banco do Firestore. Confira em Firebase →
// Firestore → aba Dados (canto superior). Padrão aqui: southamerica-east1
// (São Paulo). Se o banco estiver em "nam5", use us-central1.

const { onDocumentCreated, onDocumentWritten } = require('firebase-functions/v2/firestore')
const { setGlobalOptions } = require('firebase-functions/v2')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const { getMessaging } = require('firebase-admin/messaging')

initializeApp()
setGlobalOptions({ region: process.env.REGIAO_FUNCOES || 'southamerica-east1', maxInstances: 5 })

exports.relatorioSite = require('./relatorioSite.js').relatorioSite

const TOPICO_PROMOCOES = 'promocoes'
const reais = (centavos) => (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// Tokens que a Google diz que morreram (app desinstalado) saem do perfil.
const TOKEN_INVALIDO = ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token']

exports.avisarPontos = onDocumentCreated('lancamentos/{id}', async (evento) => {
  const l = evento.data?.data()
  if (!l || l.tipo !== 'compra' || !l.pontos || !l.cliente) return

  const ref = getFirestore().doc(`usuarios/${l.cliente}`)
  const perfil = await ref.get()
  const tokens = perfil.get('pushTokens') || []
  if (!tokens.length) return

  const extra = l.pontosDobro ? ` Inclui +${l.pontosDobro} em dobro no ${l.produtoDobro || 'produto da promoção'}.` : ''
  const resposta = await getMessaging().sendEachForMulticast({
    tokens,
    notification: {
      title: `+${l.pontos} Pontos Dourados ✨`,
      body: `Compra de ${reais(l.valor)} creditada na sua carteira.${extra}`,
    },
    data: { rota: '/carteira' },
    android: { priority: 'high', notification: { color: '#F9C115' } },
  })

  const mortos = resposta.responses
    .map((r, i) => (!r.success && TOKEN_INVALIDO.includes(r.error?.code) ? tokens[i] : null))
    .filter(Boolean)
  if (mortos.length) await ref.update({ pushTokens: FieldValue.arrayRemove(...mortos) })
})

exports.avisarDobro = onDocumentWritten('config/dobro', async (evento) => {
  const antes = evento.data?.before?.data()
  const depois = evento.data?.after?.data()
  if (!depois?.ativo || !depois.produtoNome) return
  // Só avisa num lançamento novo — não ao encerrar nem em gravações repetidas.
  const mesmoLancamento =
    antes?.ativo && antes.produtoId === depois.produtoId && antes.lancadoEm?.isEqual?.(depois.lancadoEm)
  if (mesmoLancamento) return

  const prazo = depois.ate ? ` até ${depois.ate.split('-').reverse().join('/')}` : ''
  await getMessaging().send({
    topic: TOPICO_PROMOCOES,
    notification: {
      title: `Pontos em dobro: ${depois.produtoNome} 🔥`,
      body: `Comprando ${depois.produtoNome}${prazo}, você ganha o dobro de Pontos Dourados. Corre!`,
    },
    data: { rota: '/home' },
    android: { priority: 'high', notification: { color: '#F9C115' } },
  })
})
