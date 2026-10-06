import { useEffect } from 'react'
import { useClube } from '../estado/clubeContexto.js'
import { AppBar, NavInferior, Tela } from '../componentes/Tela.jsx'
import { LinhaNotificacao } from '../componentes/cartoes.jsx'
import { Vazio } from '../componentes/primitivos.jsx'

export function Notificacoes() {
  const { notificacoes, lerNotificacoes } = useClube()

  // Marca como lidas ao sair da tela, não ao entrar — assim o destaque dourado
  // ainda aparece para quem abriu.
  useEffect(() => () => lerNotificacoes(), [lerNotificacoes])

  const novas = notificacoes.filter((n) => n.nova)
  const antigas = notificacoes.filter((n) => !n.nova)

  return (
    <Tela nav={<NavInferior ativo="home" />}>
      <AppBar titulo="Notificações" acao={{ icone: 'check', rotulo: 'Marcar todas como lidas' }} aoAcionar={lerNotificacoes} />

      {notificacoes.length === 0 && (
        <Vazio icone="sino" titulo="Tudo em dia" texto="Quando houver novidade sobre seus pontos, ela aparece aqui." />
      )}

      {novas.length > 0 && (
        <section className="px mt8 pilha g12">
          <span className="t-overline c-sutil">Hoje</span>
          {novas.map((n) => (
            <LinhaNotificacao key={n.id} item={n} />
          ))}
        </section>
      )}

      {antigas.length > 0 && (
        <section className="px mt24 pilha g12">
          <span className="t-overline c-sutil">Anteriores</span>
          {antigas.map((n) => (
            <LinhaNotificacao key={n.id} item={n} />
          ))}
        </section>
      )}
    </Tela>
  )
}
