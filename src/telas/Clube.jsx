import { useState } from 'react'
import { useRota } from '../rotas/useRota.js'
import { useClube } from '../estado/clubeContexto.js'
import { AppBar, NavInferior, Tela } from '../componentes/Tela.jsx'
import { CardParceiro } from '../componentes/cartoes.jsx'
import { Botao, Brilho, CabecalhoSecao, Chip, Vazio } from '../componentes/primitivos.jsx'
import { Folha } from '../componentes/Folha.jsx'
import { Icone } from '../componentes/Icone.jsx'
import { QRCode } from '../componentes/QRCode.jsx'
import { Gota } from '../componentes/Gota.jsx'
import { CATEGORIAS_CLUBE, NIVEIS, PARCEIROS } from '../dados/clube.js'

const ordemNivel = (id) => NIVEIS.findIndex((n) => n.id === id)

export function Clube() {
  const { ir } = useRota()
  const { nivel } = useClube()
  const liberados = PARCEIROS.filter((p) => ordemNivel(p.nivelMinimo) <= ordemNivel(nivel.atual.id))

  return (
    <Tela nav={<NavInferior ativo="clube" />}>
      <Brilho tamanho={290} topo={30} esquerda={55} forca={0.16} />

      <header className="px safe-topo pilha g4">
        <h1 className="t-h1">Clube</h1>
        <p className="t-corpo c-secundario">Ser cliente Sua Coxinha abre portas.</p>
      </header>

      <div className="px mt16">
        <div className="clube__destaque">
          <Gota
            tamanho={130}
            cor="var(--marrom-churros)"
            opacidade={0.08}
            style={{ position: 'absolute', top: -18, right: -24 }}
          />
          <div className="cresce pilha g4">
            <span className="t-overline" style={{ opacity: 0.72 }}>
              Seu nível {nivel.atual.nome.charAt(0) + nivel.atual.nome.slice(1).toLowerCase()}
            </span>
            <strong className="t-h3">{liberados.length} benefícios liberados</strong>
            <span className="t-peq" style={{ opacity: 0.8 }}>
              Sem precisar gastar pontos.
            </span>
          </div>
          <Icone nome="seta-dir" tamanho={21} cor="var(--marrom-churros)" />
        </div>
      </div>

      <div className="px mt24 grade-2">
        {CATEGORIAS_CLUBE.map((c) => {
          const qtd = PARCEIROS.filter((p) => p.categoria === c.id).length
          return (
            <button key={c.id} type="button" className="clube__categoria" onClick={() => ir(`/clube/${c.id}`)}>
              <Icone nome={c.icone} tamanho={23} cor="var(--ouro-500)" />
              <span className="pilha g4">
                <strong className="t-forte">{c.nome}</strong>
                <span className="t-peq c-sutil">{qtd} parceiros</span>
              </span>
            </button>
          )
        })}
      </div>

      <section className="px mt32 pilha g12">
        <CabecalhoSecao titulo="Perto de você" />
        {liberados.slice(0, 4).map((p) => (
          <CardParceiro key={p.id} parceiro={p} onClick={() => ir(`/parceiro/${p.id}`)} />
        ))}
      </section>
    </Tela>
  )
}

export function ClubeCategoria({ id }) {
  const { ir } = useRota()
  const { nivel } = useClube()
  const [unidade, setUnidade] = useState('todos')
  const categoria = CATEGORIAS_CLUBE.find((c) => c.id === id)
  const lista = PARCEIROS.filter((p) => p.categoria === id)

  return (
    <Tela nav={<NavInferior ativo="clube" />}>
      <AppBar titulo={categoria?.nome || 'Clube'} acao={{ icone: 'busca', rotulo: 'Buscar' }} />

      <div className="rolagem-h px mt8">
        {['todos', 'Cajamar', 'Jundiaí'].map((u) => (
          <Chip key={u} ativo={unidade === u} onClick={() => setUnidade(u)}>
            {u === 'todos' ? 'Todos' : u}
          </Chip>
        ))}
      </div>

      <div className="px mt16 pilha g12">
        {lista.length === 0 ? (
          <Vazio icone="ticket" titulo="Ainda sem parceiros" texto="Estamos fechando novas parcerias nesta categoria." />
        ) : (
          lista.map((p) => {
            const liberado = ordemNivel(p.nivelMinimo) <= ordemNivel(nivel.atual.id)
            return (
              <div key={p.id} style={{ opacity: liberado ? 1 : 0.55 }}>
                <CardParceiro parceiro={p} onClick={() => ir(`/parceiro/${p.id}`)} />
              </div>
            )
          })
        )}
      </div>
    </Tela>
  )
}

