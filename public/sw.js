// Service worker do Pontos Dourados.
// Estratégia: o app abre offline (cache primeiro para a casca), e o conteúdo
// estático é revalidado em segundo plano. O que importa aqui é o QR Code
// funcionar dentro da loja mesmo sem sinal.

const VERSAO = 'pd-v2'
const CASCA = `casca-${VERSAO}`
const CONTEUDO = `conteudo-${VERSAO}`

const ESSENCIAIS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './fontes/Satoshi-Regular.woff2',
  './fontes/Satoshi-Bold.woff2',
  './fontes/BrownBeige.woff2',
  './icones/icone-192.png',
]

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches
      .open(CASCA)
      .then((cache) => cache.addAll(ESSENCIAIS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((chaves) =>
        Promise.all(chaves.filter((c) => !c.endsWith(VERSAO)).map((c) => caches.delete(c))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (evento) => {
  const req = evento.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // Navegação: tenta a rede, cai para o index em cache quando offline.
  if (req.mode === 'navigate') {
    evento.respondWith(
      fetch(req).catch(() => caches.match('./index.html').then((r) => r || caches.match('./'))),
    )
    return
  }

  // Demais arquivos: responde do cache e atualiza por trás.
  evento.respondWith(
    caches.match(req).then((emCache) => {
      const daRede = fetch(req)
        .then((resposta) => {
          if (resposta && resposta.status === 200) {
            const copia = resposta.clone()
            caches.open(CONTEUDO).then((cache) => cache.put(req, copia))
          }
          return resposta
        })
        .catch(() => emCache)
      return emCache || daRede
    }),
  )
})
