import { useEffect } from 'react'
import { useRota } from './rotas/useRota.js'
import { useClube } from './estado/clubeContexto.js'

import { Splash } from './telas/Splash.jsx'
import { Onboarding } from './telas/Onboarding.jsx'
import { Entrar, Codigo, Cadastro } from './telas/Acesso.jsx'
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

// Rotas que podem ser abertas sem estar logado.
const ABERTAS = ['/', '/onboarding', '/entrar', '/codigo', '/cadastro']

export function App() {
  const { caminho, partes, params, ir } = useRota()
  const { autenticado, onboardingVisto } = useClube()

  // Porteiro: onboarding antes de tudo, login antes do app.
  useEffect(() => {
    if (caminho === '/') return
    if (!onboardingVisto && caminho !== '/onboarding') {
      ir('/onboarding', { substituir: true })
      return
    }
    if (!autenticado && !ABERTAS.includes(caminho)) {
      ir('/entrar', { substituir: true })
    }
  }, [caminho, autenticado, onboardingVisto, ir])

  const tela = () => {
    switch (partes[0]) {
      case undefined:
        return <Splash />
      case 'onboarding':
        return <Onboarding />
      case 'entrar':
        return <Entrar />
      case 'codigo':
        return <Codigo />
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
      default:
        return <Home />
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
