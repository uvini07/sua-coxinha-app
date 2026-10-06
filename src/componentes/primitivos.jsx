import { Icone } from './Icone.jsx'

// Peças pequenas e repetidas do design system. As maiores moram em arquivo próprio.

export function Botao({
  children,
  estilo = 'ouro',
  tamanho = 'g',
  icone,
  iconeDepois,
  largura = 'cheia',
  desabilitado,
  onClick,
  tipo = 'button',
}) {
  const classes = [
    'botao',
    `botao--${estilo}`,
    `botao--${tamanho}`,
    largura === 'cheia' ? 'botao--cheio' : '',
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <button type={tipo} className={classes} disabled={desabilitado} onClick={onClick}>
      {icone && <Icone nome={icone} tamanho={tamanho === 'p' ? 16 : 19} />}
      <span>{children}</span>
      {iconeDepois && <Icone nome={iconeDepois} tamanho={tamanho === 'p' ? 16 : 19} />}
    </button>
  )
}

export function Chip({ children, ativo, onClick, icone }) {
  return (
    <button type="button" className={`chip${ativo ? ' chip--ativo' : ''}`} onClick={onClick}>
      {icone && <Icone nome={icone} tamanho={15} />}
      {children}
    </button>
  )
}

export function Pilula({ children, cor = 'var(--texto-sutil)', icone }) {
  return (
    <span className="pilula">
      {icone ? <Icone nome={icone} tamanho={13} cor={cor} /> : <i className="pilula__ponto" style={{ background: cor }} />}
      {children}
    </span>
  )
}

export function Selo({ children, tom = 'ouro', icone }) {
  return (
    <span className={`selo selo--${tom}`}>
      {icone && <Icone nome={icone} tamanho={14} />}
      {children}
    </span>
  )
}

export function BarraProgresso({ valor = 0, tom = 'ouro', altura = 10 }) {
  const pct = Math.max(0, Math.min(1, valor))
  return (
    <div
      className={`progresso progresso--${tom}`}
      style={{ height: altura }}
      role="progressbar"
      aria-valuenow={Math.round(pct * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <i style={{ width: `${pct * 100}%` }} />
    </div>
  )
}

export function CabecalhoSecao({ titulo, acao, onAcao }) {
  return (
    <div className="cabecalho-secao">
      <h2 className="t-h3">{titulo}</h2>
      {acao && (
        <button type="button" className="cabecalho-secao__acao" onClick={onAcao}>
          {acao}
          <Icone nome="seta-dir" tamanho={15} />
        </button>
      )}
    </div>
  )
}

// O brilho dourado que fica atrás dos elementos de conquista. É o que dá a
// sensação de luz vindo de dentro — sem ele o preto fica apenas escuro.
export function Brilho({ tamanho = 320, topo = 0, esquerda = 0, forca = 0.22, cor = 'var(--ouro-500)' }) {
  return (
    <div
      className="brilho"
      style={{
        width: tamanho,
        height: tamanho,
        top: topo,
        left: esquerda,
        opacity: forca,
        background: cor,
      }}
      aria-hidden="true"
    />
  )
}

export function Vazio({ icone = 'presente', titulo, texto, children }) {
  return (
    <div className="vazio">
      <div className="vazio__icone">
        <Icone nome={icone} tamanho={34} cor="var(--texto-sutil)" />
      </div>
      <h3 className="t-h3">{titulo}</h3>
      {texto && <p className="t-corpo c-secundario">{texto}</p>}
      {children}
    </div>
  )
}

export function Divisor({ recuo = 0 }) {
  return <hr className="divisor" style={{ marginLeft: recuo }} />
}
