# Pontos Dourados

App do clube de fidelidade da Sua Coxinha. Web, **só mobile**, instalável como PWA e pronto
para virar app nativo nas lojas via Capacitor.

Design de origem: o arquivo Figma do projeto (`kZqZYvHdqiOKQ0GovrT9Yd`).
Estratégia: `Briefing_Pontos_Dourados_Sua_Coxinha_v2.pdf`.

```bash
npm install
npm run dev      # http://localhost:5180
npm run build    # gera dist/
npm run preview  # serve o dist/ para testar o PWA de verdade
```

## Antes de produção

Duas pendências conhecidas, as duas fáceis de esquecer:

1. **Licença da fonte Brown Beige.** A versão na guia de marca é gratuita só para uso
   pessoal; uso comercial exige comprar. Detalhes e alternativas em [FONTES.md](FONTES.md).
2. **Login fixo de teste.** `src/dados/demo.js` deixa telefone e código já preenchidos na
   entrada, porque ainda não existe verificação por WhatsApp. Apagar o arquivo e seguir as
   duas linhas de instrução que estão nele.

## O que já funciona

Não é maquete clicável: o estado é real e persiste no aparelho.

- Onboarding, login por telefone com código, cadastro enxuto
- Home com o Cartão Dourado, missão em destaque, recompensas e ofertas
- Carteira com saldo, pendentes, a expirar, gráfico por mês e extrato filtrável
- Missões com progresso e detalhe
- Catálogo de recompensas, **resgate que debita o saldo** e gera voucher com código único
- Vouchers com QR Code real, marcáveis como utilizados
- QR Code de identificação que **funciona offline**
- Clube de benefícios por categoria, com parceiros travados por nível
- Perfil, configurações, notificações e a trilha de níveis
- Telas de conquista para resgate, pontos creditados e subida de nível

O botão **Simular leitura no caixa**, na tela do QR, credita pontos de uma compra de
R$ 59,80 e avança a missão de sequência. É o gancho que a integração com o PDV
(ou o app do operador) vai substituir — está isolado em `registrarCompra()`.

## Só celular, de propósito

Não existe layout de desktop. No computador o app aparece centralizado numa moldura de
440px, como apareceria no aparelho. Isso é decisão de produto: o app é usado na fila do
caixa. O **painel administrativo** que o briefing pede é outro projeto, e esse sim é desktop.

## Marca

Cores e fontes saem da guia oficial. Nada foi inventado.

**Brown Beige** não tem acentos minúsculos nem Á À Â Ã Ç É Í Ú — só Ê Ó Ô Õ. Por isso ela é
a *voz do ouro*: números e palavras em caixa alta sem acento (`PONTOS DOURADOS`, `BRONZE`,
`OURO`, `1.280`, códigos de voucher), pela classe `.ouro-display`. Todo o resto é **Satoshi**,
que tem o português completo.

A rede de segurança está no `@font-face`: o `unicode-range` cobre só o que a fonte tem, então
qualquer caractere fora da faixa cai na Satoshi sozinho, em vez de virar quadradinho.

O dourado segue a regra 60/30/10 do manual, com o Preto Gourmet nos 60%. O ouro só aparece
onde existe conquista: saldo, níveis, missões, recompensas, QR e celebrações. É o preto que
faz o ouro valer.

## Estrutura

```
design/      scripts e documentação do arquivo Figma deste app
public/
  fontes/      Brown Beige e Satoshi (da guia de marca)
  icones/      ícones do PWA, gerados do logo oficial
  marca/       logo e sub-marca em SVG
  produtos/    fotos do cardápio real
  sw.js        service worker (offline)
src/
  dados/clube.js          catálogo, níveis, missões, parceiros — fonte única enquanto não há API
  estado/ClubeProvider    saldo, resgates, vouchers, histórico (localStorage)
  rotas/useRota.js        roteador por hash
  componentes/            design system em React
  telas/                  uma tela por rota
  estilos/tokens.css      as variáveis do Figma viradas CSS
```

## Quando o backend entrar

Trocar só o `ClubeProvider`. As telas consomem `useClube()` e não sabem de onde vêm os dados.
Os pontos de integração são `resgatar()`, `registrarCompra()`, `avancarMissao()` e `entrar()`.

A economia de pontos vive em `src/dados/clube.js` e é **demonstrativa**: 2 pontos por real,
~20 pontos por R$ 1,00 de recompensa. O briefing manda que isso seja parametrizável no painel —
os números reais saem da conta de margem, não daqui.

## Publicar

**Web / PWA** — deploy do `dist/` na Vercel. O `vercel.json` já traz o cache das fontes e o
`no-cache` do service worker. No Android o app instala pela tela inicial com push funcionando;
no iPhone a instalação é manual e o push só vale depois de adicionar à tela de início.

**Lojas, via Capacitor** — o `capacitor.config.json` já está pronto:

```bash
npm install @capacitor/core @capacitor/cli
npx cap init          # já lê o capacitor.config.json
npm install @capacitor/android @capacitor/ios
npm run build && npx cap sync
npx cap open android  # Android Studio
npx cap open ios      # Xcode (precisa de Mac)
```

O mesmo código vira binário nas duas lojas, com push nativo por APNs e FCM. O `base: './'`
do Vite e as URLs relativas das fontes existem justamente para isso.

Contas necessárias: Apple Developer (US$ 99/ano) e Google Play (US$ 25, uma vez).
