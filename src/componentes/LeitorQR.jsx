import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { Icone } from './Icone.jsx'

// Leitor de QR Code pela câmera traseira.
//
// jsQR em vez do BarcodeDetector do navegador: o Safari do iPhone não tem
// BarcodeDetector, e o caixa pode ser qualquer celular. A cada quadro o vídeo
// é desenhado num canvas pequeno e o jsQR procura o código ali.
//
// No app Android a câmera precisa da permissão CAMERA no AndroidManifest; na
// web, de HTTPS (o GitHub Pages e a Vercel já são).

export function LeitorQR({ aoLer, pausado }) {
  const video = useRef(null)
  const canvas = useRef(null)
  const aoLerRef = useRef(aoLer)
  aoLerRef.current = aoLer
  const [falha, setFalha] = useState('')

  useEffect(() => {
    if (pausado) return undefined
    let fluxo
    let quadro
    let vivo = true

    const procurar = () => {
      if (!vivo) return
      const v = video.current
      const c = canvas.current
      if (v && c && v.readyState >= 2 && v.videoWidth) {
        const largura = 480
        const altura = Math.round((v.videoHeight / v.videoWidth) * largura)
        c.width = largura
        c.height = altura
        const ctx = c.getContext('2d', { willReadFrequently: true })
        ctx.drawImage(v, 0, 0, largura, altura)
        const imagem = ctx.getImageData(0, 0, largura, altura)
        const achado = jsQR(imagem.data, largura, altura, { inversionAttempts: 'dontInvert' })
        if (achado?.data) {
          navigator.vibrate?.(60)
          aoLerRef.current(achado.data)
          return
        }
      }
      quadro = requestAnimationFrame(procurar)
    }

    ;(async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setFalha('Este aparelho não liberou a câmera para o app. Use a busca por telefone.')
        return
      }
      try {
        fluxo = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
        if (!vivo) {
          fluxo.getTracks().forEach((t) => t.stop())
          return
        }
        setFalha('')
        video.current.srcObject = fluxo
        await video.current.play().catch(() => {})
        quadro = requestAnimationFrame(procurar)
      } catch (e) {
        setFalha(
          e?.name === 'NotAllowedError'
            ? 'A câmera foi bloqueada. Libere nas permissões do aparelho ou use a busca por telefone.'
            : 'Não foi possível abrir a câmera. Use a busca por telefone.',
        )
      }
    })()

    return () => {
      vivo = false
      cancelAnimationFrame(quadro)
      fluxo?.getTracks().forEach((t) => t.stop())
    }
  }, [pausado])

  return (
    <div className="leitor">
      {falha ? (
        <div className="leitor__falha">
          <Icone nome="info" tamanho={22} cor="var(--sinal-alerta)" />
          <span className="t-peq c-secundario">{falha}</span>
        </div>
      ) : (
        <>
          <video ref={video} className="leitor__video" playsInline muted />
          <i className="leitor__mira" aria-hidden="true" />
        </>
      )}
      <canvas ref={canvas} hidden />
    </div>
  )
}
