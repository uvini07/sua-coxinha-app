# Pontos Dourados — App Mobile · estado do Figma

Arquivo: https://www.figma.com/design/kZqZYvHdqiOKQ0GovrT9Yd
`fileKey`: `kZqZYvHdqiOKQ0GovrT9Yd`

Documentação completa do conceito: `Obsidian Vault/10-Projetos/Pontos Dourados — App Mobile.md`
Ledger de IDs para retomada: `figma-state.json` no scratchpad da sessão.

## Pronto no arquivo

**Fundação**
- 83 variáveis em 4 coleções (`Primitivas`, `Cor`, `Espaço`, `Raio`), com escopos e *code syntax* web
- 16 estilos de texto · 6 estilos de efeito (incluindo `Brilho/Ouro`)
- 20 assets da marca e do cardápio importados (logos SVG editáveis + fotos reais)

**Componentes** — página `00 — Design System`, section `◆ Componentes`
- 43 ícones de traço (24px, peso 1.7)
- Botão (8 variantes), Chip (2), Pílula de Status (3), Selo de Nível (4), Avatar (2),
  Campo de Texto (4), Card de Missão (3), Card de Recompensa (2),
  Linha de Histórico (4), Linha de Notificação (2), Navegação Inferior (4)
- Cartão Dourado, Card de Parceiro, Barra de Progresso, Cabeçalho de Seção,
  Barra de Status, App Bar, Item de Menu, Voucher · QR, Toast de Conquista, Logo, Gota

**Telas** — página `01 — App · Fluxos`
- `A · Abertura & Onboarding` — Splash + 4 telas de onboarding ✅ verificado
- `B · Acesso` — Boas-vindas, Código, Cadastro, Termos ✅ construído
- `C · Home` — Home + continuação ⚠️ construído, **sem verificação visual** (limite atingido antes do screenshot)

## Bloqueio

Plano Figma **Starter**: 20 chamadas de MCP por mês — esgotadas.
O plano também limitou o arquivo a 3 páginas e 1 modo por coleção de variáveis.

Professional: 200 chamadas/dia.

## Falta construir

| Section | Telas |
|---|---|
| D · Carteira | Carteira, Histórico completo, Detalhe de transação |
| E · Missões | Lista, Detalhe, Missão concluída |
| F · Recompensas & Resgate | Catálogo, Detalhe, Confirmar resgate, Resgate concluído, Meus vouchers |
| G · Clube | Clube home, Categoria, Detalhe do parceiro |
| H · QR Code | Meu QR, Pontos creditados |
| I · Perfil | Perfil, Dados pessoais, Configurações |
| J · Notificações | Notificações |
| K · Níveis | Trilha de níveis, Subiu de nível |
| L · Estados | Vazio, Erro, Carregando |
| Página 00 | Cover, Marca & Fundamentos, Design Tokens (specimen) |
| Página 02 | Futuro · Comunidade (6 telas conceituais) |

**Já está tudo escrito e validado** em `figma-scripts/` — seis scripts prontos para
`use_figma`, cobrindo as 32 telas restantes e as 3 seções de documentação.

Validação feita offline, sem gastar cota:
- `lint.py` confere cada componente, variante, ícone, estilo e token contra o inventário real
- `verify.cjs` executa os seis scripts num runtime falso do Figma e conferiu 32 telas criadas

Dois defeitos reais foram achados nessa validação e corrigidos antes de qualquer chamada:
troca de ícone por `appendChild` dentro de instância (proibido pelo Figma — agora usa
`swapComponent`) e dois textos sem nome que faziam overrides falharem em silêncio.

Estimativa para concluir: **9 a 10 chamadas** — 6 de `use_figma` e 3 a 4 screenshots.
Instruções em `figma-scripts/README.md`.

## Fontes

Oficiais: **Brown Beige** (títulos) e **Satoshi** (texto) — nenhuma instalada no Figma.
Em uso: **Baloo 2** e **Poppins**, os equivalentes mais próximos disponíveis.

Para trocar: instalar `guia_de_marca/Brown Beige.otf` e `guia_de_marca/Satoshi_Complete/Fonts/OTF/*`
no sistema e usar *Substituir fonte* no Figma. Os estilos de texto já carregam toda a
hierarquia, então a troca não quebra nenhum layout.
