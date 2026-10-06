import { useMemo, useState } from 'react'
import { useRota } from '../rotas/useRota.js'
import { useClube } from '../estado/clubeContexto.js'
import { AppBar, NavInferior, Tela } from '../componentes/Tela.jsx'
import { CartaoDourado } from '../componentes/CartaoDourado.jsx'
import { LinhaHistorico } from '../componentes/cartoes.jsx'
import { Brilho, CabecalhoSecao, Chip, Divisor, Vazio } from '../componentes/primitivos.jsx'

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

// Agrupa o que entrou de ponto por mês, para o gráfico e para os cabeçalhos da lista.
function porMes(historico) {
  const mapa = new Map()
  for (const item of historico) {
    const d = item.data ? new Date(item.data + 'T12:00:00') : new Date()
    const chave = `${d.getFullYear()}-${d.getMonth()}`
    if (!mapa.has(chave))
      mapa.set(chave, { chave, mes: d.getMonth(), ano: d.getFullYear(), ganhos: 0, itens: [] })
    const linha = mapa.get(chave)
    if (item.pontos > 0) linha.ganhos += item.pontos
    linha.itens.push(item)
  }
  return [...mapa.values()].sort((a, b) => b.ano - a.ano || b.mes - a.mes)
}

export function Carteira() {
  const { ir } = useRota()
  const { usuario, nivel, historico } = useClube()
  const meses = useMemo(() => porMes(historico).slice(0, 6).reverse(), [historico])
  const teto = Math.max(1, ...meses.map((m) => m.ganhos))

  return (
    <Tela nav={<NavInferior ativo="home" />}>
      <Brilho tamanho={320} topo={40} esquerda={40} forca={0.16} />
      <AppBar titulo="Minha carteira" acao={{ icone: 'info', rotulo: 'Como funciona' }} aoAcionar={() => ir('/niveis')} />

      <div className="px mt8">
        <CartaoDourado
          saldo={usuario.saldo}
          pendentes={usuario.pendentes}
          aExpirar={usuario.aExpirar}
          nivel={nivel.atual}
        />
      </div>

      <div className="carteira__resumo px mt16">
        {[
          [usuario.saldo.toLocaleString('pt-BR'), 'Disponíveis', 'var(--sinal-sucesso)'],
          [usuario.pendentes, 'Pendentes', 'var(--sinal-alerta)'],
          [usuario.aExpirar, 'A expirar', 'var(--sinal-erro)'],
        ].map(([valor, rotulo, cor]) => (
          <div key={rotulo} className="carteira__stat">
            <span className="linha-h g4">
              <i className="pilula__ponto" style={{ background: cor }} />
              <span className="t-peq c-sutil">{rotulo}</span>
            </span>
            <b className="t-num-m">{valor}</b>
          </div>
        ))}
      </div>

      <section className="px mt32 pilha g12">
        <CabecalhoSecao titulo="Evolução dos pontos" />
        <div className="grafico">
          {meses.map((m, i) => (
            <div key={m.chave} className="grafico__coluna">
              <i
                style={{
                  height: `${Math.max(8, (m.ganhos / teto) * 92)}px`,
                  background: i === meses.length - 1 ? 'var(--gradiente-ouro)' : 'var(--neutro-700)',
                }}
              />
              <span className={`t-peq ${i === meses.length - 1 ? 'c-ouro' : 'c-sutil'}`}>{MESES[m.mes]}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="px mt32 pilha">
        <CabecalhoSecao titulo="Últimos lançamentos" acao="Ver tudo" onAcao={() => ir('/historico')} />
        {historico.slice(0, 5).map((h, i) => (
          <div key={h.id}>
            <LinhaHistorico item={h} />
            {i < 4 && <Divisor recuo={54} />}
          </div>
        ))}
      </section>
    </Tela>
  )
}

const FILTROS = [
  { id: 'tudo', nome: 'Tudo' },
  { id: 'ganho', nome: 'Ganhos' },
  { id: 'resgate', nome: 'Resgates' },
  { id: 'expirado', nome: 'Expirados' },
]

export function Historico() {
  const { historico } = useClube()
  const [filtro, setFiltro] = useState('tudo')

  const lista = useMemo(() => {
    const base =
      filtro === 'tudo'
        ? historico
        : historico.filter((h) => (filtro === 'ganho' ? h.tipo === 'ganho' || h.tipo === 'bonus' : h.tipo === filtro))
    return porMes(base)
  }, [historico, filtro])

  return (
    <Tela nav={<NavInferior ativo="home" />}>
      <AppBar titulo="Histórico" />

      <div className="rolagem-h px mt8">
        {FILTROS.map((f) => (
          <Chip key={f.id} ativo={filtro === f.id} onClick={() => setFiltro(f.id)}>
            {f.nome}
          </Chip>
        ))}
      </div>

      {lista.length === 0 && (
        <Vazio icone="carteira" titulo="Nada por aqui" texto="Não há lançamentos deste tipo no seu extrato." />
      )}

      {lista.map((grupo) => (
        <section key={grupo.chave} className="px mt24 pilha">
          <span className="t-overline c-sutil">
            {MESES[grupo.mes]} de {grupo.ano}
          </span>
          <div className="mt8">
            {grupo.itens.map((h, i) => (
              <div key={h.id}>
                <LinhaHistorico item={h} />
                {i < grupo.itens.length - 1 && <Divisor recuo={54} />}
              </div>
            ))}
          </div>
        </section>
      ))}
    </Tela>
  )
}
