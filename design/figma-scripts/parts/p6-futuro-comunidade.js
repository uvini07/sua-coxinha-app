// ===== PARTE 6 · Página 02 · Futuro · Comunidade (6 telas conceituais) =====
const PAGE=await figma.getNodeByIdAsync('5:3'); await figma.setCurrentPageAsync(PAGE);
const ids={};
const SC=mkSection('M · Futuro · Comunidade (Fase 4)',6); PAGE.appendChild(SC);
await secTitle(SC,'M · Futuro · Comunidade — Fase 4 do roadmap');
const nota=await N({t:'al',dir:'HORIZONTAL',r:999,p:[9,16],gap:9,ai:'CENTER',fill:{c:'#5AC8FA',o:0.14},stroke:'cor/sinal/info',name:'aviso'},SC);
nota.x=70; nota.y=92;
await N({t:'ico',n:'info',s:17,c:'#5AC8FA'},nota);
await N({t:'text',st:'Corpo/Pequeno',tx:'Conceito. Fora do MVP — mostra que a arquitetura visual comporta a evolução sem virar outro app.',fill:'cor/texto/secundario'},nota);
// anel de progresso com arcData
async function anel(par,size,pct,espessura){
  const wrap=await N({t:'frame',w:size,h:size,name:'anel'},par);
  const bg=await N({t:'ell',w:size,h:size,fill:'#2B2B2B'},wrap); bg.x=0;bg.y=0;
  bg.arcData={startingAngle:0,endingAngle:Math.PI*2,innerRadius:1-espessura};
  const fg=await N({t:'ell',w:size,h:size,fill:{g:OURO,a:45}},wrap); fg.x=0;fg.y=0;
  fg.arcData={startingAngle:-Math.PI/2,endingAngle:-Math.PI/2+Math.PI*2*pct,innerRadius:1-espessura};
  return wrap;
}

// --- 38 · Comunidade · início ---
{
  const f=await scr(SC,'38 · Comunidade',0);
  await glow(f,55,40,290,0.16,170);
  await statusbar(f);
  const hd=await N({t:'al',dir:'VERTICAL',w:326,gap:4},f); hd.x=32; hd.y=68;
  await N({t:'text',st:'Título/H1',tx:'Comunidade',fill:'cor/texto/primario'},hd);
  await N({t:'text',st:'Corpo/Padrão',tx:'Pequenas ações diárias que também rendem ouro.',fill:'cor/texto/secundario'},hd);
  const hero=await N({t:'al',dir:'HORIZONTAL',w:326,r:24,p:18,gap:16,ai:'CENTER',fill:{c:'#F9C115',o:0.1},stroke:'cor/borda/ouro',name:'jornada'},f);
  hero.x=32; hero.y=150; hero.counterAxisSizingMode='FIXED';
  const an=await anel(hero,72,8/21,0.22);
  const num=await N({t:'text',st:'Corpo/Forte',tx:'8/21',fill:'cor/texto/ouro'},an); num.x=19; num.y=27;
  await N({t:'al',dir:'VERTICAL',w:'fill',gap:4,ch:[
    {t:'text',st:'Rótulo/Overline',tx:'Jornada Dourada',uc:true,fill:'cor/texto/ouro'},
    {t:'text',st:'Título/H4',tx:'21 dias de bem-estar',fill:'cor/texto/primario'},
    {t:'text',st:'Corpo/Pequeno',tx:'Você está no dia 8 · sequência ativa',fill:'cor/texto/sutil'}]},hero);
  await secHead(f,32,286,'Para hoje',false);
  const hoje=await N({t:'al',dir:'HORIZONTAL',w:326,r:22,p:16,gap:14,ai:'CENTER',fill:'cor/fundo/elevado',stroke:'cor/borda/sutil',name:'ritual'},f);
  hoje.x=32; hoje.y=320; hoje.counterAxisSizingMode='FIXED';
  await N({t:'al',dir:'VERTICAL',w:50,h:50,r:16,ai:'CENTER',ji:'CENTER',fill:{c:'#F9C115',o:0.14},ch:[{t:'ico',n:'coracao',s:24,c:'#F9C115'}]},hoje);
  await N({t:'al',dir:'VERTICAL',w:'fill',gap:3,ch:[
    {t:'text',st:'Corpo/Forte',tx:'Três minutos de respiração',fill:'cor/texto/primario'},
    {t:'text',st:'Corpo/Pequeno',tx:'Ritual do dia 8 · rende 20 pontos',fill:'cor/texto/sutil'}]},hoje);
  await N({t:'ico',n:'seta-dir',s:20,c:'#5C5C5C'},hoje);
  await secHead(f,32,412,'Trilhas',false);
  const grid=await N({t:'al',dir:'HORIZONTAL',w:326,gap:12},f); grid.x=32; grid.y=446; grid.layoutWrap='WRAP'; grid.counterAxisSpacing=12;
  for(const [ic,nm,qt] of [['coracao','Bem-estar','12 conteúdos'],['escudo','Saúde emocional','9 conteúdos'],['brilho','Ansiedade','7 conteúdos'],['pessoas','Relacionamentos','6 conteúdos']]){
    await N({t:'al',dir:'VERTICAL',w:157,h:100,r:20,p:16,gap:8,ji:'SPACE_BETWEEN',fill:'cor/fundo/elevado',stroke:'cor/borda/sutil',ch:[
      {t:'ico',n:ic,s:22,c:'#F9C115'},
      {t:'al',dir:'VERTICAL',gap:2,ch:[
        {t:'text',st:'Corpo/Forte',tx:nm,fill:'cor/texto/primario',w:125},
        {t:'text',st:'Corpo/Pequeno',tx:qt,fill:'cor/texto/sutil'}]}]},grid);
  }
  await secHead(f,32,682,'Curtos para hoje');
  await nav(f,'Clube');
  ids.comunidade=f.id;
}

