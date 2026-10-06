# Fontes — situação de licença

O app usa as duas fontes da guia de marca da Sua Coxinha. Elas estão versionadas em
`public/fontes/` porque o build precisa delas. As situações de licença são diferentes:

## Satoshi — ok para uso comercial

Indian Type Foundry, distribuída pelo [Fontshare](https://www.fontshare.com/fonts/satoshi)
sob a *Free Font End User License Agreement*. Uso comercial permitido, incluindo incorporar
em site e aplicativo. A licença completa veio junto do pacote original, em
`guia_de_marca/Satoshi_Complete/License/FFL.txt`.

## Brown Beige — PENDENTE, licença comercial precisa ser comprada

O arquivo que veio na guia de marca é a versão gratuita, e o `More Info.txt` do autor é explícito:

> This product free for personal use. If you want the full version and license for commercial
> use, you can purchase here: https://thehungryjpeg.com/product/4406995-brown-beige

O Pontos Dourados é um produto comercial de uma rede de franquias. **Antes de publicar o app
nas lojas ou colocar no ar em produção, a licença comercial precisa ser comprada.** É barata
perto do risco, e resolve de uma vez — a mesma licença cobre o site, as embalagens e o material
de PDV, que já usam a fonte.

Enquanto isso não acontece, duas consequências práticas:

- **O repositório fica privado.** Redistribuir a versão gratuita num repositório público seria
  violação de licença por si só.
- Se a compra não for possível, o caminho é trocar a Brown Beige por uma alternativa com licença
  aberta e aparência próxima — rounded pesada, como Baloo 2 ou Nunito ExtraBold (ambas SIL OFL).
  A troca é de uma linha: a fonte está isolada no token `--fonte-ouro`, em `src/estilos/tokens.css`,
  e só é usada pela classe `.ouro-display`.

## Onde cada uma é usada

A Brown Beige **não tem acentos** (só Ê Ó Ô Õ em caixa alta; nenhum minúsculo). Por isso ela é a
*voz do ouro*: números e palavras em caixa alta sem acento — `PONTOS DOURADOS`, `BRONZE`, `OURO`,
`1.280`, códigos de voucher. Todo o resto é Satoshi, que tem o português completo.

O `@font-face` declara um `unicode-range` cobrindo só o que a Brown Beige tem, então qualquer
caractere fora da faixa cai na Satoshi sozinho, em vez de virar quadradinho.
