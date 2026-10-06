import { Icone } from './Icone.jsx'
import { BarraProgresso } from './primitivos.jsx'

const foto = (arquivo) => `${import.meta.env.BASE_URL}produtos/${arquivo}`

export function CardMissao({ missao, onClick }) {
  const estado = missao.bloqueada ? 'bloqueada' : missao.concluida ? 'concluida' : 'andamento'
  const icone = missao.bloqueada ? 'cadeado' : missao.concluida ? 'check-circulo' : missao.icone
  const corIcone = missao.bloqueada
    ? 'var(--texto-secundario)'
    : missao.concluida
      ? 'var(--sinal-sucesso)'
      : 'var(--ouro-500)'
  return (
    <button type="button" className={`card-missao card-missao--${estado}`} onClick={onClick}>
      <div className="card-missao__topo">
        <span className="card-missao__icone">
          <Icone nome={icone} tamanho={23} cor={corIcone} />
        </span>
        <span className="card-missao__textos">
          <strong className="t-h4">{missao.titulo}</strong>
          <span className="t-peq c-secundario">
            {missao.bloqueada
              ? missao.prazo
              : missao.concluida
                ? 'Missão concluída · bônus creditado'
                : `${missao.feito} de ${missao.meta} · ${missao.descricao.toLowerCase()}`}
          </span>
        </span>
        <Icone nome="seta-dir" tamanho={19} cor="var(--neutro-500)" />
      </div>

      <BarraProgresso valor={missao.bloqueada ? 0 : missao.progresso} altura={9} />

      <div className="card-missao__rodape">
        <span className="selo selo--ouro">
          <Icone nome="brilho" tamanho={13} />+{missao.recompensa} Pontos
        </span>
        <span className="card-missao__prazo t-peq">
          <Icone nome="relogio" tamanho={13} cor="var(--texto-sutil)" />
          {missao.concluida ? 'Concluída' : missao.prazo}
        </span>
      </div>
    </button>
  )
}

export function CardRecompensa({ recompensa, saldo, onClick }) {
  const alcancavel = saldo >= recompensa.pontos
  return (
    <button
      type="button"
      className={`card-recompensa${alcancavel ? '' : ' card-recompensa--longe'}`}
      onClick={onClick}
    >
      <span className="card-recompensa__imagem">
        <img src={foto(recompensa.imagem)} alt="" loading="lazy" />
      </span>
      <span className="card-recompensa__corpo">
        <strong className="t-forte">{recompensa.nome}</strong>
        <span className="t-peq c-sutil">{recompensa.descricao}</span>
        <span className="card-recompensa__preco">
          <Icone nome={alcancavel ? 'brilho' : 'cadeado'} tamanho={15} cor={alcancavel ? 'var(--ouro-500)' : 'var(--texto-sutil)'} />
          <b className={`t-num-m ${alcancavel ? 'c-ouro' : 'c-sutil'}`}>{recompensa.pontos.toLocaleString('pt-BR')}</b>
          <span className="t-peq c-sutil">pts</span>
        </span>
      </span>
    </button>
  )
}

export function CardParceiro({ parceiro, onClick }) {
  return (
    <button type="button" className="card-parceiro" onClick={onClick}>
      <span className="card-parceiro__logo">
        <Icone nome={parceiro.icone} tamanho={27} cor="var(--ouro-500)" />
      </span>
      <span className="card-parceiro__textos">
        <strong className="t-forte">{parceiro.nome}</strong>
        <span className="t-peq c-sutil">
          {parceiro.tipo} · {parceiro.distancia}
        </span>
        <span className="selo selo--ouro">
          <Icone nome="ticket" tamanho={12} />
          {parceiro.beneficio}
        </span>
      </span>
      <Icone nome="seta-dir" tamanho={19} cor="var(--neutro-500)" />
    </button>
  )
}

const ICONE_HISTORICO = {
  ganho: ['carteira', 'var(--ouro-500)'],
  bonus: ['fogo', 'var(--ouro-500)'],
  resgate: ['presente', 'var(--branco)'],
  expirado: ['relogio', 'var(--sinal-erro)'],
}

export function LinhaHistorico({ item, onClick }) {
  const [icone, cor] = ICONE_HISTORICO[item.tipo] || ICONE_HISTORICO.ganho
  const positivo = item.pontos > 0
  const classeValor = item.tipo === 'expirado' ? 'c-erro' : positivo ? 'c-ouro' : 'c-primario'
  return (
    <button type="button" className="linha" onClick={onClick}>
      <span className="linha__icone">
        <Icone nome={icone} tamanho={20} cor={cor} />
      </span>
      <span className="linha__textos">
        <strong className="t-forte">{item.titulo}</strong>
        <span className="t-peq c-sutil">{item.detalhe}</span>
      </span>
      <b className={`t-num-m ${classeValor}`}>
        {positivo ? '+' : '−'}
        {Math.abs(item.pontos)}
      </b>
    </button>
  )
}

export function LinhaNotificacao({ item }) {
  return (
    <article className={`notificacao${item.nova ? ' notificacao--nova' : ''}`}>
      <span className="notificacao__icone">
        <Icone nome={item.icone} tamanho={19} cor={item.nova ? 'var(--ouro-500)' : 'var(--texto-secundario)'} />
      </span>
      <div className="notificacao__textos">
        <div className="notificacao__titulo">
          <strong className="t-forte">{item.titulo}</strong>
          {item.nova && <i className="notificacao__ponto" />}
        </div>
        <p className="t-peq c-secundario">{item.texto}</p>
        <span className="t-peq c-sutil">{item.tempo}</span>
      </div>
    </article>
  )
}

const ESTADO_VOUCHER = {
  disponivel: ['Disponível', 'var(--sinal-sucesso)'],
  utilizado: ['Utilizado', 'var(--texto-sutil)'],
  expirado: ['Expirado', 'var(--sinal-erro)'],
}

export function LinhaVoucher({ voucher, onClick }) {
  const [rotulo, cor] = ESTADO_VOUCHER[voucher.estado] || ESTADO_VOUCHER.disponivel
  const ativo = voucher.estado === 'disponivel'
  return (
    <button type="button" className={`voucher-linha${ativo ? ' voucher-linha--ativo' : ''}`} onClick={onClick}>
      <span className="voucher-linha__foto">
        <img src={foto(voucher.imagem)} alt="" loading="lazy" />
      </span>
      <span className="voucher-linha__textos">
        <strong className="t-forte">{voucher.nome}</strong>
        <span className="t-peq c-ouro voucher-linha__codigo">{voucher.codigo}</span>
        <span className="t-peq c-sutil">{voucher.validade}</span>
      </span>
      <span className="pilula">
        <i className="pilula__ponto" style={{ background: cor }} />
        {rotulo}
      </span>
    </button>
  )
}