// --- 39 · Jornada de 21 dias ---
{
  const f=await scr(SC,'39 · Jornada Dourada',1);
  await glow(f,85,90,220,0.26,150);
  await statusbar(f);
  await appbar(f,'Jornada Dourada',{actionIcon:'compartilhar'});
  const top=await N({t:'al',dir:'VERTICAL',w:390,gap:16,ai:'CENTER'},f); top.x=0; top.y=132;
  const an=await anel(top,176,8/21,0.14);
  const col=await N({t:'al',dir:'VERTICAL',gap:-2,ai:'CENTER'},an); col.x=48; col.y=62;
  await N({t:'text',st:'Display/Saldo',sz:48,tx:'8',fill:{g:OURO,a:90}},col);
  await N({t:'text',st:'Corpo/Pequeno',tx:'de 21 dias',fill:'cor/texto/sutil'},col);
  await N({t:'al',dir:'VERTICAL',w:326,gap:6,ai:'CENTER',ch:[
    {t:'text',st:'Título/H2',tx:'Sequência de 8 dias',fill:'cor/texto/primario'},
    {t:'text',st:'Corpo/Padrão',tx:'Complete os 21 dias e desbloqueie um selo exclusivo.',fill:'cor/texto/secundario',ta:'CENTER',w:326}]},top);
  const dias=await N({t:'al',dir:'HORIZONTAL',w:326,gap:10},f); dias.x=32; dias.y=430; dias.layoutWrap='WRAP'; dias.counterAxisSpacing=10;
  for(let d=1;d<=21;d++){
    const feito=d<8, hoje=d===8;
    await N({t:'al',dir:'VERTICAL',w:38,h:38,r:13,ai:'CENTER',ji:'CENTER',
      fill:feito?{g:OURO}:'cor/fundo/elevado',stroke:hoje?'cor/borda/ouro':'cor/borda/sutil',sw:hoje?1.5:1,
      ch:[feito?{t:'ico',n:'check',s:17,c:'#462302'}:{t:'text',st:'Corpo/Pequeno',sz:12,tx:String(d),fill:hoje?'cor/texto/ouro':'cor/texto/sutil'}]},dias);
  }
  const rec=await N({t:'al',dir:'HORIZONTAL',w:326,r:20,p:16,gap:13,ai:'CENTER',fill:'cor/fundo/elevado',stroke:'cor/borda/ouro',name:'prêmio'},f);
  rec.x=32; rec.y=630; rec.counterAxisSizingMode='FIXED';
  await N({t:'al',dir:'VERTICAL',w:44,h:44,r:14,ai:'CENTER',ji:'CENTER',fill:{g:OURO},ch:[{t:'ico',n:'trofeu',s:22,c:'#462302'}]},rec);
  await N({t:'al',dir:'VERTICAL',w:'fill',gap:2,ch:[
    {t:'text',st:'Corpo/Forte',tx:'Ao concluir: selo Jornada Dourada',fill:'cor/texto/primario'},
    {t:'text',st:'Corpo/Pequeno',tx:'+500 Pontos Dourados e um combo cortesia',fill:'cor/texto/ouro'}]},rec);
  await botao(f,32,744,'Fazer o ritual de hoje','Ouro','Padrão');
  ids.jornada=f.id;
}

