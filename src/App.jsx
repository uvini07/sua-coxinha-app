import { useEffect } from 'react'
import { useRota } from './rotas/useRota.js'
import { useClube } from './estado/clubeContexto.js'

import { Splash } from './telas/Splash.jsx'
import { Onboarding } from './telas/Onboarding.jsx'
import { Entrar, Cadastro } from './telas/Acesso.jsx'
import { Home } from './telas/Home.jsx'
import { Carteira, Historico } from './telas/Carteira.jsx'
import { Missoes, MissaoDetalhe } from './telas/Missoes.jsx'
import { Recompensas, RecompensaDetalhe, Vouchers } from './telas/Recompensas.jsx'
import { MeuQR } from './telas/MeuQR.jsx'
import { Clube, ClubeCategoria, ParceiroDetalhe } from './telas/Clube.jsx'
import { Perfil, Configuracoes } from './telas/Perfil.jsx'
import { Notificacoes } from './telas/Notificacoes.jsx'
import { Niveis } from './telas/Niveis.jsx'
import { Celebracao } from './telas/Celebracao.jsx'
import { CaixaCompra, CaixaVoucher, Lojas, Movimento, PainelEquipe, Pessoas, RegrasClube } from './telas/Equipe.jsx'

// Rotas que podem ser abertas sem estar logado.
const ABERTAS = ['/', '/onboarding', '/entrar']

// Páginas da área da equipe e quem pode abrir cada uma. O que não está aqui
// vale para qualquer papel. (Conforto de navegação: a permissão de verdade é
// das regras do Firestore.)
const SO_PARA = {
  pessoas: ['admin', 'franqueado'],
  regras: ['admin'],
  lojas: ['admin'],
}

export function App() {
  const { caminho, partes, params, ir } = useRota()
  const { autenticado, carregando, cadastroCompleto, onboardingVisto, papel } = useClube()

  // Porteiro: onboarding antes de tudo, login antes do app, cadastro antes de
  // qualquer tela com pontos. Enquanto o Firebase ainda está dizendo se existe
  // sessão (`carregando`), ninguém é redirecionado — senão o app jogaria o
  // cliente já logado para a tela de entrada a cada recarga.
  useEffect(() => {
    if (carregando) return
    if (caminho === '/') return

    // O onboarding vem antes de tudo, e este ramo termina aqui: se ele só
    // redirecionasse, um cliente já logado que ainda não viu o onboarding
    // ficaria girando entre /onboarding e /cadastro para sempre.
    if (!onboardingVisto) {
      if (caminho !== '/onboarding') ir('/onboarding', { substituir: true })
      return
    }

    if (!autenticado) {
      if (!ABERTAS.includes(caminho)) ir('/entrar', { substituir: true })
      return
    }

    // Equipe: o login leva direto para a área da equipe, sem exigir o
    // cadastro de cliente. Para ver o app como cliente, aí sim passa pelo
    // cadastro como qualquer pessoa.
    const naEquipe = partes[0] === 'equipe'
    if (papel) {
      if (caminho === '/entrar') {
        ir('/equipe', { substituir: true })
        return
      }
      if (naEquipe) {
        const permitidos = SO_PARA[partes[1]]
        if (permitidos && !permitidos.includes(papel)) ir('/equipe', { substituir: true })
        return
      }
    } else if (naEquipe) {
      ir('/home', { substituir: true })
      return
    }

    // Logado mas sem cadastro fechado: só a etapa 2 e a celebração que vem
    // logo depois dela (o documento no Firestore pode levar um quadro para
    // chegar de volta, e seria feio piscar o cadastro de novo).
    if (!cadastroCompleto) {
      if (caminho !== '/cadastro' && caminho !== '/celebracao/boas-vindas') {
        ir('/cadastro', { substituir: true })
      }
      return
    }

    // Logado e cadastrado: as telas de login não fazem mais sentido.
    if (['/entrar', '/cadastro'].includes(caminho)) {
      ir('/home', { substituir: true })
    }
  }, [caminho, partes, autenticado, carregando, cadastroCompleto, onboardingVisto, papel, ir])

  const tela = () => {
    switch (partes[0]) {
      case undefined:
        return <Splash />
      case 'onboarding':
        return <Onboarding />
      case 'entrar':
        return <Entrar />
      case 'cadastro':
        return <Cadastro />
      case 'home':
        return <Home />
      case 'carteira':
        return <Carteira />
      case 'historico':
        return <Historico />
      case 'missoes':
        return <Missoes />
      case 'missao':
        return <MissaoDetalhe id={partes[1]} />
      case 'recompensas':
        return <Recompensas />
      case 'recompensa':
        return <RecompensaDetalhe id={partes[1]} />
      case 'vouchers':
        return <Vouchers />
      case 'qr':
        return <MeuQR />
      case 'clube':
        return partes[1] ? <ClubeCategoria id={partes[1]} /> : <Clube />
      case 'parceiro':
        return <ParceiroDetalhe id={partes[1]} />
      case 'perfil':
        return <Perfil />
      case 'config':
        return <Configuracoes />
      case 'notificacoes':
        return <Notificacoes />
      case 'niveis':
        return <Niveis />
      case 'celebracao':
        return <Celebracao tipo={partes[1]} params={params} />
      case 'equipe':
        return telaDaEquipe(partes[1])
      default:
        return <Home />
    }
  }

  const telaDaEquipe = (pagina) => {
    switch (pagina) {
      case 'compra':
        return <CaixaCompra />
      case 'voucher':
        return <CaixaVoucher />
      case 'movimento':
        return <Movimento />
      case 'pessoas':
        return <Pessoas />
      case 'regras':
        return <RegrasClube />
      case 'lojas':
        return <Lojas />
      default:
        return <PainelEquipe />
    }
  }

  return (
    <>
      <div className="app">{tela()}</div>
      <p className="app__aviso-desktop">
        Pontos Dourados é feito para o celular. <b>Abra em um telefone para a experiência real.</b>
      </p>
    </>
  )
}
