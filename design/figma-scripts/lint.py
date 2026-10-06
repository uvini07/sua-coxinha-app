"""Confere os scripts contra o inventário real do arquivo Figma.

    python lint.py

Valida nomes de componentes, variantes, ícones, estilos de texto, estilos de efeito
e tokens de cor — e procura mutações proibidas dentro de instâncias. Roda offline:
a ideia é não gastar chamada de MCP com erro de digitação.
"""
import io, os, re, glob, sys

HERE = os.path.dirname(os.path.abspath(__file__))

ICONES = """casa alvo qr presente carteira sino usuario seta-dir seta-esq seta-baixo seta-cima
seta-diagonal relogio check check-circulo mais cadeado calendario pin trofeu engrenagem info
fechar busca tendencia ticket compartilhar raio escudo estrela fogo pessoas livro halter filme
tesoura formatura cartao brilho coracao sair mapa filtro""".split()

COMPONENTES = set()
for estilo in ["Ouro", "Sólido Claro", "Contorno", "Fantasma"]:
    for estado in ["Padrão", "Desabilitado"]:
        COMPONENTES.add("Botão|Estilo=%s, Estado=%s" % (estilo, estado))
for v in ["Padrão", "Ativo"]:
    COMPONENTES.add("Chip|Estado=" + v)
for v in ["Disponível", "Pendente", "Expirando"]:
    COMPONENTES.add("Pílula de Status|Tipo=" + v)
for v in ["Bronze", "Prata", "Ouro", "Diamante"]:
    COMPONENTES.add("Selo de Nível|Nível=" + v)
for v in ["M", "G"]:
    COMPONENTES.add("Avatar|Tamanho=" + v)
for v in ["Padrão", "Preenchido", "Foco", "Erro"]:
    COMPONENTES.add("Campo de Texto|Estado=" + v)
for v in ["Em andamento", "Concluída", "Bloqueada"]:
    COMPONENTES.add("Card de Missão|Estado=" + v)
for v in ["Disponível", "Bloqueada"]:
    COMPONENTES.add("Card de Recompensa|Estado=" + v)
for v in ["Ganho", "Bônus", "Resgate", "Expirado"]:
    COMPONENTES.add("Linha de Histórico|Tipo=" + v)
for v in ["Nova", "Lida"]:
    COMPONENTES.add("Linha de Notificação|Estado=" + v)
for v in ["Início", "Missões", "Recompensas", "Clube"]:
    COMPONENTES.add("Navegação Inferior|Ativo=" + v)
COMPONENTES.update(["Barra de Progresso", "Cabeçalho de Seção", "Barra de Status", "App Bar",
                    "Cartão Dourado", "Card de Parceiro", "Item de Menu", "Voucher · QR",
                    "Toast de Conquista", "Logo · Sua Coxinha (fundo escuro)", "Gota · sub-marca"])
COMPONENTES.update("Ícone/" + i for i in ICONES)

ESTILOS_TEXTO = set("""Display/Saldo Display/XL Título/H1 Título/H2 Título/H3 Título/H4
Número/Grande Número/Médio Corpo/Grande Corpo/Padrão Corpo/Forte Corpo/Pequeno
Rótulo/Botão Rótulo/Chip Rótulo/Nav Rótulo/Overline""".split())

ESTILOS_EFEITO = set(["Sombra/Suave", "Sombra/Card", "Sombra/Elevada", "Sombra/Nav",
                      "Brilho/Ouro", "Brilho/Ouro Forte"])

TOKENS = set()
for g in ["base", "elevado", "superficie", "sunken", "inverso"]:
    TOKENS.add("cor/fundo/" + g)
for g in ["primario", "secundario", "sutil", "inverso", "ouro"]:
    TOKENS.add("cor/texto/" + g)
for g in ["sutil", "media", "ouro"]:
    TOKENS.add("cor/borda/" + g)
for g in ["primaria", "primaria-texto", "secundaria", "destrutiva"]:
    TOKENS.add("cor/acao/" + g)
for g in ["tenue", "escuro", "base", "claro", "profundo"]:
    TOKENS.add("cor/ouro/" + g)
