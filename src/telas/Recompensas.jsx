import { useState } from 'react'
import { useRota } from '../rotas/useRota.js'
import { useClube } from '../estado/clubeContexto.js'
import { AppBar, NavInferior, Tela } from '../componentes/Tela.jsx'
import { CardRecompensa, LinhaVoucher } from '../componentes/cartoes.jsx'
import { Botao, Brilho, Chip, Vazio } from '../componentes/primitivos.jsx'
import { Folha } from '../componentes/Folha.jsx'
import { Icone } from '../componentes/Icone.jsx'
import { QRCode } from '../componentes/QRCode.jsx'
import { CATEGORIAS_RECOMPENSA } from '../dados/clube.js'
import { qrDoVoucher } from '../firebase/equipe.js'

const foto = (a) => `${import.meta.env.BASE_URL}produtos/${a}`

export function Recompensas() {
  const { ir } = useRota()
  const { usuario, recompensas, vouchers } = useClube()
  const [categoria, setCategoria] = useState('tudo')

  const lista = recompensas
    .filter((r) => categoria === 'tudo' || r.categoria === categoria)
    .sort((a, b) => a.pontos - b.pontos)

  const ativos = vouchers.filter((v) => v.estado === 'disponivel').length

  return (
    <Tela nav={<NavInferior ativo="recompensas" />}>
      <Brilho tamanho={280} topo={20} esquerda={60} forca={0.16} />

      <header className="px safe-topo linha-h entre g12">
        <div className="pilha">
          <h1 className="t-h1">Recompensas</h1>
          <span className="t-peq c-secundario">Seu ouro vira coxinha.</span>
        </div>
        <span className="saldo-pill">
          <Icone nome="brilho" tamanho={15} cor="var(--ouro-500)" />
          <b className="t-forte c-ouro">{usuario.saldo.toLocaleString('pt-BR')}</b>
        </span>
      </header>

      {ativos > 0 && (
        <button type="button" className="aviso-voucher mt16" onClick={() => ir('/vouchers')}>
          <Icone nome="ticket" tamanho={19} cor="var(--ouro-500)" />
          <span className="cresce t-forte" style={{ textAlign: 'left' }}>
            Você tem {ativos} {ativos === 1 ? 'voucher ativo' : 'vouchers ativos'}
          </span>
          <Icone nome="seta-dir" tamanho={18} cor="var(--neutro-500)" />
        </button>
      )}

      <div className="rolagem-h px mt16">
        {CATEGORIAS_RECOMPENSA.map((c) => (
          <Chip key={c.id} ativo={categoria === c.id} onClick={() => setCategoria(c.id)}>
            {c.nome}
          </Chip>
        ))}
      </div>

      <div className="px mt16 grade-2">
        {lista.map((r) => (
          <CardRecompensa key={r.id} recompensa={r} saldo={usuario.saldo} onClick={() => ir(`/recompensa/${r.id}`)} />
        ))}
      </div>
    </Tela>
  )
}

