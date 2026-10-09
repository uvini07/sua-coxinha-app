import { useEffect, useMemo, useState } from 'react'
import { useRota } from '../rotas/useRota.js'
import { useClube } from '../estado/clubeContexto.js'
import { AppBar, Tela } from '../componentes/Tela.jsx'
import { BarraProgresso, Botao, Brilho, Chip, Divisor, Selo, Vazio } from '../componentes/primitivos.jsx'
import { Icone } from '../componentes/Icone.jsx'
import { LeitorQR } from '../componentes/LeitorQR.jsx'
import { RECOMPENSAS, nivelDe } from '../dados/clube.js'
import { mensagemDeErro, paraE164 } from '../firebase/autenticacao.js'
import {
  MODELOS_MISSAO,
  REGRAS_PADRAO,
  TIPOS_MISSAO,
  apagarMissao,
  atualizarMembro,
  buscarCliente,
  buscarClientePorTelefone,
  buscarVoucher,
  cadastrarMembro,
  diaDeHoje,
  dispararMissao,
  encerrarMissao,
  lerQR,
  metaDaLoja,
  missaoVencida,
  normalizarEmail,
  observarEquipe,
  observarLancamentos,
  observarLojas,
  observarMissoesEquipe,
  pontosDaCompra,
  progressoNaMissao,
  registrarCompraNoCaixa,
  removerMembro,
  salvarCatalogo,
  salvarLoja,
  salvarMetaDaLoja,
  salvarRegras,
  validarVoucherNoCaixa,
  vouchersDisponiveis,
} from '../firebase/equipe.js'

// ÁREA DA EQUIPE
//
// Quem chega aqui foi cadastrado pelo admin ou por um franqueado — ninguém se
// inscreve como equipe. O que cada papel vê:
//
//   funcionário  caixa (compra e voucher), a própria meta, ranking da loja
//   franqueado   + pessoas da loja, movimento da loja inteira, metas e
//                  missões da equipe da loja
//   admin        + seletor de loja, regras do clube, catálogo, lojas
//
// Esconder um botão aqui é só conforto: quem garante cada permissão são as
// regras do Firestore. Uma tela aberta "na mão" por quem não pode só mostra
// erro de permissão.

const NOMES_PAPEL = { admin: 'Admin master', franqueado: 'Franqueado', funcionario: 'Funcionário' }

