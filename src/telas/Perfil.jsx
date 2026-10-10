import { useState } from 'react'
import { useRota } from '../rotas/useRota.js'
import { useClube } from '../estado/clubeContexto.js'
import { AppBar, NavInferior, Tela } from '../componentes/Tela.jsx'
import { BarraProgresso, Botao, Brilho, Divisor } from '../componentes/primitivos.jsx'
import { SeloNivel } from '../componentes/SeloNivel.jsx'
import { Icone } from '../componentes/Icone.jsx'
import { Coxinildo } from '../componentes/Coxinildo.jsx'

function ItemMenu({ icone, rotulo, valor, onClick }) {
  return (
    <button type="button" className="item-menu" onClick={onClick}>
      <Icone nome={icone} tamanho={20} cor="var(--texto-secundario)" />
      <span className="item-menu__rotulo">{rotulo}</span>
      {valor && <span className="t-corpo c-sutil">{valor}</span>}
      <Icone nome="seta-dir" tamanho={17} cor="var(--neutro-500)" />
    </button>
  )
}

export function Perfil() {
  const { ir } = useRota()
  const { usuario, nivel, vouchers, sair, excluirConta, erro, ocupado, papel, unidades } = useClube()
  const [excluindo, setExcluindo] = useState(false)
  const unidade = unidades.find((u) => u.id === usuario.unidade) || unidades[0]
  const ativos = vouchers.filter((v) => v.estado === 'disponivel').length

  return (
    <Tela nav={<NavInferior ativo="clube" />}>
      <Brilho tamanho={250} topo={20} esquerda={70} forca={0.15} />

      <header className="px safe-topo linha-h entre">
        <h1 className="t-h2">Perfil</h1>
        <button type="button" className="appbar__botao" onClick={() => ir('/config')} aria-label="Configurações">
          <Icone nome="engrenagem" tamanho={19} />
        </button>
      </header>

      <div className="perfil__topo mt16">
        <button type="button" className="perfil__avatar-botao" onClick={() => ir('/avatar')} aria-label="Personalizar seu Coxinildo">
          <Coxinildo avatar={usuario.avatar} className="perfil__avatar" />
          <span className="perfil__avatar-editar">
            <Icone nome="brilho" tamanho={15} />
          </span>
        </button>
        <strong className="t-h2">{usuario.nome}</strong>
        <span className="t-corpo c-sutil">
          {usuario.telefone} · {unidade.nome}
        </span>
      </div>

      <div className="px mt24">
        <button type="button" className="caixa perfil__nivel" onClick={() => ir('/niveis')}>
          <SeloNivel nivel={nivel.atual} tamanho={52} mostrarNome={false} />
          <span className="cresce pilha g8">
            <span className="linha-h entre">
              <strong className="t-h4">
                Nível {nivel.atual.nome.charAt(0) + nivel.atual.nome.slice(1).toLowerCase()}
              </strong>
              {nivel.proximo && <span className="t-peq c-ouro">Faltam {nivel.faltam}</span>}
            </span>
            <BarraProgresso valor={nivel.progresso} altura={8} />
            <span className="t-peq c-sutil">
              {nivel.proximo
                ? `Próximo nível: ${nivel.proximo.nome.charAt(0)}${nivel.proximo.nome.slice(1).toLowerCase()}`
                : 'Você está no nível mais alto'}
            </span>
          </span>
        </button>
      </div>

      <div className="px mt16 perfil__stats">
        {[
          [usuario.acumulado.toLocaleString('pt-BR'), 'Pontos no total'],
          [usuario.resgates, 'Resgates'],
          [usuario.membroDesde, 'Membro desde'],
        ].map(([valor, rotulo]) => (
          <div key={rotulo} className="perfil__stat">
            <b className="t-num-m">{valor}</b>
            <span className="t-peq c-sutil">{rotulo}</span>
          </div>
        ))}
      </div>

      <section className="px mt24">
        {papel && (
          <>
            <ItemMenu icone="cadeado" rotulo="Voltar para a área da equipe" onClick={() => ir('/equipe')} />
            <Divisor recuo={32} />
          </>
        )}
        <ItemMenu icone="ticket" rotulo="Meus vouchers" valor={ativos ? String(ativos) : '—'} onClick={() => ir('/vouchers')} />
        <Divisor recuo={32} />
        <ItemMenu icone="carteira" rotulo="Extrato de pontos" onClick={() => ir('/historico')} />
        <Divisor recuo={32} />
        <ItemMenu icone="pin" rotulo="Unidade preferida" valor={unidade.nome} onClick={() => ir('/config')} />
        <Divisor recuo={32} />
        <ItemMenu icone="sino" rotulo="Notificações" onClick={() => ir('/notificacoes')} />
        <Divisor recuo={32} />
        <ItemMenu icone="pessoas" rotulo="Indicar amigos" valor="+200 pts" onClick={() => ir('/missao/indicacao')} />
        <Divisor recuo={32} />
        <ItemMenu icone="info" rotulo="Como os pontos funcionam" onClick={() => ir('/niveis')} />
      </section>

      <div className="px mt24" style={{ paddingBottom: 8 }}>
        <Botao estilo="fantasma" icone="sair" onClick={async () => { await sair(); ir('/entrar', { substituir: true }) }}>
          Sair da conta
        </Botao>
      </div>

      <div className="px" style={{ paddingBottom: 24 }}>
        {excluindo ? (
          <div className="caixa pilha g12">
            <strong className="t-h4">Excluir sua conta?</strong>
            <span className="t-peq c-secundario">
              Seus pontos, vouchers, extrato e dados de cadastro serão apagados de vez. Não dá para desfazer.
            </span>
            {erro && (
              <p className="aviso-teste" role="alert">
                <span className="t-peq">{erro}</span>
              </p>
            )}
            <Botao
              desabilitado={ocupado}
              onClick={async () => {
                if (await excluirConta()) ir('/entrar', { substituir: true })
              }}
            >
              {ocupado ? 'Excluindo…' : 'Excluir de vez'}
            </Botao>
            <Botao estilo="fantasma" onClick={() => setExcluindo(false)}>
              Cancelar
            </Botao>
          </div>
        ) : (
          <button type="button" className="t-peq c-sutil centro" style={{ width: '100%' }} onClick={() => setExcluindo(true)}>
            Excluir minha conta
          </button>
        )}
      </div>
    </Tela>
  )
}