// --- 40 · Ritual do dia ---
{
  const f=await scr(SC,'40 · Ritual do dia',2);
  await glow(f,85,120,220,0.24,150);
  await statusbar(f);
  await appbar(f,'Dia 8',{noAction:true});
  const top=await N({t:'al',dir:'VERTICAL',w:390,gap:18,ai:'CENTER'},f); top.x=0; top.y=140;
  await N({t:'al',dir:'VERTICAL',w:112,h:112,r:999,ai:'CENTER',ji:'CENTER',fill:{c:'#F9C115',o:0.12},stroke:'cor/borda/ouro',ch:[{t:'ico',n:'coracao',s:50,c:'#F9C115'}]},top);
  await N({t:'al',dir:'VERTICAL',w:326,gap:8,ai:'CENTER',ch:[
    {t:'text',st:'Rótulo/Overline',tx:'Rotina · 3 minutos',uc:true,fill:'cor/texto/ouro'},
    {t:'text',st:'Título/H1',tx:'Três minutos\nde respiração',fill:'cor/texto/primario',ta:'CENTER',w:326},
    {t:'text',st:'Corpo/Grande',tx:'Um intervalo curto para baixar o ritmo no meio do dia.',fill:'cor/texto/secundario',ta:'CENTER',w:326}]},top);
  let y=448;
  for(const [n,t1,t2] of [['1','Sente-se com as costas apoiadas','Pés no chão, ombros soltos.'],['2','Inspire em 4, segure 4, solte em 6','Repita por dez ciclos.'],['3','Volte devagar','Observe como o corpo ficou.']]){
    const r=await N({t:'al',dir:'HORIZONTAL',w:326,gap:13,ai:'MIN',ch:[
      {t:'al',dir:'VERTICAL',w:30,h:30,r:999,ai:'CENTER',ji:'CENTER',fill:{c:'#F9C115',o:0.14},ch:[{t:'text',st:'Corpo/Forte',tx:n,fill:'cor/texto/ouro'}]},
      {t:'al',dir:'VERTICAL',w:'fill',gap:2,ch:[
        {t:'text',st:'Corpo/Forte',tx:t1,fill:'cor/texto/primario',w:'fill'},
        {t:'text',st:'Corpo/Pequeno',tx:t2,fill:'cor/texto/sutil',w:'fill'}]}]},f);
    r.x=32;r.y=y;y+=r.height+16;
  }
  const av=await N({t:'al',dir:'HORIZONTAL',w:326,r:16,p:14,gap:11,ai:'MIN',fill:'cor/fundo/elevado',name:'aviso'},f);
  av.x=32; av.y=y+4; av.counterAxisSizingMode='FIXED';
  await N({t:'ico',n:'info',s:17,c:'#8A8A8A'},av);
  await N({t:'text',st:'Corpo/Pequeno',tx:'Conteúdo educativo de bem-estar. Não substitui acompanhamento médico ou psicológico.',fill:'cor/texto/sutil',w:'fill'},av);
  await botao(f,32,760,'Concluir ritual · +20 pontos','Ouro','Padrão');
  ids.ritual=f.id;
}

