// Runtime falso do Figma Plugin API — só o suficiente para executar os scripts
// de out/ e pegar erro de lógica sem gastar chamada de MCP.
// Regra principal que ele faz valer: não se adiciona nem remove filho dentro de
// uma instância. É o erro que mais custa caro no arquivo real.

const AVISOS = [];

class No {
  constructor(tipo, nome) {
    this.type = tipo; this.name = nome || tipo;
    this.children = []; this.parent = null;
    this.x = 0; this.y = 0; this.width = 100; this.height = 100;
    this.fills = []; this.strokes = []; this.effects = [];
    this.opacity = 1; this.visible = true;
    this.layoutMode = 'NONE'; this.itemSpacing = 0;
    this.paddingTop = this.paddingRight = this.paddingBottom = this.paddingLeft = 0;
    this.clipsContent = true;
    this.id = tipo + ':' + (No._seq = (No._seq || 0) + 1);
  }
  get _dentroDeInstancia() {
    let n = this;
    while (n) { if (n.type === 'INSTANCE') return true; n = n.parent; }
    return false;
  }
  _guardaEstrutural(op) {
    if (this._dentroDeInstancia) {
      throw new Error('Figma proíbe ' + op + ' em "' + this.name + '": o nó está dentro de uma instância. Use swapComponent / overrides.');
    }
  }
  appendChild(n) {
    this._guardaEstrutural('appendChild');
    if (n.parent) n.parent.children = n.parent.children.filter(c => c !== n);
    n.parent = this; this.children.push(n);
  }
  insertChild(i, n) {
    this._guardaEstrutural('insertChild');
    if (n.parent) n.parent.children = n.parent.children.filter(c => c !== n);
    n.parent = this; this.children.splice(i, 0, n);
  }
  remove() {
    if (this.parent) {
      this.parent._guardaEstrutural('remove');
      this.parent.children = this.parent.children.filter(c => c !== this);
    }
    this.parent = null;
  }
  resize(w, h) { this.width = w; this.height = h; }
  resizeWithoutConstraints(w, h) { this.width = w; this.height = h; }
  rescale(s) {
    if (!(s > 0)) throw new Error('rescale inválido em "' + this.name + '": ' + s);
    this.width *= s; this.height *= s;
    this.children.forEach(c => c.rescale(s));
  }
  clone() {
    const c = new No(this.type, this.name);
    Object.assign(c, { width: this.width, height: this.height, opacity: this.opacity });
    c.children = []; c.parent = null;
    this.children.forEach(k => { const kc = k.clone(); kc.parent = c; c.children.push(kc); });
    if (this.parent && !this.parent._dentroDeInstancia) { c.parent = this.parent; this.parent.children.push(c); }
    return c;
  }
  _todos(saida) { for (const c of this.children) { saida.push(c); c._todos(saida); } return saida; }
  findAll(p) { const t = this._todos([]); return p ? t.filter(p) : t; }
  findOne(p) { return this._todos([]).find(p) || null; }
  findAllWithCriteria(c) { const t = this._todos([]); return c && c.types ? t.filter(n => c.types.indexOf(n.type) >= 0) : t; }
  query() { return { first: () => null, toArray: () => [], length: 0 }; }
  async setTextStyleIdAsync(id) { if (!id) throw new Error('estilo de texto inexistente em "' + this.name + '"'); this._estilo = id; }
  async setEffectStyleIdAsync(id) { if (!id) throw new Error('estilo de efeito inexistente em "' + this.name + '"'); }
  async loadAsync() {}
  async screenshot() { return null; }
  swapComponent(comp) {
    if (!comp || comp.type !== 'COMPONENT') throw new Error('swapComponent sem componente válido em "' + this.name + '"');
    this.name = comp.name;
    this.children = comp.children.map(k => { const kc = k.clone(); kc.parent = this; return kc; });
  }
  set layoutSizingHorizontal(v) {
    if (['FIXED', 'HUG', 'FILL'].indexOf(v) < 0) throw new Error('layoutSizingHorizontal inválido: ' + v);
    const pai = this.parent;
    if (v === 'FILL' && (!pai || pai.layoutMode === 'NONE')) {
      AVISOS.push('FILL horizontal em "' + this.name + '" cujo pai não é auto-layout');
    }
    this._lsh = v;
    if (v === 'FILL' && pai && pai.layoutMode === 'HORIZONTAL') this.width = Math.max(40, (pai.width - pai.paddingLeft - pai.paddingRight) / Math.max(1, pai.children.length));
    if (v === 'FILL' && pai && pai.layoutMode === 'VERTICAL') this.width = pai.width - pai.paddingLeft - pai.paddingRight;
  }
  get layoutSizingHorizontal() { return this._lsh || 'FIXED'; }
  set layoutSizingVertical(v) {
    if (['FIXED', 'HUG', 'FILL'].indexOf(v) < 0) throw new Error('layoutSizingVertical inválido: ' + v);
    this._lsv = v;
  }
  get layoutSizingVertical() { return this._lsv || 'FIXED'; }
  set primaryAxisSizingMode(v) { if (['FIXED', 'AUTO'].indexOf(v) < 0) throw new Error('primaryAxisSizingMode inválido: ' + v); this._pa = v; }
  get primaryAxisSizingMode() { return this._pa || 'AUTO'; }
  set counterAxisSizingMode(v) { if (['FIXED', 'AUTO'].indexOf(v) < 0) throw new Error('counterAxisSizingMode inválido: ' + v); this._ca = v; }
  get counterAxisSizingMode() { return this._ca || 'AUTO'; }
  set counterAxisAlignItems(v) { if (['MIN', 'CENTER', 'MAX', 'BASELINE'].indexOf(v) < 0) throw new Error('counterAxisAlignItems inválido: ' + v); }
  set primaryAxisAlignItems(v) { if (['MIN', 'CENTER', 'MAX', 'SPACE_BETWEEN'].indexOf(v) < 0) throw new Error('primaryAxisAlignItems inválido: ' + v); }
  set layoutPositioning(v) { if (['AUTO', 'ABSOLUTE'].indexOf(v) < 0) throw new Error('layoutPositioning inválido: ' + v); }
  set cornerRadius(v) { this._r = v; }
  set textAutoResize(v) { if (['NONE', 'WIDTH_AND_HEIGHT', 'HEIGHT', 'TRUNCATE'].indexOf(v) < 0) throw new Error('textAutoResize inválido: ' + v); this._tar = v; }
  set characters(v) {
    this._chars = String(v);
    const fs = this._fs || 14;
    if (this._tar === 'WIDTH_AND_HEIGHT') this.width = Math.max(8, this._chars.length * fs * 0.55);
    const linhas = this._chars.split('\n').length;
    this.height = Math.max(fs * 1.35, linhas * fs * 1.35);
  }
  get characters() { return this._chars || ''; }
  set fontSize(v) { this._fs = v; if (this._chars != null) this.characters = this._chars; }
  set arcData(v) {
    if (!v || typeof v.innerRadius !== 'number') throw new Error('arcData inválido em "' + this.name + '"');
    if (v.innerRadius < 0 || v.innerRadius > 1) throw new Error('arcData.innerRadius fora de 0..1');
  }
}

