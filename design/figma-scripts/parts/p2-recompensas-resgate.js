// ===== PARTE 2 · F · Recompensas & Resgate (5 telas) =====
const PAGE=await figma.getNodeByIdAsync('5:2'); await figma.setCurrentPageAsync(PAGE);
const ids={};
const SF=mkSection('F · Recompensas & Resgate',5); PAGE.appendChild(SF); await secTitle(SF,'F · Recompensas & Resgate');

const CAT=[
  ['Coxinha G','Frango com Catupiry®','300',IMG.coxinhaG,1],
  ['Coxinha M','Queijo mussarela','200',IMG.coxinhaM,1],
  ['Churros Gourmet','Doce de leite','450',IMG.churros,1],
  ['Copo Mágico Doce','Churros + sorvete','600',IMG.copoDoce,1],
  ['Combo Casal','2 coxinhas G + 2 bebidas','900',IMG.comboCasal,0],
  ['Mini Gostosuras','Caixa com 20 unidades','1.200',IMG.cestaMini,0]];

// --- 18 · Catálogo de recompensas ---
{
  const f=await scr(SF,'18 · Recompensas',0);
  await glow(f,60,30,280,0.16,170);
  await statusbar(f);
  const hd=await N({t:'al',dir:'HORIZONTAL',w:326,ji:'SPACE_BETWEEN',ai:'CENTER'},f); hd.x=32; hd.y=68;
  await N({t:'al',dir:'VERTICAL',gap:3,ch:[
    {t:'text',st:'Título/H1',tx:'Recompensas',fill:'cor/texto/primario'},
    {t:'text',st:'Corpo/Pequeno',tx:'Seu ouro vira coxinha.',fill:'cor/texto/secundario'}]},hd);
  await N({t:'al',dir:'HORIZONTAL',gap:7,ai:'CENTER',r:999,p:[9,14,9,12],fill:{c:'#F9C115',o:0.14},stroke:'cor/borda/ouro',ch:[
    {t:'ico',n:'brilho',s:16,c:'#F9C115'},
    {t:'text',st:'Corpo/Forte',tx:'1.280',fill:'cor/texto/ouro'}]},hd);
  await chips(f,32,152,['Tudo','Produtos','Combos','Cupons','Experiências'],0);
  let i=0;
  for(const [nome,desc,pts,im,ok] of CAT){
    const c=await N({t:'inst',k:'Card de Recompensa|Estado='+(ok?'Disponível':'Bloqueada')},f);
    c.x=32+(i%2)*183; c.y=212+Math.floor(i/2)*250;
    txAll(c,{'nome':nome,'descrição':desc});
    if(ok) tx(c,'pontos',pts);
    const foto=c.findOne(n=>n.name==='foto'); if(foto) foto.fills=[{type:'IMAGE',imageHash:im,scaleMode:'FIT'}];
    i++;
  }
  await nav(f,'Recompensas');
  ids.catalogo=f.id;
}

