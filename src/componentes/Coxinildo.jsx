// O Coxinildo, mascote da Sua Coxinha, vestido do jeito que o cliente quiser.
// É o avatar do clube: no lugar de foto de perfil, cada cliente monta o seu.
//
// A ilustração do mascote é a original (produtos/mascote.webp); os acessórios
// são desenhados por cima, num SVG com o mesmo sistema de coordenadas da
// imagem (368 × 424). As medidas abaixo vêm do próprio desenho:
//
//   ponta da cabeça ≈ (200, 5) · olhos em (160, 184) e (232, 184), raio ≈ 24
//   cabeça com ~125 px de largura na altura y = 85 · boca em y ≈ 240
//
// Formato salvo no perfil: { cabeca, oculos, extra } — cada um o id de um
// acessório ou 'nenhum'.

const MASCOTE = `${import.meta.env.BASE_URL}produtos/mascote.webp`

export const AVATAR_PADRAO = { cabeca: 'nenhum', oculos: 'nenhum', extra: 'nenhum' }

// Duas molduras: o corpo inteiro (editor) ou só a cabeça (avatares redondos).
// Ambas têm folga em cima para chapéu e cabelo.
const ENQUADRAMENTO = {
  corpo: '-26 -78 420 510',
  rosto: '22 -66 324 340',
}

const ESCURO = '#1c1c1e'

