import { useEffect, useRef, useState } from 'react'
import { useRota } from '../rotas/useRota.js'
import { useClube } from '../estado/clubeContexto.js'
import { Botao, Brilho } from '../componentes/primitivos.jsx'
import { AppBar, Tela } from '../componentes/Tela.jsx'
import { Icone } from '../componentes/Icone.jsx'
import { UNIDADES } from '../dados/clube.js'

// O SMS do Firebase tem 6 dígitos.
const DIGITOS = 6

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
  const { ir } = useRota()
  const { pedirCodigo, entrarComGoogle, erro, ocupado, limparErro } = useClube()
  const [telefone, setTelefone] = useState('')
  const valido = telefone.replace(/\D/g, '').length >= 10

  const continuar = async () => {
    if (!valido || ocupado) return
    // O reCAPTCHA invisível roda aqui; o Firebase só manda o SMS depois dele.
    if (await pedirCodigo(telefone)) ir('/codigo')
  }

  const comGoogle = async () => {
    if (ocupado) return
    // Em popup a sessão abre na hora e o porteiro do App leva para o destino.
    // Em redirect o app recarrega e cai no mesmo caminho.
    await entrarComGoogle()
  }

  return (
    <Tela className="acesso">
      <Brilho tamanho={340} topo={-70} esquerda={-50} forca={0.22} />

      <div className="acesso__conteudo safe-topo px">
        <img src={`${import.meta.env.BASE_URL}marca/logo-claro.svg`} alt="Sua Coxinha" className="acesso__logo" />

        <div className="pilha g12 mt32">
          <span className="t-overline c-ouro">Clube Pontos Dourados</span>
          <h1 className="t-h1">Entre e comece a acumular.</h1>
          <p className="t-corpo-g c-secundario">
            Use o mesmo telefone que você informa no caixa — é por ele que seus pontos são identificados.
          </p>
        </div>

        <div className="campo mt32">
          <span className="t-overline c-secundario">Telefone / WhatsApp</span>
          <label className="campo__caixa">
            <Icone nome="usuario" tamanho={19} cor="var(--ouro-500)" />
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="(11) 90000-0000"
              value={telefone}
              onChange={(e) => {
                limparErro()
                setTelefone(mascararTelefone(e.target.value))
              }}
            />
          </label>
        </div>

        <div className="pilha g12 mt24">
          <Botao onClick={continuar} desabilitado={!valido || ocupado}>
            {ocupado ? 'Enviando código…' : 'Receber código por SMS'}
          </Botao>
          <div className="acesso__ou">
            <i />
            <span className="t-peq c-sutil">ou</span>
            <i />
          </div>
          <Botao estilo="contorno" icone="usuario" onClick={comGoogle} desabilitado={ocupado}>
            Entrar com Google
          </Botao>
        </div>

        <Erro texto={erro} />

        <p className="t-peq c-sutil centro mt24">
          Ao continuar você concorda com os Termos de Uso e a Política de Privacidade da Sua Coxinha.
        </p>

        <div className="acesso__prova">
          <Icone nome="pessoas" tamanho={16} cor="var(--ouro-500)" />
          <span className="t-peq c-secundario">Mais de 12 mil clientes no clube</span>
        </div>
      </div>
    </Tela>
  )
}