function Interruptor({ ligado, onClick, rotulo }) {
  return (
    <button
      type="button"
      className={`interruptor${ligado ? ' interruptor--ligado' : ''}`}
      onClick={onClick}
      role="switch"
      aria-checked={ligado}
      aria-label={rotulo}
    >
      <i />
    </button>
  )
}

export function Configuracoes() {
  const { usuario, atualizarPerfil, unidades } = useClube()
  const { ir } = useRota()
  const [avisos, setAvisos] = useState({ app: true, whatsapp: true, email: false, ofertas: true })

  const alternar = (chave) => setAvisos((a) => ({ ...a, [chave]: !a[chave] }))

  return (
    <Tela>
      <AppBar titulo="Configurações" />

      <div className="px mt8 pilha g16">
        <div className="campo">
          <span className="t-overline c-secundario">Unidade preferida</span>
          <label className="campo__caixa">
            <Icone nome="pin" tamanho={19} cor="var(--ouro-500)" />
            <select value={usuario.unidade} onChange={(e) => atualizarPerfil({ unidade: e.target.value })}>
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome} · {u.bairro}
                </option>
              ))}
            </select>
            <Icone nome="seta-baixo" tamanho={18} cor="var(--texto-secundario)" />
          </label>
        </div>
      </div>

      <section className="px mt32">
        <span className="t-overline c-sutil">Como falamos com você</span>
        <div className="mt8">
          {[
            ['app', 'Notificações do app', 'Pontos, missões e recompensas'],
            ['whatsapp', 'WhatsApp', 'Avisos de expiração e ofertas'],
            ['email', 'E-mail', 'Resumo mensal da carteira'],
            ['ofertas', 'Ofertas personalizadas', 'Baseadas no seu histórico'],
          ].map(([chave, titulo, sub], i, lista) => (
            <div key={chave}>
              <div className="linha-h g12" style={{ padding: '14px 0' }}>
                <span className="cresce pilha g4">
                  <strong className="t-corpo-g">{titulo}</strong>
                  <span className="t-peq c-sutil">{sub}</span>
                </span>
                <Interruptor ligado={avisos[chave]} onClick={() => alternar(chave)} rotulo={titulo} />
              </div>
              {i < lista.length - 1 && <Divisor />}
            </div>
          ))}
        </div>
      </section>

      <section className="px mt32">
        <span className="t-overline c-sutil">Privacidade e conta</span>
        <div className="mt8">
          <ItemMenu icone="escudo" rotulo="Termos de uso" />
          <Divisor recuo={32} />
          <ItemMenu icone="cadeado" rotulo="Política de privacidade" />
          <Divisor recuo={32} />
          <ItemMenu icone="livro" rotulo="Como os pontos funcionam" onClick={() => ir('/niveis')} />
          <Divisor recuo={32} />
          <ItemMenu icone="info" rotulo="Ajuda e contato" />
        </div>
      </section>

      <div className="px mt32 pilha g12" style={{ paddingBottom: 24 }}>
        <div className="caixa caixa--nota">
          <Icone nome="info" tamanho={17} cor="var(--texto-sutil)" />
          <span className="t-peq c-sutil cresce">
            Seus dados ficam na sua conta do clube, não no aparelho — você entra em qualquer celular e encontra o
            mesmo saldo.
          </span>
        </div>
        <span className="t-peq c-sutil centro">Pontos Dourados · versão 0.1.0</span>
      </div>
    </Tela>
  )
}
