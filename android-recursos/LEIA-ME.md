# Ícone e tela de abertura do Android

O workflow copia `res/` por cima do projeto gerado pelo Capacitor, substituindo
o ícone e a splash padrão.

- `mipmap-*/ic_launcher.png` — ícone clássico (de `public/icones/icone-512.png`)
- `mipmap-*/ic_launcher_round.png` — versão redonda
- `mipmap-*/ic_launcher_foreground.png` + `values/ic_launcher_background.xml` —
  ícone adaptativo (Android 8+), de `public/icones/icone-maskable-512.png` sobre
  o Preto Gourmet `#131313`
- `drawable*/splash.png` — tela de abertura: a gota da marca no centro

Mudou o ícone em `public/icones/`? Gere de novo com ImageMagick, nos mesmos
tamanhos (48/72/96/144/192 px para o ícone, 108/162/216/324/432 para o
foreground).