export function Codigo() {
  const { ir, voltar } = useRota()
  const { confirmarCodigo, pedirCodigo, telefoneEmVerificacao, erro, ocupado, limparErro } = useClube()
  const [digitos, setDigitos] = useState(Array(DIGITOS).fill(''))
  const campos = useRef([])
  const [segundos, setSegundos] = useState(45)

  // Chegou aqui sem ter pedido código (recarregou a página, por exemplo):
  // volta para a entrada em vez de ficar numa tela que não confirma nada.
  useEffect(() => {
    if (!telefoneEmVerificacao) ir('/entrar', { substituir: true })
  }, [telefoneEmVerificacao, ir])

  useEffect(() => {
    campos.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (segundos <= 0) return
    const t = setTimeout(() => setSegundos((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [segundos])

  const completo = digitos.every((d) => d !== '')

  const verificar = async (codigo = digitos.join('')) => {
    if (codigo.length < DIGITOS || ocupado) return
    // Deu certo? O porteiro do App decide entre /cadastro e /home conforme o
    // perfil no Firestore — aqui não se decide rota de destino.
    if (!(await confirmarCodigo(codigo))) setDigitos(Array(DIGITOS).fill(''))
  }

  const escrever = (i, valor) => {
    limparErro()
    const digitado = valor.replace(/\D/g, '')
    if (!digitado) {
      const novos = [...digitos]
      novos[i] = ''
      setDigitos(novos)
      return
    }
    // Colar o código inteiro (ou o preenchimento automático do SMS no Android)
    // entra tudo em um campo só: distribui pelos seguintes.
    const novos = [...digitos]
    for (let k = 0; k < digitado.length && i + k < DIGITOS; k++) novos[i + k] = digitado[k]
    setDigitos(novos)
    const proximo = Math.min(DIGITOS - 1, i + digitado.length)
    campos.current[proximo]?.focus()
    if (novos.every((d) => d !== '')) verificar(novos.join(''))
  }

  const apagar = (i, e) => {
    if (e.key === 'Backspace' && !digitos[i] && i > 0) campos.current[i - 1]?.focus()
  }

  const reenviar = async () => {
    if (segundos > 0 || ocupado) return
    if (await pedirCodigo(telefoneEmVerificacao)) setSegundos(45)
  }

  return (
    <Tela className="acesso">
      <AppBar titulo="Verificação" aoVoltar={voltar} />
      <div className="px pilha g12 mt16">
        <h1 className="t-h1">Digite o código.</h1>
        <p className="t-corpo-g c-secundario">
          Enviamos um código de {DIGITOS} dígitos por SMS para {telefoneEmVerificacao}.
        </p>
      </div>

      <div className="codigo__campos px mt32">
        {digitos.map((d, i) => (
          <input
            key={i}
            ref={(el) => (campos.current[i] = el)}
            className={`codigo__caixa${d ? ' codigo__caixa--cheia' : ''}`}
            type="tel"
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            value={d}
            onChange={(e) => escrever(i, e.target.value)}
            onKeyDown={(e) => apagar(i, e)}
            aria-label={`Dígito ${i + 1}`}
          />
        ))}
      </div>

      <button type="button" className="px linha-h g8 mt24 acesso__reenviar" onClick={reenviar} disabled={segundos > 0}>
        <Icone nome="relogio" tamanho={16} cor="var(--texto-sutil)" />
        <span className="t-peq c-sutil">
          {segundos > 0 ? `Reenviar código em 00:${String(segundos).padStart(2, '0')}` : 'Reenviar código'}
        </span>
      </button>

      <Erro texto={erro} />

      <div className="px mt32">
        <Botao onClick={() => verificar()} desabilitado={!completo || ocupado}>
          {ocupado ? 'Verificando…' : 'Verificar'}
        </Botao>
      </div>
    </Tela>
  )
}

export function Cadastro() {
  const { ir } = useRota()
  const { usuario, concluirCadastro, erro, ocupado } = useClube()
  const [nome, setNome] = useState(usuario.nome)
  const [nascimento, setNascimento] = useState(usuario.nascimento)
  const [unidade, setUnidade] = useState(usuario.unidade)
  const [aceite, setAceite] = useState(false)
  const [novidades, setNovidades] = useState(true)

  // Entrando pelo Google, o nome já vem da conta — mas só depois de o perfil
  // chegar do Firestore, que pode ser um quadro depois desta tela montar.
  useEffect(() => {
    if (!nome && usuario.nome) setNome(usuario.nome)
  }, [usuario.nome, nome])

  const concluir = async () => {
    if (!nome.trim() || !aceite || ocupado) return
    if (await concluirCadastro({ nome, nascimento, unidade, novidades })) {
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
              {UNIDADES.map((u) => (
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
        <Botao onClick={concluir} desabilitado={!nome.trim() || !aceite || ocupado}>
          {ocupado ? 'Criando sua conta…' : 'Entrar no clube'}
        </Botao>
      </div>
    </Tela>
  )
}
