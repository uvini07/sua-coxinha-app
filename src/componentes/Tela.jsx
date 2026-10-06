import { useEffect, useRef } from 'react'
import { Icone } from './Icone.jsx'
import { useRota } from '../rotas/useRota.js'

// Casca de tela: área rolável no meio, barra de navegação opcional embaixo.
// O respiro do topo e de baixo usa safe-area, porque instalado no iPhone o app
// fica embaixo do relógio e em cima da barra de gestos.

export function Tela({ children, nav, fundo, className = '', semRolagem }) {
  const area = useRef(null)
  const { caminho } = useRota()

  // Cada tela começa do topo, como um app nativo faria.
  useEffect(() => {
    if (area.current) area.current.scrollTop = 0
  }, [caminho])

  return (
    <div className={`tela ${className}`} style={fundo ? { background: fundo } : undefined}>
      <div className={`tela__area${semRolagem ? ' tela__area--fixa' : ''}${nav ? ' tela__area--com-nav' : ''}`} ref={area}>
        {children}
      </div>
      {nav}
    </div>
  )
}

export function AppBar({ titulo, aoVoltar, acao, aoAcionar, fechar, transparente, children }) {
  const { voltar } = useRota()
  return (
    <header className={`appbar${transparente ? ' appbar--transparente' : ''}`}>
      <button type="button" className="appbar__botao" onClick={aoVoltar || voltar} aria-label="Voltar">
        <Icone nome={fechar ? 'fechar' : 'seta-esq'} tamanho={21} />
      </button>
      {children || <h1 className="appbar__titulo t-h4">{titulo}</h1>}
      {acao ? (
        <button type="button" className="appbar__botao" onClick={aoAcionar} aria-label={acao.rotulo}>
          <Icone nome={acao.icone} tamanho={21} />
        </button>
      ) : (
        <span className="appbar__botao appbar__botao--vazio" aria-hidden="true" />
      )}
    </header>
  )
}

const ABAS = [
  { id: 'home', rotulo: 'Início', icone: 'casa', rota: '/home' },
  { id: 'missoes', rotulo: 'Missões', icone: 'alvo', rota: '/missoes' },
  { id: 'qr', rotulo: 'QR Code', icone: 'qr', rota: '/qr', central: true },
  { id: 'recompensas', rotulo: 'Recompensas', icone: 'presente', rota: '/recompensas' },
  { id: 'clube', rotulo: 'Clube', icone: 'ticket', rota: '/clube' },
]

export function NavInferior({ ativo }) {
  const { ir } = useRota()
  return (
    <nav className="nav" aria-label="Navegação principal">
      {ABAS.map((aba) =>
        aba.central ? (
          <button
            key={aba.id}
            type="button"
            className="nav__fab"
            onClick={() => ir(aba.rota)}
            aria-label="Meu QR Code"
          >
            <Icone nome="qr" tamanho={27} cor="var(--marrom-churros)" />
          </button>
        ) : (
          <button
            key={aba.id}
            type="button"
            className={`nav__aba${ativo === aba.id ? ' nav__aba--ativa' : ''}`}
            onClick={() => ir(aba.rota)}
            aria-current={ativo === aba.id ? 'page' : undefined}
          >
            <Icone nome={aba.icone} tamanho={22} />
            <span className="t-nav">{aba.rotulo}</span>
          </button>
        ),
      )}
    </nav>
  )
}
