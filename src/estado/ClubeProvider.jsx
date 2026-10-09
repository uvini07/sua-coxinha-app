import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ClubeContexto } from './clubeContexto.js'
import { MISSOES, RECOMPENSAS, UNIDADES, USUARIO_VAZIO, nivelDe } from '../dados/clube.js'
import {
  concluirRedirecionamento,
  entrarComApple as loginApple,
  entrarComGoogle as loginGoogle,
  mensagemDeErro,
  observarSessao,
  paraE164,
  sairDaConta,
} from '../firebase/autenticacao.js'
import {
  garantirPerfil,
  marcarNotificacoesLidas,
  observarColecao,
  observarPerfil,
  reservarTelefone,
  resgatarRecompensa,
  salvarPerfil,
} from '../firebase/clube.js'
import {
  EMAIL_ADMIN,
  REGRAS_PADRAO,
  normalizarEmail,
  observarConfig,
  observarLojas,
  observarMembro,
} from '../firebase/equipe.js'
import { iniciarAnalytics } from '../firebase/app.js'

// O estado do clube vem do Firebase: a sessão do Authentication e o documento
// do cliente no Firestore, ouvidos em tempo real. As telas continuam vendo a
// mesma forma de dados que antes — quem traduz é este arquivo.
//
// A única coisa que fica no aparelho é se o onboarding já foi visto, porque
// isso é anterior ao login e não pertence a nenhuma conta.

const CHAVE_ONBOARDING = 'pontos-dourados:onboarding'

const lerOnboarding = () => {
  try {
    return localStorage.getItem(CHAVE_ONBOARDING) === '1'
  } catch {
    return false
  }
}

