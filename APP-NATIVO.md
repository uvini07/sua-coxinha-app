# App nativo — Android e iOS via Capacitor

O mesmo código da web vira app nas duas lojas. O Capacitor empacota o `dist/` num
projeto nativo; não há segunda base de código.

As pastas `android/` e `ios/` **não entram no repositório** (estão no `.gitignore`): elas
são geradas a partir do `capacitor.config.json` e do `package.json`. Quem clona o projeto
roda `npx cap add android` e tem o mesmo resultado.

> **Cuidado com isso:** arquivos que você colocar dentro de `android/` ou `ios/` à mão —
> `google-services.json`, esquemas de URL no `Info.plist`, ícones — somem se a pasta for
> apagada e regerada. Ou você guarda cópias fora e repete os passos abaixo, ou tira as
> duas linhas do `.gitignore` e passa a versionar as pastas. Para quem vai publicar nas
> lojas de verdade, versionar costuma ser o caminho menos doloroso.

## Por que o login é nativo

Na web o login do Google abre num popup. **Dentro do app isso não funciona:** o Google
recusa OAuth em WebView embutida (`disallowed_useragent`), e o redirect também morre,
porque `capacitor://localhost` não é um domínio que o Firebase aceite autorizar.

Por isso `src/firebase/autenticacao.js` tem dois caminhos. Na web, popup. No nativo,
`@capacitor-firebase/authentication` abre o seletor de contas do próprio aparelho,
devolve os tokens, e a credencial é montada com o SDK do app via `signInWithCredential`.
O resto do código não percebe diferença: a sessão é a mesma do `firebase/auth`.

O `sairDaConta()` encerra os dois lados. Se encerrasse só um, o login seguinte entraria
sozinho na conta anterior, sem passar pelo seletor.

## O que você precisa antes de começar

| | Android | iOS |
|---|---|---|
| Máquina | Windows, Mac ou Linux | **Mac** (Xcode não roda em outro sistema) |
| Ferramenta | Android Studio | Xcode + CocoaPods |
| Conta | Google Play, US$ 25 uma vez | Apple Developer, US$ 99/ano |

## Android

**1. Registre o app no Firebase.** Console → Configurações do projeto → Adicionar app →
Android. Nome do pacote exatamente `br.com.suacoxinha.pontosdourados` (é o `appId` do
`capacitor.config.json`; se os dois não baterem, o login falha sem explicar por quê).

**2. Baixe o `google-services.json`** e ponha em `android/app/google-services.json`.

**3. Cadastre as impressões digitais SHA-1.** Sem isso o login do Google devolve erro de
console de desenvolvedor. São duas, e esquecer a segunda é o erro clássico:

```bash
# a de depuração, para testar no seu computador
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey \
        -storepass android -keypass android

# a de produção: o Google Play re-assina o app, então a SHA-1 que vale é a do
# Play App Signing, em Play Console → Versão → Configuração → Assinatura de app
```

Cadastre as duas no Firebase → Configurações do projeto → seu app Android → Adicionar
impressão digital. Se funcionar no seu aparelho e quebrar depois de publicar, foi a
segunda que faltou.

**4. Gere e abra:**

```bash
npm install
npx cap add android      # só na primeira vez
npm run app:android      # build + sync + abre o Android Studio
```

No Android Studio: Run para instalar no aparelho, Build → Generate Signed Bundle para o
`.aab` que sobe na loja.

## iOS

**1. Registre o app no Firebase** (Adicionar app → iOS), mesmo bundle ID
`br.com.suacoxinha.pontosdourados`. Baixe o `GoogleService-Info.plist` e arraste para
dentro do projeto no Xcode, no grupo `App`.

**2. Esquema de URL.** Abra o `GoogleService-Info.plist`, copie o valor de
`REVERSED_CLIENT_ID` e registre em Xcode → App → Info → URL Types → novo item, campo URL
Schemes. **Sem isso o app fecha sozinho ao tentar entrar**, com uma mensagem sobre URL
schemes faltando.

**3. Entrar com Apple.** Xcode → Signing & Capabilities → `+` → Sign in with Apple. No
console do Firebase, habilite o provedor Apple (exige Service ID e chave criados no
portal do Apple Developer). Depois ligue o botão no app com `VITE_LOGIN_APPLE=true`.

> A App Store **exige** login da Apple em qualquer app que ofereça login social. Na
> prática: sem isso, o app é recusado na revisão.

**4. Gere e abra:**

```bash
npm install
npx cap add ios          # só na primeira vez
npm run app:ios          # build + sync + abre o Xcode
```

## O ciclo do dia a dia

Mudou código web? `npm run app:sync` — ele roda o `vite build` e copia o `dist/` para os
dois projetos nativos. Só é preciso mexer no Android Studio ou no Xcode para rodar no
aparelho, assinar e publicar.

Mudou `capacitor.config.json` ou instalou plugin? Também é `npm run app:sync`.

## Antes de publicar

- **Domínios autorizados no Firebase** não bloqueiam o app nativo (o login não passa por
  domínio), mas continuam valendo para a versão web.
- **Ícone e splash**: hoje saem do `public/icones/`. Para as lojas o caminho usual é o
  `@capacitor/assets`, que gera todos os tamanhos a partir de uma imagem só.
- **Push nativo** (APNs e FCM) ainda não está integrado — o app usa notificações do
  clube gravadas no Firestore, que não é a mesma coisa que push.
- A economia de pontos e a pendência do PDV descritas no [README](README.md) valem
  igual aqui: o app nativo roda o mesmo código, então o cliente também credita os
  próprios pontos até a função do caixa entrar.
