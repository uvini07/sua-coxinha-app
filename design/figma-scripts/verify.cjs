// Executa cada script de out/ contra o runtime falso (mock-figma.cjs).
//     node verify.js
// Pega erro de lógica, nome errado e mutação proibida dentro de instância —
// tudo antes de gastar chamada de MCP no arquivo real.
const fs = require('fs');
const path = require('path');

const arquivos = fs.readdirSync(path.join(__dirname, 'out')).filter(f => f.endsWith('.js')).sort();
let falhas = 0;

(async () => {
  for (const arq of arquivos) {
    delete require.cache[require.resolve('./mock-figma.cjs')];
    const { figma, AVISOS, PAGINAS } = require('./mock-figma.cjs');
    const src = fs.readFileSync(path.join(__dirname, 'out', arq), 'utf8');
    const fn = new Function('figma', '"use strict"; return (async () => {' + src + '})();');
    try {
      const r = await fn(figma);
      // telas criadas e checagem de transbordo vertical
      const telas = [];
      for (const p of Object.values(PAGINAS)) {
        for (const sec of p.children) {
          if (sec.type !== 'SECTION') continue;
          for (const f of sec.children) {
            if (f.type === 'FRAME' && f.height === 844) telas.push({ sec: sec.name, nome: f.name, n: f.findAll().length });
          }
        }
      }
      const chaves = r && r.ids ? Object.keys(r.ids).length : 0;
      console.log(arq.padEnd(30), 'OK   telas=' + telas.length, ' ids=' + chaves, ' nós=' + telas.reduce((a, t) => a + t.n, 0));
      if (AVISOS.length) AVISOS.slice(0, 6).forEach(a => console.log('   aviso:', a));
    } catch (e) {
      falhas++;
      console.log(arq.padEnd(30), 'FALHOU');
      console.log('   ' + e.message);
      if (e.stack) {
        const linha = (e.stack.split('\n').find(l => l.indexOf('<anonymous>') >= 0) || '').trim();
        if (linha) console.log('   ' + linha);
      }
    }
  }
  console.log();
  console.log(falhas ? falhas + ' script(s) com erro.' : 'Todos os scripts rodaram no runtime falso.');
  process.exit(falhas ? 1 : 0);
})();
