// O service worker é o que faz o QR Code abrir sem internet — dentro de loja o
// sinal costuma ser ruim, e é exatamente ali que o app precisa funcionar.
// Em desenvolvimento ele fica desligado para não servir arquivo velho.

export function registrarServiceWorker() {
  if (import.meta.env.DEV) return
  if (!('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      /* sem service worker o app continua funcionando, só perde o offline */
    })
  })
}

// Em alguns navegadores a instalação só pode ser oferecida depois deste evento.
export function ouvirConviteDeInstalacao(aoPoderInstalar) {
  let evento = null
  const aoDisparar = (e) => {
    e.preventDefault()
    evento = e
    aoPoderInstalar(async () => {
      if (!evento) return false
      evento.prompt()
      const { outcome } = await evento.userChoice
      evento = null
      return outcome === 'accepted'
    })
  }
  window.addEventListener('beforeinstallprompt', aoDisparar)
  return () => window.removeEventListener('beforeinstallprompt', aoDisparar)
}
