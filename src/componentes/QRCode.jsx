import { useMemo } from 'react'
import qrcode from 'qrcode-generator'

// QR Code de verdade, gerado no aparelho. Importa que seja real e não um
// desenho: ele precisa ser lido pelo caixa — e precisa funcionar sem internet,
// o que só acontece porque a geração é local.

export function QRCode({ valor, tamanho = 200, cor = '#131313', margem = 2, className }) {
  const { caminho, lado } = useMemo(() => {
    const qr = qrcode(0, 'M') // tipo automático, correção média
    qr.addData(valor)
    qr.make()
    const modulos = qr.getModuleCount()
    const total = modulos + margem * 2
    let d = ''
    for (let linha = 0; linha < modulos; linha++) {
      for (let col = 0; col < modulos; col++) {
        if (qr.isDark(linha, col)) d += `M${col + margem} ${linha + margem}h1v1h-1z`
      }
    }
    return { caminho: d, lado: total }
  }, [valor, margem])

  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox={`0 0 ${lado} ${lado}`}
      className={className}
      shapeRendering="crispEdges"
      role="img"
      aria-label={`QR Code do código ${valor}`}
      style={{ flex: 'none' }}
    >
      <path d={caminho} fill={cor} />
    </svg>
  )
}
