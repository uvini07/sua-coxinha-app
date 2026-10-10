import { useRota } from '../rotas/useRota.js'
import { useClube } from '../estado/clubeContexto.js'
import { NavInferior, Tela } from '../componentes/Tela.jsx'
import { CartaoDourado } from '../componentes/CartaoDourado.jsx'
import { CardMissao, CardParceiro, CardRecompensa, LinhaHistorico } from '../componentes/cartoes.jsx'
import { Brilho, CabecalhoSecao, Divisor } from '../componentes/primitivos.jsx'
import { Icone } from '../componentes/Icone.jsx'
import { PARCEIROS } from '../dados/clube.js'

const saudacao = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia,'
  if (h < 18) return 'Boa tarde,'
  return 'Boa noite,'
}

const ATALHOS = [
  { icone: 'qr', rotulo: 'Meu QR', rota: '/qr' },
  { icone: 'carteira', rotulo: 'Extrato', rota: '/carteira' },
  { icone: 'ticket', rotulo: 'Vouchers', rota: '/vouchers', contador: 'vouchers' },
  { icone: 'pessoas', rotulo: 'Convidar', rota: '/missao/indicacao' },
]

export function Home() {
  const { ir } = useRota()
  const { usuario, nivel, missoes, recompensas, historico, naoLidas, papel, vouchers } = useClube()
  const vouchersAtivos = vouchers.filter((v) => v.estado === 'disponivel').length

  const missaoDestaque = missoes.find((m) => !m.concluida && !m.bloqueada) || missoes[0]
  const paraResgatar = [...recompensas].sort((a, b) => a.pontos - b.pontos).slice(0, 6)

  return (
    <Tela nav={<NavInferior ativo="home" />}>
      <Brilho tamanho={330} topo={60} esquerda={40} forca={0.18} />

      <header className="home__topo safe-topo px">
        <button type="button" className="home__avatar" onClick={() => ir('/perfil')} aria-label="Abrir perfil">
          <img src={`${import.meta.env.BASE_URL}produtos/mascote.webp`} alt="" />
        </button>
        <div className="cresce pilha">
          <span className="t-peq c-sutil">{saudacao()}</span>
          <strong className="t-h3">{usuario.primeiroNome}</strong>
        </div>
        <button type="button" className="home__sino" onClick={() => ir('/notificacoes')} aria-label="Notificações">
          <Icone nome="sino" tamanho={20} />
          {naoLidas > 0 && <i className="home__aviso" />}
        </button>
      </header>

      {papel && (
        <div className="px mt16">
          <button type="button" className="faixa-equipe" onClick={() => ir('/equipe')}>
            <Icone nome="cadeado" tamanho={16} cor="var(--ouro-500)" />
            <span className="cresce t-peq">Você está vendo o app como cliente</span>
            <strong className="t-peq c-ouro">Voltar à equipe</strong>
          </button>
        </div>
      )}

      <div className="px mt16">
        <CartaoDourado
          saldo={usuario.saldo}
          pendentes={usuario.pendentes}
          aExpirar={usuario.aExpirar}
          nivel={nivel.atual}
          onClick={() => ir('/carteira')}
        />
      </div>

      <div className="home__atalhos px mt16">
        {ATALHOS.map((a) => (
          <button key={a.rota} type="button" className="home__atalho" onClick={() => ir(a.rota)}>
            <Icone nome={a.icone} tamanho={20} cor="var(--ouro-500)" />
            <span className="t-nav c-secundario">{a.rotulo}</span>
            {a.contador === 'vouchers' && vouchersAtivos > 0 && (
              <b className="home__atalho-contador" aria-label={`${vouchersAtivos} vouchers ativos`}>
                {vouchersAtivos}
              </b>
            )}
          </button>
        ))}
      </div>

      {missaoDestaque && (
        <section className="px mt32 pilha g12">
          <CabecalhoSecao titulo="Missão Dourada" acao="Ver todas" onAcao={() => ir('/missoes')} />
          <CardMissao missao={missaoDestaque} onClick={() => ir(`/missao/${missaoDestaque.id}`)} />
        </section>
      )}

      <section className="px mt32 pilha g12">
        <CabecalhoSecao titulo="Resgate agora" acao="Ver tudo" onAcao={() => ir('/recompensas')} />
        <div className="rolagem-h">
          {paraResgatar.map((r) => (
            <div key={r.id} style={{ width: 158 }}>
              <CardRecompensa recompensa={r} saldo={usuario.saldo} onClick={() => ir(`/recompensa/${r.id}`)} />
            </div>
          ))}
        </div>
      </section>

      <section className="px mt32 pilha g12">
        <CabecalhoSecao titulo="Oferta para você" />
        <article className="oferta">
          <div className="cresce pilha g8">
            <span className="selo selo--ouro">
              <Icone nome="raio" tamanho={13} />
              Só hoje · 2X
            </span>
            <strong className="t-h4">Churros Gourmet com pontos em dobro</strong>
            <span className="t-peq c-sutil">Porque você pediu churros 3 vezes.</span>
          </div>
          <img src={`${import.meta.env.BASE_URL}produtos/churros-gourmet.webp`} alt="" />
        </article>
      </section>

      <section className="px mt32 pilha g12">
        <CabecalhoSecao titulo="Clube de benefícios" acao="Ver tudo" onAcao={() => ir('/clube')} />
        {PARCEIROS.slice(0, 2).map((p) => (
          <CardParceiro key={p.id} parceiro={p} onClick={() => ir(`/parceiro/${p.id}`)} />
        ))}
      </section>

      {/* A seção só existe quando há atividade — numa conta nova ela seria um
          título com nada embaixo. */}
      {historico.length > 0 && (
        <section className="px mt32 pilha">
          <CabecalhoSecao titulo="Atividade recente" acao="Histórico" onAcao={() => ir('/historico')} />
          {historico.slice(0, 3).map((h, i) => (
            <div key={h.id}>
              <LinhaHistorico item={h} />
              {i < 2 && <Divisor recuo={54} />}
            </div>
          ))}
        </section>
      )}
    </Tela>
  )
}
