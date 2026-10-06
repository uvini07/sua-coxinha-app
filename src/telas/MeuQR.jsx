import { useEffect, useState } from 'react'
import { useRota } from '../rotas/useRota.js'
import { useClube } from '../estado/clubeContexto.js'
import { AppBar, Tela } from '../componentes/Tela.jsx'
import { Botao, Brilho } from '../componentes/primitivos.jsx'
import { Icone } from '../componentes/Icone.jsx'
import { QRCode } from '../componentes/QRCode.jsx'
import { UNIDADES } from '../dados/clube.js'

export function MeuQR() {
  const { ir } = useRota()
  const { usuario, nivel, registrarCompra, avancarMissao } = useClube()
  const [simulando, setSimulando] = useState(false)
  const unidade = UNIDADES.find((u) => u.id === usuario.unidade) || UNIDADES[0]

  // Tela de identificação pede brilho alto: avisamos em vez de tentar forçar,
  // porque navegador não controla o brilho do aparelho.
  useEffect(() => {
    document.body.dataset.tela = 'qr'
    return () => {
      delete document.body.dataset.tela
    }
  }, [])

  const simularCaixa = () => {
    setSimulando(true)
    const pontos = registrarCompra(5980, unidade.nome)
    avancarMissao('sequencia')
    setTimeout(() => ir(`/celebracao/pontos?p=${pontos}`, { substituir: true }), 700)
  }

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

          <QRCode valor={usuario.codigo} tamanho={196} />

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

        <div className="qr__simulacao">
          <span className="t-overline c-sutil">Demonstração</span>
          <p className="t-peq c-secundario">
            Ainda não existe integração com o PDV. Este botão simula o caixa lendo seu código numa compra de R$ 59,80.
          </p>
          <Botao estilo="superficie" tamanho="p" icone="qr" onClick={simularCaixa} desabilitado={simulando}>
            {simulando ? 'Lendo…' : 'Simular leitura no caixa'}
          </Botao>
        </div>
      </div>
    </Tela>
  )
}
