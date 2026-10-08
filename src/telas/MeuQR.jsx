import { useEffect, useRef } from 'react'
import { useRota } from '../rotas/useRota.js'
import { useClube } from '../estado/clubeContexto.js'
import { AppBar, Tela } from '../componentes/Tela.jsx'
import { Botao, Brilho } from '../componentes/primitivos.jsx'
import { Icone } from '../componentes/Icone.jsx'
import { QRCode } from '../componentes/QRCode.jsx'
import { qrDoCliente } from '../firebase/equipe.js'

export function MeuQR() {
  const { ir } = useRota()
  const { uid, usuario, nivel, historico } = useClube()

  // Quando o caixa registra a compra, o extrato ganha uma linha nova em tempo
  // real. Se ela é de agora (feita com esta tela aberta), vai direto para a
  // comemoração. Comparar só o id não basta: abrindo o app direto nesta tela,
  // o extrato antigo chega do servidor depois e pareceria novidade. A folga de
  // dois minutos cobre relógio de celular adiantado em relação ao servidor.
  // E a linha que já estava no topo ao abrir nunca é comemorada.
  const abertaEm = useRef(Date.now())
  const primeiro = historico[0]
  const idAoAbrir = useRef(primeiro?.id)
  useEffect(() => {
    const quando = primeiro?.criadoEm?.toMillis?.()
    if (
      primeiro?.tipo === 'ganho' &&
      primeiro.id !== idAoAbrir.current &&
      quando &&
      quando > abertaEm.current - 120000
    ) {
      ir(`/celebracao/pontos?p=${primeiro.pontos}`, { substituir: true })
    }
  }, [primeiro, ir])

  // Tela de identificação pede brilho alto: avisamos em vez de tentar forçar,
  // porque navegador não controla o brilho do aparelho.
  useEffect(() => {
    document.body.dataset.tela = 'qr'
    return () => {
      delete document.body.dataset.tela
    }
  }, [])

  return (
    <Tela className="qr">
      <Brilho tamanho={420} topo={170} esquerda={-15} forca={0.28} />
      <AppBar titulo="Identificação" fechar aoVoltar={() => ir('/home')} />

      <div className="px mt8">
        <div className="qr__cartao">
          <img src={`${import.meta.env.BASE_URL}produtos/mascote.webp`} alt="" className="qr__avatar" />
          <div className="centro pilha g8">
            <strong className="t-h3" style={{ color: '#131313' }}>
              {usuario.nome}
            </strong>
            {/* Sem a palavra "Nível": a Brown Beige não tem Í, e escrever sem
                acento seria erro de português. O nome do nível já diz tudo. */}
            <span className="qr__nivel ouro-display t-overline">
              <Icone nome={nivel.atual.icone} tamanho={13} cor="#8A5A06" />
              {nivel.atual.nome} · {usuario.saldo.toLocaleString('pt-BR')} PTS
            </span>
          </div>

          <QRCode valor={qrDoCliente(uid)} tamanho={196} />

          <span className="qr__codigo ouro-display">{usuario.codigo}</span>
          <p className="t-peq centro" style={{ color: '#5C5C5C' }}>
            Mostre este código no caixa antes de pagar.
          </p>
        </div>
      </div>

      <div className="px mt24 pilha g12 centro">
        <span className="t-peq c-sutil">Ou informe seu telefone no caixa</span>
        <span className="qr__telefone">
          <Icone nome="usuario" tamanho={18} cor="var(--ouro-500)" />
          <strong className="t-h4">{usuario.telefone}</strong>
        </span>
      </div>

      <div className="px mt24 pilha g12" style={{ paddingBottom: 28 }}>
        <span className="qr__dica">
          <Icone nome="brilho" tamanho={15} cor="var(--texto-sutil)" />
          <span className="t-peq c-sutil">Deixe o brilho da tela no máximo para o leitor pegar mais rápido</span>
        </span>

      </div>
    </Tela>
  )
}
