import { Icone } from './Icone.jsx'

// Medalha do nível. O nome vai em Brown Beige porque BRONZE, PRATA, OURO e
// DIAMANTE não têm acento — é exatamente o tipo de palavra que a fonte cobre.

export function SeloNivel({ nivel, tamanho = 76, mostrarNome = true, apagado, brilho = true }) {
  const diametro = tamanho
  return (
    <div className={`selo-nivel${apagado ? ' selo-nivel--apagado' : ''}`}>
      <div
        className="selo-nivel__medalha"
        style={{
          width: diametro,
          height: diametro,
          borderRadius: diametro * 0.34,
          background: nivel.gradiente,
          boxShadow: brilho && !apagado ? `0 8px 24px -4px ${nivel.cor}59` : 'none',
        }}
      >
        <Icone nome={nivel.icone} tamanho={Math.round(diametro * 0.42)} cor="#FFFFFF" traco={1.9} />
      </div>
      {mostrarNome && <span className="t-overline ouro-display selo-nivel__nome">{nivel.nome}</span>}
    </div>
  )
}