const CABECA = {
  bone: {
    nome: 'Boné',
    desenho: (
      <g>
        <path d="M126 92 C124 22 162 -16 200 -16 C240 -16 276 22 274 92 Z" fill="#d7262b" />
        <path d="M126 92 C124 22 162 -16 200 -16 C176 10 170 50 172 92 Z" fill="#000" opacity="0.12" />
        <path d="M196 78 Q284 64 330 92 Q300 112 200 100 Z" fill="#a8151a" />
        <rect x="124" y="80" width="152" height="14" rx="7" fill="#b51a1f" />
        <circle cx="200" cy="-14" r="7" fill="#a8151a" />
        <path d="M200 26 c-8 10 -12 16 -12 22 a12 12 0 0 0 24 0 c0 -6 -4 -12 -12 -22 z" fill="#fff" />
      </g>
    ),
  },
  'bone-ouro': {
    nome: 'Boné dourado',
    desenho: (
      <g>
        <defs>
          <linearGradient id="cx-ouro" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffeb4a" />
            <stop offset="0.5" stopColor="#f9c115" />
            <stop offset="1" stopColor="#c98a0a" />
          </linearGradient>
        </defs>
        <path d="M126 92 C124 22 162 -16 200 -16 C240 -16 276 22 274 92 Z" fill="url(#cx-ouro)" />
        <path d="M204 78 Q116 64 70 92 Q100 112 200 100 Z" fill="#c98a0a" />
        <rect x="124" y="80" width="152" height="14" rx="7" fill="#e0a50c" />
        <circle cx="200" cy="-14" r="7" fill="#c98a0a" />
        <text x="200" y="58" textAnchor="middle" fontSize="34" fontWeight="900" fill="#462302" fontFamily="system-ui">
          PD
        </text>
      </g>
    ),
  },
  cartola: {
    nome: 'Cartola',
    desenho: (
      <g>
        <ellipse cx="200" cy="66" rx="88" ry="16" fill={ESCURO} />
        <path d="M148 64 L152 -58 Q200 -70 248 -58 L252 64 Z" fill="#26262a" />
        <path d="M150 34 L250 34 L251 56 L149 56 Z" fill="#f9c115" />
        <path d="M152 -58 Q200 -70 248 -58 Q200 -48 152 -58 Z" fill="#3a3a40" />
      </g>
    ),
  },
  chef: {
    nome: 'Chapéu de chef',
    desenho: (
      <g stroke="#d9d6cf" strokeWidth="3">
        <circle cx="160" cy="6" r="34" fill="#fff" />
        <circle cx="240" cy="6" r="34" fill="#fff" />
        <circle cx="200" cy="-18" r="40" fill="#fff" />
        <rect x="146" y="20" width="108" height="56" rx="8" fill="#fff" />
        <path d="M172 26 V70 M200 26 V70 M228 26 V70" stroke="#e6e3dc" />
      </g>
    ),
  },
  coroa: {
    nome: 'Coroa',
    desenho: (
      <g>
        <path d="M144 70 L140 4 L172 34 L200 -18 L228 34 L260 4 L256 70 Z" fill="url(#cx-coroa)" stroke="#a86f04" strokeWidth="3" strokeLinejoin="round" />
        <defs>
          <linearGradient id="cx-coroa" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffeb4a" />
            <stop offset="1" stopColor="#e0a50c" />
          </linearGradient>
        </defs>
        <rect x="142" y="56" width="116" height="16" rx="4" fill="#c98a0a" />
        <circle cx="200" cy="40" r="9" fill="#d7262b" />
        <circle cx="166" cy="48" r="6" fill="#2e7de0" />
        <circle cx="234" cy="48" r="6" fill="#2e7de0" />
        <circle cx="140" cy="4" r="6" fill="#fff4c2" />
        <circle cx="200" cy="-18" r="7" fill="#fff4c2" />
        <circle cx="260" cy="4" r="6" fill="#fff4c2" />
      </g>
    ),
  },
  cowboy: {
    nome: 'Chapéu de cowboy',
    desenho: (
      <g>
        <path d="M78 74 Q90 98 200 98 Q310 98 322 74 Q300 84 200 84 Q100 84 78 74 Z" fill="#7a4a1e" />
        <path d="M148 80 C140 20 160 -16 180 -10 Q200 4 220 -10 C240 -16 260 20 252 80 Z" fill="#9b6129" />
        <path d="M150 62 Q200 72 250 62 L252 80 Q200 88 148 80 Z" fill="#4a2a0c" />
        <path d="M180 -10 Q200 4 220 -10 Q200 20 180 -10 Z" fill="#7a4a1e" />
      </g>
    ),
  },
  gorro: {
    nome: 'Gorro',
    desenho: (
      <g>
        <path d="M130 98 C126 18 164 -14 200 -14 C236 -14 274 18 270 98 Z" fill="#2f6fd6" />
        <path d="M165 -4 V84 M200 -14 V84 M235 -4 V84" stroke="#255bb3" strokeWidth="6" strokeLinecap="round" />
        <rect x="124" y="76" width="152" height="32" rx="14" fill="#1f4f9e" />
        <circle cx="200" cy="-24" r="18" fill="#f9c115" />
      </g>
    ),
  },
  festa: {
    nome: 'Chapéu de festa',
    desenho: (
      <g>
        <path d="M156 72 L204 -60 L248 72 Z" fill="#e8336d" />
        <path d="M172 28 L232 28 M164 50 L240 50 M186 -8 L220 -8" stroke="#f9c115" strokeWidth="9" strokeLinecap="round" />
        <circle cx="204" cy="-62" r="12" fill="#f9c115" />
        <ellipse cx="202" cy="72" rx="50" ry="8" fill="#c21f55" />
      </g>
    ),
  },
  topete: {
    nome: 'Topete',
    desenho: (
      <path
        d="M152 70 C140 30 160 -18 206 -30 C238 -38 262 -18 250 4 C272 2 282 30 262 52 C252 40 236 36 226 44 C214 30 194 30 182 44 C172 40 160 50 152 70 Z"
        fill="#3b2412"
      />
    ),
  },
  black: {
    nome: 'Black power',
    desenho: (
      <g fill="#2a190c">
        <circle cx="200" cy="-2" r="62" />
        <circle cx="140" cy="40" r="44" />
        <circle cx="260" cy="40" r="44" />
        <circle cx="160" cy="-20" r="38" />
        <circle cx="240" cy="-20" r="38" />
        <circle cx="118" cy="82" r="30" />
        <circle cx="282" cy="82" r="30" />
        <circle cx="185" cy="-30" r="10" fill="#3d2513" />
        <circle cx="236" cy="10" r="9" fill="#3d2513" />
      </g>
    ),
  },
  moicano: {
    nome: 'Moicano',
    desenho: (
      <path
        d="M182 70 L170 26 L188 34 L180 -12 L198 2 L198 -46 L212 0 L226 -16 L220 30 L238 22 L222 70 Z"
        fill="#e8336d"
        stroke="#b51a4b"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    ),
  },
  laco: {
    nome: 'Laço',
    desenho: (
      <g>
        <path d="M232 38 L196 6 Q188 40 206 56 Z" fill="#ff5d9e" />
        <path d="M240 38 L278 8 Q288 42 266 58 Z" fill="#ff5d9e" />
        <circle cx="236" cy="40" r="12" fill="#e8336d" />
      </g>
    ),
  },
}

const lente = 'rgba(255,255,255,0.18)'

