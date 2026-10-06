import { useEffect, useRef, useState } from 'react'
import { useRota } from '../rotas/useRota.js'
import { useClube } from '../estado/clubeContexto.js'
import { Botao, Brilho } from '../componentes/primitivos.jsx'
import { AppBar, Tela } from '../componentes/Tela.jsx'
import { Icone } from '../componentes/Icone.jsx'
import { UNIDADES } from '../dados/clube.js'
import { LOGIN_DE_TESTE, MODO_TESTE } from '../dados/demo.js' // TEMPORÁRIO

// Máscara de telefone brasileiro, só com os dígitos que o usuário digitou.
function mascararTelefone(bruto) {
  const d = bruto.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export function Entrar() {
  const { ir } = useRota()
  const { atualizarPerfil } = useClube()
  // TEMPORÁRIO: login de teste. Em produção é `useState('')`.
  const [telefone, setTelefone] = useState(MODO_TESTE ? mascararTelefone(LOGIN_DE_TESTE.telefone) : '')
  const valido = telefone.replace(/\D/g, '').length >= 10

  const continuar = () => {
    if (!valido) return
    atualizarPerfil({ telefone })
    ir('/codigo')
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
              onChange={(e) => setTelefone(mascararTelefone(e.target.value))}
            />
          </label>
        </div>

        <div className="pilha g12 mt24">
          <Botao onClick={continuar} desabilitado={!valido}>
            Continuar
          </Botao>
          <div className="acesso__ou">
            <i />
            <span className="t-peq c-sutil">ou</span>
            <i />
          </div>
          <Botao estilo="contorno" icone="compartilhar" onClick={continuar} desabilitado={!valido}>
            Entrar com WhatsApp
          </Botao>
        </div>

        {MODO_TESTE && (
          <p className="aviso-teste mt16">
            <Icone nome="info" tamanho={15} cor="var(--sinal-alerta)" />
            <span className="t-peq">Número fixo de teste — sai quando a verificação por WhatsApp entrar</span>
          </p>
        )}

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
  const { ir } = useRota()
  const { usuario } = useClube()
  // TEMPORÁRIO: código de teste. Em produção é `useState(['', '', '', ''])`.
  const [digitos, setDigitos] = useState(MODO_TESTE ? LOGIN_DE_TESTE.codigo.split('') : ['', '', '', ''])
  const campos = useRef([])
  const [segundos, setSegundos] = useState(28)

  useEffect(() => {
    campos.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (segundos <= 0) return
    const t = setTimeout(() => setSegundos((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [segundos])

  const completo = digitos.every((d) => d !== '')

  const escrever = (i, valor) => {
    const d = valor.replace(/\D/g, '').slice(-1)
    const novos = [...digitos]
    novos[i] = d
    setDigitos(novos)
    if (d && i < 3) campos.current[i + 1]?.focus()
  }

  const apagar = (i, e) => {
    if (e.key === 'Backspace' && !digitos[i] && i > 0) campos.current[i - 1]?.focus()
  }

  return (
    <Tela className="acesso">
      <AppBar titulo="Verificação" />
      <div className="px pilha g12 mt16">
        <h1 className="t-h1">Digite o código.</h1>
        <p className="t-corpo-g c-secundario">
          Enviamos um código de 4 dígitos por WhatsApp para {usuario.telefone}.
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
            maxLength={1}
            value={d}
            onChange={(e) => escrever(i, e.target.value)}
            onKeyDown={(e) => apagar(i, e)}
            aria-label={`Dígito ${i + 1}`}
          />
        ))}
      </div>

      <div className="px linha-h g8 mt24">
        <Icone nome="relogio" tamanho={16} cor="var(--texto-sutil)" />
        <span className="t-peq c-sutil">
          {segundos > 0 ? `Reenviar código em 00:${String(segundos).padStart(2, '0')}` : 'Reenviar código'}
        </span>
      </div>

      <div className="px mt32">
        <Botao onClick={() => ir('/cadastro')} desabilitado={!completo}>
          Verificar
        </Botao>
      </div>
    </Tela>
  )
}

export function Cadastro() {
  const { ir } = useRota()
  const { usuario, atualizarPerfil, entrar } = useClube()
  const [nome, setNome] = useState(usuario.nome)
  const [nascimento, setNascimento] = useState(usuario.nascimento)
  const [unidade, setUnidade] = useState(usuario.unidade)
  const [aceite, setAceite] = useState(true)
  const [novidades, setNovidades] = useState(true)

  const concluir = () => {
    if (!nome.trim() || !aceite) return
    atualizarPerfil({ nome, primeiroNome: nome.trim().split(' ')[0], nascimento, unidade })
    entrar()
    ir('/home', { substituir: true })
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

      <div className="px mt32">
        <Botao onClick={concluir} desabilitado={!nome.trim() || !aceite}>
          Entrar no clube
        </Botao>
      </div>
    </Tela>
  )
}
