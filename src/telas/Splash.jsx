import { useEffect } from 'react'
import { useRota } from '../rotas/useRota.js'
import { useClube } from '../estado/clubeContexto.js'
import { Brilho } from '../componentes/primitivos.jsx'
import { Gota } from '../componentes/Gota.jsx'

export function Splash() {
  const { ir } = useRota()
  const { autenticado, carregando, cadastroCompleto, onboardingVisto, papel } = useClube()

  // A splash espera duas coisas: a animação terminar e o Firebase responder se
  // existe sessão. Quem demorar mais manda — por isso o efeito reage a
  // `carregando` em vez de confiar só no tempo.
  useEffect(() => {
    if (carregando) return
    const t = setTimeout(() => {
      if (!onboardingVisto) ir('/onboarding', { substituir: true })
      else if (!autenticado) ir('/entrar', { substituir: true })
      else if (papel) ir('/equipe', { substituir: true })
      else if (!cadastroCompleto) ir('/cadastro', { substituir: true })
      else ir('/home', { substituir: true })
    }, 1700)
    return () => clearTimeout(t)
  }, [autenticado, carregando, cadastroCompleto, onboardingVisto, papel, ir])

  return (
    <div className="tela splash">
      <Brilho tamanho={440} topo={210} esquerda={-30} forca={0.26} />
      <Gota tamanho={250} cor="var(--branco)" opacidade={0.05} style={{ position: 'absolute', top: 50, right: -60 }} />
      <Gota tamanho={150} cor="var(--branco)" opacidade={0.05} style={{ position: 'absolute', bottom: 90, left: -45 }} />

      <div className="splash__centro">
        <img src={`${import.meta.env.BASE_URL}marca/logo-claro.svg`} alt="Sua Coxinha" className="splash__logo" />
        <i className="splash__risco" />
        <h1 className="t-saldo ouro-display splash__titulo texto-ouro-gradiente">PONTOS DOURADOS</h1>
        <p className="t-corpo-g c-secundario">Sua compra vale ouro.</p>
      </div>

      <div className="splash__rodape">
        <span className="splash__pontos" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="t-overline c-sutil">Clube Sua Coxinha</span>
      </div>
    </div>
  )
}
