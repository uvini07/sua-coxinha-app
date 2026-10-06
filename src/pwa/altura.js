// A altura da janela no celular não é confiável em CSS.
//
// `100vh` ignora as barras do navegador, `100dvh` muda de comportamento entre
// versões do iOS, e `height: 100%` depende de o documento ter altura definida —
// que é justamente o que quebra quando o body está em `position: fixed` com
// `viewport-fit=cover`. O sintoma é uma faixa vazia no rodapé: o app termina
// antes do fim da tela.
//
// Em vez de adivinhar, medimos. `visualViewport` é o que o usuário realmente vê
// — já desconta barra do navegador e teclado aberto — e gravamos o valor numa
// variável CSS que a moldura do app usa.

export function acompanharAlturaDaJanela() {
  const vv = window.visualViewport

  const aplicar = () => {
    const altura = vv ? vv.height : window.innerHeight
    document.documentElement.style.setProperty('--altura-janela', `${Math.round(altura)}px`)
  }

  aplicar()

  // orientationchange dispara antes de a janela ter o tamanho novo: medimos de
  // novo no quadro seguinte.
  const aplicarDepois = () => requestAnimationFrame(() => setTimeout(aplicar, 60))

  window.addEventListener('resize', aplicar)
  window.addEventListener('orientationchange', aplicarDepois)
  if (vv) {
    vv.addEventListener('resize', aplicar)
    vv.addEventListener('scroll', aplicar)
  }

  return () => {
    window.removeEventListener('resize', aplicar)
    window.removeEventListener('orientationchange', aplicarDepois)
    if (vv) {
      vv.removeEventListener('resize', aplicar)
      vv.removeEventListener('scroll', aplicar)
    }
  }
}
