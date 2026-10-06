"""Gera os scripts finais de use_figma em out/, juntando _prelude.js com cada parte.

    python build.py

Cada arquivo em out/ é o conteúdo exato do parâmetro `code` de uma chamada use_figma.
O limite do Figma MCP é 50.000 caracteres por chamada — o build avisa se passar.
"""
import io, os, glob

HERE = os.path.dirname(os.path.abspath(__file__))
LIMITE = 50000

prelude = io.open(os.path.join(HERE, "_prelude.js"), encoding="utf-8").read()
out_dir = os.path.join(HERE, "out")
os.makedirs(out_dir, exist_ok=True)

ok = True
for src in sorted(glob.glob(os.path.join(HERE, "parts", "*.js"))):
    nome = os.path.basename(src)
    corpo = io.open(src, encoding="utf-8").read()
    final = prelude + "\n" + corpo
    destino = os.path.join(out_dir, nome)
    io.open(destino, "w", encoding="utf-8").write(final)
    n = len(final)
    flag = "OK " if n < LIMITE else "ACIMA DO LIMITE"
    if n >= LIMITE:
        ok = False
    print("%-34s %7d chars  %s" % (nome, n, flag))

print()
print("Gerados em:", out_dir)
if not ok:
    print("Alguma parte passou de 50.000 caracteres — divida-a antes de rodar.")
