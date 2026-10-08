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

## Baixar o app pronto, sem instalar nada

O repositório compila sozinho no GitHub Actions. Não é preciso ter Android Studio,
Xcode nem Mac para ter o APK na mão.

**Android — instala no celular, direto:**

```
https://github.com/uvini07/sua-coxinha-app/releases/download/apk-teste/pontos-dourados.apk
```

Abra no navegador do Android, baixe e toque no arquivo. O link não muda: cada build do
`main` sobrescreve o arquivo, então ele sempre serve a última versão.

> O anexo da execução (Actions → Artifacts) **não** serve para instalar no celular:
> exige conta no GitHub e entrega um `.zip`, e o Android não instala APK de dentro de
> zip. Ele fica só como histórico.

**iOS — compila, mas não instala.** O workflow `ios.yml` roda sob demanda (Actions →
Build iOS → Run workflow) e prova que o código compila, pegando erro de Swift, de plugin
nativo ou de SPM sem precisar de um Mac. O resultado é um build de **simulador**: não
existe link de download para iPhone, porque a Apple exige certificado de conta paga para
qualquer app rodar num aparelho. Com a conta, o caminho é TestFlight e o workflow ganha
os passos de assinatura.

**Para o login funcionar nos builds**, os arquivos do Firebase precisam chegar até o
servidor que compila. Há dois caminhos, e o mais simples é o primeiro:

1. **Guardar no repositório**, em `firebase/` — veja [firebase/LEIA-ME.md](firebase/LEIA-ME.md).
   Não são credenciais secretas: viajam dentro de cada app publicado.
2. **Guardar como secret**, se preferir não versionar. O secret tem prioridade sobre o
   arquivo.

A chave de assinatura é diferente: essa **só** como secret, nunca no repositório.

Os secrets, se optar por eles (Settings → Secrets and variables → Actions):

| Secret | De onde vem | Sem ele |
|---|---|---|
| `GOOGLE_SERVICES_JSON` | Firebase → app Android | o APK abre, o login falha |
| `ANDROID_DEBUG_KEYSTORE_BASE64` | a chave de teste, em base64 | a SHA-1 muda a cada build e o login quebra sozinho |
| `GOOGLE_SERVICE_INFO_PLIST` | Firebase → app iOS | compila, o login falha |

### Por que a chave de assinatura precisa ser fixa

O Google só aceita o login se a impressão digital (SHA-1) da chave que assinou o app
estiver cadastrada no Firebase. Num build local isso é estável, porque a chave de
depuração mora no seu computador. **Num servidor de CI, não:** sem uma chave fornecida,
o Gradle gera uma nova a cada execução, a SHA-1 muda e o login passa a falhar sem ninguém
ter mexido em nada.

Por isso o workflow carrega a chave de um secret. Para gerar a sua:

```bash
keytool -genkeypair -v \
  -keystore pd-debug.keystore -storetype PKCS12 \
  -alias androiddebugkey -storepass android -keypass android \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=Pontos Dourados Teste, O=Sua Coxinha, L=Cajamar, ST=SP, C=BR"

base64 -w0 pd-debug.keystore    # cole a saída no secret
```

O alias e a senha seguem a convenção do Android (`androiddebugkey` / `android`), que é
o que faz o Gradle usar o arquivo sem configuração extra. **É chave de teste**: a versão
da loja usa outra, guardada com cuidado, e a SHA-1 que vale lá é a do Play App Signing.

A cada build o workflow imprime a SHA-1 do APK no resumo da execução, já formatada para
colar no Firebase — não é preciso descobrir por conta própria.

## O que você precisa antes de começar

| | Android | iOS |
|---|---|---|
| Máquina | Windows, Mac ou Linux | **Mac** (Xcode não roda em outro sistema) |
| Ferramenta | Android Studio | Xcode |
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

> O Capacitor 8 resolve as dependências nativas por **Swift Package Manager**: todo
> plugin traz um `Package.swift`. Não há CocoaPods, nem `Podfile`, nem `pod install`
> neste projeto — tutorial que mande rodar `pod install` é de versão anterior.

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
