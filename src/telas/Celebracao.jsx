import { useRota } from '../rotas/useRota.js'
import { useClube } from '../estado/clubeContexto.js'
import { Tela } from '../componentes/Tela.jsx'
import { Botao, Brilho } from '../componentes/primitivos.jsx'
import { SeloNivel } from '../componentes/SeloNivel.jsx'
import { Gota } from '../componentes/Gota.jsx'
import { Icone } from '../componentes/Icone.jsx'
import { QRCode } from '../componentes/QRCode.jsx'

// Os momentos de conquista. É aqui que o dourado aparece no volume máximo —
// justamente porque o resto do app é preto.

function Palco({ children }) {
  return (
    <div className="celebra">
      <Brilho tamanho={440} topo={140} esquerda={-20} forca={0.3} />
      <Gota tamanho={150} cor="var(--branco)" opacidade={0.06} style={{ position: 'absolute', top: 90, right: -40 }} />
      <Gota tamanho={90} cor="var(--branco)" opacidade={0.05} style={{ position: 'absolute', bottom: 150, left: -25 }} />
      <div className="celebra__conteudo">{children}</div>
    </div>
  )
}

export function Celebracao({ tipo, params }) {
  const { ir } = useRota()
  const { vouchers, nivel, usuario } = useClube()

  if (tipo === 'resgate') {
    const voucher = vouchers.find((v) => v.id === params.voucher) || vouchers[0]
    return (
      <Tela className="celebra-tela">
        <Palco>
          <span className="celebra__marca celebra__marca--p">
            <Icone nome="check" tamanho={30} cor="var(--marrom-churros)" traco={2.2} />
          </span>
          <h1 className="t-h2 centro">Resgate concluído!</h1>
          <p className="t-corpo c-secundario centro">Mostre o código no caixa para retirar.</p>

          {voucher && (
            <div className="cupom mt16">
              <span className="cupom__marca">
                <img src={`${import.meta.env.BASE_URL}marca/gota-ouro.svg`} alt="" width={22} />
                <span className="t-overline" style={{ color: 'var(--marrom-churros)' }}>
                  Pontos Dourados
                </span>
              </span>
              <strong className="t-h2" style={{ color: '#131313' }}>
                {voucher.nome}
              </strong>
              <span className="t-peq" style={{ color: '#5C5C5C' }}>
                {voucher.descricao} · {voucher.pontos} pontos
              </span>
              <QRCode valor={voucher.codigo} tamanho={168} />
              <span className="cupom__codigo ouro-display">{voucher.codigo}</span>
              <i className="cupom__linha" />
              <span className="t-peq" style={{ color: '#5C5C5C' }}>
                {voucher.validade} · unidade Cajamar
              </span>
            </div>
          )}

          <div className="pilha g8 mt24" style={{ width: '100%' }}>
            <Botao onClick={() => ir('/vouchers', { substituir: true })}>Ver meus vouchers</Botao>
            <Botao estilo="fantasma" onClick={() => ir('/home', { substituir: true })}>
              Voltar ao início
            </Botao>
          </div>
        </Palco>
      </Tela>
    )
  }

  if (tipo === 'nivel') {
    return (
      <Tela className="celebra-tela">
        <Palco>
          <SeloNivel nivel={nivel.atual} tamanho={132} mostrarNome={false} />
          <span className="t-overline c-ouro">Novo nível desbloqueado</span>
          <h1 className="t-h1 centro">
            Você chegou
            <br />
            ao nível {nivel.atual.nome.charAt(0) + nivel.atual.nome.slice(1).toLowerCase()}.
          </h1>
          <p className="t-corpo-g c-secundario centro">Obrigado por voltar sempre. O clube retribui.</p>

          <div className="caixa caixa--ouro pilha g12 mt16" style={{ width: '100%' }}>
            <span className="t-overline c-sutil">O que você desbloqueou</span>
            {nivel.atual.beneficios.map((b) => (
              <span key={b} className="linha-h g12">
                <Icone nome="check-circulo" tamanho={18} cor="var(--ouro-500)" />
                <span className="t-corpo c-secundario cresce">{b}</span>
              </span>
            ))}
          </div>

          <div className="pilha g8 mt24" style={{ width: '100%' }}>
            <Botao onClick={() => ir('/clube', { substituir: true })}>Ver meus benefícios</Botao>
            <Botao estilo="fantasma" onClick={() => ir('/home', { substituir: true })}>
              Agora não
            </Botao>
          </div>
        </Palco>
      </Tela>
    )
  }

  if (tipo === 'missao') {
    return (
      <Tela className="celebra-tela">
        <Palco>
          <span className="celebra__marca">
            <Icone nome="check" tamanho={52} cor="var(--marrom-churros)" traco={2.2} />
          </span>
          <span className="t-overline c-ouro">Missão Dourada</span>
          <h1 className="t-h1 centro">Missão concluída!</h1>
          <div className="pilha centro">
            <strong className="t-saldo texto-ouro-gradiente">+{params.p || 150}</strong>
            <span className="t-forte c-secundario">Pontos Dourados</span>
          </div>
          <div className="pilha g8 mt24" style={{ width: '100%' }}>
            <Botao onClick={() => ir('/recompensas', { substituir: true })}>Ver minhas recompensas</Botao>
            <Botao estilo="fantasma" onClick={() => ir('/home', { substituir: true })}>
              Continuar
            </Botao>
          </div>
        </Palco>
      </Tela>
    )
  }

  // Conta criada: a carteira começa em zero, e a tela diz isso sem rodeio —
  // prometer pontos que não existem seria a pior primeira impressão possível.
  if (tipo === 'boas-vindas') {
    return (
      <Tela className="celebra-tela">
        <Palco>
          <span className="celebra__marca">
            <Icone nome="brilho" tamanho={48} cor="var(--marrom-churros)" traco={2.2} />
          </span>
          <span className="t-overline c-ouro">Bem-vindo ao clube</span>
          <h1 className="t-h1 centro">
            Pronto,
            <br />
            {usuario.primeiroNome || 'cliente'}.
          </h1>
          <p className="t-corpo-g c-secundario centro">
            Sua carteira começa em zero. A partir da próxima compra identificada no caixa, cada real vira ponto.
          </p>

          <div className="caixa caixa--ouro pilha g12 mt16" style={{ width: '100%' }}>
            <span className="t-overline c-sutil">Como acumular</span>
            {[
              'Mostre seu QR Code ou informe seu telefone no caixa',
              'Cada R$ 1,00 vale 2 Pontos Dourados',
              'Missões Douradas pagam bônus por fora',
            ].map((t) => (
              <span key={t} className="linha-h g12">
                <Icone nome="check-circulo" tamanho={18} cor="var(--ouro-500)" />
                <span className="t-corpo c-secundario cresce">{t}</span>
              </span>
            ))}
          </div>

          <div className="pilha g8 mt24" style={{ width: '100%' }}>
            <Botao onClick={() => ir('/qr', { substituir: true })}>Ver meu QR Code</Botao>
            <Botao estilo="fantasma" onClick={() => ir('/home', { substituir: true })}>
              Explorar o clube
            </Botao>
          </div>
        </Palco>
      </Tela>
    )
  }

  // Pontos creditados depois de uma compra identificada
  const pontos = Number(params.p) || 0
  return (
    <Tela className="celebra-tela">
      <Palco>
        <span className="celebra__marca">
          <Icone nome="check" tamanho={48} cor="var(--marrom-churros)" traco={2.2} />
        </span>
        <div className="pilha centro">
          <strong className="t-saldo texto-ouro-gradiente">+{pontos}</strong>
          <span className="t-forte c-secundario">Pontos Dourados</span>
        </div>
        <h1 className="t-h3 centro">Compra identificada!</h1>

        <div className="caixa pilha g12 mt16" style={{ width: '100%' }}>
          <div className="linha-h entre">
            <span className="t-overline c-sutil">Cajamar · Portal dos Ipês</span>
            <span className="t-peq c-sutil">agora</span>
          </div>
          {[
            ['2×', 'Coxinha G', 'R$ 29,80'],
            ['1×', 'Combo Pra Você', 'R$ 20,90'],
            ['1×', 'Molho Cremoso', 'R$ 9,10'],
          ].map(([q, nome, valor]) => (
            <div key={nome} className="linha-h g12">
              <b className="t-peq c-ouro">{q}</b>
              <span className="t-corpo c-secundario cresce">{nome}</span>
              <span className="t-corpo">{valor}</span>
            </div>
          ))}
          <i className="divisor" />
          <div className="linha-h entre">
            <strong className="t-forte">Total</strong>
            <b className="t-num-m">R$ 59,80</b>
          </div>
        </div>

        {nivel.proximo && (
          <div className="caixa caixa--ouro pilha g12" style={{ width: '100%' }}>
            <span className="linha-h g12">
              <Icone nome="tendencia" tamanho={19} cor="var(--ouro-500)" />
              <strong className="t-forte cresce">
                Faltam {nivel.faltam.toLocaleString('pt-BR')} pontos para o{' '}
                {nivel.proximo.nome.charAt(0) + nivel.proximo.nome.slice(1).toLowerCase()}
              </strong>
            </span>
            <div className="progresso progresso--escuro" style={{ height: 9 }}>
              <i style={{ width: `${nivel.progresso * 100}%` }} />
            </div>
          </div>
        )}

        <div className="pilha g8 mt24" style={{ width: '100%' }}>
          <Botao onClick={() => ir('/carteira', { substituir: true })}>
            Ver minha carteira · {usuario.saldo.toLocaleString('pt-BR')} pts
          </Botao>
          <Botao estilo="fantasma" onClick={() => ir('/home', { substituir: true })}>
            Fechar
          </Botao>
        </div>
      </Palco>
    </Tela>
  )
}
