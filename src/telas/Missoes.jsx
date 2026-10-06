import { useState } from 'react'
import { useRota } from '../rotas/useRota.js'
import { useClube } from '../estado/clubeContexto.js'
import { AppBar, NavInferior, Tela } from '../componentes/Tela.jsx'
import { CardMissao } from '../componentes/cartoes.jsx'
import { BarraProgresso, Botao, Brilho, CabecalhoSecao, Chip, Vazio } from '../componentes/primitivos.jsx'
import { Icone } from '../componentes/Icone.jsx'

const FILTROS = [
  { id: 'ativas', nome: 'Ativas' },
  { id: 'concluidas', nome: 'Concluídas' },
  { id: 'todas', nome: 'Todas' },
]

export function Missoes() {
  const { ir } = useRota()
  const { missoes } = useClube()
  const [filtro, setFiltro] = useState('ativas')

  const concluidas = missoes.filter((m) => m.concluida).length
  const lista = missoes.filter((m) =>
    filtro === 'todas' ? true : filtro === 'concluidas' ? m.concluida : !m.concluida,
  )

  return (
    <Tela nav={<NavInferior ativo="missoes" />}>
      <Brilho tamanho={300} topo={30} esquerda={50} forca={0.18} />

      <header className="px safe-topo pilha g4">
        <h1 className="t-h1">Missões Douradas</h1>
        <p className="t-corpo c-secundario">Cada missão é um motivo a mais para voltar.</p>
      </header>

      <div className="px mt16">
        <div className="caixa caixa--ouro pilha g12">
          <div className="linha-h entre g12">
            <span className="linha-h g8">
              <Icone nome="trofeu" tamanho={18} cor="var(--ouro-500)" />
              <strong className="t-forte">
                {concluidas} de {missoes.length} concluídas este mês
              </strong>
            </span>
            <strong className="t-forte c-ouro">{Math.round((concluidas / missoes.length) * 100)}%</strong>
          </div>
          <BarraProgresso valor={concluidas / missoes.length} tom="escuro" altura={9} />
        </div>
      </div>

      <div className="rolagem-h px mt24">
        {FILTROS.map((f) => (
          <Chip key={f.id} ativo={filtro === f.id} onClick={() => setFiltro(f.id)}>
            {f.nome}
          </Chip>
        ))}
      </div>

      <section className="px mt16 pilha g12">
        {lista.length === 0 ? (
          <Vazio icone="alvo" titulo="Nenhuma missão aqui" texto="Quando novas missões abrirem, elas aparecem nesta lista." />
        ) : (
          lista.map((m) => <CardMissao key={m.id} missao={m} onClick={() => ir(`/missao/${m.id}`)} />)
        )}
      </section>
    </Tela>
  )
}

export function MissaoDetalhe({ id }) {
  const { ir } = useRota()
  const { missoes } = useClube()
  const missao = missoes.find((m) => m.id === id)

  if (!missao)
    return (
      <Tela>
        <AppBar titulo="Missão" />
        <Vazio icone="alvo" titulo="Missão não encontrada" texto="Ela pode ter sido encerrada." />
      </Tela>
    )

  const convite = missao.id === 'indicacao'
  const textoConvite = encodeURIComponent(
    'Entrei no Pontos Dourados, o clube da Sua Coxinha. Cada compra vira ponto e os pontos viram coxinha. Entra também: https://www.suacoxinhaloja.com.br',
  )

  return (
    <Tela>
      <Brilho tamanho={230} topo={80} esquerda={85} forca={0.26} />
      <AppBar titulo="Missão Dourada" acao={{ icone: 'compartilhar', rotulo: 'Compartilhar' }} />

      <div className="missao__capa">
        <span className="missao__icone">
          <Icone nome={missao.icone} tamanho={42} cor="var(--marrom-churros)" traco={1.9} />
        </span>
        <h1 className="t-h1 centro">{missao.titulo}</h1>
        <p className="t-corpo-g c-secundario centro">{missao.detalhe}</p>
      </div>

      <div className="px mt24">
        <div className="caixa caixa--ouro pilha g12">
          <div className="linha-h entre g12">
            <span className="pilha">
              <span className="t-overline c-sutil">Seu progresso</span>
              <strong className="t-num-g">
                {missao.feito} de {missao.meta}
              </strong>
            </span>
            <strong className="t-saldo ouro-display c-ouro" style={{ fontSize: 38 }}>
              {Math.round(missao.progresso * 100)}%
            </strong>
          </div>
          <BarraProgresso valor={missao.progresso} tom="escuro" altura={12} />
          <div className="linha-h entre g12">
            <span className="linha-h g4 t-peq c-sutil">
              <Icone nome="relogio" tamanho={14} cor="var(--texto-sutil)" />
              {missao.prazo}
            </span>
            <span className="selo selo--ouro">
              <Icone nome="brilho" tamanho={13} />+{missao.recompensa} Pontos
            </span>
          </div>
        </div>
      </div>

      <section className="px mt32 pilha g16">
        <CabecalhoSecao titulo="Como funciona" />
        {missao.comoFunciona.map(([titulo, texto], i) => (
          <div key={i} className="passo">
            <span className="passo__numero">{i + 1}</span>
            <span className="pilha g4">
              <strong className="t-forte">{titulo}</strong>
              <span className="t-peq c-sutil">{texto}</span>
            </span>
          </div>
        ))}
      </section>

      <div className="px mt32 pilha g12" style={{ paddingBottom: 24 }}>
        {convite ? (
          <Botao
            icone="compartilhar"
            onClick={() => window.open(`https://wa.me/?text=${textoConvite}`, '_blank', 'noopener')}
          >
            Convidar pelo WhatsApp
          </Botao>
        ) : (
          <Botao
            icone="seta-diagonal"
            onClick={() => window.open('https://www.suacoxinhaloja.com.br', '_blank', 'noopener')}
            desabilitado={missao.bloqueada}
          >
            Fazer meu pedido
          </Botao>
        )}
        <Botao estilo="fantasma" onClick={() => ir('/missoes')}>
          Ver todas as missões
        </Botao>
      </div>
    </Tela>
  )
}
