import { useEffect } from 'react'
import { useRota } from '../rotas/useRota.js'
import { useClube } from '../estado/clubeContexto.js'
import { Brilho } from '../componentes/primitivos.jsx'
import { Gota } from '../componentes/Gota.jsx'

// Moedas que sobem atrás da coxinha: posição, tamanho e atraso fixos, para
// a animação ser igual em toda abertura (e não piscar ao re-renderizar).
const MOEDAS = [
  [12, 9, 0], [27, 6, 0.9], [41, 11, 0.35], [58, 7, 1.3], [70, 10, 0.6], [84, 6, 1.6], [92, 8, 0.15], [5, 7, 1.1],
]

export function Splash() {
  const { ir } = useRota()
  const { autenticado, carregando, cadastroCompleto, onboardingVisto, papel } = useClube()

  // A splash espera duas coisas: a animação terminar (o aro de ouro leva
  // ~2,2 s para fechar) e o Firebase responder se
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
    }, 2300)
    return () => clearTimeout(t)
  }, [autenticado, carregando, cadastroCompleto, onboardingVisto, papel, ir])

  return (
    <div className="tela splash">
      <Brilho tamanho={440} topo={170} esquerda={-30} forca={0.24} />
      <Gota tamanho={250} cor="var(--branco)" opacidade={0.04} style={{ position: 'absolute', top: 50, right: -60 }} />
      <Gota tamanho={150} cor="var(--branco)" opacidade={0.04} style={{ position: 'absolute', bottom: 90, left: -45 }} />

      <div className="splash__moedas" aria-hidden="true">
        {MOEDAS.map(([x, t, atraso], i) => (
          <i key={i} style={{ left: `${x}%`, width: t, height: t, animationDelay: `${atraso}s` }} />
        ))}
      </div>

      <div className="splash__centro">
        <div className="splash__palco" aria-hidden="true">
          <i className="splash__aro" />
          <i className="splash__aro-luz" />
          <img src={`${import.meta.env.BASE_URL}produtos/coxinha-g.webp`} alt="" className="splash__coxinha" />
          <i className="splash__sombra" />
        </div>
        <img src={`${import.meta.env.BASE_URL}marca/logo-claro.svg`} alt="Sua Coxinha" className="splash__logo" />
        <h1 className="t-saldo ouro-display splash__titulo">
          <span>PONTOS DOURADOS</span>
        </h1>
        <p className="t-corpo-g c-secundario splash__lema">Sua compra vale ouro.</p>
      </div>

      <div className="splash__rodape">
        <span className="splash__barra" role="progressbar" aria-label="Carregando">
          <i />
        </span>
        <span className="t-overline c-sutil">Clube Sua Coxinha</span>
      </div>
    </div>
  )
}
