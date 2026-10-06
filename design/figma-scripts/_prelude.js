// ===== PRELUDE · Pontos Dourados · helpers compartilhados =====
// Não executar sozinho: build.py concatena este arquivo com cada parte.
const DS=await figma.getNodeByIdAsync('0:1'); await DS.loadAsync();
const hx=h=>{h=h.replace('#','');return{r:parseInt(h.slice(0,2),16)/255,g:parseInt(h.slice(2,4),16)/255,b:parseInt(h.slice(4,6),16)/255}};
const V={};(await figma.variables.getLocalVariablesAsync()).forEach(v=>V[v.name]=v);
const TS={};figma.getLocalTextStyles().forEach(s=>TS[s.name]=s);
const ES={};figma.getLocalEffectStyles().forEach(s=>ES[s.name]=s);
for(const f of [['Baloo 2','ExtraBold'],['Baloo 2','Bold'],['Baloo 2','SemiBold'],['Baloo 2','Medium'],['Baloo 2','Regular'],['Poppins','Regular'],['Poppins','Medium'],['Poppins','SemiBold'],['Poppins','Bold']]) await figma.loadFontAsync({family:f[0],style:f[1]});
const IC={},C={};
DS.findAllWithCriteria({types:['COMPONENT','COMPONENT_SET']}).forEach(n=>{
  if(n.type==='COMPONENT_SET'){C[n.name]=n;n.children.forEach(v=>{C[n.name+'|'+v.name]=v;});}
  else if(!(n.parent&&n.parent.type==='COMPONENT_SET')){C[n.name]=n;if(n.name.indexOf('Ícone/')===0)IC[n.name.slice(6)]=n;}
});
function sol(c,o){let p;if(c[0]==='#')p={type:'SOLID',color:hx(c)};else if(V[c])p=figma.variables.setBoundVariableForPaint({type:'SOLID',color:hx('#FFFFFF')},'color',V[c]);else p={type:'SOLID',color:hx('#FF00FF')};return o==null?p:Object.assign({},p,{opacity:o});}
function gt(d){const r=d*Math.PI/180,c=Math.cos(r),s=Math.sin(r);return[[c,s,.5-.5*c-.5*s],[-s,c,.5+.5*s-.5*c]];}
function grd(st,d){return{type:'GRADIENT_LINEAR',gradientTransform:gt(d==null?135:d),gradientStops:st.map(a=>({position:a[0],color:Object.assign({},hx(a[1]),{a:a[2]==null?1:a[2]})}))};}
const OURO=[[0,'#FFEB4A'],[.45,'#F9C115'],[1,'#E0A50C']];
const MET={Bronze:[[0,'#F0BE92'],[.45,'#C8792F'],[1,'#7E4412']],Prata:[[0,'#FFFFFF'],[.45,'#C9CED6'],[1,'#878D97']],Ouro:OURO,Diamante:[[0,'#EAFBFF'],[.45,'#7FD6E8'],[1,'#2E93AE']]};
const IMG={coxinhaG:'8facdecb86ac6b5be18572071c7ad34c5d35a05f',coxinhaM:'d82a80c4218f0f4985487687b55a4aecee9d9a2a',coxinhaGourmet:'02a5ac42628004377634bd5d2609c0b2e019a293',comboCasal:'237a28e86fe1f81bb885b3e8cf163dcbeb4126b2',churros:'625ad63322edd923dd32b89c3bab6674d52f3ca1',copoDoce:'0eb62e5a8e1ab66263b0a7e9d5b1ce0741e5326c',cestaMini:'7c8600136abd1e12c29feee9329a0da2c0afeed2',coxinhaCombo:'3a8179bffabfb1f4e8c550e3413f4b0777b857d4',molhos:'b26bfbd31805f83d8e2c75c2ed158b32438a9124',mascote:'8a8f9dd95cce364ad60b2a5b50401c5627ce69c6',congelados:'fc47a3209fda0fd56077876da449b4f7a2e9f72e',miniChurros:'f68b84432ce726918e15ca7a544ba3e20e43b024',catupiry:'9791e022a63894e476a18835ab27a4d8c5b76881',costela:'e1e5fed76d65cee51a97d20bde8735eb9c01afdb',loja:'6cce7185f6fdfd41c136d45bd996bdff5b594afb'};
function pf(v){if(v==null)return[];if(Array.isArray(v))return v;if(typeof v==='string')return[sol(v)];if(v.g)return[grd(v.g,v.a)];if(v.im)return[{type:'IMAGE',imageHash:v.im,scaleMode:v.mode||'FILL'}];if(v.c)return[sol(v.c,v.o)];return[v];}
function ico(n,s,c){const i=IC[n].createInstance();i.name='ícone/'+n;if(s&&s!==24)i.rescale(s/24);if(c)i.findAll(x=>x.type==='VECTOR').forEach(x=>{x.strokes=[sol(c)];});return i;}
function inst(k){const c=C[k];if(!c)throw new Error('componente faltando: '+k);return c.createInstance();}
async function N(sp,par){
  const t=sp.t||'al';let n;
  if(t==='text')n=figma.createText();
  else if(t==='rect')n=figma.createRectangle();
  else if(t==='ell')n=figma.createEllipse();
  else if(t==='ico')n=ico(sp.n,sp.s,sp.c);
  else if(t==='inst')n=inst(sp.k);
  else if(t==='svg')n=figma.createNodeFromSvg(sp.svg);
  else if(t==='comp'){n=figma.createComponent();n.layoutMode=sp.dir||'VERTICAL';n.primaryAxisSizingMode='AUTO';n.counterAxisSizingMode='AUTO';n.fills=[];}
  else if(t==='frame'){n=figma.createFrame();n.layoutMode='NONE';n.fills=[];}
  else {n=figma.createAutoLayout(sp.dir||'VERTICAL');n.fills=[];}
  if(par)par.appendChild(n);
  if(t==='text'){
    if(sp.st&&TS[sp.st])await n.setTextStyleIdAsync(TS[sp.st].id);
    if(sp.fo)n.fontName=sp.fo;
    n.characters=sp.tx==null?'':String(sp.tx);
    if(sp.sz)n.fontSize=sp.sz;
    if(sp.lh!=null)n.lineHeight={unit:'PIXELS',value:sp.lh};
    if(sp.ls!=null)n.letterSpacing={unit:'PERCENT',value:sp.ls};
    if(sp.uc)n.textCase='UPPER';
    if(sp.ta)n.textAlignHorizontal=sp.ta;
    n.textAutoResize=(sp.w==='fill'||typeof sp.w==='number')?'HEIGHT':'WIDTH_AND_HEIGHT';
  }
  if(typeof sp.w==='number'||typeof sp.h==='number'){
    const w=typeof sp.w==='number'?sp.w:n.width,h=typeof sp.h==='number'?sp.h:n.height;
    if(t==='text')n.resize(w,n.height);else n.resize(Math.max(w,.01),Math.max(h,.01));
  }
  const pal=par&&'layoutMode'in par&&par.layoutMode!=='NONE';
  if(pal&&!sp.abs){if(sp.w==='fill')n.layoutSizingHorizontal='FILL';if(sp.h==='fill')n.layoutSizingVertical='FILL';}
  if(sp.name)n.name=sp.name;
  if(sp.fill!==undefined)n.fills=pf(sp.fill);
  if(sp.stroke){n.strokes=pf(sp.stroke);n.strokeWeight=sp.sw||1;n.strokeAlign=sp.sa||'INSIDE';}
  if(sp.dash)n.dashPattern=sp.dash;
  if(sp.r!=null){if(Array.isArray(sp.r)){n.topLeftRadius=sp.r[0];n.topRightRadius=sp.r[1];n.bottomRightRadius=sp.r[2];n.bottomLeftRadius=sp.r[3];}else n.cornerRadius=sp.r;}
  if(sp.p!=null){const q=Array.isArray(sp.p)?sp.p:[sp.p];const a=q.length===1?[q[0],q[0],q[0],q[0]]:q.length===2?[q[0],q[1],q[0],q[1]]:q;n.paddingTop=a[0];n.paddingRight=a[1];n.paddingBottom=a[2];n.paddingLeft=a[3];}
  if(sp.gap!=null)n.itemSpacing=sp.gap;
  if(sp.ai)n.counterAxisAlignItems=sp.ai;
  if(sp.ji)n.primaryAxisAlignItems=sp.ji;
  if(sp.clip!=null)n.clipsContent=sp.clip;
  if(sp.op!=null)n.opacity=sp.op;
  if(sp.ef&&ES[sp.ef])await n.setEffectStyleIdAsync(ES[sp.ef].id);
  if(sp.efs)n.effects=sp.efs;
  if(sp.abs&&pal)n.layoutPositioning='ABSOLUTE';
  if(sp.px!=null)n.x=sp.px;
  if(sp.py!=null)n.y=sp.py;
  if(sp.ch)for(const c of sp.ch){if(c)await N(c,n);}
  return n;
}
function tx(node,name,val){const t=node.findOne(n=>n.type==='TEXT'&&n.name===name);if(t)t.characters=String(val);return t;}
function txAll(node,pairs){for(const k in pairs)tx(node,k,pairs[k]);return node;}
// Texto por posição, para nós sem nome dentro de um componente.
function txIn(escopo,idx,val){const ts=escopo.findAll(n=>n.type==='TEXT');if(ts[idx])ts[idx].characters=String(val);return ts[idx];}
// Troca o ícone de uma instância. NUNCA adicionar/remover filhos dentro de
// instâncias — o Figma proíbe. swapComponent é o override permitido.
function swapIcon(escopo,novo,cor,idx){
  const alvos=escopo.findAll(n=>n.type==='INSTANCE'&&n.name.indexOf('ícone/')===0);
  const alvo=alvos[idx||0];
  if(alvo&&IC[novo]){alvo.swapComponent(IC[novo]);if(cor)alvo.findAll(x=>x.type==='VECTOR').forEach(x=>{x.strokes=[sol(cor)];});}
  return alvo;
}
const blur=r=>[{type:'LAYER_BLUR',radius:r,visible:true}];
function qrSvg(seed,n,m,col){
  let s=seed>>>0;const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
  let d='';const dk=(x,y)=>{d+='M'+(x*m)+' '+(y*m)+'h'+m+'v'+m+'h-'+m+'z';};
  const fnd=(ox,oy)=>{for(let y=0;y<7;y++)for(let x=0;x<7;x++){if(x===0||x===6||y===0||y===6||(x>=2&&x<=4&&y>=2&&y<=4))dk(ox+x,oy+y);}};
  fnd(0,0);fnd(n-7,0);fnd(0,n-7);
  const inF=(x,y)=>(x<8&&y<8)||(x>=n-8&&y<8)||(x<8&&y>=n-8);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){if(inF(x,y))continue;if(y===6||x===6){if((x+y)%2===0)dk(x,y);continue;}if(rnd()>0.5)dk(x,y);}
  const S=n*m;return '<svg width="'+S+'" height="'+S+'" viewBox="0 0 '+S+' '+S+'" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="'+d+'" fill="'+(col||'#131313')+'"/></svg>';
}
// --- fábrica de seções e telas ---
function mkSection(name,cols){
  const S=figma.createSection();S.name=name;S.fills=[sol('#0A0A0A')];
  S.resizeWithoutConstraints(cols*450+140,1120);
  return S;
}
async function secTitle(S,name){const t=await N({t:'text',st:'Título/H2',tx:name,fill:'#FFFFFF'},S);t.x=70;t.y=50;return t;}
async function scr(S,name,i,bg){const f=await N({t:'frame',name:name,w:390,h:844,fill:bg||'cor/fundo/base',clip:true},S);f.x=70+i*450;f.y=140;return f;}
async function statusbar(f){const s=await N({t:'inst',k:'Barra de Status'},f);s.x=0;s.y=0;return s;}
async function appbar(f,title,opts){
  const a=await N({t:'inst',k:'App Bar'},f);a.x=0;a.y=54;tx(a,'título',title);
  // ordem dos ícones dentro da App Bar: 0 = voltar, 1 = ação
  if(opts&&opts.closeIcon)swapIcon(a,'fechar','#FFFFFF',0);
  if(opts&&opts.actionIcon)swapIcon(a,opts.actionIcon,'#FFFFFF',1);
  if(opts&&opts.noAction===true){const r=a.findOne(n=>n.name==='ação');if(r)r.opacity=0;}
  return a;
}
async function glow(f,x,y,s,op,b,col){const e=await N({t:'ell',w:s,h:s,fill:col||'cor/ouro/base',op:op==null?0.22:op,efs:blur(b||170),name:'brilho'},f);e.x=x;e.y=y;return e;}
async function secHead(f,x,y,title,showAction){
  const h=await N({t:'inst',k:'Cabeçalho de Seção'},f);h.x=x;h.y=y;h.resize(326,h.height);tx(h,'título',title);
  if(showAction===false){const a=h.findOne(n=>n.name==='ação');if(a)a.opacity=0;}
  return h;
}
async function nav(f,ativo){const n=await N({t:'inst',k:'Navegação Inferior|Ativo='+ativo},f);n.x=0;n.y=756;return n;}
async function chips(f,x,y,itens,ativoIdx){
  const row=await N({t:'al',dir:'HORIZONTAL',gap:9,name:'filtros'},f);row.x=x;row.y=y;
  for(let i=0;i<itens.length;i++){
    const c=await N({t:'inst',k:'Chip|Estado='+(i===ativoIdx?'Ativo':'Padrão')},row);tx(c,'rótulo',itens[i]);
  }
  return row;
}
async function botao(f,x,y,rotulo,estilo,estado,w){
  const b=await N({t:'inst',k:'Botão|Estilo='+(estilo||'Ouro')+', Estado='+(estado||'Padrão')},f);
  b.x=x;b.y=y;b.resize(w||326,52);tx(b,'rótulo',rotulo);return b;
}
async function overline(f,x,y,t,cor){const n=await N({t:'text',st:'Rótulo/Overline',tx:t,uc:true,fill:cor||'cor/texto/sutil'},f);n.x=x;n.y=y;return n;}
// caixa de informação genérica (linhas rótulo → valor)
async function infoCard(parent,linhas,opts){
  const c=await N({t:'al',dir:'VERTICAL',w:(opts&&opts.w)||326,r:20,p:(opts&&opts.p)||18,gap:0,fill:'cor/fundo/elevado',stroke:'cor/borda/sutil',name:(opts&&opts.name)||'informações'},parent);
  c.counterAxisSizingMode='FIXED';
  for(let i=0;i<linhas.length;i++){
    const [k,v,cor]=linhas[i];
    await N({t:'al',dir:'HORIZONTAL',w:'fill',p:[13,0],gap:16,ji:'SPACE_BETWEEN',ai:'CENTER',ch:[
      {t:'text',st:'Corpo/Padrão',tx:k,fill:'cor/texto/secundario'},
      {t:'text',st:'Corpo/Forte',tx:v,fill:cor||'cor/texto/primario',ta:'RIGHT'}]},c);
    if(i<linhas.length-1) await N({t:'rect',w:'fill',h:1,fill:'cor/borda/sutil'},c);
  }
  return c;
}
// bloco de celebração reutilizável (missão, nível, resgate)
async function celebra(f,opts){
  await glow(f,-20,140,440,0.30,190);
  for(const [s,x,y,o] of [[150,290,90,0.07],[90,-20,560,0.06],[60,320,620,0.06]]){
    const g=inst('Gota · sub-marca');f.appendChild(g);g.rescale(s/g.width);g.opacity=o;g.x=x;g.y=y;
  }
  const col=await N({t:'al',dir:'VERTICAL',w:390,gap:22,ai:'CENTER',name:'celebração'},f);
  col.x=0;col.y=opts.top||168;
  return col;
}
