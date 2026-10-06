// ===== PARTE 4 · J · Notificações (1) + K · Níveis (2) + L · Estados (3) =====
const PAGE=await figma.getNodeByIdAsync('5:2'); await figma.setCurrentPageAsync(PAGE);
const ids={};
const NIVEIS=[['Bronze','0 pontos acumulados','Conquistado'],
              ['Prata','1.000 pontos acumulados','Conquistado'],
              ['Ouro','3.000 pontos acumulados','Nível atual'],
              ['Diamante','5.000 pontos acumulados','Faltam 320']];

// --- ajuste de consistência no onboarding 3 (texto genérico, não dado do usuário) ---
try{
  const o3=await figma.getNodeByIdAsync('12:268');
  if(o3){const p=o3.findOne(n=>n.name==='faltam');
    if(p){const t=p.findOne(n=>n.type==='TEXT'); if(t)t.characters='Faltam 320 pontos para o próximo nível';}}
}catch(e){}

// ===================== J · NOTIFICAÇÕES =====================
const SJ=mkSection('J · Notificações',1); PAGE.appendChild(SJ); await secTitle(SJ,'J · Notificações');
{
  const f=await scr(SJ,'31 · Notificações',0);
  await statusbar(f);
  await appbar(f,'Notificações',{actionIcon:'check'});
  await overline(f,32,124,'Hoje','cor/texto/sutil');
  let y=150;
  const NOVAS=[['brilho','Você ganhou 150 Pontos Dourados','Missão “Sequência Dourada” concluída na unidade Cajamar.','há 2 h'],
               ['presente','Uma nova recompensa está disponível','Churros Gourmet entrou no catálogo por 450 pontos.','há 5 h']];
  for(const [ic,t1,t2,tm] of NOVAS){
    const n=await N({t:'inst',k:'Linha de Notificação|Estado=Nova'},f); n.x=32; n.y=y;
    txAll(n,{'título':t1,'texto':t2,'tempo':tm});
    swapIcon(n,ic,'#F9C115',0);
    y+=n.height+12;
  }
  await overline(f,32,y+10,'Esta semana','cor/texto/sutil');
  y+=36;
  const LIDAS=[['relogio','Seus pontos expiram em 7 dias','90 Pontos Dourados vencem em 19 de novembro.','ontem'],
               ['tendencia','Você está a 320 pontos do Diamante','Mais duas compras e o próximo nível é seu.','2 dias'],
               ['alvo','Você desbloqueou uma Missão Dourada','“Experimente um sabor novo” vale 80 pontos.','4 dias']];
  for(const [ic,t1,t2,tm] of LIDAS){
    const n=await N({t:'inst',k:'Linha de Notificação|Estado=Lida'},f); n.x=32; n.y=y;
    txAll(n,{'título':t1,'texto':t2,'tempo':tm});
    swapIcon(n,ic,'#8A8A8A',0);
    y+=n.height+12;
  }
  await nav(f,'Início');
  ids.notificacoes=f.id;
}
SJ.x=0; SJ.y=10800;

// ===================== K · NÍVEIS =====================
const SK=mkSection('K · Níveis',2); PAGE.appendChild(SK); await secTitle(SK,'K · Níveis');

// --- 32 · Trilha de níveis ---
{
  const f=await scr(SK,'32 · Trilha de níveis',0);
  await glow(f,85,80,220,0.24,150);
  await statusbar(f);
  await appbar(f,'Seu nível',{actionIcon:'info'});
  const top=await N({t:'al',dir:'VERTICAL',w:390,gap:14,ai:'CENTER'},f); top.x=0; top.y=132;
  const selo=await N({t:'inst',k:'Selo de Nível|Nível=Ouro'},top); selo.rescale(1.18);
  await N({t:'al',dir:'VERTICAL',w:326,gap:6,ai:'CENTER',ch:[
    {t:'text',st:'Título/H1',tx:'Nível Ouro',fill:'cor/texto/primario'},
    {t:'text',st:'Corpo/Padrão',tx:'4.680 pontos acumulados desde out/2025',fill:'cor/texto/secundario',ta:'CENTER',w:326}]},top);
  const pc=await N({t:'al',dir:'VERTICAL',w:326,r:20,p:16,gap:10,fill:{c:'#F9C115',o:0.1},stroke:'cor/borda/ouro',name:'próximo'},f);
  pc.x=32; pc.y=348; pc.counterAxisSizingMode='FIXED';
  await N({t:'al',dir:'HORIZONTAL',w:'fill',ji:'SPACE_BETWEEN',ai:'CENTER',ch:[
    {t:'text',st:'Corpo/Forte',tx:'Faltam 320 pontos para o Diamante',fill:'cor/texto/primario'},
    {t:'text',st:'Corpo/Forte',tx:'94%',fill:'cor/texto/ouro'}]},pc);
  await N({t:'al',dir:'HORIZONTAL',w:'fill',h:10,r:999,clip:true,fill:{c:'#462302',o:0.5},ch:[{t:'rect',w:276,h:10,r:999,fill:{g:OURO,a:90}}]},pc);
  await secHead(f,32,pc.y+pc.height+26,'Sua trilha',false);
  const y0=pc.y+pc.height+58;
  const linha=await N({t:'rect',w:2,h:3*78,fill:'cor/borda/sutil',name:'trilho'},f); linha.x=32+23; linha.y=y0+24;
  for(let i=0;i<NIVEIS.length;i++){
    const [nv,req,sta]=NIVEIS[i];
    const conq=i<2, atual=i===2;
    const r=await N({t:'al',dir:'HORIZONTAL',w:326,gap:14,ai:'CENTER',p:[0],name:'nível '+nv},f);
    r.x=32; r.y=y0+i*78; r.counterAxisSizingMode='FIXED';
    await N({t:'al',dir:'VERTICAL',w:48,h:48,r:16,ai:'CENTER',ji:'CENTER',fill:{g:MET[nv]},op:(conq||atual)?1:0.35,stroke:atual?'#FFFFFF':undefined,sw:2,
      ch:[{t:'ico',n:conq?'check':(atual?'trofeu':'cadeado'),s:22,c:'#FFFFFF'}]},r);
    await N({t:'al',dir:'VERTICAL',w:'fill',gap:2,ch:[
      {t:'text',st:'Corpo/Forte',tx:nv,fill:(conq||atual)?'cor/texto/primario':'cor/texto/secundario'},
      {t:'text',st:'Corpo/Pequeno',tx:req,fill:'cor/texto/sutil'}]},r);
    await N({t:'al',dir:'HORIZONTAL',r:999,p:[5,11],fill:atual?{c:'#F9C115',o:0.16}:'cor/fundo/superficie',ch:[
      {t:'text',st:'Corpo/Pequeno',sz:11,tx:sta,fill:atual?'cor/texto/ouro':'cor/texto/sutil'}]},r);
  }
  await nav(f,'Início');
  ids.niveis=f.id;
}

