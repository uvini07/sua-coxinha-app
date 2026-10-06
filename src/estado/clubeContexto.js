import { createContext, useContext } from 'react'

export const ClubeContexto = createContext(null)

export function useClube() {
  const valor = useContext(ClubeContexto)
  if (!valor) throw new Error('useClube precisa estar dentro de <ClubeProvider>')
  return valor
}
