// Regras puras do login do PDV: PIN, bloqueio e quem pode dar o quê a quem.
// Sem Firebase aqui dentro, para dar para testar sozinho (pdv/regras.test.js).
//
// O PIN é guardado como no PDV: PBKDF2-SHA256, 210 mil iterações, sal de 16
// bytes, tudo em base64. Só que agora o hash mora no servidor (pdv_segredos),
// que nenhum navegador lê — sem ele, não há como testar PINs fora da tela.

const { pbkdf2, randomBytes, timingSafeEqual } = require('node:crypto')
const { PERMISSOES } = require('./permissoes.js')

const ITERACOES = 210_000
const SESSAO_HORAS = 12

const derivar = (segredo, sal, iteracoes) =>
  new Promise((resolve, reject) =>
    pbkdf2(String(segredo), Buffer.from(sal, 'base64'), iteracoes, 32, 'sha256', (erro, bits) => (erro ? reject(erro) : resolve(bits))),
  )

async function criarCredencial(segredo) {
  const sal = randomBytes(16).toString('base64')
  return { hash: (await derivar(segredo, sal, ITERACOES)).toString('base64'), sal, iteracoes: ITERACOES }
}

async function conferirCredencial(segredo, credencial) {
  if (!credencial?.hash || !credencial?.sal) return false
  const calculado = await derivar(segredo, credencial.sal, credencial.iteracoes || ITERACOES)
  const guardado = Buffer.from(credencial.hash, 'base64')
  return guardado.length === calculado.length && timingSafeEqual(guardado, calculado)
}

// 4 a 6 dígitos, sem repetição (0000) nem sequência (1234, 9876).
function problemaNoPin(pin) {
  const p = String(pin ?? '')
  if (!/^\d{4,6}$/.test(p)) return 'O PIN precisa ter de 4 a 6 números.'
  if (/^(\d)\1+$/.test(p)) return 'O PIN não pode repetir o mesmo número.'
  if ('01234567890'.includes(p) || '09876543210'.includes(p)) return 'O PIN não pode ser uma sequência.'
  return null
}

// 5 erros = 1 min, 6 = 2 min, 7 = 4 min… até 30 min.
function tempoDeBloqueio(tentativas) {
  if (tentativas < 5) return 0
  return Math.min(30, 2 ** (tentativas - 5)) * 60_000
}

const minutosAte = (ms, agora) => Math.max(1, Math.ceil((ms - agora) / 60_000))

// --- Permissões ----------------------------------------------------------------

// O perfil do sistema (Administrador) tem tudo, inclusive o que surgir depois.
const permissoesDoPerfil = (perfil) => (perfil?.sistema ? PERMISSOES : perfil?.permissoes || [])

const pode = (usuario, perfil, permissao) => Boolean(usuario?.ativo) && permissoesDoPerfil(perfil).includes(permissao)

const acessaFilial = (usuario, filialId) => Boolean(usuario) && (usuario.todasFiliais === true || (usuario.filiais || []).includes(filialId))

const temRetaguarda = (perfil) => permissoesDoPerfil(perfil).some((p) => p.startsWith('admin.'))

// Ninguém dá o que não tem. Quem não é do perfil do sistema só atribui perfis
// cujas permissões ele mesmo tem, e só nas filiais dele.
function alcancaPerfil(autorPerfil, alvoPerfil) {
  if (autorPerfil?.sistema) return true
  if (!alvoPerfil || alvoPerfil.sistema) return false
  const minhas = permissoesDoPerfil(autorPerfil)
  return (alvoPerfil.permissoes || []).every((p) => minhas.includes(p))
}

function alcancaFiliais(autor, alvo) {
  if (autor?.todasFiliais) return true
  if (alvo.todasFiliais) return false
  return (alvo.filiais || []).every((f) => (autor?.filiais || []).includes(f))
}

// O autor pode mexer neste usuário (que já existe)? O dono da rede só é
// editado por ele mesmo; os outros, só se estiverem inteiros no alcance do autor.
function alcancaUsuario({ autor, autorPerfil }, { alvo, alvoPerfil }) {
  if (alvo.dono) return autor.id === alvo.id
  return alcancaPerfil(autorPerfil, alvoPerfil) && alcancaFiliais(autor, alvo)
}

// --- Entradas ------------------------------------------------------------------

const texto = (v, max) =>
  String(v ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)

const email = (v) => String(v ?? '').trim().toLowerCase()
const emailValido = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && v.length <= 120

// Ids do PDV: os do Firestore (20 letras e números) e os do cadastro local
// (f-max-morumbi, pdv-f-penha-1…).
const idValido = (v) => typeof v === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(v)

const permissaoValida = (p) => PERMISSOES.includes(p)

module.exports = {
  ITERACOES,
  SESSAO_HORAS,
  criarCredencial,
  conferirCredencial,
  problemaNoPin,
  tempoDeBloqueio,
  minutosAte,
  permissoesDoPerfil,
  pode,
  acessaFilial,
  temRetaguarda,
  alcancaPerfil,
  alcancaFiliais,
  alcancaUsuario,
  texto,
  email,
  emailValido,
  idValido,
  permissaoValida,
}