// --- 33 · Subiu de nível ---
{
  const f=await scr(SK,'33 · Você subiu de nível',1);
  const col=await celebra(f,{top:150});
  const selo=await N({t:'inst',k:'Selo de Nível|Nível=Ouro'},col); selo.rescale(1.55);
  await N({t:'al',dir:'VERTICAL',w:326,gap:8,ai:'CENTER',ch:[
    {t:'text',st:'Rótulo/Overline',tx:'Novo nível desbloqueado',uc:true,fill:'cor/texto/ouro'},
    {t:'text',st:'Título/H1',tx:'Você chegou\nao nível Ouro.',fill:'cor/texto/primario',ta:'CENTER',w:326},
    {t:'text',st:'Corpo/Grande',tx:'Obrigado por voltar sempre. O clube retribui.',fill:'cor/texto/secundario',ta:'CENTER',w:326}]},col);
  const lst=await N({t:'al',dir:'VERTICAL',w:326,r:22,p:18,gap:14,fill:'cor/fundo/elevado',stroke:'cor/borda/ouro',name:'benefícios'},f);
  lst.x=32; lst.y=592; lst.counterAxisSizingMode='FIXED';
  await N({t:'text',st:'Rótulo/Overline',tx:'O que você desbloqueou',uc:true,fill:'cor/texto/sutil'},lst);
  for(const t of ['Recompensas exclusivas do nível Ouro','14 benefícios de parceiros do Clube','Pontos em dobro no mês do aniversário']){
    await N({t:'al',dir:'HORIZONTAL',w:'fill',gap:11,ai:'CENTER',ch:[
      {t:'ico',n:'check-circulo',s:19,c:'#F9C115'},
      {t:'text',st:'Corpo/Padrão',tx:t,fill:'cor/texto/secundario',w:'fill'}]},lst);
  }
  await botao(f,32,714,'Ver meus benefícios','Ouro','Padrão');
  await botao(f,32,776,'Agora não','Fantasma','Padrão');
  ids.subiuNivel=f.id;
}
SK.x=0; SK.y=12000;

// ===================== L · ESTADOS & FEEDBACK =====================
const SL=mkSection('L · Estados & Feedback',4); PAGE.appendChild(SL); await secTitle(SL,'L · Estados & Feedback');

// --- 34 · Estado vazio ---
{
  const f=await scr(SL,'34 · Vazio · sem pontos',0);
  await statusbar(f);
  await appbar(f,'Recompensas',{noAction:true});
  const g=inst('Gota · sub-marca'); f.appendChild(g); g.rescale(160/g.width);
  g.findAll(x=>'fills' in x&&x.type!=='FRAME').forEach(x=>{x.fills=[sol('#FFFFFF')];});
  g.opacity=0.07; g.x=120; g.y=226;
  const col=await N({t:'al',dir:'VERTICAL',w:326,gap:12,ai:'CENTER'},f); col.x=32; col.y=440;
  await N({t:'text',st:'Título/H2',tx:'Nada por aqui ainda',fill:'cor/texto/primario',ta:'CENTER',w:326},col);
  await N({t:'text',st:'Corpo/Grande',tx:'Você precisa de 200 Pontos Dourados para o primeiro resgate. Falta pouco.',fill:'cor/texto/secundario',ta:'CENTER',w:326},col);
  await botao(f,32,596,'Como ganhar pontos','Ouro','Padrão');
  await botao(f,32,656,'Ver o cardápio','Contorno','Padrão');
  await nav(f,'Recompensas');
  ids.vazio=f.id;
}