class Componente extends No {
  constructor(nome, filhos, w, h) {
    super('COMPONENT', nome);
    this.width = w || 100; this.height = h || 100;
    this.key = 'key_' + nome;
    (filhos || []).forEach(f => { f.parent = this; this.children.push(f); });
  }
  createInstance() {
    const i = new No('INSTANCE', this.name);
    i.width = this.width; i.height = this.height;
    i.mainComponent = this;
    this.children.forEach(k => { const kc = k.clone(); kc.parent = i; i.children.push(kc); });
    return i;
  }
}

// ---------- montagem do inventário real do arquivo ----------
function F(nome, filhos) { const n = new No('FRAME', nome); (filhos || []).forEach(c => { c.parent = n; n.children.push(c); }); return n; }
function T(nome) { const n = new No('TEXT', nome); n._tar = 'WIDTH_AND_HEIGHT'; n._fs = 14; n.characters = 'texto'; return n; }
function R(nome) { return new No('RECTANGLE', nome); }
function E(nome) { return new No('ELLIPSE', nome); }
function V() { return new No('VECTOR', 'vetor'); }

const ICONES = `casa alvo qr presente carteira sino usuario seta-dir seta-esq seta-baixo seta-cima
seta-diagonal relogio check check-circulo mais cadeado calendario pin trofeu engrenagem info
fechar busca tendencia ticket compartilhar raio escudo estrela fogo pessoas livro halter filme
tesoura formatura cartao brilho coracao sair mapa filtro`.split(/\s+/).filter(Boolean);

