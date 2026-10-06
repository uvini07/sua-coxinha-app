# Scripts de conclusão — Pontos Dourados no Figma

Arquivo Figma: https://www.figma.com/design/kZqZYvHdqiOKQ0GovrT9Yd
`fileKey`: `kZqZYvHdqiOKQ0GovrT9Yd`

Estes scripts terminam o app: **32 telas** e as **3 seções de documentação**, somando
43 telas no arquivo. Foram escritos e validados offline porque o plano Starter do Figma
dá 20 chamadas de MCP por mês e elas acabaram — a ideia é que, quando a cota voltar,
nenhuma chamada seja gasta com erro.

## Como rodar

```bash
cd figma-scripts
python build.py      # junta _prelude.js + parts/*.js em out/
python lint.py       # confere componentes, ícones, estilos e tokens
node verify.cjs      # executa tudo num runtime falso do Figma
```

Depois é uma chamada `use_figma` por arquivo de `out/`, **na ordem**, passando o conteúdo
do arquivo como parâmetro `code` e `fileKey` acima. Mande `skillNames` como
`resource:figma-use,resource:figma-generate-design`.

| Ordem | Arquivo | O que cria |
|---|---|---|
| 1 | `p1-carteira-missoes.js` | D · Carteira (3) · E · Missões Douradas (3) |
| 2 | `p2-recompensas-resgate.js` | F · Recompensas & Resgate (5) |
| 3 | `p3-clube-qr-perfil.js` | G · Clube (3) · H · QR Code (2) · I · Perfil (3) |
| 4 | `p4-notif-niveis-estados.js` | J · Notificações (1) · K · Níveis (2) · L · Estados (4) |
| 5 | `p5-cover-marca-tokens.js` | Página 00: Cover, Marca & Fundamentos, Design Tokens |
| 6 | `p6-futuro-comunidade.js` | Página 02: Comunidade, Fase 4 (6) |

Cada script é independente e troca de página uma única vez, como o Figma exige.
Rodar duas vezes duplica as seções — se precisar repetir, apague a seção criada antes.

Reserve 3 ou 4 chamadas de `get_screenshot` para conferir o resultado.
Total estimado: **9 a 10 chamadas**.

## Como está organizado

- `_prelude.js` — helpers compartilhados: construtor de nós (`N`), paleta, gradientes,
  índice de componentes e ícones, fábricas de tela (`scr`, `appbar`, `nav`, `chips`, `botao`).
  Não roda sozinho.
- `parts/*.js` — o conteúdo de cada grupo de telas.
- `out/*.js` — o que você cola no `use_figma`. Gerado, não edite.
- `mock-figma.cjs` — runtime falso com o inventário real do arquivo.
- `verify.cjs` — roda os scripts contra o runtime falso.
- `lint.py` — confere nomes contra o inventário.

## Duas armadilhas que já foram resolvidas

**Não se adiciona nem remove filho dentro de uma instância.** O Figma proíbe. Para trocar
o ícone de uma instância use `swapIcon(escopo, nome, cor, índice)`, que chama
`swapComponent` no ícone aninhado — o override que o Figma aceita. O `mock-figma.cjs`
faz valer essa regra, então uma regressão quebra o `verify.cjs` em vez de quebrar no arquivo.

**Frames de auto-layout nascem com preenchimento branco.** O construtor `N` já zera isso.
Ao escrever um frame novo fora do `N`, defina `fills` explicitamente.

## Limites do plano Starter

- 3 páginas por arquivo — a hierarquia pedida virou *Sections* dentro das páginas
- 1 modo por coleção de variáveis — por isso ainda não existe modo Claro
- 20 chamadas de MCP por mês (Professional: 200/dia)