const OCULOS = {
  redondo: {
    nome: 'Redondo',
    desenho: (
      <g fill={lente} stroke={ESCURO} strokeWidth="6">
        <circle cx="160" cy="184" r="31" />
        <circle cx="234" cy="184" r="31" />
        <path d="M191 182 Q197 174 203 182" fill="none" />
        <path d="M129 180 L98 170 M265 180 L300 170" fill="none" strokeLinecap="round" />
      </g>
    ),
  },
  escuro: {
    nome: 'Escuro',
    desenho: (
      <g>
        <path d="M124 168 Q160 158 192 168 Q194 206 160 212 Q122 208 124 168 Z" fill="#111" />
        <path d="M202 168 Q234 158 270 168 Q272 208 234 212 Q200 206 202 168 Z" fill="#111" />
        <path d="M192 172 Q197 166 202 172" stroke="#111" strokeWidth="6" fill="none" />
        <path d="M124 170 L96 162 M270 170 L302 162" stroke="#111" strokeWidth="6" strokeLinecap="round" />
        <path d="M138 176 L152 172 M216 176 L230 172" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
      </g>
    ),
  },
  coracao: {
    nome: 'Coração',
    desenho: (
      <g fill="#ff4f8b" stroke="#c21f55" strokeWidth="4" strokeLinejoin="round">
        <path d="M160 214 C120 190 124 160 144 158 C154 157 160 166 160 172 C160 166 166 157 176 158 C196 160 200 190 160 214 Z" />
        <path d="M234 214 C194 190 198 160 218 158 C228 157 234 166 234 172 C234 166 240 157 250 158 C270 160 274 190 234 214 Z" />
        <path d="M194 176 L200 176 M130 176 L100 168 M266 176 L298 168" fill="none" strokeLinecap="round" />
      </g>
    ),
  },
  nerd: {
    nome: 'Nerd',
    desenho: (
      <g fill={lente} stroke={ESCURO} strokeWidth="9">
        <rect x="126" y="158" width="66" height="52" rx="12" />
        <rect x="204" y="158" width="66" height="52" rx="12" />
        <path d="M192 180 L204 180 M126 174 L98 166 M270 174 L300 166" fill="none" strokeLinecap="round" />
      </g>
    ),
  },
  estrela: {
    nome: 'Estrela',
    desenho: (
      <g fill="#f9c115" stroke="#c98a0a" strokeWidth="4" strokeLinejoin="round">
        <path d="M160 150 L169 172 L192 172 L174 187 L181 210 L160 196 L139 210 L146 187 L128 172 L151 172 Z" />
        <path d="M234 150 L243 172 L266 172 L248 187 L255 210 L234 196 L213 210 L220 187 L202 172 L225 172 Z" />
        <path d="M128 174 L100 166 M266 174 L298 166" fill="none" strokeLinecap="round" />
      </g>
    ),
  },
  visor: {
    nome: 'Visor gamer',
    desenho: (
      <g>
        <path d="M112 166 Q197 146 284 166 L280 204 Q197 188 116 204 Z" fill="#1fe0ff" opacity="0.85" stroke="#0b7d99" strokeWidth="5" strokeLinejoin="round" />
        <path d="M130 174 Q197 160 266 174" stroke="#fff" strokeWidth="4" opacity="0.6" fill="none" strokeLinecap="round" />
      </g>
    ),
  },
}

const EXTRA = {
  bigode: {
    nome: 'Bigode',
    desenho: (
      <path
        d="M196 222 C186 210 164 212 156 226 C150 236 160 244 166 236 C172 228 184 232 196 230 C208 232 220 228 226 236 C232 244 242 236 236 226 C228 212 206 210 196 222 Z"
        fill="#3b2412"
      />
    ),
  },
  gravata: {
    nome: 'Gravata borboleta',
    desenho: (
      <g>
        <path d="M200 322 L166 304 L168 342 Z" fill="#d7262b" />
        <path d="M200 322 L236 304 L234 342 Z" fill="#d7262b" />
        <rect x="190" y="312" width="20" height="20" rx="6" fill="#a8151a" />
      </g>
    ),
  },
  fone: {
    nome: 'Fone',
    desenho: (
      <g>
        <path d="M86 176 C80 60 140 20 200 20 C260 20 320 60 314 176" fill="none" stroke={ESCURO} strokeWidth="14" strokeLinecap="round" />
        <rect x="64" y="150" width="36" height="66" rx="16" fill="#e8336d" />
        <rect x="300" y="150" width="36" height="66" rx="16" fill="#e8336d" />
      </g>
    ),
  },
  estrelinhas: {
    nome: 'Brilho',
    desenho: (
      <g fill="#ffeb4a">
        <path d="M70 120 l7 17 17 7 -17 7 -7 17 -7 -17 -17 -7 17 -7 z" />
        <path d="M322 90 l5 12 12 5 -12 5 -5 12 -5 -12 -12 -5 12 -5 z" />
        <path d="M330 220 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4 z" />
      </g>
    ),
  },
}

export const CATEGORIAS_AVATAR = [
  { id: 'cabeca', nome: 'Cabeça', itens: CABECA },
  { id: 'oculos', nome: 'Óculos', itens: OCULOS },
  { id: 'extra', nome: 'Extras', itens: EXTRA },
]

const desenhoDe = (categoria, id) => CATEGORIAS_AVATAR.find((c) => c.id === categoria)?.itens[id]?.desenho || null

export function Coxinildo({ avatar, enquadramento = 'rosto', className, style, titulo }) {
  const a = { ...AVATAR_PADRAO, ...(avatar || {}) }
  return (
    <svg
      viewBox={ENQUADRAMENTO[enquadramento]}
      preserveAspectRatio="xMidYMid meet"
      className={className}
      style={style}
      role={titulo ? 'img' : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
    >
      <image href={MASCOTE} x="0" y="0" width="368" height="424" />
      {desenhoDe('extra', a.extra)}
      {desenhoDe('oculos', a.oculos)}
      {desenhoDe('cabeca', a.cabeca)}
    </svg>
  )
}
