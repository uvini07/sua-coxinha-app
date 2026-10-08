import { Icone } from './Icone.jsx'
import { Gota } from './Gota.jsx'

// O elemento-assinatura do app: a carteira de valor dentro da Sua Coxinha.
// Gradiente de ouro com os amarelos da marca, textura da sub-marca e o texto em
// Marrom Churros — nunca preto, que é o que deixaria com cara de banco.
// Um por tela. O resto da interface é preto para este cartão brilhar.

export function CartaoDourado({ saldo, pendentes, aExpirar, nivel, onClick, compacto }) {
  const Elemento = onClick ? 'button' : 'div'
  return (
    <Elemento
      type={onClick ? 'button' : undefined}
      className={`cartao-ouro${compacto ? ' cartao-ouro--compacto' : ''}`}
      onClick={onClick}
    >
      <div className="cartao-ouro__textura" aria-hidden="true">
        <Gota tamanho={190} cor="var(--marrom-churros)" opacidade={0.07} style={{ top: -28, right: -46 }} />
        <Gota tamanho={110} cor="var(--marrom-churros)" opacidade={0.07} style={{ bottom: -24, right: 54 }} />
        <Gota tamanho={74} cor="var(--marrom-churros)" opacidade={0.06} style={{ bottom: 18, right: -14 }} />
      </div>

      <div className="cartao-ouro__topo">
        <span className="t-overline">Seu saldo dourado</span>
        <span className="cartao-ouro__nivel">
          <Icone nome={nivel?.icone || 'trofeu'} tamanho={14} />
          <span className="t-overline">Nível {nivel?.nome ? nivel.nome.charAt(0) + nivel.nome.slice(1).toLowerCase() : 'Bronze'}</span>
        </span>
      </div>

      <div className="cartao-ouro__saldo">
        <strong className="t-saldo">{saldo.toLocaleString('pt-BR')}</strong>
        <span className="t-forte">Pontos Dourados</span>
      </div>

      {/* Pendentes e a expirar só aparecem quando existem: numa carteira nova,
          dois zeros no rodapé do cartão não informam nada e ainda sugerem que
          alguma coisa está prestes a sumir. */}
      {(pendentes > 0 || aExpirar > 0) && (
        <div className="cartao-ouro__rodape">
          {pendentes > 0 && (
            <span>
              <i style={{ background: 'rgba(70,35,2,0.45)' }} />
              {pendentes} pendentes
            </span>
          )}
          {aExpirar > 0 && (
            <span>
              <i style={{ background: '#8A2B06' }} />
              {aExpirar} expiram em 7 dias
            </span>
          )}
        </div>
      )}
    </Elemento>
  )
}
