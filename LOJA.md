# Publicar na Play Store

Tudo o que a ficha da loja pede, pronto para copiar, e a ordem dos passos.
O que depende de conta, pagamento ou documento da empresa está marcado como
**(vocês)**.

## 1. Antes de tudo

- [ ] **(vocês)** Conta no [Google Play Console](https://play.google.com/console),
      US$ 25 uma vez. Abra como **organização**, no CNPJ da Sua Coxinha: conta
      pessoal nova só libera o app ao público depois de um teste fechado com 12
      pessoas por 14 dias. Organização exige número D-U-N-S (gratuito, pedido
      em [dnb.com](https://www.dnb.com/duns-number/get-a-duns.html), leva alguns dias).
- [ ] **(vocês)** Publicar as regras do Firestore: Firebase → Firestore →
      Regras → colar `firestore.rules` → Publicar.
- [ ] **(vocês)** Conferir o e-mail de contato das páginas legais. Hoje é o
      do admin; se a Sua Coxinha tiver um e-mail próprio para isso, troque em
      `public/legal/*.html`.

## 2. Chave de upload e o arquivo .aab

A chave de upload já foi gerada e entregue fora do repositório (arquivo
`pontos-dourados-upload.jks`, a senha e o base64). **Guarde o .jks e a senha
num lugar seguro** — sem eles, a troca da chave tem de ser pedida ao suporte do
Google.

1. Em GitHub → Settings → Secrets and variables → Actions, crie:
   - `ANDROID_UPLOAD_KEYSTORE_BASE64` — o conteúdo do arquivo base64
   - `ANDROID_UPLOAD_KEYSTORE_SENHA` — a senha
2. Actions → **Versão para a Play Store** → Run workflow.
3. Ao terminar, baixe o `.aab` em **Artifacts**, no fim da página da execução.

Cada execução sobe o `versionCode` sozinho. O nome da versão que o cliente vê
é o `version` do `package.json` (hoje `0.1.0`); troque para `1.0.0` no
primeiro lançamento público.

## 3. Login com Google na versão da loja

Na loja o app chega assinado pela chave da Google, não pela de upload. Depois
do primeiro envio:

1. Play Console → o app → **Configuração → Integridade do app** → aba
   *Assinatura de apps*.
2. Copie a **SHA-1 da chave de assinatura de app** (e também a da chave de
   upload, que está no mesmo lugar).
3. Firebase → Configurações do projeto → app Android → **Adicionar impressão
   digital** → cole cada uma.
4. Baixe o `google-services.json` de novo e substitua em `firebase/`.

Sem isso o login funciona no APK de teste e **falha na versão da loja**.

## 4. Ficha da loja

**Nome do app** (até 30): `Pontos Dourados – Sua Coxinha`

**Descrição curta** (até 80):

```
Junte pontos em cada compra na Sua Coxinha e troque por coxinhas e combos.
```

**Descrição completa:**

```
Pontos Dourados é o clube de fidelidade da Sua Coxinha. Sua compra vale ouro: cada real gasto nas lojas da rede vira pontos, e os pontos viram coxinha, combo e doce.

COMO FUNCIONA
• Entre com sua conta Google em segundos, sem senha nova.
• No caixa, mostre o seu QR Code ou informe o telefone.
• Os pontos caem na hora na sua carteira.
• Troque os pontos por recompensas do catálogo e receba um voucher para usar na loja.

SUA CARTEIRA
• Saldo e extrato de cada ponto ganho e resgatado.
• Vouchers ativos sempre à mão.
• Avisos de pontos creditados.

NÍVEIS
Quanto mais você volta, mais sobe: Bronze, Prata, Ouro e Diamante. O nível acompanha o total de pontos que você já juntou e nunca desce.

PARA A EQUIPE DAS LOJAS
Funcionários e franqueados cadastrados usam o mesmo app para registrar compras, validar vouchers e acompanhar metas e missões da equipe.

Participar é gratuito. Pontos e vouchers não têm valor em dinheiro.
```

**Categoria:** Comer e beber · **Tags:** fidelidade, recompensas, restaurante

**E-mail de contato:** o mesmo das páginas legais.

**Política de privacidade:**
`https://uvini07.github.io/sua-coxinha-app/legal/privacidade.html`

**Imagens** (em `loja/imagens/`):

| Item | Arquivo |
|---|---|
| Ícone 512×512 | `icone-512.png` |
| Imagem de destaque 1024×500 | `destaque-1024x500.png` |
| Capturas do celular (1080×1920) | `print-1-home.png` … `print-6-perfil.png` |

As capturas são das telas reais, com uma cliente fictícia (Mariana) e saldo de
exemplo.

## 5. Conteúdo do app (questionários do Play Console)

**Acesso ao app:** o app exige login. Informe ao revisor uma conta Google de
teste já cadastrada no clube, ou explique: *"Toque em Entrar com Google com
qualquer conta Google; o cadastro leva 30 segundos."*

**Anúncios:** não contém anúncios.

**Classificação de conteúdo:** categoria *Utilitário, produtividade,
comunicação ou outro*. Responda **não** para violência, sexo, linguagem,
drogas, jogos de azar. Não há compras com dinheiro real no app. Resultado
esperado: Livre.

**Público-alvo:** 13 anos ou mais (não marque faixas de crianças).

**App de notícias / governo / saúde / financeiro:** não.

**Exclusão de conta:**
- No app: Perfil → Excluir minha conta.
- Link para a web: `https://uvini07.github.io/sua-coxinha-app/legal/excluir-conta.html`

### Segurança dos dados

Coleta de dados: **sim**. Criptografia em trânsito: **sim**. O usuário pode
pedir exclusão: **sim**. Nenhum dado é compartilhado com terceiros (o Firebase
processa em nome da Sua Coxinha, o que a Google não conta como
compartilhamento).

| Tipo de dado | Coletado | Obrigatório | Para quê |
|---|---|---|---|
| Nome | sim | sim | Funcionalidade do app, gerenciamento da conta |
| E-mail | sim | sim | Gerenciamento da conta |
| Telefone | sim | sim | Funcionalidade do app (identificação no caixa) |
| Outras informações (data de nascimento) | sim | não | Funcionalidade do app |
| Histórico de compras | sim | sim | Funcionalidade do app (pontos) |
| Fotos (foto de perfil do Google) | sim | não | Gerenciamento da conta |
| Interações no app (Analytics) | sim | sim | Análise |
| IDs do dispositivo ou outros (Analytics) | sim | sim | Análise |
| Diagnóstico (falhas) | sim | sim | Análise |

Câmera: usada só pela equipe para ler QR Code, sem gravar nem enviar imagem —
não entra na tabela.

## 6. Enviar

1. Play Console → Criar app → nome, idioma **português (Brasil)**, *App*,
   *Gratuito*.
2. Preencha as seções 4 e 5.
3. **Testar e lançar → Teste interno** → criar versão → enviar o `.aab` → dar
   as SHA-1 ao Firebase (seção 3) → instalar pelo link de teste e confirmar o
   login.
4. Com tudo certo: **Produção** → promover a versão → enviar para revisão. A
   primeira revisão costuma levar de 1 a 7 dias.