const COMPS = {};
ICONES.forEach(n => { COMPS['Ícone/' + n] = new Componente('Ícone/' + n, [V(), V()], 24, 24); });
function IcoInst(n) { const i = COMPS['Ícone/' + n].createInstance(); i.name = 'ícone/' + n; return i; }

function reg(nome, filhos, w, h) { COMPS[nome] = new Componente(nome, filhos, w, h); }

['Ouro', 'Sólido Claro', 'Contorno', 'Fantasma'].forEach(e =>
  ['Padrão', 'Desabilitado'].forEach(s => reg('Botão|Estilo=' + e + ', Estado=' + s, [T('rótulo')], 220, 52)));
['Padrão', 'Ativo'].forEach(v => reg('Chip|Estado=' + v, [T('rótulo')], 110, 36));
['Disponível', 'Pendente', 'Expirando'].forEach(v => reg('Pílula de Status|Tipo=' + v, [E('ponto'), T('rótulo')], 180, 30));
['Bronze', 'Prata', 'Ouro', 'Diamante'].forEach(v => reg('Selo de Nível|Nível=' + v, [F('medalha', [IcoInst('trofeu')]), T('nome')], 76, 110));
reg('Avatar|Tamanho=M', [], 48, 48); reg('Avatar|Tamanho=G', [], 88, 88);
reg('Barra de Progresso', [F('legenda', [T('a'), T('b')]), F('trilho', [R('preenchimento')])], 320, 48);
['Padrão', 'Preenchido', 'Foco'].forEach(v => reg('Campo de Texto|Estado=' + v, [T('rótulo'), F('campo', [T('valor')])], 320, 86));
reg('Campo de Texto|Estado=Erro', [T('rótulo'), F('campo', [T('valor'), IcoInst('info')]), T('ajuda')], 320, 108);
reg('Cabeçalho de Seção', [T('título'), F('ação', [T('ver'), IcoInst('seta-dir')])], 326, 26);
reg('Barra de Status', [T('hora'), F('sinais', [V()])], 390, 54);
reg('App Bar', [F('voltar', [IcoInst('seta-esq')]), T('título'), F('ação', [IcoInst('info')])], 390, 56);
reg('Cartão Dourado', [
  F('topo', [T('rótulo'), F('nível', [IcoInst('trofeu'), T('rótulo nível')])]),
  F('saldo', [T('valor'), T('unidade')]),
  F('rodapé', [F('a', [E('d'), T('t')]), F('b', [E('d'), T('t')])])], 326, 212);
['Em andamento', 'Concluída', 'Bloqueada'].forEach(v => reg('Card de Missão|Estado=' + v, [
  F('cabeçalho', [F('ícone', [IcoInst('fogo')]), F('textos', [T('título'), T('descrição')]), IcoInst('seta-dir')]),
  F('progresso', [F('trilho', [R('preenchimento')])]),
  F('rodapé', [F('recompensa', [IcoInst('brilho'), T('rec')]), F('prazo', [IcoInst('relogio'), T('pz')])])], 326, 168));
