// Permissões do PDV (pdvmarkfy). Cópia de src/dados/permissoes.js do PDV: o
// servidor decide sozinho quem pode o quê, sem confiar no que a tela manda.
// Se uma permissão nova entrar lá, entra aqui também (e em PERMISSOES_NOVAS).

const PERMISSOES = [
  'caixa.vender',
  'caixa.abrir',
  'caixa.fechar',
  'caixa.sangria',
  'caixa.desconto',
  'caixa.descontoLivre',
  'caixa.cancelarItem',
  'caixa.cancelarVenda',
  'caixa.estornar',
  'caixa.reimprimir',
  'caixa.pausarProduto',
  'cozinha.ver',
  'admin.dashboard',
  'admin.cardapio',
  'admin.precos',
  'admin.estoque',
  'admin.financeiro',
  'admin.relatorios',
  'admin.pessoas',
  'admin.usuarios',
  'admin.config',
  'admin.salao',
  'admin.comunicados',
  'admin.auditoria',
  'admin.backup',
  'dados.cpfCompleto',
]

const CAIXA_BASICO = ['caixa.vender', 'caixa.abrir', 'caixa.fechar', 'caixa.cancelarItem', 'caixa.reimprimir', 'caixa.pausarProduto', 'caixa.desconto', 'cozinha.ver']

const PERFIS_PADRAO = [
  { id: 'perfil-admin', nome: 'Administrador', descricao: 'Franqueadora. Acesso total, em todas as filiais.', permissoes: PERMISSOES, sistema: true },
  {
    id: 'perfil-gerente',
    nome: 'Gerente',
    descricao: 'Franqueado ou gerente de loja. Caixa, cardápio, estoque e financeiro da própria filial.',
    permissoes: [
      ...CAIXA_BASICO,
      'caixa.sangria',
      'caixa.descontoLivre',
      'caixa.cancelarVenda',
      'caixa.estornar',
      'admin.dashboard',
      'admin.cardapio',
      'admin.precos',
      'admin.estoque',
      'admin.financeiro',
      'admin.relatorios',
      'admin.pessoas',
      'admin.salao',
      'dados.cpfCompleto',
    ],
    sistema: false,
  },
  { id: 'perfil-atendente', nome: 'Atendente', descricao: 'Opera o caixa da loja.', permissoes: CAIXA_BASICO, sistema: false },
  { id: 'perfil-cozinha', nome: 'Cozinha', descricao: 'Só a tela da cozinha.', permissoes: ['cozinha.ver'], sistema: false },
]

// Permissões criadas depois da primeira versão: entram uma única vez nos
// perfis padrão já gravados; se o administrador tirar depois, não voltam.
const PERMISSOES_NOVAS = [{ chave: 'admin.salao', perfis: ['perfil-gerente'] }]

module.exports = { PERMISSOES, PERFIS_PADRAO, PERMISSOES_NOVAS }