// --- 41 · Conteúdo / trilha ---
{
  const f=await scr(SC,'41 · Conteúdo da trilha',3);
  const hero=await N({t:'al',dir:'VERTICAL',w:390,h:260,ai:'CENTER',ji:'CENTER',clip:true,fill:{c:'#F9C115',o:0.1},name:'herói'},f);
  hero.x=0; hero.y=0; hero.primaryAxisSizingMode='FIXED'; hero.counterAxisSizingMode='FIXED';
  const gd=inst('Gota · sub-marca'); hero.appendChild(gd); gd.layoutPositioning='ABSOLUTE'; gd.rescale(230/gd.width); gd.opacity=0.12; gd.x=240; gd.y=20;
  await N({t:'al',dir:'VERTICAL',w:72,h:72,r:999,ai:'CENTER',ji:'CENTER',fill:{g:OURO},ef:'Brilho/Ouro',ch:[{t:'ico',n:'seta-dir',s:32,c:'#462302'}]},hero);
  await statusbar(f);
  await appbar(f,'',{closeIcon:true,actionIcon:'coracao'});
  const col=await N({t:'al',dir:'VERTICAL',w:326,gap:10},f); col.x=32; col.y=284;
  await N({t:'al',dir:'HORIZONTAL',gap:9,ai:'CENTER',ch:[
    {t:'text',st:'Rótulo/Overline',tx:'Saúde emocional',uc:true,fill:'cor/texto/ouro'},
    {t:'ell',w:4,h:4,fill:'cor/texto/sutil'},
    {t:'text',st:'Corpo/Pequeno',tx:'6 min',fill:'cor/texto/sutil'}]},col);
  await N({t:'text',st:'Título/H1',tx:'Quando a pressa\nvira ansiedade',fill:'cor/texto/primario',w:326},col);
  await N({t:'text',st:'Corpo/Grande',tx:'Como reconhecer os sinais de que o ritmo passou do ponto — e três ajustes simples para o dia seguinte.',fill:'cor/texto/secundario',w:326},col);
  await secHead(f,32,col.y+col.height+26,'Nesta trilha',false);
  let y=col.y+col.height+58;
  const EP=[['1','Quando a pressa vira ansiedade','6 min',2],['2','O corpo avisa antes da cabeça','5 min',1],['3','Rotina não é prisão','7 min',0],['4','Pedir ajuda é estratégia','4 min',0]];
  for(const [n,t,dur,est] of EP){
    const r=await N({t:'al',dir:'HORIZONTAL',w:326,r:16,p:13,gap:13,ai:'CENTER',fill:est===2?{c:'#F9C115',o:0.1}:'cor/fundo/elevado',stroke:est===2?'cor/borda/ouro':'cor/borda/sutil',op:est===0?0.6:1},f);
    r.x=32; r.y=y; r.counterAxisSizingMode='FIXED';
    await N({t:'al',dir:'VERTICAL',w:34,h:34,r:12,ai:'CENTER',ji:'CENTER',fill:est===1?{g:OURO}:'cor/fundo/superficie',
      ch:[est===1?{t:'ico',n:'check',s:18,c:'#462302'}:{t:'text',st:'Corpo/Forte',tx:n,fill:est===2?'cor/texto/ouro':'cor/texto/sutil'}]},r);
    await N({t:'al',dir:'VERTICAL',w:'fill',gap:2,ch:[
      {t:'text',st:'Corpo/Forte',tx:t,fill:'cor/texto/primario',w:'fill'},
      {t:'text',st:'Corpo/Pequeno',tx:dur+(est===1?' · concluído':est===2?' · tocando agora':''),fill:'cor/texto/sutil'}]},r);
    y+=r.height+10;
  }
  ids.conteudo=f.id;
}

// --- 42 · Progresso pessoal ---
{
  const f=await scr(SC,'42 · Seu progresso',4);
  await glow(f,60,50,280,0.16,170);
  await statusbar(f);
  await appbar(f,'Seu progresso',{actionIcon:'compartilhar'});
  const st=await N({t:'al',dir:'HORIZONTAL',w:326,gap:10},f); st.x=32; st.y=128;
  for(const [v,l,ic] of [['8','dias seguidos','fogo'],['24','rituais','check-circulo'],['72','minutos','relogio']]){
    await N({t:'al',dir:'VERTICAL',w:'fill',h:96,r:20,gap:5,ai:'CENTER',ji:'CENTER',fill:'cor/fundo/elevado',stroke:'cor/borda/sutil',ch:[
      {t:'ico',n:ic,s:20,c:'#F9C115'},
      {t:'text',st:'Número/Médio',sz:22,tx:v,fill:'cor/texto/primario'},
      {t:'text',st:'Corpo/Pequeno',sz:11,tx:l,fill:'cor/texto/sutil'}]},st);
  }
  await secHead(f,32,250,'Sua semana',false);
  const ch=await N({t:'al',dir:'HORIZONTAL',w:326,h:150,r:20,p:[18,16],gap:10,ai:'MAX',ji:'SPACE_BETWEEN',fill:'cor/fundo/elevado',stroke:'cor/borda/sutil',name:'semana'},f);
  ch.x=32; ch.y=284; ch.primaryAxisSizingMode='FIXED'; ch.counterAxisSizingMode='FIXED';
  const dd=[['S',34],['T',58],['Q',46],['Q',72],['S',64],['S',88],['D',0]];
  for(let i=0;i<dd.length;i++){
    const [d,h]=dd[i];
    await N({t:'al',dir:'VERTICAL',gap:9,ai:'CENTER',ch:[
      {t:'rect',w:26,h:Math.max(h,6),r:8,fill:h>0?{g:OURO,a:90}:{c:'#2B2B2B',o:1}},
      {t:'text',st:'Corpo/Pequeno',sz:11,tx:d,fill:i===5?'cor/texto/ouro':'cor/texto/sutil'}]},ch);
  }
  await secHead(f,32,464,'Selos conquistados',false);
  const sel=await N({t:'al',dir:'HORIZONTAL',w:326,gap:14},f); sel.x=32; sel.y=498;
  for(const [ic,nm,on] of [['fogo','7 dias',1],['coracao','Respirar',1],['livro','Ler',1],['trofeu','21 dias',0]]){
    await N({t:'al',dir:'VERTICAL',gap:8,ai:'CENTER',op:on?1:0.3,ch:[
      {t:'al',dir:'VERTICAL',w:62,h:62,r:22,ai:'CENTER',ji:'CENTER',fill:on?{g:OURO}:'cor/fundo/elevado',stroke:on?undefined:'cor/borda/sutil',ch:[{t:'ico',n:on?ic:'cadeado',s:28,c:on?'#462302':'#8A8A8A'}]},
      {t:'text',st:'Corpo/Pequeno',sz:11,tx:nm,fill:'cor/texto/sutil'}]},sel);
  }
  const vinc=await N({t:'al',dir:'HORIZONTAL',w:326,r:20,p:16,gap:13,ai:'CENTER',fill:{c:'#F9C115',o:0.1},stroke:'cor/borda/ouro',name:'vínculo'},f);
  vinc.x=32; vinc.y=612; vinc.counterAxisSizingMode='FIXED';
  await N({t:'ico',n:'brilho',s:22,c:'#F9C115'},vinc);
  await N({t:'text',st:'Corpo/Padrão',tx:'Sua jornada já rendeu 180 Pontos Dourados na carteira.',fill:'cor/texto/secundario',w:'fill'},vinc);
  await nav(f,'Clube');
  ids.progresso=f.id;
}