['Disponível', 'Bloqueada'].forEach(v => reg('Card de Recompensa|Estado=' + v, [
  F('imagem', [R('foto')]),
  F('corpo', [T('nome'), T('descrição'), F('preço', [IcoInst('brilho'), T('pontos'), T('pts')])])], 167, 236));
reg('Card de Parceiro', [
  F('logo', [IcoInst('halter')]),
  F('textos', [T('nome'), T('categoria'), F('benefício', [IcoInst('ticket'), T('ben')])]),
  IcoInst('seta-dir')], 326, 86);
['Ganho', 'Bônus', 'Resgate', 'Expirado'].forEach(v => reg('Linha de Histórico|Tipo=' + v, [
  F('ícone', [IcoInst('carteira')]), F('textos', [T('título'), T('detalhe')]), T('valor')], 326, 72));
['Nova', 'Lida'].forEach(v => reg('Linha de Notificação|Estado=' + v, [
  F('ícone', [IcoInst('brilho')]),
  F('textos', [F('linha', [T('título'), E('pontinho')]), T('texto'), T('tempo')])], 326, 104));
reg('Item de Menu', [IcoInst('pin'), T('rótulo'), T('valor'), IcoInst('seta-dir')], 326, 52);
['Início', 'Missões', 'Recompensas', 'Clube'].forEach(v => reg('Navegação Inferior|Ativo=' + v, [
  F('aba Início', [IcoInst('casa'), T('rótulo')]),
  F('aba Missões', [IcoInst('alvo'), T('rótulo')]),
  F('espaço FAB', []),
  F('aba Recompensas', [IcoInst('presente'), T('rótulo')]),
  F('aba Clube', [IcoInst('ticket'), T('rótulo')]),
  F('FAB QR Code', [IcoInst('qr')]),
  R('indicador')], 390, 88));
reg('Voucher · QR', [
  F('marca', [new No('INSTANCE', 'gota'), T('m')]), F('título', [T('a'), T('b')]),
  F('QR Code', [V()]), F('código', [T('c')]), R('divisor'), F('validade', [T('a'), T('b')])], 326, 560);
reg('Toast de Conquista', [F('ícone', [IcoInst('check')]), F('textos', [T('título'), T('texto')]), IcoInst('fechar')], 326, 72);
reg('Logo · Sua Coxinha (fundo escuro)', [V(), V()], 170, 40);
reg('Gota · sub-marca', [V()], 44, 54);

// ---------- páginas e nós soltos ----------
const PAGINAS = {
  '0:1': new No('PAGE', '00 — Design System'),
  '5:2': new No('PAGE', '01 — App · Fluxos'),
  '5:3': new No('PAGE', '02 — Futuro · Comunidade')
};
PAGINAS['0:1'].layoutMode = 'NONE';
Object.values(COMPS).forEach(c => { c.parent = PAGINAS['0:1']; PAGINAS['0:1'].children.push(c); });

const SOLTOS = {
  '5:113': F('logo-wordmark-dark', [V(), V()]),
  '5:125': F('logo-wordmark-light', [V(), V()]),
  '5:137': F('droplet-gold', [V()]),
  '12:227': F('02 · Onboarding 1', [F('cartão QR', [IcoInst('qr')])]),
  '12:268': F('04 · Onboarding 3', [F('faltam', [IcoInst('tendencia'), T('t')])]),
  '12:323': F('05 · Onboarding 4', [F('recompensas', []), F('Card de Parceiro', [])])
};
Object.values(SOLTOS).forEach(n => { n.width = 200; n.height = 60; });