const dinheiro = (centavos) =>
  (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const codigoVoucher = () => {
  const bloco = () =>
    Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('')
  return `PD-${bloco()}-${bloco()}`
}

// Timestamp do Firestore → o que a tela espera. Enquanto a escrita não volta
// do servidor, `serverTimestamp()` chega como null; aí vale o agora.
const paraData = (ts) => (ts?.toDate ? ts.toDate() : ts ? new Date(ts) : new Date())

// "out/2025" — montado à mão porque o `toLocaleDateString` pt-BR devolve
// "out. de 2025", e tirar o ponto e o "de" com replace deixa espaço sobrando.
const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const mesAno = (ts) => {
  const d = paraData(ts)
  return `${MESES_CURTOS[d.getMonth()]}/${d.getFullYear()}`
}

const diaISO = (ts) => paraData(ts).toISOString().slice(0, 10)

// "há 2 h", "ontem", "4 dias" — o formato que a lista de notificações usa.
function tempoRelativo(ts) {
  const minutos = Math.max(0, Math.round((Date.now() - paraData(ts).getTime()) / 60000))
  if (minutos < 2) return 'agora'
  if (minutos < 60) return `há ${minutos} min`
  const horas = Math.round(minutos / 60)
  if (horas < 24) return `há ${horas} h`
  const dias = Math.round(horas / 24)
  if (dias === 1) return 'ontem'
  return `${dias} dias`
}

export function ClubeProvider({ children }) {
  const [sessao, setSessao] = useState(undefined) // undefined = ainda verificando
  const [perfil, setPerfil] = useState(null)
  const [historico, setHistorico] = useState([])
  const [vouchers, setVouchers] = useState([])
  const [notificacoes, setNotificacoes] = useState([])
  const [onboardingVisto, setOnboardingVisto] = useState(lerOnboarding)
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)

  // Equipe e configuração do clube. `membro` undefined = ainda consultando;
  // null = a pessoa não é da equipe.
  const [membro, setMembro] = useState(undefined)
  const [regrasSalvas, setRegrasSalvas] = useState(null)
  const [catalogo, setCatalogo] = useState(null)
  const [lojasSalvas, setLojasSalvas] = useState([])
  const [lojaEscolhida, setLojaEscolhida] = useState('')

  // A tela de notificações marca tudo como lido na saída
  // (`useEffect(() => () => lerNotificacoes(), ...)`). Para isso a função
  // precisa ser estável: se ela mudasse a cada notificação nova, o cleanup
  // rodaria com a tela ainda aberta e o destaque dourado nunca apareceria.
  const notificacoesRef = useRef([])
  notificacoesRef.current = notificacoes

  // --- Sessão --------------------------------------------------------------

  useEffect(() => {
    iniciarAnalytics()
    concluirRedirecionamento()
    return observarSessao(async (user) => {
      if (!user) {
        setSessao(null)
        setPerfil(null)
        setHistorico([])
        setVouchers([])
        setNotificacoes([])
        setMembro(undefined)
        return
      }
      try {
        // Cria o documento zerado no primeiro login desta conta.
        await garantirPerfil(user)
      } catch (e) {
        setErro(mensagemDeErro(e))
      }
      setSessao(user)
    })
  }, [])

  // --- Dados do cliente, em tempo real ------------------------------------

  useEffect(() => {
    if (!sessao) return undefined
    const aoFalhar = (e) => setErro(mensagemDeErro(e))
    const cancelar = [
      observarPerfil(sessao.uid, setPerfil, aoFalhar),
      observarColecao(sessao.uid, 'historico', setHistorico, aoFalhar),
      observarColecao(sessao.uid, 'vouchers', setVouchers, aoFalhar),
      observarColecao(sessao.uid, 'notificacoes', setNotificacoes, aoFalhar),
    ]
    return () => cancelar.forEach((c) => c())
  }, [sessao])

  // --- Papel na equipe e regras do clube ----------------------------------

  // O papel vem de `equipe/{email}`, que só o admin ou o franqueado criam. Uma
  // falha aqui (sem rede, regra antiga no console) vale como "não é equipe":
  // a pessoa cai no app de cliente, que é o lado seguro.
  useEffect(() => {
    if (!sessao) return undefined
    if (!sessao.email) {
      setMembro(null)
      return undefined
    }
    return observarMembro(sessao.email, setMembro, () => setMembro(null))
  }, [sessao])

  useEffect(() => {
    if (!sessao) return undefined
    const ignorar = () => {}
    const cancelar = [
      observarConfig('regras', setRegrasSalvas, ignorar),
      observarConfig('catalogo', setCatalogo, ignorar),
      observarLojas(setLojasSalvas, ignorar),
    ]
    return () => cancelar.forEach((c) => c())
  }, [sessao])

  const souAdmin = !!sessao?.emailVerified && normalizarEmail(sessao?.email) === EMAIL_ADMIN
  const papel = souAdmin ? 'admin' : membro?.ativo ? membro.papel : null

  const regras = useMemo(() => ({ ...REGRAS_PADRAO, ...(regrasSalvas || {}) }), [regrasSalvas])

  // Lojas cadastradas no painel; enquanto não houver nenhuma, as do código.
  const unidades = useMemo(() => {
    const ativas = lojasSalvas.filter((l) => l.ativa !== false)
    if (!ativas.length) return UNIDADES
    return ativas
      .map((l) => ({ bairro: '', endereco: '', ...l }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [lojasSalvas])

  // Em que loja a pessoa está operando o caixa. Equipe: sempre a dela.
  // Admin: a que escolher no seletor do painel.
  const lojaOperacao = papel === 'admin' ? lojaEscolhida || unidades[0]?.id || '' : membro?.loja || ''

  // O preço em pontos vem do catálogo publicado pelo admin — é ele que a
  // regra do resgate confere, então a tela tem de mostrar o mesmo número.
  const recompensas = useMemo(() => {
    const precos = catalogo?.pontos || {}
    return RECOMPENSAS.map((r) => (precos[r.id] ? { ...r, pontos: precos[r.id] } : r))
  }, [catalogo])

  // --- Formato que as telas consomem --------------------------------------

  const usuario = useMemo(() => {
    if (!perfil) return USUARIO_VAZIO
    return {
      ...USUARIO_VAZIO,
      ...perfil,
      membroDesde: perfil.criadoEm ? mesAno(perfil.criadoEm) : '—',
    }
  }, [perfil])

  const nivel = useMemo(() => nivelDe(usuario.acumulado), [usuario.acumulado])

  const missoes = useMemo(() => {
    const salvas = perfil?.missoes || {}
    return MISSOES.map((base) => {
      const salvo = salvas[base.id] || {}
      const feito = salvo.feito || 0
      return {
        ...base,
        feito,
        concluida: !!salvo.concluida,
        progresso: Math.min(1, feito / base.meta),
      }
    })
  }, [perfil])

  // O extrato guarda só o essencial; a data legível é montada aqui para não
  // congelar formato de texto no banco.
  const historicoFormatado = useMemo(
    () =>
      historico.map((h) => {
        const dia = paraData(h.criadoEm)
          .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
          .replace('.', '')
        return {
          ...h,
          data: h.data || diaISO(h.criadoEm),
          detalhe: h.detalhe?.includes('·') ? h.detalhe : [h.detalhe, dia].filter(Boolean).join(' · '),
        }
      }),
    [historico],
  )

  const notificacoesFormatadas = useMemo(
    () => notificacoes.map((n) => ({ ...n, tempo: n.tempo || tempoRelativo(n.criadoEm) })),
    [notificacoes],
  )

  // --- Login ---------------------------------------------------------------

  const entrar = useCallback(async (login) => {
    setErro('')
    setOcupado(true)
    try {
      await login()
      return true
    } catch (e) {
      setErro(mensagemDeErro(e))
      return false
    } finally {
      setOcupado(false)
    }
  }, [])

  const entrarComGoogle = useCallback(() => entrar(loginGoogle), [entrar])
  const entrarComApple = useCallback(() => entrar(loginApple), [entrar])

  const sair = useCallback(async () => {
    setErro('')
    await sairDaConta()
  }, [])

  const concluirOnboarding = useCallback(() => {
    try {
      localStorage.setItem(CHAVE_ONBOARDING, '1')
    } catch {
      /* sem storage: o onboarding reaparece, o app funciona */
    }
    setOnboardingVisto(true)
  }, [])

  // --- Escritas ------------------------------------------------------------

  const atualizarPerfil = useCallback(
    async (campos) => {
      if (!sessao) return
      try {
        await salvarPerfil(sessao.uid, campos)
      } catch (e) {
        setErro(mensagemDeErro(e))
      }
    },
    [sessao],
  )

  // Fecha o cadastro: grava os dados da etapa 2 e libera o app.
  const concluirCadastro = useCallback(
    async ({ nome, telefone, nascimento, unidade, novidades }) => {
      if (!sessao) return false
      const e164 = paraE164(telefone)
      setErro('')
      setOcupado(true)
      try {
        // A reserva vem primeiro: se o número já for de outra conta, o cadastro
        // nem chega a ser gravado e o cliente corrige antes de entrar.
        await reservarTelefone(sessao.uid, e164)
        await salvarPerfil(sessao.uid, {
          nome: nome.trim(),
          primeiroNome: nome.trim().split(' ')[0],
          telefone,
          telefoneE164: e164,
          nascimento,
          unidade,
          aceiteTermos: true,
          aceiteNovidades: !!novidades,
          cadastroCompleto: true,
        })
        return true
      } catch (e) {
        setErro(mensagemDeErro(e))
        return false
      } finally {
        setOcupado(false)
      }
    },
    [sessao],
  )

  const resgatar = useCallback(
    async (recompensa) => {
      if (!sessao) return null
      // Sem catálogo publicado a regra recusa todo resgate; melhor dizer o
      // motivo do que mostrar "sem permissão".
      if (!catalogo) {
        setErro(mensagemDeErro({ code: 'catalogo-ausente' }))
        return null
      }
      setErro('')
      try {
        const voucher = await resgatarRecompensa(sessao.uid, recompensa, codigoVoucher())
        // null = o saldo no servidor não cobria o preço (ex.: outro aparelho
        // resgatou antes). Sem mensagem, isso também parecia um clique mudo.
        if (!voucher) setErro(mensagemDeErro({ code: 'saldo-insuficiente' }))
        return voucher
      } catch (e) {
        setErro(mensagemDeErro(e))
        return null
      }
    },
    [sessao, catalogo],
  )

  const lerNotificacoes = useCallback(async () => {
    if (!sessao) return
    const novas = notificacoesRef.current.filter((n) => n.nova).map((n) => n.id)
    if (!novas.length) return
    try {
      await marcarNotificacoesLidas(sessao.uid, novas)
    } catch (e) {
      setErro(mensagemDeErro(e))
    }
  }, [sessao])

  const valor = useMemo(
    () => ({
      // sessão
      carregando: sessao === undefined || (!!sessao && membro === undefined),
      autenticado: !!sessao,
      uid: sessao?.uid || null,
      cadastroCompleto: !!perfil?.cadastroCompleto,
      onboardingVisto,
      erro,
      ocupado,
      limparErro: () => setErro(''),

      // dados
      usuario,
      nivel,
      missoes,
      recompensas,
      catalogoPublicado: !!catalogo,
      // O que a regra do Firestore exige existir antes de o caixa funcionar.
      configuracao: { lojas: lojasSalvas.length > 0, regras: !!regrasSalvas, catalogo: !!catalogo },
      regras,
      unidades,

      // equipe
      email: sessao?.email || '',
      papel,
      membro: membro || null,
      lojaOperacao,
      escolherLoja: setLojaEscolhida,
      historico: historicoFormatado,
      vouchers,
      notificacoes: notificacoesFormatadas,
      naoLidas: notificacoesFormatadas.filter((n) => n.nova).length,
      dinheiro,

      // ações
      entrarComGoogle,
      entrarComApple,
      sair,
      concluirOnboarding,
      concluirCadastro,
      atualizarPerfil,
      resgatar,
      lerNotificacoes,
    }),
    [
      sessao,
      perfil,
      onboardingVisto,
      erro,
      ocupado,
      usuario,
      nivel,
      missoes,
      historicoFormatado,
      vouchers,
      notificacoesFormatadas,
      entrarComGoogle,
      entrarComApple,
      sair,
      concluirOnboarding,
      concluirCadastro,
      atualizarPerfil,
      resgatar,
      lerNotificacoes,
      membro,
      papel,
      lojaOperacao,
      recompensas,
      catalogo,
      regras,
      regrasSalvas,
      lojasSalvas,
      unidades,
    ],
  )

  return <ClubeContexto.Provider value={valor}>{children}</ClubeContexto.Provider>
}