// --- 43 · Feed de conquistas ---
{
  const f=await scr(SC,'43 · Conquistas da comunidade',5);
  await statusbar(f);
  await appbar(f,'Comunidade',{actionIcon:'pessoas'});
  const bn=await N({t:'al',dir:'HORIZONTAL',w:326,r:20,p:16,gap:13,ai:'CENTER',fill:{c:'#F9C115',o:0.1},stroke:'cor/borda/ouro',name:'contador'},f);
  bn.x=32; bn.y=122; bn.counterAxisSizingMode='FIXED';
  await N({t:'ico',n:'pessoas',s:22,c:'#F9C115'},bn);
  await N({t:'text',st:'Corpo/Forte',tx:'Você e mais 248 pessoas na Jornada Dourada',fill:'cor/texto/primario',w:'fill'},bn);
  let y=206;
  const FEED=[['Ana P.','concluiu a Jornada Dourada','há 10 min','trofeu',1],
              ['Rafael M.','está no dia 14 da jornada','há 1 h','fogo',0],
              ['Juliana S.','desbloqueou o selo Respirar','há 3 h','coracao',0],
              ['Carlos E.','completou 30 rituais','ontem','check-circulo',0],
              ['Bia L.','entrou na comunidade','ontem','brilho',0]];
  for(const [nome,ac,tm,ic,dest] of FEED){
    const r=await N({t:'al',dir:'HORIZONTAL',w:326,r:20,p:15,gap:13,ai:'CENTER',fill:'cor/fundo/elevado',stroke:dest?'cor/borda/ouro':'cor/borda/sutil',name:'conquista'},f);
    r.x=32; r.y=y; r.counterAxisSizingMode='FIXED';
    await N({t:'al',dir:'VERTICAL',w:42,h:42,r:999,ai:'CENTER',ji:'CENTER',fill:dest?{g:OURO}:'cor/fundo/superficie',ch:[{t:'ico',n:ic,s:20,c:dest?'#462302':'#F9C115'}]},r);
    await N({t:'al',dir:'VERTICAL',w:'fill',gap:2,ch:[
      {t:'text',st:'Corpo/Forte',tx:nome,fill:'cor/texto/primario'},
      {t:'text',st:'Corpo/Pequeno',tx:ac,fill:'cor/texto/secundario',w:'fill'},
      {t:'text',st:'Corpo/Pequeno',tx:tm,fill:'cor/texto/sutil'}]},r);
    await N({t:'al',dir:'HORIZONTAL',gap:5,ai:'CENTER',r:999,p:[6,11,6,9],fill:'cor/fundo/superficie',ch:[
      {t:'ico',n:'coracao',s:14,c:'#F9C115'},
      {t:'text',st:'Corpo/Pequeno',sz:11,tx:dest?'32':'12',fill:'cor/texto/sutil'}]},r);
    y+=r.height+12;
  }
  await nav(f,'Clube');
  ids.feed=f.id;
}
SC.x=0; SC.y=0;
return {ids, section:SC.id};