for g in ["bronze", "prata", "ouro", "diamante"]:
    TOKENS.add("cor/nivel/" + g)
for g in ["sucesso", "alerta", "erro", "info"]:
    TOKENS.add("cor/sinal/" + g)

problemas = []
arquivos = [os.path.join(HERE, "_prelude.js")] + sorted(glob.glob(os.path.join(HERE, "parts", "*.js")))

for caminho in arquivos:
    nome = os.path.basename(caminho)
    src = io.open(caminho, encoding="utf-8").read()
    linhas = src.split("\n")

    def achar(regex, validos, rotulo, ignorar=()):
        for i, linha in enumerate(linhas, 1):
            for m in re.finditer(regex, linha):
                valor = m.group(1)
                # concatenações como 'Chip|Estado='+x são dinâmicas: valida só o prefixo
                if valor in ignorar or valor.endswith("=") or valor.endswith("|"):
                    continue
                if valor not in validos:
                    problemas.append("%s:%d  %s desconhecido: %r" % (nome, i, rotulo, valor))

    # componentes: inst('X') e k:'X'
    achar(r"inst\('([^']+)'\)", COMPONENTES, "componente")
    achar(r"k:\s*'([^']+)'", COMPONENTES, "componente")
    # ícones: {t:'ico', n:'X'} e ico('X'
    achar(r"n:\s*'([^']+)'[^}]*?t?:?\s*", ICONES, "ícone", ignorar=())
    achar(r"\bico\('([^']+)'", ICONES, "ícone")
    achar(r"swapIcon\([^,]+,\s*'([^']+)'", ICONES, "ícone")
    # estilos
    achar(r"st:\s*'([^']+)'", ESTILOS_TEXTO, "estilo de texto")
    achar(r"ef:\s*'([^']+)'", ESTILOS_EFEITO, "estilo de efeito")
    # tokens de cor em fill/stroke/c:
    for i, linha in enumerate(linhas, 1):
        for m in re.finditer(r"(?:fill|stroke|c):\s*'(cor/[^']+)'", linha):
            if m.group(1) not in TOKENS:
                problemas.append("%s:%d  token de cor desconhecido: %r" % (nome, i, m.group(1)))
        for m in re.finditer(r"sol\('(cor/[^']+)'", linha):
            if m.group(1) not in TOKENS:
                problemas.append("%s:%d  token de cor desconhecido: %r" % (nome, i, m.group(1)))
    # mutação proibida dentro de instância
    for i, linha in enumerate(linhas, 1):
        if re.search(r"\.(appendChild|insertChild)\(", linha) and re.search(r"\bico\(", linha):
            problemas.append("%s:%d  troca de ícone por appendChild/insertChild — use swapIcon()" % (nome, i))

# a regex de ícone acima é ruidosa: refaz só para a forma canônica {t:'ico',n:'X'}
problemas = [p for p in problemas if "ícone desconhecido" not in p]
for caminho in arquivos:
    nome = os.path.basename(caminho)
    linhas = io.open(caminho, encoding="utf-8").read().split("\n")
    for i, linha in enumerate(linhas, 1):
        for m in re.finditer(r"t:\s*'ico'\s*,\s*n:\s*'([^']+)'", linha):
            if m.group(1) not in ICONES:
                problemas.append("%s:%d  ícone desconhecido: %r" % (nome, i, m.group(1)))
        for m in re.finditer(r"swapIcon\([^,]+,\s*'([^']+)'", linha):
            if m.group(1) not in ICONES:
                problemas.append("%s:%d  ícone desconhecido: %r" % (nome, i, m.group(1)))
        for m in re.finditer(r"\bico\('([^']+)'", linha):
            if m.group(1) not in ICONES:
                problemas.append("%s:%d  ícone desconhecido: %r" % (nome, i, m.group(1)))

if problemas:
    print("Problemas encontrados:\n")
    for p in sorted(set(problemas)):
        print(" ", p)
    print("\nTotal:", len(set(problemas)))
    sys.exit(1)
print("Lint OK — componentes, ícones, estilos e tokens conferem com o arquivo Figma.")
