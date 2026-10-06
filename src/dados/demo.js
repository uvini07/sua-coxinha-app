// ⚠️ TEMPORÁRIO — REMOVER ANTES DE PRODUÇÃO
//
// Login fixo para teste enquanto não existe backend de verificação. Sem ele,
// toda vez que alguém abre o app precisa digitar telefone e inventar um código
// de 4 dígitos que não é checado contra nada.
//
// Para remover tudo de uma vez:
//   1. apague este arquivo
//   2. em src/telas/Acesso.jsx, tire o import e troque os dois `useState`
//      marcados com "TEMPORÁRIO" pelos valores vazios que estão no comentário
//
// Está registrado também na seção "Antes de produção" do README.

export const MODO_TESTE = true

export const LOGIN_DE_TESTE = {
  telefone: '11971813986',
  // Código de verificação aceito. Não há SMS: qualquer código passa, este só
  // vem preenchido para não travar o teste.
  codigo: '1986',
}
