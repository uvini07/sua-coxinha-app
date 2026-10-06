import { useCallback, useEffect, useMemo, useState } from 'react'
import { ClubeContexto } from './clubeContexto.js'
import {
  HISTORICO_INICIAL,
  MISSOES,
  NOTIFICACOES_INICIAIS,
  PONTOS_POR_REAL,
  RECOMPENSAS,
  USUARIO_INICIAL,
  nivelDe,
} from '../dados/clube.js'

// Enquanto não existe backend, o estado do clube mora aqui e é gravado no
// localStorage. Quando a API entrar, só estas funções mudam — as telas não.

const CHAVE = 'pontos-dourados:v1'

const estadoInicial = () => ({
  autenticado: false,
  onboardingVisto: false,
  usuario: USUARIO_INICIAL,
  historico: HISTORICO_INICIAL,
  missoes: MISSOES.map((m) => ({ id: m.id, feito: m.feito, concluida: !!m.concluida })),
  vouchers: [],
  notificacoes: NOTIFICACOES_INICIAIS,
})

function ler() {
  try {
    const bruto = localStorage.getItem(CHAVE)
    if (!bruto) return estadoInicial()
    return { ...estadoInicial(), ...JSON.parse(bruto) }
  } catch {
    // Modo privado ou storage bloqueado: o app funciona igual, só não lembra.
    return estadoInicial()
  }
}

const dinheiro = (centavos) =>
  (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const agora = () =>
  new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')

// Data ISO curta, usada para agrupar o extrato por mês.
const hoje = () => new Date().toISOString().slice(0, 10)

const codigoVoucher = () => {
  const bloco = () =>
    Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('')
  return `PD-${bloco()}-${bloco()}`
}

export function ClubeProvider({ children }) {
  const [estado, setEstado] = useState(ler)

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(estado))
    } catch {
      /* sem storage: segue sem lembrar */
    }
  }, [estado])

  const nivel = useMemo(() => nivelDe(estado.usuario.acumulado), [estado.usuario.acumulado])

  const missoes = useMemo(
    () =>
      MISSOES.map((base) => {
        const salvo = estado.missoes.find((m) => m.id === base.id) || {}
        const feito = salvo.feito ?? base.feito
        return {
          ...base,
          feito,
          concluida: salvo.concluida ?? !!base.concluida,
          progresso: Math.min(1, feito / base.meta),
        }
      }),
    [estado.missoes],
  )

  const entrar = useCallback(() => setEstado((e) => ({ ...e, autenticado: true })), [])
  const sair = useCallback(() => setEstado(() => ({ ...estadoInicial(), onboardingVisto: true })), [])
  const concluirOnboarding = useCallback(() => setEstado((e) => ({ ...e, onboardingVisto: true })), [])

  const atualizarPerfil = useCallback(
    (campos) => setEstado((e) => ({ ...e, usuario: { ...e.usuario, ...campos } })),
    [],
  )

  const resgatar = useCallback((recompensa) => {
    let voucher = null
    setEstado((e) => {
      if (e.usuario.saldo < recompensa.pontos) return e
      voucher = {
        id: `v-${Date.now()}`,
        recompensaId: recompensa.id,
        nome: recompensa.nome,
        descricao: recompensa.descricao,
        imagem: recompensa.imagem,
        pontos: recompensa.pontos,
        codigo: codigoVoucher(),
        estado: 'disponivel',
        validade: 'Vence em 7 dias',
        criadoEm: Date.now(),
      }
      return {
        ...e,
        usuario: { ...e.usuario, saldo: e.usuario.saldo - recompensa.pontos, resgates: e.usuario.resgates + 1 },
        vouchers: [voucher, ...e.vouchers],
        historico: [
          {
            id: `h-${Date.now()}`,
            tipo: 'resgate',
            titulo: 'Resgate de recompensa',
            detalhe: `${recompensa.nome} · ${agora()}`,
            pontos: -recompensa.pontos,
            data: hoje(),
          },
          ...e.historico,
        ],
      }
    })
    return voucher
  }, [])

  // Simula uma compra identificada no caixa. É o gancho que a integração com o
  // PDV (ou o app do operador) vai substituir.
  const registrarCompra = useCallback((valorCentavos, unidade = 'Cajamar') => {
    const pontos = Math.round((valorCentavos / 100) * PONTOS_POR_REAL)
    setEstado((e) => ({
      ...e,
      usuario: {
        ...e.usuario,
        saldo: e.usuario.saldo + pontos,
        acumulado: e.usuario.acumulado + pontos,
      },
      historico: [
        {
          id: `h-${Date.now()}`,
          tipo: 'ganho',
          titulo: 'Compra na Sua Coxinha',
          detalhe: `${unidade} · ${agora()}`,
          pontos,
          valor: valorCentavos,
          data: hoje(),
        },
        ...e.historico,
      ],
    }))
    return pontos
  }, [])

  const avancarMissao = useCallback((id) => {
    setEstado((e) => {
      const base = MISSOES.find((m) => m.id === id)
      if (!base) return e
      const atual = e.missoes.find((m) => m.id === id) || { feito: base.feito, concluida: false }
      if (atual.concluida) return e
      const feito = Math.min(base.meta, atual.feito + 1)
      const concluida = feito >= base.meta
      return {
        ...e,
        missoes: e.missoes.map((m) => (m.id === id ? { ...m, feito, concluida } : m)),
        usuario: concluida
          ? {
              ...e.usuario,
              saldo: e.usuario.saldo + base.recompensa,
              acumulado: e.usuario.acumulado + base.recompensa,
            }
          : e.usuario,
        historico: concluida
          ? [
              {
                id: `h-${Date.now()}`,
                tipo: 'bonus',
                titulo: 'Missão Dourada concluída',
                detalhe: `${base.titulo} · ${agora()}`,
                pontos: base.recompensa,
                data: hoje(),
              },
              ...e.historico,
            ]
          : e.historico,
      }
    })
  }, [])

  const usarVoucher = useCallback(
    (id) =>
      setEstado((e) => ({
        ...e,
        vouchers: e.vouchers.map((v) => (v.id === id ? { ...v, estado: 'utilizado' } : v)),
      })),
    [],
  )

  const lerNotificacoes = useCallback(
    () => setEstado((e) => ({ ...e, notificacoes: e.notificacoes.map((n) => ({ ...n, nova: false })) })),
    [],
  )

  const reiniciar = useCallback(() => {
    try {
      localStorage.removeItem(CHAVE)
    } catch {
      /* ignora */
    }
    setEstado(estadoInicial())
  }, [])

  const valor = useMemo(
    () => ({
      ...estado,
      nivel,
      missoes,
      recompensas: RECOMPENSAS,
      naoLidas: estado.notificacoes.filter((n) => n.nova).length,
      dinheiro,
      entrar,
      sair,
      concluirOnboarding,
      atualizarPerfil,
      resgatar,
      registrarCompra,
      avancarMissao,
      usarVoucher,
      lerNotificacoes,
      reiniciar,
    }),
    [
      estado,
      nivel,
      missoes,
      entrar,
      sair,
      concluirOnboarding,
      atualizarPerfil,
      resgatar,
      registrarCompra,
      avancarMissao,
      usarVoucher,
      lerNotificacoes,
      reiniciar,
    ],
  )

  return <ClubeContexto.Provider value={valor}>{children}</ClubeContexto.Provider>
}