const reais = (centavos) =>
  ((centavos || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// "59,80" → 5980. Aceita "59", "59,8", "1.234,56".
const paraCentavos = (texto) => {
  const limpo = String(texto).replace(/[^\d,]/g, '')
  if (!limpo) return 0
  const [inteiro, frac = ''] = limpo.split(',')
  return Number(inteiro || 0) * 100 + Number((frac + '00').slice(0, 2))
}

// Máscara do campo de valor: só dígitos e uma vírgula com até 2 casas.
const mascararValor = (texto) => {
  const [inteiro, ...resto] = String(texto).replace(/[^\d,]/g, '').split(',')
  return resto.length ? `${inteiro},${resto.join('').slice(0, 2)}` : inteiro
}

const mascararTelefone = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

const nomeDaLoja = (unidades, id) => unidades.find((u) => u.id === id)?.nome || id || '—'

function Aviso({ texto, tom = 'alerta' }) {
  if (!texto) return null
  const cor = tom === 'sucesso' ? 'var(--sinal-sucesso)' : 'var(--sinal-alerta)'
  return (
    <p className={`aviso-teste${tom === 'sucesso' ? ' aviso-teste--sucesso' : ''}`} role="alert">
      <Icone nome={tom === 'sucesso' ? 'check-circulo' : 'info'} tamanho={15} cor={cor} />
      <span className="t-peq">{texto}</span>
    </p>
  )
}

function Campo({ rotulo, children, dica }) {
  return (
    <div className="campo">
      <span className="t-overline c-secundario">{rotulo}</span>
      <label className="campo__caixa">{children}</label>
      {dica && <span className="t-peq c-sutil">{dica}</span>}
    </div>
  )
}

// Quem está operando, no formato que as funções do caixa esperam.
function useOperador() {
  const { uid, email, membro, papel } = useClube()
  return useMemo(() => ({ uid, email, membro: papel === 'admin' ? null : membro }), [uid, email, membro, papel])
}

// Barra de troca de loja do admin. Para a equipe a loja é fixa e só aparece.
function SeletorLoja() {
  const { papel, unidades, lojaOperacao, escolherLoja } = useClube()
  if (papel !== 'admin') {
    return (
      <span className="t-peq c-sutil">
        Loja <b className="c-primario">{nomeDaLoja(unidades, lojaOperacao)}</b>
      </span>
    )
  }
  return (
    <div className="rolagem-h">
      {unidades.map((u) => (
        <Chip key={u.id} ativo={lojaOperacao === u.id} onClick={() => escolherLoja(u.id)} icone="pin">
          {u.nome}
        </Chip>
      ))}
    </div>
  )
}

// --- Início da área da equipe -----------------------------------------------

export function PainelEquipe() {
  const { ir } = useRota()
  const { papel, membro, email, usuario, lojaOperacao, configuracao, sair } = useClube()
  const [equipe, setEquipe] = useState([])
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!lojaOperacao) return undefined
    return observarEquipe(lojaOperacao, setEquipe, (e) => setErro(mensagemDeErro(e)))
  }, [lojaOperacao])

  // Ranking: quem mais vendeu na loja. Empate decide pelos vouchers.
  const ranking = useMemo(
    () =>
      [...equipe]
        .filter((m) => m.ativo)
        .sort((a, b) => (b.vendas || 0) - (a.vendas || 0) || (b.vouchers || 0) - (a.vouchers || 0)),
    [equipe],
  )

  const gestor = papel === 'admin' || papel === 'franqueado'

  return (
    <Tela>
      <Brilho tamanho={300} topo={0} esquerda={90} forca={0.14} />

      <header className="px safe-topo pilha g8">
        <div className="linha-h entre">
          <span className="t-overline c-ouro">Área da equipe</span>
          <Selo tom="neutro" icone="cadeado">
            {NOMES_PAPEL[papel]}
          </Selo>
        </div>
        <h1 className="t-h2">{membro?.nome || usuario.nome || email}</h1>
        <SeletorLoja />
      </header>

      {papel === 'admin' && <PrimeirosPassos />}
      {papel !== 'admin' && !configuracao.regras && (
        <div className="px mt16">
          <Aviso texto="O admin ainda não salvou as regras do clube. Até lá o caixa não consegue registrar compras." />
        </div>
      )}

      <div className="px mt24 equipe__acoes">
        <button type="button" className="equipe__acao" onClick={() => ir('/equipe/compra')}>
          <Icone nome="qr" tamanho={30} cor="var(--marrom-churros)" />
          <strong className="t-h4">Registrar compra</strong>
          <span className="t-peq">Lê o QR do cliente e deposita os pontos</span>
        </button>
        <button type="button" className="equipe__acao equipe__acao--escura" onClick={() => ir('/equipe/voucher')}>
          <Icone nome="ticket" tamanho={30} cor="var(--ouro-500)" />
          <strong className="t-h4">Validar voucher</strong>
          <span className="t-peq c-secundario">Dá baixa no resgate do cliente</span>
        </button>
      </div>

      {membro && papel !== 'admin' && (
        <section className="px mt32">
          <span className="t-overline c-sutil">Minha meta</span>
          <div className="equipe__stats mt8">
            <div>
              <b className="t-num-m c-ouro">{(membro.pontos || 0).toLocaleString('pt-BR')}</b>
              <span className="t-peq c-sutil">pontos para trocar</span>
            </div>
            <div>
              <b className="t-num-m">{reais(membro.vendas)}</b>
              <span className="t-peq c-sutil">em vendas</span>
            </div>
            <div>
              <b className="t-num-m">{membro.compras || 0}</b>
              <span className="t-peq c-sutil">compras</span>
            </div>
            <div>
              <b className="t-num-m">{membro.vouchers || 0}</b>
              <span className="t-peq c-sutil">vouchers</span>
            </div>
          </div>
        </section>
      )}

      {membro && papel !== 'admin' && <MinhasMissoes membro={membro} loja={lojaOperacao} />}

      <section className="px mt32">
        <span className="t-overline c-sutil">Ranking da loja</span>
        <Aviso texto={erro} />
        {ranking.length === 0 ? (
          <p className="t-peq c-sutil mt8">Ninguém cadastrado nesta loja ainda.</p>
        ) : (
          <div className="mt8">
            {ranking.map((m, i) => (
              <div key={m.id}>
                <div className={`ranking__linha${normalizarEmail(email) === m.id ? ' ranking__linha--eu' : ''}`}>
                  <span className="ranking__posicao ouro-display">{i + 1}</span>
                  <span className="cresce pilha g4">
                    <strong className="t-forte">{m.nome}</strong>
                    <span className="t-peq c-sutil">
                      {m.compras || 0} compras · {m.vouchers || 0} vouchers · {m.pontos || 0} pts
                    </span>
                  </span>
                  <b className="t-forte">{reais(m.vendas)}</b>
                </div>
                {i < ranking.length - 1 && <Divisor />}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="px mt32">
        <span className="t-overline c-sutil">Gestão</span>
        <div className="mt8">
          <ItemEquipe icone="relogio" rotulo="Movimento do dia" onClick={() => ir('/equipe/movimento')} />
          {gestor && (
            <>
              <Divisor recuo={32} />
              <ItemEquipe icone="pessoas" rotulo="Pessoas da equipe" onClick={() => ir('/equipe/pessoas')} />
              <Divisor recuo={32} />
              <ItemEquipe icone="alvo" rotulo="Metas e missões da equipe" onClick={() => ir('/equipe/metas')} />
            </>
          )}
          {papel === 'admin' && (
            <>
              <Divisor recuo={32} />
              <ItemEquipe icone="engrenagem" rotulo="Regras do clube e catálogo" onClick={() => ir('/equipe/regras')} />
              <Divisor recuo={32} />
              <ItemEquipe icone="pin" rotulo="Lojas" onClick={() => ir('/equipe/lojas')} />
            </>
          )}
          <Divisor recuo={32} />
          <ItemEquipe icone="usuario" rotulo="Ver o app como cliente" onClick={() => ir('/home')} />
        </div>
      </section>

      <div className="px mt24" style={{ paddingBottom: 24 }}>
        <Botao
          estilo="fantasma"
          icone="sair"
          onClick={async () => {
            await sair()
            ir('/entrar', { substituir: true })
          }}
        >
          Sair da conta
        </Botao>
      </div>
    </Tela>
  )
}

// Missões ativas da loja, com o progresso de quem está logado.
function MinhasMissoes({ membro, loja }) {
  const [missoes, setMissoes] = useState([])
  useEffect(() => {
    if (!loja) return undefined
    return observarMissoesEquipe(loja, setMissoes, () => setMissoes([]))
  }, [loja])

  const ativas = missoes.filter((m) => m.ativa && !missaoVencida(m))
  if (!ativas.length) return null
  return (
    <section className="px mt32">
      <span className="t-overline c-sutil">Missões da equipe</span>
      <div className="pilha g12 mt8">
        {ativas.map((m) => (
          <CartaoMissao key={m.id} missao={m} progresso={progressoNaMissao(m, membro)} />
        ))}
      </div>
    </section>
  )
}

const quantidadeDaMissao = (tipo, n) => (tipo === 'vendas' ? reais(n) : `${n} ${TIPOS_MISSAO[tipo].unidade}`)

const prazoLegivel = (dia) => (dia ? dia.split('-').reverse().join('/') : '')

function CartaoMissao({ missao, progresso, children }) {
  return (
    <div className="caixa pilha g8">
      <div className="linha-h entre g8">
        <strong className="t-h4">{missao.titulo}</strong>
        {progresso?.concluida && (
          <Selo tom="ouro" icone="check">
            Concluída
          </Selo>
        )}
      </div>
      <span className="t-peq c-sutil">
        Meta: {quantidadeDaMissao(missao.tipo, missao.alvo)}
        {missao.prazo ? ` · até ${prazoLegivel(missao.prazo)}` : ''}
        {missao.premio ? ` · Prêmio: ${missao.premio}` : ''}
      </span>
      {progresso && (
        <>
          <BarraProgresso valor={progresso.fracao} altura={9} />
          <span className="t-peq c-secundario">
            {quantidadeDaMissao(missao.tipo, progresso.feito)} de {quantidadeDaMissao(missao.tipo, missao.alvo)}
          </span>
        </>
      )}
      {children}
    </div>
  )
}

// O caixa só funciona depois que estes três documentos existem no Firestore
// (as regras de segurança consultam cada um). Some sozinho quando tudo estiver
// feito.
function PrimeirosPassos() {
  const { ir } = useRota()
  const { configuracao } = useClube()
  const passos = [
    [configuracao.lojas, 'Criar as lojas', '/equipe/lojas'],
    [configuracao.regras, 'Salvar as regras de pontuação', '/equipe/regras'],
    [configuracao.catalogo, 'Publicar o catálogo de recompensas', '/equipe/regras'],
  ]
  if (passos.every(([feito]) => feito)) return null
  return (
    <div className="px mt16">
      <div className="caixa caixa--ouro pilha g12">
        <strong className="t-h4">Primeiros passos</strong>
        <span className="t-peq c-secundario">Sem isto o caixa e os resgates ficam bloqueados.</span>
        {passos.map(([feito, rotulo, rota]) => (
          <button key={rotulo} type="button" className="linha-h g12" onClick={() => ir(rota)} disabled={feito}>
            <Icone nome={feito ? 'check-circulo' : 'seta-dir'} tamanho={18} cor={feito ? 'var(--sinal-sucesso)' : 'var(--ouro-500)'} />
            <span className={`t-corpo${feito ? ' c-sutil' : ''}`} style={feito ? { textDecoration: 'line-through' } : undefined}>
              {rotulo}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function ItemEquipe({ icone, rotulo, onClick }) {
  return (
    <button type="button" className="item-menu" onClick={onClick}>
      <Icone nome={icone} tamanho={20} cor="var(--ouro-500)" />
      <span className="item-menu__rotulo">{rotulo}</span>
      <Icone nome="seta-dir" tamanho={17} cor="var(--neutro-500)" />
    </button>
  )
}

// --- Achar o cliente: QR ou telefone ----------------------------------------

function BuscarCliente({ aoAchar, aoLerVoucher, titulo }) {
  const [telefone, setTelefone] = useState('')
  const [erro, setErro] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [pausado, setPausado] = useState(false)

  const achar = async (busca) => {
    setErro('')
    setBuscando(true)
    setPausado(true)
    try {
      const cliente = await busca()
      if (!cliente) {
        setErro('Cliente não encontrado. Confira o código ou o telefone.')
        setPausado(false)
        return
      }
      aoAchar(cliente)
    } catch (e) {
      setErro(mensagemDeErro(e))
      setPausado(false)
    } finally {
      setBuscando(false)
    }
  }

  const aoLer = (texto) => {
    const qr = lerQR(texto)
    if (qr?.tipo === 'cliente') return achar(() => buscarCliente(qr.uid))
    if (qr?.tipo === 'voucher' && aoLerVoucher) {
      // Se o voucher não for achado, a câmera volta a procurar.
      setPausado(true)
      return aoLerVoucher(qr).then((achou) => !achou && setPausado(false))
    }
    setErro(
      qr?.tipo === 'voucher'
        ? 'Esse é o QR de um voucher. Para registrar compra, leia o QR de identificação do cliente.'
        : 'Esse QR não é do Pontos Dourados.',
    )
  }

  const telefoneValido = telefone.replace(/\D/g, '').length >= 10

  return (
    <div className="px pilha g16">
      <p className="t-corpo c-secundario">{titulo}</p>
      <LeitorQR aoLer={aoLer} pausado={pausado} />
      <Aviso texto={erro} />

      <Campo rotulo="Ou busque pelo telefone">
        <Icone nome="usuario" tamanho={19} cor="var(--ouro-500)" />
        <input
          type="tel"
          inputMode="numeric"
          placeholder="(11) 90000-0000"
          value={telefone}
          onChange={(e) => setTelefone(mascararTelefone(e.target.value))}
        />
      </Campo>
      <Botao
        estilo="superficie"
        icone="busca"
        desabilitado={!telefoneValido || buscando}
        onClick={() => achar(() => buscarClientePorTelefone(paraE164(telefone)))}
      >
        {buscando ? 'Buscando…' : 'Buscar cliente'}
      </Botao>
    </div>
  )
}

function CartaoCliente({ cliente }) {
  const nivel = nivelDe(cliente.acumulado || 0).atual
  return (
    <div className="caixa linha-h g12">
      <img src={`${import.meta.env.BASE_URL}produtos/mascote.webp`} alt="" className="equipe__avatar" />
      <span className="cresce pilha g4">
        <strong className="t-h4">{cliente.nome || 'Cliente sem nome'}</strong>
        <span className="t-peq c-sutil">
          {cliente.telefone || 'sem telefone'} · {nivel.nome} · {(cliente.saldo || 0).toLocaleString('pt-BR')} pts
        </span>
      </span>
    </div>
  )
}

// --- Caixa: registrar compra --------------------------------------------------

export function CaixaCompra() {
  const { ir } = useRota()
  const { uid, regras, lojaOperacao, unidades } = useClube()
  const operador = useOperador()
  const [cliente, setCliente] = useState(null)
  const [valor, setValor] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [feito, setFeito] = useState(null)

  const centavos = paraCentavos(valor)
  const pontos = pontosDaCompra(centavos, regras.pontosPorReal)
  const acimaDoTeto = centavos > regras.valorMaximo
  const propriaConta = cliente?.uid === uid
  const pode = cliente && centavos > 0 && !acimaDoTeto && !propriaConta && !enviando && lojaOperacao

  const registrar = async () => {
    if (!pode) return
    setErro('')
    setEnviando(true)
    try {
      const r = await registrarCompraNoCaixa({
        cliente,
        valor: centavos,
        loja: lojaOperacao,
        lojaNome: nomeDaLoja(unidades, lojaOperacao),
        regras,
        meta: metaDaLoja(unidades, lojaOperacao, regras),
        operador,
      })
      setFeito({ ...r, valor: centavos, nome: cliente.nome })
    } catch (e) {
      setErro(mensagemDeErro(e))
    } finally {
      setEnviando(false)
    }
  }

  const recomecar = () => {
    setCliente(null)
    setValor('')
    setErro('')
    setFeito(null)
  }

  return (
    <Tela>
      <AppBar titulo="Registrar compra" aoVoltar={() => ir('/equipe')} />

      {feito ? (
        <div className="px pilha g16 centro mt24">
          <span className="equipe__ok">
            <Icone nome="check" tamanho={40} cor="var(--marrom-churros)" />
          </span>
          <h2 className="t-h2">+{feito.pontos} pontos</h2>
          <p className="t-corpo c-secundario">
            Depositados para {feito.nome || 'o cliente'} na compra de {reais(feito.valor)}.
            {operador.membro ? ` Sua meta: +${feito.pontosEquipe} pts.` : ''}
          </p>
          <Botao icone="qr" onClick={recomecar}>
            Nova compra
          </Botao>
          <Botao estilo="fantasma" onClick={() => ir('/equipe')}>
            Voltar ao início
          </Botao>
        </div>
      ) : !cliente ? (
        <BuscarCliente titulo="Peça para o cliente abrir o QR Code no app e aponte a câmera." aoAchar={setCliente} />
      ) : (
        <div className="px pilha g16">
          <CartaoCliente cliente={cliente} />
          {propriaConta && <Aviso texto="Você não pode registrar compra na sua própria conta." />}

          <Campo
            rotulo="Valor da compra"
            dica={`Teto por compra: ${reais(regras.valorMaximo)}. Regra atual: ${regras.pontosPorReal} pts por R$ 1,00.`}
          >
            <span className="t-h4 c-sutil">R$</span>
            <input
              inputMode="decimal"
              placeholder="0,00"
              value={valor}
              autoFocus
              onChange={(e) => setValor(mascararValor(e.target.value))}
            />
          </Campo>

          {acimaDoTeto && <Aviso texto={`Acima do teto de ${reais(regras.valorMaximo)} por compra.`} />}

          <div className="caixa caixa--ouro linha-h entre">
            <span className="t-corpo c-secundario">O cliente ganha</span>
            <b className="t-num-m c-ouro">{pontos.toLocaleString('pt-BR')} pts</b>
          </div>

          <Aviso texto={erro} />
          <Botao onClick={registrar} desabilitado={!pode}>
            {enviando ? 'Registrando…' : 'Confirmar e depositar'}
          </Botao>
          <Botao estilo="fantasma" onClick={recomecar}>
            Trocar cliente
          </Botao>
        </div>
      )}
    </Tela>
  )
}

// --- Caixa: validar voucher ---------------------------------------------------

export function CaixaVoucher() {
  const { ir } = useRota()
  const { uid, regras, lojaOperacao, unidades } = useClube()
  const operador = useOperador()
  const [cliente, setCliente] = useState(null)
  const [disponiveis, setDisponiveis] = useState(null)
  const [voucher, setVoucher] = useState(null)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [feito, setFeito] = useState(null)

  // Achou o cliente (QR dele ou telefone): mostra os vouchers ativos.
  const aoAcharCliente = async (c) => {
    setCliente(c)
    setErro('')
    try {
      setDisponiveis(await vouchersDisponiveis(c.uid))
    } catch (e) {
      setErro(mensagemDeErro(e))
    }
  }

  // Leu o QR do próprio voucher: vai direto para a confirmação.
  const aoLerVoucher = async ({ uid: dono, id }) => {
    setErro('')
    try {
      const [c, v] = await Promise.all([buscarCliente(dono), buscarVoucher(dono, id)])
      if (!c || !v) {
        setErro('Voucher não encontrado.')
        return false
      }
      setCliente(c)
      setVoucher(v)
      return true
    } catch (e) {
      setErro(mensagemDeErro(e))
      return false
    }
  }

  const darBaixa = async () => {
    setErro('')
    setEnviando(true)
    try {
      const r = await validarVoucherNoCaixa({
        cliente,
        voucher,
        loja: lojaOperacao,
        meta: metaDaLoja(unidades, lojaOperacao, regras),
        operador,
      })
      setFeito({ ...r, nome: voucher.nome })
    } catch (e) {
      setErro(mensagemDeErro(e))
    } finally {
      setEnviando(false)
    }
  }

  const recomecar = () => {
    setCliente(null)
    setDisponiveis(null)
    setVoucher(null)
    setErro('')
    setFeito(null)
  }

  const propriaConta = cliente?.uid === uid
  const usado = voucher && voucher.estado !== 'disponivel'

  return (
    <Tela>
      <AppBar titulo="Validar voucher" aoVoltar={() => ir('/equipe')} />

      {feito ? (
        <div className="px pilha g16 centro mt24">
          <span className="equipe__ok">
            <Icone nome="check" tamanho={40} cor="var(--marrom-churros)" />
          </span>
          <h2 className="t-h2">Voucher validado</h2>
          <p className="t-corpo c-secundario">
            Entregue: {feito.nome}.{operador.membro ? ` Sua meta: +${feito.pontosEquipe} pts.` : ''}
          </p>
          <Botao icone="ticket" onClick={recomecar}>
            Validar outro
          </Botao>
          <Botao estilo="fantasma" onClick={() => ir('/equipe')}>
            Voltar ao início
          </Botao>
        </div>
      ) : !cliente ? (
        <>
          <BuscarCliente
            titulo="Leia o QR do voucher (no app do cliente, em Meus vouchers) ou o QR de identificação dele."
            aoAchar={aoAcharCliente}
            aoLerVoucher={aoLerVoucher}
          />
          <div className="px">
            <Aviso texto={erro} />
          </div>
        </>
      ) : !voucher ? (
        <div className="px pilha g16">
          <CartaoCliente cliente={cliente} />
          <span className="t-overline c-sutil">Vouchers ativos</span>
          {disponiveis === null ? (
            <p className="t-peq c-sutil">Carregando…</p>
          ) : disponiveis.length === 0 ? (
            <Vazio icone="ticket" titulo="Nenhum voucher ativo" texto="Este cliente não tem resgate para retirar." />
          ) : (
            disponiveis.map((v) => (
              <button key={v.id} type="button" className="caixa linha-h g12" onClick={() => setVoucher(v)}>
                <Icone nome="presente" tamanho={22} cor="var(--ouro-500)" />
                <span className="cresce pilha g4" style={{ textAlign: 'left' }}>
                  <strong className="t-forte">{v.nome}</strong>
                  <span className="t-peq c-sutil">{v.codigo}</span>
                </span>
                <Icone nome="seta-dir" tamanho={18} cor="var(--texto-sutil)" />
              </button>
            ))
          )}
          <Aviso texto={erro} />
          <Botao estilo="fantasma" onClick={recomecar}>
            Trocar cliente
          </Botao>
        </div>
      ) : (
        <div className="px pilha g16">
          <CartaoCliente cliente={cliente} />
          <div className="caixa pilha g8">
            <span className="t-overline c-sutil">Voucher</span>
            <strong className="t-h3">{voucher.nome}</strong>
            <span className="t-peq c-sutil">
              {voucher.codigo} · {voucher.pontos} pts
            </span>
          </div>
          {usado && <Aviso texto="Este voucher já foi utilizado ou não está mais disponível." />}
          {propriaConta && <Aviso texto="Você não pode validar um voucher da sua própria conta." />}
          <Aviso texto={erro} />
          <Botao onClick={darBaixa} desabilitado={enviando || usado || propriaConta || !lojaOperacao}>
            {enviando ? 'Validando…' : 'Entregar e dar baixa'}
          </Botao>
          <Botao estilo="fantasma" onClick={recomecar}>
            Cancelar
          </Botao>
        </div>
      )}
    </Tela>
  )
}

// --- Movimento do dia (livro de lançamentos) ----------------------------------

export function Movimento() {
  const { papel, email, lojaOperacao, unidades } = useClube()
  const [dia, setDia] = useState(diaDeHoje())
  const [itens, setItens] = useState([])
  const [erro, setErro] = useState('')

  useEffect(() => {
    setErro('')
    // Funcionário só pode consultar o que ele mesmo lançou (regra do Firestore).
    const filtro = papel === 'funcionario' ? { dia, operador: email } : { dia, loja: lojaOperacao }
    return observarLancamentos(filtro, setItens, (e) => setErro(mensagemDeErro(e)))
  }, [dia, papel, email, lojaOperacao])

  const compras = itens.filter((l) => l.tipo === 'compra')
  const totais = {
    vendas: compras.reduce((s, l) => s + (l.valor || 0), 0),
    pontos: compras.reduce((s, l) => s + (l.pontos || 0), 0),
    vouchers: itens.filter((l) => l.tipo === 'voucher').length,
  }

  return (
    <Tela>
      <AppBar titulo="Movimento do dia" />
      <div className="px pilha g16">
        <SeletorLoja />
        <Campo rotulo="Dia">
          <Icone nome="calendario" tamanho={19} cor="var(--ouro-500)" />
          <input type="date" value={dia} max={diaDeHoje()} onChange={(e) => e.target.value && setDia(e.target.value)} />
        </Campo>

        <div className="equipe__stats">
          <div>
            <b className="t-num-m">{reais(totais.vendas)}</b>
            <span className="t-peq c-sutil">{compras.length} compras identificadas</span>
          </div>
          <div>
            <b className="t-num-m c-ouro">{totais.pontos.toLocaleString('pt-BR')}</b>
            <span className="t-peq c-sutil">pontos emitidos</span>
          </div>
          <div>
            <b className="t-num-m">{totais.vouchers}</b>
            <span className="t-peq c-sutil">vouchers validados</span>
          </div>
        </div>

        <Aviso texto={erro} />
        {papel === 'funcionario' && <span className="t-peq c-sutil">Mostrando só os lançamentos feitos por você.</span>}

        {itens.length === 0 ? (
          <Vazio icone="relogio" titulo="Nada neste dia" texto="Compras e vouchers registrados aparecem aqui." />
        ) : (
          <div>
            {itens.map((l, i) => (
              <div key={l.id}>
                <div className="ranking__linha">
                  <Icone
                    nome={l.tipo === 'compra' ? 'carteira' : 'ticket'}
                    tamanho={20}
                    cor={l.tipo === 'compra' ? 'var(--ouro-500)' : 'var(--texto-secundario)'}
                  />
                  <span className="cresce pilha g4">
                    <strong className="t-forte">
                      {l.tipo === 'compra' ? `Compra · ${l.clienteNome || 'cliente'}` : `Voucher · ${l.voucherNome}`}
                    </strong>
                    <span className="t-peq c-sutil">
                      {l.criadoEm?.toDate?.().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) || 'agora'}
                      {' · '}
                      {l.operadorNome} · {nomeDaLoja(unidades, l.loja)}
                    </span>
                  </span>
                  <span className="pilha g4" style={{ textAlign: 'right' }}>
                    {l.tipo === 'compra' && <b className="t-forte">{reais(l.valor)}</b>}
                    <span className="t-peq c-ouro">{l.tipo === 'compra' ? `+${l.pontos} pts` : 'baixa'}</span>
                  </span>
                </div>
                {i < itens.length - 1 && <Divisor />}
              </div>
            ))}
          </div>
        )}
      </div>
    </Tela>
  )
}

// --- Pessoas da equipe -------------------------------------------------------

export function Pessoas() {
  const { papel, email, lojaOperacao, unidades } = useClube()
  const [equipe, setEquipe] = useState([])
  const [nome, setNome] = useState('')
  const [novoEmail, setNovoEmail] = useState('')
  const [novoPapel, setNovoPapel] = useState('funcionario')
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [apagando, setApagando] = useState(null)

  const souAdmin = papel === 'admin'

  useEffect(() => {
    if (!lojaOperacao) return undefined
    return observarEquipe(lojaOperacao, setEquipe, (e) => setErro(mensagemDeErro(e)))
  }, [lojaOperacao])

  const ordenada = [...equipe].sort(
    (a, b) => (a.papel === b.papel ? a.nome.localeCompare(b.nome, 'pt-BR') : a.papel === 'franqueado' ? -1 : 1),
  )

  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(novoEmail.trim())
  const pode = nome.trim() && emailValido && !enviando && lojaOperacao

  const cadastrar = async () => {
    if (!pode) return
    setErro('')
    setOk('')
    setEnviando(true)
    try {
      await cadastrarMembro(
        { email: novoEmail, nome, papel: souAdmin ? novoPapel : 'funcionario', loja: lojaOperacao },
        email,
      )
      setOk(`${nome.trim()} cadastrado. Peça para entrar no app com o Google usando ${normalizarEmail(novoEmail)}.`)
      setNome('')
      setNovoEmail('')
    } catch (e) {
      setErro(mensagemDeErro(e))
    } finally {
      setEnviando(false)
    }
  }

  const alterar = async (m, campos) => {
    setErro('')
    try {
      await atualizarMembro(m.id, campos)
    } catch (e) {
      setErro(mensagemDeErro(e))
    }
  }

  const apagar = async (m) => {
    setErro('')
    try {
      await removerMembro(m.id)
    } catch (e) {
      setErro(mensagemDeErro(e))
    } finally {
      setApagando(null)
    }
  }

  return (
    <Tela>
      <AppBar titulo="Pessoas da equipe" />
      <div className="px pilha g16">
        <SeletorLoja />

        <div className="caixa pilha g16">
          <strong className="t-h4">Cadastrar {souAdmin ? 'pessoa' : 'funcionário'}</strong>
          <Campo rotulo="Nome">
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome da pessoa" />
          </Campo>
          <Campo rotulo="E-mail do Google" dica="É com este e-mail que a pessoa vai entrar no app.">
            <input
              type="email"
              inputMode="email"
              autoCapitalize="none"
              value={novoEmail}
              onChange={(e) => setNovoEmail(e.target.value)}
              placeholder="nome@gmail.com"
            />
          </Campo>
          {souAdmin && (
            <div className="rolagem-h">
              <Chip ativo={novoPapel === 'funcionario'} onClick={() => setNovoPapel('funcionario')}>
                Funcionário
              </Chip>
              <Chip ativo={novoPapel === 'franqueado'} onClick={() => setNovoPapel('franqueado')}>
                Franqueado
              </Chip>
            </div>
          )}
          <span className="t-peq c-sutil">
            Vai para a loja <b className="c-primario">{nomeDaLoja(unidades, lojaOperacao)}</b>
            {souAdmin ? ' (troque no seletor acima).' : '.'}
          </span>
          <Botao icone="mais" onClick={cadastrar} desabilitado={!pode}>
            {enviando ? 'Cadastrando…' : 'Cadastrar'}
          </Botao>
        </div>

        <Aviso texto={ok} tom="sucesso" />
        <Aviso texto={erro} />

        {ordenada.length === 0 ? (
          <Vazio icone="pessoas" titulo="Ninguém nesta loja" texto="Quem você cadastrar aparece aqui." />
        ) : (
          <div>
            {ordenada.map((m, i) => {
              // Franqueado não mexe em outro franqueado (nem em si mesmo).
              const podeMexer = souAdmin || m.papel === 'funcionario'
              return (
                <div key={m.id}>
                  <div className="pessoa">
                    <span className="cresce pilha g4">
                      <strong className="t-forte">
                        {m.nome} {!m.ativo && <span className="c-erro t-peq">· sem acesso</span>}
                      </strong>
                      <span className="t-peq c-sutil">{m.id}</span>
                      <span className="t-peq c-sutil">{NOMES_PAPEL[m.papel]}</span>
                    </span>
                    {podeMexer && (
                      <span className="pessoa__acoes">
                        {souAdmin && (
                          <Chip
                            onClick={() =>
                              alterar(m, { papel: m.papel === 'franqueado' ? 'funcionario' : 'franqueado' })
                            }
                          >
                            {m.papel === 'franqueado' ? 'Tornar funcionário' : 'Tornar franqueado'}
                          </Chip>
                        )}
                        <Chip onClick={() => alterar(m, { ativo: !m.ativo })} icone={m.ativo ? 'cadeado' : 'check'}>
                          {m.ativo ? 'Tirar acesso' : 'Dar acesso'}
                        </Chip>
                        {apagando === m.id ? (
                          <Chip onClick={() => apagar(m)} icone="check">
                            Confirmar
                          </Chip>
                        ) : (
                          <Chip onClick={() => setApagando(m.id)} icone="fechar">
                            Remover
                          </Chip>
                        )}
                      </span>
                    )}
                  </div>
                  {i < ordenada.length - 1 && <Divisor />}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Tela>
  )
}

// --- Metas e missões da equipe (franqueado e admin) -------------------------

const CAMPOS_META = [
  ['pontosPorReal', 'Pontos de meta por R$ 1,00 vendido', 'Quanto o funcionário ganha a cada real registrado no caixa.'],
  ['pontosPorVoucher', 'Pontos de meta por voucher validado', 'Quanto o funcionário ganha a cada voucher que dá baixa.'],
]

export function MetasEquipe() {
  const { email, regras, unidades, lojaOperacao } = useClube()
  const meta = metaDaLoja(unidades, lojaOperacao, regras)
  const [form, setForm] = useState(null)
  const [equipe, setEquipe] = useState([])
  const [missoes, setMissoes] = useState([])
  const [rascunho, setRascunho] = useState(null)
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState('')

  // Recomeça o formulário ao trocar de loja (o admin troca no seletor).
  useEffect(() => {
    setForm({ pontosPorReal: String(meta.pontosPorReal), pontosPorVoucher: String(meta.pontosPorVoucher) })
  }, [lojaOperacao, meta.pontosPorReal, meta.pontosPorVoucher])

  useEffect(() => {
    if (!lojaOperacao) return undefined
    const parar = [
      observarEquipe(lojaOperacao, setEquipe, (e) => setErro(mensagemDeErro(e))),
      observarMissoesEquipe(lojaOperacao, setMissoes, (e) => setErro(mensagemDeErro(e))),
    ]
    return () => parar.forEach((p) => p())
  }, [lojaOperacao])

  const executar = async (fn, mensagem) => {
    setErro('')
    setOk('')
    try {
      await fn()
      if (mensagem) setOk(mensagem)
    } catch (e) {
      setErro(mensagemDeErro(e))
    }
  }

  const inteiro = (v) => Math.max(0, Math.floor(Number(v) || 0))

  const salvarMetas = () =>
    executar(
      () =>
        salvarMetaDaLoja(lojaOperacao, {
          pontosPorReal: inteiro(form.pontosPorReal),
          pontosPorVoucher: inteiro(form.pontosPorVoucher),
        }),
      'Metas salvas. Valem a partir do próximo lançamento desta loja.',
    )

  const novoRascunho = (modelo) =>
    setRascunho({
      modelo: modelo?.id || '',
      titulo: modelo?.titulo || '',
      tipo: modelo?.tipo || 'vouchers',
      alvo: String(modelo ? (modelo.tipo === 'vendas' ? modelo.alvo / 100 : modelo.alvo) : ''),
      premio: '',
      prazo: '',
    })

  const alvoDoRascunho = rascunho
    ? rascunho.tipo === 'vendas'
      ? inteiro(rascunho.alvo) * 100
      : inteiro(rascunho.alvo)
    : 0

  const disparar = () =>
    executar(async () => {
      await dispararMissao(
        { loja: lojaOperacao, ...rascunho, alvo: alvoDoRascunho },
        equipe,
        email,
      )
      setRascunho(null)
    }, 'Missão disparada. A equipe já vê no painel dela.')

  const funcionarios = equipe.filter((m) => m.ativo && m.papel === 'funcionario')
  const ativas = missoes.filter((m) => m.ativa && !missaoVencida(m))
  const encerradas = missoes.filter((m) => !m.ativa || missaoVencida(m))

  if (!form) return null

  return (
    <Tela>
      <AppBar titulo="Metas e missões" />
      <div className="px pilha g16" style={{ paddingBottom: 24 }}>
        <SeletorLoja />
        <Aviso texto={ok} tom="sucesso" />
        <Aviso texto={erro} />

        <span className="t-overline c-sutil">Metas da loja</span>
        {CAMPOS_META.map(([chave, rotulo, dica]) => (
          <Campo key={chave} rotulo={rotulo} dica={dica}>
            <input
              inputMode="numeric"
              value={form[chave]}
              onChange={(e) => setForm({ ...form, [chave]: e.target.value.replace(/\D/g, '') })}
            />
          </Campo>
        ))}
        <Botao onClick={salvarMetas}>Salvar metas</Botao>

        <span className="t-overline c-sutil mt16">Missões ativas</span>
        {ativas.length === 0 && <p className="t-peq c-sutil">Nenhuma missão rodando. Escolha uma pronta abaixo.</p>}
        {ativas.map((m) => (
          <CartaoMissao key={m.id} missao={m}>
            {funcionarios.length === 0 && <span className="t-peq c-sutil">Nenhum funcionário ativo nesta loja.</span>}
            {funcionarios.map((f) => {
              const p = progressoNaMissao(m, f)
              return (
                <div key={f.id} className="pilha g4">
                  <div className="linha-h entre">
                    <span className="t-corpo">{f.nome}</span>
                    <span className={`t-peq ${p.concluida ? 'c-ouro' : 'c-sutil'}`}>
                      {p.concluida ? 'Concluiu' : `${quantidadeDaMissao(m.tipo, p.feito)}`}
                    </span>
                  </div>
                  <BarraProgresso valor={p.fracao} altura={6} />
                </div>
              )
            })}
            <div className="linha-h g8 mt8">
              <Botao estilo="fantasma" tamanho="p" largura="auto" onClick={() => executar(() => encerrarMissao(m.id))}>
                Encerrar
              </Botao>
            </div>
          </CartaoMissao>
        ))}

        <span className="t-overline c-sutil mt16">Missões prontas</span>
        {rascunho ? (
          <div className="caixa pilha g16">
            <strong className="t-h4">{rascunho.modelo ? 'Disparar missão' : 'Missão personalizada'}</strong>
            <Campo rotulo="Nome da missão">
              <input
                value={rascunho.titulo}
                maxLength={60}
                onChange={(e) => setRascunho({ ...rascunho, titulo: e.target.value })}
                placeholder="Ex.: Semana dos vouchers"
              />
            </Campo>
            <div className="pilha g8">
              <span className="t-overline c-secundario">O que conta</span>
              <div className="rolagem-h">
                {Object.entries(TIPOS_MISSAO).map(([tipo, t]) => (
                  <Chip key={tipo} ativo={rascunho.tipo === tipo} onClick={() => setRascunho({ ...rascunho, tipo })}>
                    {t.rotulo}
                  </Chip>
                ))}
              </div>
            </div>
            <Campo rotulo={rascunho.tipo === 'vendas' ? 'Meta (R$)' : 'Meta (quantidade)'} dica="Cada funcionário precisa chegar nesse número.">
              <input
                inputMode="numeric"
                value={rascunho.alvo}
                onChange={(e) => setRascunho({ ...rascunho, alvo: e.target.value.replace(/\D/g, '') })}
              />
            </Campo>
            <Campo rotulo="Prêmio (opcional)">
              <input
                value={rascunho.premio}
                maxLength={80}
                onChange={(e) => setRascunho({ ...rascunho, premio: e.target.value })}
                placeholder="Ex.: folga extra, R$ 50, almoço"
              />
            </Campo>
            <Campo rotulo="Prazo (opcional)">
              <Icone nome="calendario" tamanho={19} cor="var(--ouro-500)" />
              <input
                type="date"
                value={rascunho.prazo}
                min={diaDeHoje()}
                onChange={(e) => setRascunho({ ...rascunho, prazo: e.target.value })}
              />
            </Campo>
            <Botao icone="raio" onClick={disparar} desabilitado={!rascunho.titulo.trim() || !alvoDoRascunho}>
              Disparar para a equipe
            </Botao>
            <Botao estilo="fantasma" onClick={() => setRascunho(null)}>
              Cancelar
            </Botao>
          </div>
        ) : (
          <>
            {MODELOS_MISSAO.map((modelo) => (
              <button key={modelo.id} type="button" className="caixa linha-h g12" onClick={() => novoRascunho(modelo)}>
                <Icone nome="alvo" tamanho={22} cor="var(--ouro-500)" />
                <span className="cresce pilha g4" style={{ textAlign: 'left' }}>
                  <strong className="t-forte">{modelo.titulo}</strong>
                  <span className="t-peq c-sutil">{quantidadeDaMissao(modelo.tipo, modelo.alvo)}</span>
                </span>
                <Icone nome="seta-dir" tamanho={17} cor="var(--neutro-500)" />
              </button>
            ))}
            <Botao estilo="superficie" icone="mais" onClick={() => novoRascunho(null)}>
              Criar missão personalizada
            </Botao>
          </>
        )}

        {encerradas.length > 0 && (
          <>
            <span className="t-overline c-sutil mt16">Encerradas</span>
            {encerradas.map((m) => (
              <CartaoMissao key={m.id} missao={m}>
                <span className="t-peq c-sutil">
                  {funcionarios.filter((f) => progressoNaMissao(m, f).concluida).length} de {funcionarios.length} concluíram
                </span>
                <div className="linha-h g8">
                  <Botao estilo="fantasma" tamanho="p" largura="auto" onClick={() => executar(() => apagarMissao(m.id))}>
                    Apagar
                  </Botao>
                </div>
              </CartaoMissao>
            ))}
          </>
        )}
      </div>
    </Tela>
  )
}

// --- Regras do clube e catálogo (admin) --------------------------------------

const CAMPOS_REGRAS = [
  ['pontosPorReal', 'Pontos do cliente por R$ 1,00', 'Quanto o cliente ganha a cada real gasto.'],
  ['valorMaximo', 'Teto por compra (R$)', 'Compra acima disso é recusada. Freio contra erro de digitação e fraude.'],
]

export function RegrasClube() {
  const { regras, recompensas, catalogoPublicado } = useClube()
  const [form, setForm] = useState(null)
  const [precos, setPrecos] = useState(null)
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState('')

  // Preenche uma vez com o que está salvo (ou o padrão).
  useEffect(() => {
    if (form) return
    setForm(
      Object.fromEntries(
        CAMPOS_REGRAS.map(([chave]) => [
          chave,
          chave === 'valorMaximo' ? String(regras[chave] / 100) : String(regras[chave]),
        ]),
      ),
    )
  }, [regras, form])

  useEffect(() => {
    if (precos) return
    setPrecos(Object.fromEntries(recompensas.map((r) => [r.id, String(r.pontos)])))
  }, [recompensas, precos])

  if (!form || !precos) return null

  const inteiro = (v) => Math.max(0, Math.floor(Number(String(v).replace(',', '.')) || 0))

  const salvar = async () => {
    setErro('')
    setOk('')
    const novas = {
      pontosPorReal: inteiro(form.pontosPorReal),
      valorMaximo: inteiro(form.valorMaximo) * 100,
      // As metas da equipe agora são de cada loja (tela Metas e missões);
      // aqui só se preserva o padrão da rede, usado por loja sem meta própria.
      metaPontosPorReal: regras.metaPontosPorReal,
      metaPontosPorVoucher: regras.metaPontosPorVoucher,
    }
    if (!novas.pontosPorReal || !novas.valorMaximo) {
      setErro('Pontos por real e teto por compra precisam ser maiores que zero.')
      return
    }
    try {
      await salvarRegras(novas)
      setOk('Regras salvas. Valem a partir da próxima compra, em todas as lojas.')
    } catch (e) {
      setErro(mensagemDeErro(e))
    }
  }

  const publicar = async () => {
    setErro('')
    setOk('')
    const mapa = Object.fromEntries(RECOMPENSAS.map((r) => [r.id, inteiro(precos[r.id])]))
    if (Object.values(mapa).some((p) => p <= 0)) {
      setErro('Toda recompensa precisa custar pelo menos 1 ponto.')
      return
    }
    try {
      await salvarCatalogo(mapa)
      setOk('Catálogo publicado. Os clientes já veem os novos preços.')
    } catch (e) {
      setErro(mensagemDeErro(e))
    }
  }

  return (
    <Tela>
      <AppBar titulo="Regras do clube" />
      <div className="px pilha g16" style={{ paddingBottom: 24 }}>
        <Aviso texto={ok} tom="sucesso" />
        <Aviso texto={erro} />

        <span className="t-overline c-sutil">Pontuação</span>
        {CAMPOS_REGRAS.map(([chave, rotulo, dica]) => (
          <Campo key={chave} rotulo={rotulo} dica={`${dica} Padrão: ${chave === 'valorMaximo' ? REGRAS_PADRAO[chave] / 100 : REGRAS_PADRAO[chave]}.`}>
            <input
              inputMode="numeric"
              value={form[chave]}
              onChange={(e) => setForm({ ...form, [chave]: e.target.value.replace(/\D/g, '') })}
            />
          </Campo>
        ))}
        <Botao onClick={salvar}>Salvar regras</Botao>

        <span className="t-overline c-sutil mt16">Catálogo de recompensas (preço em pontos)</span>
        {!catalogoPublicado && (
          <Aviso texto="O catálogo ainda não foi publicado: enquanto isso nenhum cliente consegue resgatar." />
        )}
        {RECOMPENSAS.map((r) => (
          <div key={r.id} className="linha-h g12">
            <span className="cresce t-corpo">{r.nome}</span>
            <label className="campo__caixa" style={{ width: 120 }}>
              <input
                inputMode="numeric"
                value={precos[r.id]}
                onChange={(e) => setPrecos({ ...precos, [r.id]: e.target.value.replace(/\D/g, '') })}
              />
            </label>
          </div>
        ))}
        <Botao onClick={publicar}>{catalogoPublicado ? 'Publicar novos preços' : 'Publicar catálogo'}</Botao>
      </div>
    </Tela>
  )
}

// --- Lojas (admin) ------------------------------------------------------------

const slug = (texto) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export function Lojas() {
  const { unidades } = useClube()
  const [lojas, setLojas] = useState(null)
  const [nome, setNome] = useState('')
  const [bairro, setBairro] = useState('')
  const [endereco, setEndereco] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => observarLojas(setLojas, (e) => setErro(mensagemDeErro(e))), [])

  const executar = async (fn) => {
    setErro('')
    try {
      await fn()
    } catch (e) {
      setErro(mensagemDeErro(e))
    }
  }

  // As lojas do código viram documentos: a partir daí equipe pode ser
  // cadastrada nelas (a regra exige que a loja exista).
  const importar = () =>
    executar(() =>
      Promise.all(
        unidades.map((u) => salvarLoja(u.id, { nome: u.nome, bairro: u.bairro || '', endereco: u.endereco || '', ativa: true })),
      ),
    )

  const criar = () =>
    executar(async () => {
      await salvarLoja(slug(nome), { nome: nome.trim(), bairro: bairro.trim(), endereco: endereco.trim(), ativa: true })
      setNome('')
      setBairro('')
      setEndereco('')
    })

  return (
    <Tela>
      <AppBar titulo="Lojas" />
      <div className="px pilha g16" style={{ paddingBottom: 24 }}>
        <Aviso texto={erro} />

        {lojas && lojas.length === 0 && (
          <div className="caixa caixa--ouro pilha g12">
            <span className="t-corpo">
              Nenhuma loja cadastrada ainda. Comece criando as lojas atuais — sem isso não dá para cadastrar equipe.
            </span>
            <Botao onClick={importar}>Criar {unidades.map((u) => u.nome).join(' e ')}</Botao>
          </div>
        )}

        {(lojas || []).map((l) => (
          <div key={l.id} className="caixa linha-h g12">
            <Icone nome="pin" tamanho={20} cor={l.ativa === false ? 'var(--texto-sutil)' : 'var(--ouro-500)'} />
            <span className="cresce pilha g4">
              <strong className="t-forte">{l.nome}</strong>
              <span className="t-peq c-sutil">{[l.bairro, l.endereco].filter(Boolean).join(' · ') || l.id}</span>
            </span>
            <Chip ativo={l.ativa !== false} onClick={() => executar(() => salvarLoja(l.id, { ativa: l.ativa === false }))}>
              {l.ativa === false ? 'Fechada' : 'Ativa'}
            </Chip>
          </div>
        ))}

        <div className="caixa pilha g16">
          <strong className="t-h4">Nova loja</strong>
          <Campo rotulo="Nome (cidade ou unidade)">
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Campinas" />
          </Campo>
          <Campo rotulo="Bairro">
            <input value={bairro} onChange={(e) => setBairro(e.target.value)} />
          </Campo>
          <Campo rotulo="Endereço">
            <input value={endereco} onChange={(e) => setEndereco(e.target.value)} />
          </Campo>
          <Botao icone="mais" onClick={criar} desabilitado={!slug(nome)}>
            Criar loja
          </Botao>
        </div>
      </div>
    </Tela>
  )
}