export function ParceiroDetalhe({ id }) {
  const { nivel } = useClube()
  const [cupom, setCupom] = useState(false)
  const parceiro = PARCEIROS.find((p) => p.id === id)

  if (!parceiro)
    return (
      <Tela>
        <AppBar titulo="Parceiro" />
        <Vazio icone="ticket" titulo="Parceiro não encontrado" />
      </Tela>
    )

  const liberado = ordemNivel(parceiro.nivelMinimo) <= ordemNivel(nivel.atual.id)
  const exigido = NIVEIS.find((n) => n.id === parceiro.nivelMinimo)

  return (
    <Tela className="detalhe">
      <AppBar transparente fechar acao={{ icone: 'compartilhar', rotulo: 'Compartilhar' }} titulo="" />

      <div className="parceiro__capa">
        <img src={`${import.meta.env.BASE_URL}produtos/loja.jpg`} alt="" />
        <i />
      </div>

      <div className="px">
        <span className="parceiro__logo">
          <Icone nome={parceiro.icone} tamanho={34} cor="var(--ouro-500)" />
        </span>
      </div>

      <div className="px pilha g4 mt16">
        <h1 className="t-h1">{parceiro.nome}</h1>
        <span className="t-corpo c-secundario">
          {parceiro.tipo} · {parceiro.distancia}
        </span>
      </div>

      <div className="px mt24">
        <div className={`caixa ${liberado ? 'caixa--ouro' : ''} pilha g8`}>
          <span className="linha-h g8">
            <Icone nome={liberado ? 'ticket' : 'cadeado'} tamanho={19} cor={liberado ? 'var(--ouro-500)' : 'var(--texto-sutil)'} />
            <strong className={`t-h3 ${liberado ? 'c-ouro' : 'c-sutil'}`}>{parceiro.beneficio}</strong>
          </span>
          <span className="t-corpo c-secundario">{parceiro.detalhe}</span>
          {!liberado && (
            <span className="t-peq c-sutil">
              Disponível a partir do nível {exigido?.nome.charAt(0)}
              {exigido?.nome.slice(1).toLowerCase()}.
            </span>
          )}
        </div>
      </div>

      <section className="px mt24 pilha g12">
        <CabecalhoSecao titulo="Como usar" />
        {parceiro.comoUsar.map((t, i) => (
          <div key={t} className="passo">
            <span className="passo__numero passo__numero--p">{i + 1}</span>
            <span className="t-corpo c-secundario cresce">{t}</span>
          </div>
        ))}
      </section>

      <div className="px mt24" style={{ paddingBottom: 130 }}>
        <div className="info-linhas caixa" style={{ padding: '0 16px' }}>
          <div>
            <span className="t-corpo c-secundario">Endereço</span>
            <b>{parceiro.endereco}</b>
          </div>
          <div>
            <span className="t-corpo c-secundario">Funcionamento</span>
            <b>{parceiro.horario}</b>
          </div>
        </div>
      </div>

      <div className="barra-acao">
        <Botao onClick={() => setCupom(true)} desabilitado={!liberado}>
          {liberado ? 'Gerar meu cupom' : `Exclusivo do nível ${exigido?.nome.charAt(0)}${exigido?.nome.slice(1).toLowerCase()}`}
        </Botao>
      </div>

      <Folha aberta={cupom} aoFechar={() => setCupom(false)} titulo="Seu cupom">
        <div className="voucher-qr">
          <QRCode valor={`PD-CLUBE-${parceiro.id.toUpperCase()}`} tamanho={178} />
        </div>
        <div className="centro pilha g8">
          <strong className="t-h3">{parceiro.beneficio}</strong>
          <span className="t-peq c-sutil">
            {parceiro.nome} · apresente este código no balcão
          </span>
        </div>
        <Botao estilo="fantasma" onClick={() => setCupom(false)}>
          Fechar
        </Botao>
      </Folha>
    </Tela>
  )
}