// --- 19 · Detalhe da recompensa ---
{
  const f=await scr(SF,'19 · Detalhe da recompensa',1);
  const hero=await N({t:'al',dir:'VERTICAL',w:390,h:348,ai:'CENTER',ji:'CENTER',clip:true,fill:{c:'#F9C115',o:0.1},name:'herói'},f);
  hero.x=0; hero.y=0; hero.primaryAxisSizingMode='FIXED'; hero.counterAxisSizingMode='FIXED';
  await glow(f,75,70,240,0.3,150);
  const foto=await N({t:'rect',w:250,h:250,fill:{im:IMG.coxinhaG,mode:'FIT'},name:'foto'},hero);
  await statusbar(f);
  await appbar(f,'',{closeIcon:true,actionIcon:'coracao'});
  const col=await N({t:'al',dir:'VERTICAL',w:326,gap:10},f); col.x=32; col.y=368;
  await N({t:'text',st:'Rótulo/Overline',tx:'Produto · Linha coxinhas',uc:true,fill:'cor/texto/ouro'},col);
  await N({t:'text',st:'Título/H1',tx:'Coxinha G',fill:'cor/texto/primario'},col);
  await N({t:'text',st:'Corpo/Grande',tx:'A clássica da casa, no tamanho grande, com o recheio que você escolher no balcão.',fill:'cor/texto/secundario',w:326},col);
  const pr=await N({t:'al',dir:'HORIZONTAL',w:326,r:20,p:16,gap:14,ai:'CENTER',ji:'SPACE_BETWEEN',fill:'cor/fundo/elevado',stroke:'cor/borda/ouro',name:'preço'},f);
  pr.x=32; pr.y=col.y+col.height+18; pr.counterAxisSizingMode='FIXED';
  await N({t:'al',dir:'HORIZONTAL',gap:9,ai:'CENTER',ch:[
    {t:'ico',n:'brilho',s:24,c:'#F9C115'},
    {t:'al',dir:'VERTICAL',gap:-2,ch:[
      {t:'text',st:'Número/Grande',tx:'300',fill:'cor/texto/ouro'},
      {t:'text',st:'Corpo/Pequeno',tx:'Pontos Dourados',fill:'cor/texto/sutil'}]}]},pr);
  await N({t:'al',dir:'VERTICAL',gap:2,ai:'MAX',ch:[
    {t:'text',st:'Corpo/Pequeno',tx:'Seu saldo',fill:'cor/texto/sutil'},
    {t:'text',st:'Corpo/Forte',tx:'1.280 pts',fill:'cor/texto/primario'}]},pr);
  await secHead(f,32,pr.y+pr.height+24,'O que está incluso',false);
  let y=pr.y+pr.height+54;
  for(const t of ['1 Coxinha G do sabor que você escolher','Acompanha 1 molho da casa','Retirada na unidade escolhida']){
    const r=await N({t:'al',dir:'HORIZONTAL',w:326,gap:11,ai:'CENTER',ch:[
      {t:'ico',n:'check-circulo',s:19,c:'#3DD68C'},
      {t:'text',st:'Corpo/Padrão',tx:t,fill:'cor/texto/secundario',w:'fill'}]},f);
    r.x=32;r.y=y;y+=r.height+11;
  }
  const bar=await N({t:'al',dir:'VERTICAL',w:390,h:112,p:[16,32],gap:9,ai:'CENTER',fill:'cor/fundo/elevado',ef:'Sombra/Nav',name:'barra de ação'},f);
  bar.x=0; bar.y=732; bar.primaryAxisSizingMode='FIXED'; bar.counterAxisSizingMode='FIXED';
  await N({t:'text',st:'Corpo/Pequeno',tx:'Válido por 7 dias após o resgate · Cajamar',fill:'cor/texto/sutil'},bar);
  const b=await N({t:'inst',k:'Botão|Estilo=Ouro, Estado=Padrão'},bar); b.resize(326,52); tx(b,'rótulo','Resgatar por 300 pontos');
  ids.detalheRecompensa=f.id;
}

