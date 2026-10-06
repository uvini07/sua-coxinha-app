import { useCallback, useEffect, useState } from 'react'

// Roteador por hash (#/home). Sem dependência externa e, mais importante,
// funciona igual na web, no PWA instalado e dentro do Capacitor — que serve os
// arquivos de um caminho local onde rota por history daria dor de cabeça.
// Como o app roda em tela cheia, o # nunca aparece para o usuário.

const lerHash = () => {
  const bruto = window.location.hash.replace(/^#/, '') || '/'
  const [caminho, consulta] = bruto.split('?')
  const partes = caminho.split('/').filter(Boolean)
  return {
    caminho: '/' + partes.join('/'),
    partes,
    params: Object.fromEntries(new URLSearchParams(consulta || '')),
  }
}

export function useRota() {
  const [rota, setRota] = useState(lerHash)

  useEffect(() => {
    const aoMudar = () => setRota(lerHash())
    window.addEventListener('hashchange', aoMudar)
    return () => window.removeEventListener('hashchange', aoMudar)
  }, [])

  const ir = useCallback((destino, opcoes = {}) => {
    const alvo = destino.startsWith('#') ? destino : '#' + destino
    if (opcoes.substituir) window.location.replace(alvo)
    else window.location.hash = alvo
  }, [])

  const voltar = useCallback(() => window.history.back(), [])

  return { ...rota, ir, voltar }
}
