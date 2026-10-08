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

## Firebase

O app roda sobre o projeto **`suacoxinhaapp`**: login pelo Authentication, dados no
Firestore. Não há mais estado de demonstração — quem cria uma conta entra com a carteira
em zero e só ganha pontos quando uma compra é identificada.

```
src/firebase/config.js         chaves do projeto (públicas por natureza)
src/firebase/app.js            initializeApp, auth, db, analytics
src/firebase/autenticacao.js   Google, SMS e a tradução dos erros do Firebase
src/firebase/clube.js          leitura e escrita do Firestore
firestore.rules                quem alcança o quê
```

**Coleções**

```
usuarios/{uid}                     perfil, saldo, acumulado, progresso das missões
usuarios/{uid}/historico/{id}      extrato de pontos
usuarios/{uid}/vouchers/{id}       recompensas resgatadas
usuarios/{uid}/notificacoes/{id}   avisos do clube
```

O `uid` é o do Authentication, então telefone e Google caem na mesma conta se o
Firebase estiver com *account linking* por e-mail/telefone — hoje são duas contas
separadas, o que é o padrão do Firebase.

**Saldo é dinheiro.** Toda escrita que mexe em pontos passa por `runTransaction` ou
`increment`: duas abas abertas, ou o caixa e o app ao mesmo tempo, não gravam uma sobre a
outra, e dois toques no botão de resgate não geram dois vouchers com o saldo de um.

**O que precisa estar ligado no console** (já está, para `suacoxinhaapp`):

- Authentication → Sign-in method: **Google** e **Telefone** habilitados
- Authentication → Domínios autorizados: `localhost` e o domínio da Vercel.
  Sem isso o login pelo Google devolve `auth/unauthorized-domain`
- Firestore criado, com as regras deste repositório publicadas:
  `firebase deploy --only firestore:rules`
- Para testar SMS sem gastar envio: Authentication → Telefone → *Números de telefone para
  teste*, onde se cadastra um número e um código fixo

Para apontar o app para outro projeto (staging), copie `.env.example` para `.env.local` e
preencha as variáveis `VITE_FIREBASE_*`; elas têm prioridade sobre os valores padrão.

**Testar as regras antes de publicar**

```bash
npm run testar:regras
```

Sobe o emulador do Firestore e roda `testes/regras.test.mjs`: as 24 operações que o app
realmente faz (criar conta, creditar compra com `increment`, resgatar dentro de uma
transação, listar as subcoleções ordenadas) mais as que precisam ser recusadas — ler a
carteira alheia, criar conta já com pontos, escrever numa coleção fora do previsto. É um
comando só, não precisa de credencial e não toca no projeto de verdade.

Vale a pena rodar antes de cada `firebase deploy --only firestore:rules`: regra quebrada
só aparece quando um cliente não consegue entrar.

## Antes de produção

Três pendências conhecidas, as três fáceis de esquecer:

1. **Licença da fonte Brown Beige.** A versão na guia de marca é gratuita só para uso
   pessoal; uso comercial exige comprar. Detalhes e alternativas em [FONTES.md](FONTES.md).
2. **O cliente ainda credita os próprios pontos.** Enquanto não existe integração com o
   PDV, o botão "Simular leitura no caixa" grava saldo direto do navegador — ou seja, quem
   entende do assunto consegue se dar pontos. A correção está escrita e comentada no fim de
   `firestore.rules`: quando a Cloud Function do caixa entrar, saldo e extrato passam a ser
   escritos só pelo Admin SDK, e o cliente fica com leitura.
3. **Notificações são lidas, nunca criadas.** O app lê `usuarios/{uid}/notificacoes` e
   marca como lidas, mas ninguém escreve lá ainda. Quem vai criar é a mesma função do
   servidor (pontos creditados, pontos a expirar, nova recompensa).

## O que já funciona

Não é maquete clicável: o estado é real e vive na conta do cliente, no Firestore — entrar
em outro celular traz o mesmo saldo.

- Onboarding, login real por **SMS** ou **Google**, cadastro enxuto em duas etapas
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
  firebase/               autenticação e Firestore
  estado/ClubeProvider    traduz o Firebase na forma que as telas esperam
  rotas/useRota.js        roteador por hash
  componentes/            design system em React
  telas/                  uma tela por rota
  estilos/tokens.css      as variáveis do Figma viradas CSS
```

## Quando o PDV entrar

As telas consomem `useClube()` e não sabem de onde vêm os dados: a troca acontece dentro de
`src/firebase/clube.js`. O ponto de integração é `creditarCompra()` — hoje chamado pelo
botão da tela do QR, amanhã por uma Cloud Function que o caixa dispara com o `uid` lido do
QR Code (ou com o telefone informado no balcão).

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
