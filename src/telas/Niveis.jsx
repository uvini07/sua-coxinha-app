import { useClube } from '../estado/clubeContexto.js'
import { AppBar, NavInferior, Tela } from '../componentes/Tela.jsx'
import { BarraProgresso, Brilho, CabecalhoSecao } from '../componentes/primitivos.jsx'
import { SeloNivel } from '../componentes/SeloNivel.jsx'
import { Icone } from '../componentes/Icone.jsx'
import { NIVEIS, PONTOS_POR_REAL } from '../dados/clube.js'

const capitalizar = (s) => s.charAt(0) + s.slice(1).toLowerCase()

export function Niveis() {
  const { usuario, nivel } = useClube()
  const indiceAtual = NIVEIS.findIndex((n) => n.id === nivel.atual.id)

  return (
    <Tela nav={<NavInferior ativo="home" />}>
      <Brilho tamanho={230} topo={70} esquerda={85} forca={0.24} />
      <AppBar titulo="Seu nível" />

      <div className="niveis__topo">
        <SeloNivel nivel={nivel.atual} tamanho={92} mostrarNome={false} />
        <h1 className="t-h1">Nível {capitalizar(nivel.atual.nome)}</h1>
        <p className="t-corpo c-secundario centro">
          {usuario.acumulado.toLocaleString('pt-BR')} pontos acumulados desde {usuario.membroDesde}
        </p>
      </div>

      {nivel.proximo && (
        <div className="px mt24">
          <div className="caixa caixa--ouro pilha g12">
            <div className="linha-h entre g12">
              <strong className="t-forte">
                Faltam {nivel.faltam.toLocaleString('pt-BR')} pontos para o {capitalizar(nivel.proximo.nome)}
              </strong>
              <strong className="t-forte c-ouro">{Math.round(nivel.progresso * 100)}%</strong>
            </div>
            <BarraProgresso valor={nivel.progresso} tom="escuro" altura={10} />
          </div>
        </div>
      )}

      <section className="px mt32 pilha g12">
        <CabecalhoSecao titulo="Sua trilha" />
        <div className="trilha">
          <i className="trilha__linha" aria-hidden="true" />
          {NIVEIS.map((n, i) => {
            const conquistado = i < indiceAtual
            const atual = i === indiceAtual
            return (
              <div key={n.id} className="trilha__item">
                <span
                  className={`trilha__medalha${!conquistado && !atual ? ' trilha__medalha--futura' : ''}`}
                  style={{ background: n.gradiente, borderColor: atual ? '#fff' : 'transparent' }}
                >
                  <Icone
                    nome={conquistado ? 'check' : atual ? n.icone : 'cadeado'}
                    tamanho={21}
                    cor="#FFFFFF"
                    traco={1.9}
                  />
                </span>
                <span className="cresce pilha g4">
                  <strong className={`t-forte ouro-display ${conquistado || atual ? '' : 'c-secundario'}`}>{n.nome}</strong>
                  <span className="t-peq c-sutil">
                    {n.minimo === 0 ? 'Ao entrar no clube' : `${n.minimo.toLocaleString('pt-BR')} pontos acumulados`}
                  </span>
                </span>
                <span className={`pilula${atual ? ' pilula--ouro' : ''}`}>
                  {conquistado ? 'Conquistado' : atual ? 'Nível atual' : `Faltam ${(n.minimo - usuario.acumulado).toLocaleString('pt-BR')}`}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      <section className="px mt32 pilha g12">
        <CabecalhoSecao titulo={`O que o ${capitalizar(nivel.atual.nome)} dá`} />
        <div className="caixa pilha g12">
          {nivel.atual.beneficios.map((b) => (
            <span key={b} className="linha-h g12">
              <Icone nome="check-circulo" tamanho={18} cor="var(--ouro-500)" />
              <span className="t-corpo c-secundario cresce">{b}</span>
            </span>
          ))}
        </div>
      </section>

      <section className="px mt24" style={{ paddingBottom: 24 }}>
        <div className="caixa caixa--nota">
          <Icone nome="info" tamanho={18} cor="var(--texto-sutil)" />
          <div className="pilha g4 cresce">
            <strong className="t-forte">Como os pontos funcionam</strong>
            <span className="t-peq c-sutil">
              Cada R$ 1,00 em compra identificada rende {PONTOS_POR_REAL} Pontos Dourados. O nível é calculado pelo total
              acumulado — resgatar uma recompensa não faz você descer de nível.
            </span>
          </div>
        </div>
      </section>
    </Tela>
  )
}
