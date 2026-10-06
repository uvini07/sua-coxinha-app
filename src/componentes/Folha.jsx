import { useEffect } from 'react'

// Folha que sobe de baixo (bottom sheet). Usada para confirmar resgate e para
// as ações rápidas — num app de celular isso substitui o modal centralizado.

export function Folha({ aberta, aoFechar, titulo, children }) {
  useEffect(() => {
    if (!aberta) return
    const aoTeclar = (e) => {
      if (e.key === 'Escape') aoFechar()
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [aberta, aoFechar])

  if (!aberta) return null

  return (
    <div className="folha" role="dialog" aria-modal="true" aria-label={titulo}>
      <button type="button" className="folha__fundo" onClick={aoFechar} aria-label="Fechar" />
      <div className="folha__painel">
        <i className="folha__alca" aria-hidden="true" />
        {titulo && <h2 className="t-h2 folha__titulo">{titulo}</h2>}
        {children}
      </div>
    </div>
  )
}
