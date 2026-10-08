import { useEffect, useState } from 'react'
import { useRota } from '../rotas/useRota.js'
import { useClube } from '../estado/clubeContexto.js'
import { Botao, Brilho } from '../componentes/primitivos.jsx'
import { AppBar, Tela } from '../componentes/Tela.jsx'
import { LOGIN_APPLE } from '../firebase/config.js'
import { Icone } from '../componentes/Icone.jsx'

// Máscara de telefone brasileiro, só com os dígitos que o usuário digitou.
function mascararTelefone(bruto) {
  const d = bruto.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

function Erro({ texto }) {
  if (!texto) return null
  return (
    <p className="aviso-teste mt16" role="alert">
      <Icone nome="info" tamanho={15} cor="var(--sinal-alerta)" />
      <span className="t-peq">{texto}</span>
    </p>
  )
}

export function Entrar() {
  const { entrarComGoogle, entrarComApple, erro, ocupado } = useClube()

  // Não há senha nem código: o provedor devolve a sessão e o porteiro do App
  // decide entre /cadastro e /home conforme o perfil no Firestore.
  return (
    <Tela className="acesso">
      <Brilho tamanho={340} topo={-70} esquerda={-50} forca={0.22} />

      <div className="acesso__conteudo safe-topo px">
        <img src={`${import.meta.env.BASE_URL}marca/logo-claro.svg`} alt="Sua Coxinha" className="acesso__logo" />

        <div className="pilha g12 mt32">
          <span className="t-overline c-ouro">Clube Pontos Dourados</span>
          <h1 className="t-h1">Entre e comece a acumular.</h1>
          <p className="t-corpo-g c-secundario">
            Uma conta só, em qualquer celular. Seu telefone fica guardado no perfil — é por ele que o caixa encontra
            seus pontos.
          </p>
        </div>

        <div className="pilha g12 mt32">
          <Botao icone="usuario" onClick={entrarComGoogle} desabilitado={ocupado}>
            {ocupado ? 'Entrando…' : 'Entrar com Google'}
          </Botao>
          {LOGIN_APPLE && (
            <Botao estilo="contorno" icone="usuario" onClick={entrarComApple} desabilitado={ocupado}>
              Entrar com Apple
            </Botao>
          )}
        </div>

        <Erro texto={erro} />

        <div className="acesso__rodape pilha">
          <p className="t-peq c-sutil centro">
            Ao continuar você concorda com os Termos de Uso e a Política de Privacidade da Sua Coxinha.
          </p>

          <div className="acesso__prova">
            <Icone nome="pessoas" tamanho={16} cor="var(--ouro-500)" />
            <span className="t-peq c-secundario">Mais de 12 mil clientes no clube</span>
          </div>
        </div>
      </div>
    </Tela>
  )
}

export function Cadastro() {
  const { ir } = useRota()
  const { usuario, concluirCadastro, erro, ocupado, unidades } = useClube()
  const [nome, setNome] = useState(usuario.nome)
  const [telefone, setTelefone] = useState(usuario.telefone)
  const [nascimento, setNascimento] = useState(usuario.nascimento)
  const [unidade, setUnidade] = useState(usuario.unidade)
  const [aceite, setAceite] = useState(false)
  const [novidades, setNovidades] = useState(true)

  // Entrando pelo Google, o nome já vem da conta — mas só depois de o perfil
  // chegar do Firestore, que pode ser um quadro depois desta tela montar.
  useEffect(() => {
    if (!nome && usuario.nome) setNome(usuario.nome)
  }, [usuario.nome, nome])

  const telefoneValido = telefone.replace(/\D/g, '').length >= 10
  const podeConcluir = nome.trim() && telefoneValido && aceite && !ocupado

  const concluir = async () => {
    if (!podeConcluir) return
    if (await concluirCadastro({ nome, telefone, nascimento, unidade, novidades })) {
      ir('/celebracao/boas-vindas', { substituir: true })
    }
  }

  return (
    <Tela className="acesso">
      <AppBar titulo="Criar conta" />

      <div className="px pilha g8 mt8">
        <span className="t-overline c-ouro">Etapa 2 de 2</span>
        <h1 className="t-h1">Quase lá.</h1>
        <p className="t-corpo c-secundario">Só o essencial agora. Você completa o perfil depois.</p>
      </div>

      <div className="px pilha g16 mt24">
        <div className="campo">
          <span className="t-overline c-secundario">Nome completo</span>
          <label className="campo__caixa">
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" autoComplete="name" />
          </label>
        </div>

        <div className="campo">
          <span className="t-overline c-secundario">Telefone / WhatsApp</span>
          <label className="campo__caixa">
            <Icone nome="usuario" tamanho={19} cor="var(--ouro-500)" />
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="(11) 90000-0000"
              value={telefone}
              onChange={(e) => setTelefone(mascararTelefone(e.target.value))}
            />
          </label>
          <span className="t-peq c-sutil">
            É o número que você informa no caixa. Confira com atenção: ele identifica seus pontos.
          </span>
        </div>

        <div className="campo">
          <span className="t-overline c-secundario">Data de nascimento</span>
          <label className="campo__caixa">
            <Icone nome="calendario" tamanho={19} cor="var(--texto-sutil)" />
            <input
              value={nascimento}
              onChange={(e) => setNascimento(e.target.value)}
              placeholder="dd/mm/aaaa"
              inputMode="numeric"
            />
          </label>
          <span className="t-peq c-sutil">No mês do seu aniversário os pontos valem em dobro.</span>
        </div>

        <div className="campo">
          <span className="t-overline c-secundario">Unidade preferida</span>
          <label className="campo__caixa">
            <Icone nome="pin" tamanho={19} cor="var(--ouro-500)" />
            <select value={unidade} onChange={(e) => setUnidade(e.target.value)}>
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome} · {u.bairro}
                </option>
              ))}
            </select>
            <Icone nome="seta-baixo" tamanho={18} cor="var(--texto-secundario)" />
          </label>
        </div>
      </div>

      <div className="px pilha g12 mt24">
        {[
          [aceite, setAceite, 'Aceito os Termos de Uso e a Política de Privacidade.', 'Obrigatório para participar do clube.'],
          [novidades, setNovidades, 'Quero receber ofertas e avisos de pontos.', 'Por WhatsApp e notificações do app.'],
        ].map(([valor, setar, titulo, sub], i) => (
          <button
            key={i}
            type="button"
            className={`aceite${valor ? ' aceite--marcado' : ''}`}
            onClick={() => setar(!valor)}
          >
            <span className="aceite__caixa">{valor && <Icone nome="check" tamanho={15} cor="var(--marrom-churros)" />}</span>
            <span className="pilha g4">
              <strong className="t-forte">{titulo}</strong>
              <span className="t-peq c-sutil">{sub}</span>
            </span>
          </button>
        ))}
      </div>

      <Erro texto={erro} />

      <div className="px mt32">
        <Botao onClick={concluir} desabilitado={!podeConcluir}>
          {ocupado ? 'Criando sua conta…' : 'Entrar no clube'}
        </Botao>
      </div>
    </Tela>
  )
}