// --- 20 · Confirmar resgate (bottom sheet) ---
{
  const f=await scr(SF,'20 · Confirmar resgate',2);
  // contexto desfocado ao fundo
  await statusbar(f);
  const bg=await N({t:'al',dir:'HORIZONTAL',gap:16,name:'fundo'},f); bg.x=32; bg.y=140; bg.opacity=0.35;
  for(const [nome,desc,pts,im,ok] of CAT.slice(0,2)){
    const c=await N({t:'inst',k:'Card de Recompensa|Estado=Disponível'},bg);
    txAll(c,{'nome':nome,'descrição':desc,'pontos':pts});
    const ft=c.findOne(n=>n.name==='foto'); if(ft) ft.fills=[{type:'IMAGE',imageHash:im,scaleMode:'FIT'}];
  }
  const scrim=await N({t:'rect',w:390,h:844,fill:{c:'#0A0A0A',o:0.72},name:'scrim'},f); scrim.x=0; scrim.y=0;
  const sh=await N({t:'al',dir:'VERTICAL',w:390,p:[14,32,36,32],gap:18,ai:'CENTER',r:[28,28,0,0],fill:'cor/fundo/elevado',ef:'Sombra/Elevada',name:'sheet'},f);
  sh.counterAxisSizingMode='FIXED';
  await N({t:'rect',w:44,h:5,r:999,fill:{c:'#FFFFFF',o:0.25},name:'alça'},sh);
  await N({t:'text',st:'Título/H2',tx:'Confirmar resgate',fill:'cor/texto/primario'},sh);
  const pr=await N({t:'al',dir:'HORIZONTAL',w:'fill',r:18,p:13,gap:13,ai:'CENTER',fill:'cor/fundo/superficie',name:'produto'},sh);
  await N({t:'al',dir:'VERTICAL',w:58,h:58,r:14,ai:'CENTER',ji:'CENTER',clip:true,fill:{c:'#F9C115',o:0.12},ch:[{t:'rect',w:50,h:50,fill:{im:IMG.coxinhaG,mode:'FIT'}}]},pr);
  await N({t:'al',dir:'VERTICAL',w:'fill',gap:3,ch:[
    {t:'text',st:'Corpo/Forte',tx:'Coxinha G',fill:'cor/texto/primario'},
    {t:'text',st:'Corpo/Pequeno',tx:'Frango com Catupiry®',fill:'cor/texto/sutil'}]},pr);
  await N({t:'text',st:'Número/Médio',sz:18,tx:'−300',fill:'cor/texto/ouro'},pr);
  const inf=await infoCard(sh,[['Saldo atual','1.280 pts'],['Custo do resgate','−300 pts','cor/texto/ouro'],['Saldo depois','980 pts']],{w:326,p:[2,18]});
  inf.layoutSizingHorizontal='FILL'; inf.fills=[]; inf.strokes=[sol('cor/borda/sutil')];
  await N({t:'al',dir:'HORIZONTAL',w:'fill',r:14,p:13,gap:10,ai:'MIN',fill:{c:'#F9C115',o:0.1},ch:[
    {t:'ico',n:'relogio',s:17,c:'#F9C115'},
    {t:'text',st:'Corpo/Pequeno',tx:'O voucher vale 7 dias e só pode ser usado na unidade Cajamar.',fill:'cor/texto/secundario',w:'fill'}]},sh);
  const b1=await N({t:'inst',k:'Botão|Estilo=Ouro, Estado=Padrão'},sh); b1.resize(326,52); tx(b1,'rótulo','Confirmar resgate');
  const b2=await N({t:'inst',k:'Botão|Estilo=Fantasma, Estado=Padrão'},sh); b2.resize(326,48); tx(b2,'rótulo','Cancelar');
  sh.x=0; sh.y=844-sh.height;
  ids.confirmarResgate=f.id;
}