export function RecompensaDetalhe({ id }) {
  const { ir } = useRota()
  const { usuario, recompensas, resgatar, erro, limparErro } = useClube()
  const [confirmando, setConfirmando] = useState(false)
  const [resgatando, setResgatando] = useState(false)
  const recompensa = recompensas.find((r) => r.id === id)

  if (!recompensa)
    return (
      <Tela>
        <AppBar titulo="Recompensa" />
        <Vazio icone="presente" titulo="Recompensa não encontrada" texto="Ela pode ter saído do catálogo." />
      </Tela>
    )

  const podeResgatar = usuario.saldo >= recompensa.pontos
  const faltam = recompensa.pontos - usuario.saldo

  // Se o resgate falhar, a folha fica aberta mostrando o motivo. Antes ela
  // fechava em silêncio e o toque parecia não ter feito nada.
  const confirmar = async () => {
    if (resgatando) return
    setResgatando(true)
    const voucher = await resgatar(recompensa)
    setResgatando(false)
    if (!voucher) return
    setConfirmando(false)
    ir(`/celebracao/resgate?voucher=${voucher.id}`, { substituir: true })
  }

  const abrirConfirmacao = () => {
    limparErro()
    setConfirmando(true)
  }

  return (
    <Tela className="detalhe">
      <AppBar transparente fechar acao={{ icone: 'coracao', rotulo: 'Favoritar' }} titulo="" />

      <div className="detalhe__capa">
        <Brilho tamanho={240} topo={40} esquerda={75} forca={0.3} />
        <img src={foto(recompensa.imagem)} alt={recompensa.nome} />
      </div>

      <div className="px pilha g8 mt16">
        <span className="t-overline c-ouro">{recompensa.descricao}</span>
        <h1 className="t-h1">{recompensa.nome}</h1>
        <p className="t-corpo-g c-secundario">{recompensa.detalhe}</p>
      </div>

      <div className="px mt24">
        <div className="caixa preco-caixa">
          <span className="linha-h g8">
            <Icone nome="brilho" tamanho={22} cor="var(--ouro-500)" />
            <span className="pilha">
              <b className="t-num-g c-ouro">{recompensa.pontos.toLocaleString('pt-BR')}</b>
              <span className="t-peq c-sutil">Pontos Dourados</span>
            </span>
          </span>
          <span className="pilha" style={{ alignItems: 'flex-end' }}>
            <span className="t-peq c-sutil">Seu saldo</span>
            <b className="t-forte">{usuario.saldo.toLocaleString('pt-BR')} pts</b>
          </span>
        </div>
      </div>

      <section className="px mt24 pilha g12">
        <h2 className="t-h3">O que está incluso</h2>
        {recompensa.inclui.map((t) => (
          <span key={t} className="linha-h g12">
            <Icone nome="check-circulo" tamanho={18} cor="var(--sinal-sucesso)" />
            <span className="t-corpo c-secundario cresce">{t}</span>
          </span>
        ))}
      </section>

      <div className="px mt24" style={{ paddingBottom: 150 }}>
        <div className="caixa caixa--nota">
          <Icone nome="relogio" tamanho={18} cor="var(--ouro-500)" />
          <span className="t-peq c-secundario cresce">
            O voucher vale 7 dias depois do resgate e é usado na unidade que você escolher.
          </span>
        </div>
      </div>

      <div className="barra-acao">
        <span className="t-peq c-sutil">
          {podeResgatar ? 'Válido por 7 dias · Cajamar' : `Faltam ${faltam.toLocaleString('pt-BR')} pontos`}
        </span>
        <Botao onClick={abrirConfirmacao} desabilitado={!podeResgatar}>
          {podeResgatar ? `Resgatar por ${recompensa.pontos} pontos` : 'Saldo insuficiente'}
        </Botao>
      </div>

      <Folha aberta={confirmando} aoFechar={() => setConfirmando(false)} titulo="Confirmar resgate">
        <div className="folha__produto">
          <span className="folha__foto">
            <img src={foto(recompensa.imagem)} alt="" />
          </span>
          <span className="cresce pilha g4">
            <strong className="t-forte">{recompensa.nome}</strong>
            <span className="t-peq c-sutil">{recompensa.descricao}</span>
          </span>
          <b className="t-num-m c-ouro">−{recompensa.pontos}</b>
        </div>

        <div className="info-linhas caixa" style={{ padding: '0 16px' }}>
          <div>
            <span className="t-corpo c-secundario">Saldo atual</span>
            <b>{usuario.saldo.toLocaleString('pt-BR')} pts</b>
          </div>
          <div>
            <span className="t-corpo c-secundario">Custo do resgate</span>
            <b className="c-ouro">−{recompensa.pontos.toLocaleString('pt-BR')} pts</b>
          </div>
          <div>
            <span className="t-corpo c-secundario">Saldo depois</span>
            <b>{(usuario.saldo - recompensa.pontos).toLocaleString('pt-BR')} pts</b>
          </div>
        </div>

        <div className="caixa caixa--nota" style={{ background: 'rgba(249,193,21,0.1)', borderColor: 'var(--borda-ouro)' }}>
          <Icone nome="info" tamanho={17} cor="var(--ouro-500)" />
          <span className="t-peq c-secundario cresce">
            O resgate desconta os pontos na hora e gera um código único. Não dá para desfazer.
          </span>
        </div>

        {erro && (
          <p className="aviso-teste" role="alert">
            <Icone nome="info" tamanho={15} cor="var(--sinal-alerta)" />
            <span className="t-peq">{erro}</span>
          </p>
        )}

        <Botao onClick={confirmar} desabilitado={resgatando}>
          {resgatando ? 'Resgatando…' : erro ? 'Tentar de novo' : 'Confirmar resgate'}
        </Botao>
        <Botao estilo="fantasma" onClick={() => setConfirmando(false)}>
          Agora não
        </Botao>
      </Folha>
    </Tela>
  )
}

const FILTROS_VOUCHER = [
  { id: 'disponivel', nome: 'Ativos' },
  { id: 'utilizado', nome: 'Usados' },
  { id: 'todos', nome: 'Todos' },
]

export function Vouchers() {
  const { uid, vouchers } = useClube()
  const [filtro, setFiltro] = useState('disponivel')
  const [aberto, setAberto] = useState(null)

  const lista = vouchers.filter((v) => filtro === 'todos' || v.estado === filtro)

  return (
    <Tela nav={<NavInferior ativo="recompensas" />}>
      <AppBar titulo="Meus vouchers" />

      <div className="rolagem-h px mt8">
        {FILTROS_VOUCHER.map((f) => (
          <Chip key={f.id} ativo={filtro === f.id} onClick={() => setFiltro(f.id)}>
            {f.nome}
          </Chip>
        ))}
      </div>

      {lista.length === 0 ? (
        <Vazio
          icone="ticket"
          titulo="Nenhum voucher aqui"
          texto="Quando você resgatar uma recompensa, o código aparece nesta lista."
        />
      ) : (
        <div className="px mt16 pilha g12">
          {lista.map((v) => (
            <LinhaVoucher key={v.id} voucher={v} onClick={() => setAberto(v)} />
          ))}
        </div>
      )}

      <Folha aberta={!!aberto} aoFechar={() => setAberto(null)} titulo={aberto?.nome}>
        {aberto && (
          <>
            <div className="voucher-qr">
              <QRCode valor={qrDoVoucher(uid, aberto.id)} tamanho={188} />
            </div>
            <div className="centro pilha g8">
              <strong className="t-h3 ouro-display">{aberto.codigo}</strong>
              <span className="t-peq c-sutil">{aberto.validade}</span>
            </div>
            {aberto.estado === 'disponivel' ? (
              <div className="caixa caixa--nota">
                <Icone nome="info" tamanho={17} cor="var(--ouro-500)" />
                <span className="t-peq c-secundario cresce">
                  Mostre este código no caixa. A baixa é feita pela equipe da loja na hora da entrega.
                </span>
              </div>
            ) : (
              <Botao estilo="superficie" desabilitado>
                {aberto.estado === 'utilizado' ? 'Voucher já utilizado' : 'Voucher indisponível'}
              </Botao>
            )}
          </>
        )}
      </Folha>
    </Tela>
  )
}
