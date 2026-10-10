import { useState } from 'react'
import { useRota } from '../rotas/useRota.js'
import { useClube } from '../estado/clubeContexto.js'
import { AppBar, Tela } from '../componentes/Tela.jsx'
import { Botao, Brilho, Chip } from '../componentes/primitivos.jsx'
import { AVATAR_PADRAO, CATEGORIAS_AVATAR, Coxinildo } from '../componentes/Coxinildo.jsx'

// Monta o Coxinildo do cliente: um acessório por categoria, com prévia ao
// vivo. Só grava no perfil ao tocar em Salvar.
export function EditorAvatar() {
  const { voltar } = useRota()
  const { usuario, atualizarPerfil } = useClube()
  const [avatar, setAvatar] = useState({ ...AVATAR_PADRAO, ...(usuario.avatar || {}) })
  const [aba, setAba] = useState(CATEGORIAS_AVATAR[0].id)
  const [salvando, setSalvando] = useState(false)

  const categoria = CATEGORIAS_AVATAR.find((c) => c.id === aba)
  const opcoes = [['nenhum', 'Nenhum'], ...Object.entries(categoria.itens).map(([id, i]) => [id, i.nome])]

  const sortear = () => {
    const sorteado = {}
    for (const c of CATEGORIAS_AVATAR) {
      const ids = ['nenhum', ...Object.keys(c.itens)]
      sorteado[c.id] = ids[Math.floor(Math.random() * ids.length)]
    }
    setAvatar(sorteado)
  }

  const salvar = async () => {
    setSalvando(true)
    await atualizarPerfil({ avatar })
    setSalvando(false)
    voltar()
  }

  return (
    <Tela>
      <AppBar titulo="Seu Coxinildo" />
      <Brilho tamanho={320} topo={40} esquerda={20} forca={0.2} />

      <div className="avatar__palco">
        <Coxinildo avatar={avatar} enquadramento="corpo" className="avatar__grande" titulo="Seu Coxinildo" />
      </div>

      <div className="rolagem-h px mt16">
        {CATEGORIAS_AVATAR.map((c) => (
          <Chip key={c.id} ativo={aba === c.id} onClick={() => setAba(c.id)}>
            {c.nome}
          </Chip>
        ))}
      </div>

      <div className="px mt8 avatar__grade">
        {opcoes.map(([id, nome]) => {
          const ativo = avatar[aba] === id
          return (
            <button
              key={id}
              type="button"
              className={`avatar__opcao${ativo ? ' avatar__opcao--ativa' : ''}`}
              onClick={() => setAvatar({ ...avatar, [aba]: id })}
              aria-pressed={ativo}
            >
              <Coxinildo
                avatar={{ ...AVATAR_PADRAO, [aba]: id }}
                enquadramento={aba === 'extra' ? 'corpo' : 'rosto'}
                className="avatar__mini"
              />
              <span className="t-peq">{nome}</span>
            </button>
          )
        })}
      </div>

      <div className="px mt24 pilha g12" style={{ paddingBottom: 24 }}>
        <Botao onClick={salvar} desabilitado={salvando}>
          {salvando ? 'Salvando…' : 'Salvar meu Coxinildo'}
        </Botao>
        <Botao estilo="fantasma" icone="brilho" onClick={sortear}>
          Sortear um visual
        </Botao>
      </div>
    </Tela>
  )
}
