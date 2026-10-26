// Pontos de entrada do login do PDV (ver servico.js). Cada um é uma função
// chamável (onCall): o Firebase confere o token de quem chama antes de entrar.
//
// Domínios que podem chamar: os do PDV na Vercel e o localhost. Para um
// domínio próprio, ponha em PDV_ORIGENS (separados por vírgula) — o workflow
// grava a variável do GitHub com esse nome em functions/.env.

const { onCall } = require('firebase-functions/v2/https')
const { getFirestore } = require('firebase-admin/firestore')
const { getAuth } = require('firebase-admin/auth')
const { criarServico } = require('./servico.js')

let servico = null
const usar = () => (servico ??= criarServico({ db: getFirestore(), auth: getAuth() }))

const extras = String(process.env.PDV_ORIGENS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

const opcoes = {
  cors: [/pdvmarkfy[a-z0-9-]*\.vercel\.app$/, /^http:\/\/localhost(:\d+)?$/, ...extras],
  // O PBKDF2 do PIN é conta pesada de propósito: memória maior traz CPU maior.
  memory: '512MiB',
  timeoutSeconds: 30,
}

const chamavel = (nome) => onCall(opcoes, (req) => usar()[nome](req))

module.exports = {
  pdvEntrarGoogle: chamavel('entrarGoogle'),
  pdvOperadores: chamavel('operadores'),
  pdvEntrarPin: chamavel('entrarPin'),
  pdvConferirPin: chamavel('conferirPin'),
  pdvSupervisores: chamavel('supervisores'),
  pdvAutorizar: chamavel('autorizar'),
  pdvUsuarios: chamavel('listarUsuarios'),
  pdvSalvarUsuario: chamavel('salvarUsuario'),
  pdvDesbloquearUsuario: chamavel('desbloquearUsuario'),
  pdvSalvarPerfil: chamavel('salvarPerfil'),
  pdvRemoverPerfil: chamavel('removerPerfil'),
  pdvParear: chamavel('parear'),
  pdvTerminais: chamavel('listarTerminais'),
  pdvDesativarTerminal: chamavel('desativarTerminal'),
  pdvAcessos: chamavel('acessos'),
}
