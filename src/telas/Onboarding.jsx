import { useState } from 'react'
import { useRota } from '../rotas/useRota.js'
import { useClube } from '../estado/clubeContexto.js'
import { Botao, Brilho } from '../componentes/primitivos.jsx'
import { SeloNivel } from '../componentes/SeloNivel.jsx'
import { Icone } from '../componentes/Icone.jsx'
import { QRCode } from '../componentes/QRCode.jsx'
import { NIVEIS, RECOMPENSAS } from '../dados/clube.js'

const foto = (a) => `${import.meta.env.BASE_URL}produtos/${a}`

const PASSOS = [
  {
    titulo: 'Sua compra\nvale ouro.',
    texto:
      'A cada compra na Sua Coxinha você acumula Pontos Dourados. Eles ficam na sua carteira e viram coxinha, combo ou experiência.',
    cta: 'Começar',
  },
  {
    titulo: 'Acumule em\nsegundos.',
    texto:
      'No caixa, informe seu telefone ou mostre seu QR Code. Os pontos entram na hora, sem cartão e sem papelada.',
    cta: 'Continuar',
  },
  {
    titulo: 'Suba de\nnível.',
    texto:
      'Bronze, Prata, Ouro e Diamante. Quanto mais você volta, maior o reconhecimento — e melhores as recompensas.',
    cta: 'Continuar',
  },
  {
    titulo: 'Mais que\ndesconto.',
    texto:
      'Troque pontos por produtos e combos, e use o Clube para ter vantagens em academia, cursos, lazer e serviços.',
    cta: 'Criar minha conta',
  },
]

function Ilustracao({ passo }) {
  if (passo === 0)
    return (
      <>
        <img src={foto('coxinha-g.webp')} alt="" className="onb__produto" />
        <span className="onb__selo">
          <Icone nome="brilho" tamanho={17} cor="var(--marrom-churros)" />
          +120 Pontos Dourados
        </span>
      </>
    )
  if (passo === 1)
    return (
      <>
        <div className="onb__cartao-qr">
          <img src={`${import.meta.env.BASE_URL}marca/gota-ouro.svg`} alt="" width={30} />
          <QRCode valor="PD-4417-0982" tamanho={116} />
          <span className="t-peq" style={{ color: '#5C5C5C' }}>
            Marcelo · Cajamar
          </span>
        </div>
        <span className="onb__selo onb__selo--escuro">
          <Icone nome="check-circulo" tamanho={16} cor="var(--sinal-sucesso)" />
          Pontos creditados
        </span>
      </>
    )
  if (passo === 2)
    return (
      <>
        <div className="onb__niveis">
          {NIVEIS.map((n) => (
            <SeloNivel key={n.id} nivel={n} tamanho={n.id === 'ouro' ? 74 : 56} apagado={n.id !== 'ouro'} mostrarNome={false} />
          ))}
        </div>
        <span className="onb__selo onb__selo--ouro">
          <Icone nome="tendencia" tamanho={16} cor="var(--ouro-500)" />
          Faltam 320 pontos para o próximo nível
        </span>
      </>
    )
  return (
    <div className="onb__recompensas">
      {RECOMPENSAS.slice(0, 2).map((r) => (
        <div key={r.id} className="onb__recompensa">
          <img src={foto(r.imagem)} alt="" />
          <strong className="t-peq">{r.nome}</strong>
          <span className="t-peq c-ouro">{r.pontos} pts</span>
        </div>
      ))}
    </div>
  )
}

export function Onboarding() {
  const [passo, setPasso] = useState(0)
  const { ir } = useRota()
  const { concluirOnboarding } = useClube()
  const atual = PASSOS[passo]

  const avancar = () => {
    if (passo < PASSOS.length - 1) setPasso(passo + 1)
    else {
      concluirOnboarding()
      ir('/entrar', { substituir: true })
    }
  }

  const pular = () => {
    concluirOnboarding()
    ir('/entrar', { substituir: true })
  }

  return (
    <div className="tela onb">
      <Brilho tamanho={300} topo={110} esquerda={55} forca={passo === 2 ? 0.2 : 0.26} />

      <header className="onb__topo safe-topo px">
        <button type="button" className="t-forte c-sutil" onClick={pular}>
          Pular
        </button>
      </header>

      <div className="onb__palco" key={passo}>
        <Ilustracao passo={passo} />
      </div>

      <div className="onb__texto px">
        <span className="t-overline c-ouro">
          Passo {passo + 1} de {PASSOS.length}
        </span>
        <h1 className="t-h1">{atual.titulo}</h1>
        <p className="t-corpo-g c-secundario">{atual.texto}</p>
      </div>

      <div className="onb__base px">
        <div className="onb__pontos" aria-hidden="true">
          {PASSOS.map((_, i) => (
            <i key={i} className={i === passo ? 'ativo' : undefined} />
          ))}
        </div>
        <Botao onClick={avancar}>{atual.cta}</Botao>
        <button type="button" className="t-peq c-sutil onb__entrar" onClick={pular}>
          Já tenho conta · Entrar
        </button>
      </div>
    </div>
  )
}
