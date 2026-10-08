# Arquivos de configuração do Firebase

Ponha aqui os arquivos que o console do Firebase gera, e faça commit:

| Arquivo | Onde pegar | Para que serve |
|---|---|---|
| `google-services.json` | Firebase → Configurações do projeto → app **Android** → Baixar | login com Google no APK |
| `GoogleService-Info.plist` | Firebase → Configurações do projeto → app **iOS** → Baixar | login com Google no app iOS |

O build do GitHub Actions procura por eles aqui. Alternativa: guardar o conteúdo
nos secrets `GOOGLE_SERVICES_JSON` e `GOOGLE_SERVICE_INFO_PLIST`, que têm
prioridade sobre os arquivos.

## Isto pode mesmo ficar no repositório?

Pode. Não são credenciais secretas: os dois viajam **dentro de cada app publicado**,
de onde qualquer pessoa extrai em um minuto. A mesma configuração já está em
`src/firebase/config.js`, visível no bundle do site. Quem protege os dados dos
clientes são as regras do Firestore (`firestore.rules`) e a autenticação — não o
sigilo destes arquivos.

O que **nunca** entra aqui: a chave de assinatura de produção (`.keystore` ou
`.jks`) e qualquer chave de serviço do Firebase Admin. Essas são credenciais de
verdade.