const VARIAVEIS = [];
['fundo/base', 'fundo/elevado', 'fundo/superficie', 'fundo/sunken', 'fundo/inverso',
 'texto/primario', 'texto/secundario', 'texto/sutil', 'texto/inverso', 'texto/ouro',
 'borda/sutil', 'borda/media', 'borda/ouro', 'acao/primaria', 'acao/primaria-texto',
 'acao/secundaria', 'acao/destrutiva', 'ouro/tenue', 'ouro/escuro', 'ouro/base',
 'ouro/claro', 'ouro/profundo', 'nivel/bronze', 'nivel/prata', 'nivel/ouro',
 'nivel/diamante', 'sinal/sucesso', 'sinal/alerta', 'sinal/erro', 'sinal/info']
  .forEach(n => VARIAVEIS.push({ name: 'cor/' + n, id: 'var:' + n }));

const ESTILOS_TEXTO = `Display/Saldo Display/XL Título/H1 Título/H2 Título/H3 Título/H4
Número/Grande Número/Médio Corpo/Grande Corpo/Padrão Corpo/Forte Corpo/Pequeno
Rótulo/Botão Rótulo/Chip Rótulo/Nav Rótulo/Overline`.split(/\s+/).filter(Boolean)
  .map(n => ({ name: n, id: 'ts:' + n }));
const ESTILOS_EFEITO = ['Sombra/Suave', 'Sombra/Card', 'Sombra/Elevada', 'Sombra/Nav', 'Brilho/Ouro', 'Brilho/Ouro Forte']
  .map(n => ({ name: n, id: 'es:' + n }));

const figma = {
  root: { children: Object.values(PAGINAS) },
  currentPage: PAGINAS['0:1'],
  async getNodeByIdAsync(id) { return PAGINAS[id] || SOLTOS[id] || null; },
  async setCurrentPageAsync(p) { if (!p) throw new Error('setCurrentPageAsync com página nula'); this.currentPage = p; },
  async loadFontAsync(f) { if (!f || !f.family || !f.style) throw new Error('loadFontAsync inválido'); },
  async listAvailableFontsAsync() { return []; },
  createText() { const n = new No('TEXT'); n._tar = 'WIDTH_AND_HEIGHT'; n._fs = 14; return n; },
  createRectangle() { return new No('RECTANGLE'); },
  createEllipse() { return new No('ELLIPSE'); },
  createLine() { return new No('LINE'); },
  createFrame() { const n = new No('FRAME'); n.width = 100; n.height = 100; return n; },
  createComponent() { return new No('COMPONENT'); },
  createSection() { const n = new No('SECTION'); n.layoutMode = 'NONE'; return n; },
  createPage() { return new No('PAGE'); },
  createAutoLayout(dir, props) {
    const n = new No('FRAME');
    n.layoutMode = (typeof dir === 'string') ? dir : 'HORIZONTAL';
    n.width = 100; n.height = 40;
    return n;
  },
  createNodeFromSvg(svg) {
    if (typeof svg !== 'string' || svg.indexOf('<svg') !== 0) throw new Error('createNodeFromSvg sem SVG válido');
    const n = new No('FRAME', 'svg'); n.width = 24; n.height = 24;
    const v = new No('VECTOR'); v.parent = n; n.children.push(v);
    return n;
  },
  combineAsVariants(nodes, parent) {
    const s = new No('COMPONENT_SET');
    nodes.forEach(n => { n.parent = s; s.children.push(n); });
    if (parent) { s.parent = parent; parent.children.push(s); }
    return s;
  },
  getLocalTextStyles() { return ESTILOS_TEXTO; },
  getLocalEffectStyles() { return ESTILOS_EFEITO; },
  variables: {
    async getLocalVariablesAsync() { return VARIAVEIS; },
    async getLocalVariableCollectionsAsync() { return []; },
    setBoundVariableForPaint(paint, field, v) {
      if (!v) throw new Error('setBoundVariableForPaint com variável nula');
      return Object.assign({}, paint, { boundVariables: { [field]: { id: v.id } } });
    }
  },
  notify() { throw new Error('figma.notify não é suportado'); }
};

module.exports = { figma, AVISOS, PAGINAS, COMPS };