// --- 21 · Resgate concluído ---
{
  const f=await scr(SF,'21 · Resgate concluído',3);
  await glow(f,-20,60,420,0.26,190);
  const g=inst('Gota · sub-marca'); f.appendChild(g); g.rescale(150/g.width); g.opacity=0.06; g.x=280; g.y=560;
  await statusbar(f);
  const top=await N({t:'al',dir:'VERTICAL',w:390,gap:12,ai:'CENTER'},f); top.x=0; top.y=78;
  await N({t:'al',dir:'VERTICAL',w:58,h:58,r:999,ai:'CENTER',ji:'CENTER',fill:{g:OURO},ef:'Brilho/Ouro',ch:[{t:'ico',n:'check',s:30,c:'#462302'}]},top);
  await N({t:'al',dir:'VERTICAL',gap:5,ai:'CENTER',ch:[
    {t:'text',st:'Título/H2',tx:'Resgate concluído!',fill:'cor/texto/primario'},
    {t:'text',st:'Corpo/Padrão',tx:'Mostre o código no caixa para retirar.',fill:'cor/texto/secundario'}]},top);
  const v=await N({t:'inst',k:'Voucher · QR'},f); v.x=32; v.y=232;
  const bar=await N({t:'al',dir:'VERTICAL',w:390,h:104,p:[16,32],gap:8,ai:'CENTER',fill:'cor/fundo/elevado',ef:'Sombra/Nav',name:'barra de ação'},f);
  bar.x=0; bar.y=740; bar.primaryAxisSizingMode='FIXED'; bar.counterAxisSizingMode='FIXED';
  const b=await N({t:'inst',k:'Botão|Estilo=Ouro, Estado=Padrão'},bar); b.resize(326,52); tx(b,'rótulo','Salvar nos meus vouchers');
  await N({t:'text',st:'Corpo/Pequeno',tx:'Também enviamos por WhatsApp',fill:'cor/texto/sutil'},bar);
  ids.resgateConcluido=f.id;
}

// --- 22 · Meus vouchers ---
{
  const f=await scr(SF,'22 · Meus vouchers',4);
  await statusbar(f);
  await appbar(f,'Meus vouchers',{noAction:true});
  await chips(f,32,122,['Ativos','Usados','Expirados'],0);
  const VS=[
    ['Coxinha G','PD-7K4M-2X90','Vence em 5 dias',IMG.coxinhaG,'Disponível','cor/sinal/sucesso',1],
    ['Churros Gourmet','PD-9A2P-7T41','Vence em 2 dias',IMG.churros,'Disponível','cor/sinal/alerta',1],
    ['Combo Casal','PD-3C8L-5R22','Usado em 02 nov',IMG.comboCasal,'Utilizado','cor/texto/sutil',0],
    ['Copo Mágico Doce','PD-6B1X-9K07','Expirou em 28 out',IMG.copoDoce,'Expirado','cor/sinal/erro',0]];
  let y=182;
  for(const [nome,cod,val,im,est,cor,ativo] of VS){
    const r=await N({t:'al',dir:'HORIZONTAL',w:326,r:20,p:14,gap:13,ai:'CENTER',fill:'cor/fundo/elevado',stroke:ativo?'cor/borda/ouro':'cor/borda/sutil',op:ativo?1:0.55,name:'voucher'},f);
    r.x=32; r.y=y; r.counterAxisSizingMode='FIXED';
    await N({t:'al',dir:'VERTICAL',w:56,h:56,r:14,ai:'CENTER',ji:'CENTER',clip:true,fill:{c:'#F9C115',o:0.12},ch:[{t:'rect',w:48,h:48,fill:{im:im,mode:'FIT'}}]},r);
    await N({t:'al',dir:'VERTICAL',w:'fill',gap:3,ch:[
      {t:'text',st:'Corpo/Forte',tx:nome,fill:'cor/texto/primario'},
      {t:'text',st:'Corpo/Pequeno',tx:cod,fill:'cor/texto/ouro',ls:6},
      {t:'text',st:'Corpo/Pequeno',tx:val,fill:'cor/texto/sutil'}]},r);
    await N({t:'al',dir:'HORIZONTAL',gap:6,ai:'CENTER',r:999,p:[6,11,6,9],fill:'cor/fundo/superficie',ch:[
      {t:'ell',w:6,h:6,fill:cor},
      {t:'text',st:'Corpo/Pequeno',sz:11,tx:est,fill:'cor/texto/secundario'}]},r);
    y+=r.height+12;
  }
  await nav(f,'Recompensas');
  ids.meusVouchers=f.id;
}
SF.x=0; SF.y=6000;
return {ids, section:SF.id};