// --- 35 · Erro / sem conexão ---
{
  const f=await scr(SL,'35 · Erro · sem conexão',1);
  await statusbar(f);
  await appbar(f,'',{closeIcon:true,noAction:true});
  const col=await N({t:'al',dir:'VERTICAL',w:326,gap:16,ai:'CENTER'},f); col.x=32; col.y=300;
  await N({t:'al',dir:'VERTICAL',w:84,h:84,r:999,ai:'CENTER',ji:'CENTER',fill:'cor/fundo/elevado',stroke:'cor/borda/sutil',ch:[{t:'ico',n:'info',s:38,c:'#8A8A8A'}]},col);
  await N({t:'al',dir:'VERTICAL',gap:8,ai:'CENTER',ch:[
    {t:'text',st:'Título/H2',tx:'Sem conexão',fill:'cor/texto/primario',ta:'CENTER',w:326},
    {t:'text',st:'Corpo/Grande',tx:'Não conseguimos carregar seu saldo agora. Seus pontos estão seguros.',fill:'cor/texto/secundario',ta:'CENTER',w:326}]},col);
  await botao(f,32,520,'Tentar de novo','Contorno','Padrão');
  const dica=await N({t:'al',dir:'HORIZONTAL',w:326,r:16,p:14,gap:11,ai:'MIN',fill:'cor/fundo/elevado',ch:[
    {t:'ico',n:'qr',s:18,c:'#F9C115'},
    {t:'text',st:'Corpo/Pequeno',tx:'Seu QR Code funciona offline — pode mostrar no caixa mesmo assim.',fill:'cor/texto/secundario',w:'fill'}]},f);
  dica.x=32; dica.y=596; dica.counterAxisSizingMode='FIXED';
  ids.erro=f.id;
}

// --- 36 · Carregando (skeleton) ---
{
  const f=await scr(SL,'36 · Carregando',2);
  await statusbar(f);
  const sk=(x,y,w,h,r)=>N({t:'rect',w:w,h:h,r:r==null?10:r,fill:'cor/fundo/superficie',name:'esqueleto'},f).then(n=>{n.x=x;n.y=y;return n;});
  await sk(32,62,48,48,999);
  await sk(92,70,110,12);
  await sk(92,90,72,10);
  await sk(338,62,44,44,999);
  await sk(32,130,326,212,28);
  await sk(32,362,102,74,18); await sk(144,362,102,74,18); await sk(256,362,102,74,18);
  await sk(32,458,140,16);
  await sk(32,492,326,168,24);
  await sk(32,678,120,16);
  await sk(32,712,167,230,20); await sk(215,712,167,230,20);
  await nav(f,'Início');
  ids.carregando=f.id;
}

// --- 37 · Toast em contexto ---
{
  const f=await scr(SL,'37 · Feedback em contexto',3);
  await glow(f,40,80,300,0.16,170);
  await statusbar(f);
  const hd=await N({t:'al',dir:'HORIZONTAL',w:326,gap:12,ai:'CENTER'},f); hd.x=32; hd.y=62;
  await N({t:'inst',k:'Avatar|Tamanho=M'},hd);
  await N({t:'al',dir:'VERTICAL',w:'fill',gap:1,ch:[
    {t:'text',st:'Corpo/Pequeno',tx:'Boa tarde,',fill:'cor/texto/sutil'},
    {t:'text',st:'Título/H3',tx:'Marcelo',fill:'cor/texto/primario'}]},hd);
  const cd=await N({t:'inst',k:'Cartão Dourado'},f); cd.x=32; cd.y=130;
  const t1=await N({t:'inst',k:'Toast de Conquista'},f); t1.x=32; t1.y=366;
  const t2=await N({t:'inst',k:'Toast de Conquista'},f); t2.x=32; t2.y=452;
  txAll(t2,{'título':'Pontos prestes a expirar','texto':'90 Pontos Dourados vencem em 7 dias'});
  swapIcon(t2,'relogio','#462302',0);
  const t3=await N({t:'inst',k:'Toast de Conquista'},f); t3.x=32; t3.y=538;
  txAll(t3,{'título':'Não foi possível resgatar','texto':'Saldo insuficiente para esta recompensa'});
  t3.strokes=[sol('cor/sinal/erro')];
  const ic3=t3.findOne(n=>n.name==='ícone'); if(ic3)ic3.fills=[sol('cor/sinal/erro')];
  swapIcon(t3,'fechar','#FFFFFF',0);
  const tt3=t3.findOne(n=>n.name==='texto'); if(tt3)tt3.fills=[sol('cor/sinal/erro')];
  await overline(f,32,636,'Estados de feedback · sucesso · alerta · erro','cor/texto/sutil');
  await nav(f,'Início');
  ids.feedback=f.id;
}
SL.x=0; SL.y=13200;
return {ids, sections:{J:SJ.id,K:SK.id,L:SL.id}};
