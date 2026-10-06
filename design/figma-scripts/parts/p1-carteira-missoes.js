// ===== PARTE 1 · D · Carteira (3 telas) + E · Missões Douradas (3 telas) =====
const PAGE=await figma.getNodeByIdAsync('5:2'); await figma.setCurrentPageAsync(PAGE);
const ids={};

// ===================== D · CARTEIRA =====================
const SD=mkSection('D · Carteira',3); PAGE.appendChild(SD); await secTitle(SD,'D · Carteira');

// --- 12 · Carteira ---
{
  const f=await scr(SD,'12 · Carteira',0);
  await glow(f,40,60,320,0.18,170);
  await statusbar(f);
  await appbar(f,'Minha carteira',{actionIcon:'info'});
  const cd=await N({t:'inst',k:'Cartão Dourado'},f); cd.x=32; cd.y=122;
  const row=await N({t:'al',dir:'HORIZONTAL',w:326,gap:10,name:'resumo'},f); row.x=32; row.y=352;
  for(const [vl,lb,cor] of [['1.280','Disponíveis','cor/sinal/sucesso'],['180','Pendentes','cor/sinal/alerta'],['90','A expirar','cor/sinal/erro']]){
    await N({t:'al',dir:'VERTICAL',w:'fill',h:82,r:18,p:[14,12],gap:5,ji:'CENTER',fill:'cor/fundo/elevado',stroke:'cor/borda/sutil',ch:[
      {t:'al',dir:'HORIZONTAL',gap:6,ai:'CENTER',ch:[{t:'ell',w:6,h:6,fill:cor},{t:'text',st:'Corpo/Pequeno',tx:lb,fill:'cor/texto/sutil'}]},
      {t:'text',st:'Número/Médio',sz:21,tx:vl,fill:'cor/texto/primario'}]},row);
  }
  await secHead(f,32,458,'Evolução dos pontos',false);
  const ch=await N({t:'al',dir:'HORIZONTAL',w:326,h:150,r:20,p:[18,16],gap:12,ai:'MAX',ji:'SPACE_BETWEEN',fill:'cor/fundo/elevado',stroke:'cor/borda/sutil',name:'gráfico'},f);
  ch.x=32; ch.y=492; ch.primaryAxisSizingMode='FIXED'; ch.counterAxisSizingMode='FIXED';
  const meses=[['Jun',38],['Jul',56],['Ago',44],['Set',78],['Out',62],['Nov',96]];
  for(let i=0;i<meses.length;i++){
    const [m,h]=meses[i], atual=i===meses.length-1;
    await N({t:'al',dir:'VERTICAL',gap:9,ai:'CENTER',ch:[
      {t:'rect',w:30,h:h,r:9,fill:atual?{g:OURO,a:90}:{c:'#2B2B2B',o:1}},
      {t:'text',st:'Corpo/Pequeno',sz:11,tx:m,fill:atual?'cor/texto/ouro':'cor/texto/sutil'}]},ch);
  }
  await secHead(f,32,672,'Últimos lançamentos');
  let y=706;
  for(const tp of ['Ganho','Bônus']){const h=await N({t:'inst',k:'Linha de Histórico|Tipo='+tp},f);h.x=32;h.y=y;y+=h.height+2;}
  await nav(f,'Início');
  ids.carteira=f.id;
}

// --- 13 · Histórico completo ---
{
  const f=await scr(SD,'13 · Histórico',1);
  await statusbar(f);
  await appbar(f,'Histórico',{actionIcon:'filtro'});
  await chips(f,32,122,['Tudo','Ganhos','Resgates','Expirados'],0);
  async function linha(tp,tit,det,val,y){
    const h=await N({t:'inst',k:'Linha de Histórico|Tipo='+tp},f);h.x=32;h.y=y;
    txAll(h,{'título':tit,'detalhe':det,'valor':val});
    const d=await N({t:'rect',w:326,h:1,fill:'cor/borda/sutil'},f);d.x=32;d.y=y+h.height;
    return y+h.height+9;
  }
  await overline(f,32,186,'Novembro de 2026','cor/texto/sutil');
  let y=212;
  y=await linha('Ganho','Compra na Sua Coxinha','Cajamar · 12 nov, 14:32','+120',y);
  y=await linha('Bônus','Missão Dourada concluída','Sequência Dourada · 10 nov','+150',y);
  y=await linha('Resgate','Resgate de recompensa','Coxinha G · 08 nov','−300',y);
  y=await linha('Ganho','Compra na Sua Coxinha','Jundiaí · 05 nov, 19:08','+86',y);
  await overline(f,32,y+10,'Outubro de 2026','cor/texto/sutil');
  y+=38;
  y=await linha('Expirado','Pontos expirados','Validade de 12 meses · 01 nov','−45',y);
  y=await linha('Bônus','Bônus de aniversário','Pontos em dobro no mês · 22 out','+240',y);
  y=await linha('Ganho','Compra na Sua Coxinha','Cajamar · 18 out, 12:40','+104',y);
  await nav(f,'Início');
  ids.historico=f.id;
}

// --- 14 · Detalhe de transação ---
{
  const f=await scr(SD,'14 · Detalhe do lançamento',2);
  await glow(f,75,70,240,0.20,150);
  await statusbar(f);
  await appbar(f,'Lançamento',{actionIcon:'compartilhar'});
  const top=await N({t:'al',dir:'VERTICAL',w:390,gap:14,ai:'CENTER',name:'destaque'},f); top.x=0; top.y=146;
  await N({t:'al',dir:'VERTICAL',w:78,h:78,r:999,ai:'CENTER',ji:'CENTER',fill:{g:OURO},ef:'Brilho/Ouro',ch:[{t:'ico',n:'carteira',s:34,c:'#462302'}]},top);
  await N({t:'al',dir:'VERTICAL',gap:0,ai:'CENTER',ch:[
    {t:'text',st:'Display/Saldo',sz:46,tx:'+120',fill:'cor/texto/ouro'},
    {t:'text',st:'Corpo/Forte',tx:'Pontos Dourados',fill:'cor/texto/secundario'}]},top);
  await N({t:'al',dir:'HORIZONTAL',gap:7,ai:'CENTER',r:999,p:[7,13],fill:{c:'#3DD68C',o:0.14},ch:[
    {t:'ico',n:'check-circulo',s:15,c:'#3DD68C'},
    {t:'text',st:'Corpo/Pequeno',fo:{family:'Poppins',style:'SemiBold'},tx:'Creditado',fill:'cor/sinal/sucesso'}]},top);
  const card=await infoCard(f,[
    ['Origem','Compra identificada'],
    ['Unidade','Cajamar · Portal dos Ipês'],
    ['Data','12 de nov, 14:32'],
    ['Valor da compra','R$ 59,80'],
    ['Pedido','#20261112-0417'],
    ['Pontos válidos até','12 de nov de 2027']]);
  card.x=32; card.y=398;
  const nota=await N({t:'al',dir:'HORIZONTAL',w:326,r:16,p:14,gap:11,ai:'MIN',fill:{c:'#F9C115',o:0.1},name:'nota',ch:[
    {t:'ico',n:'info',s:18,c:'#F9C115'},
    {t:'text',st:'Corpo/Pequeno',tx:'Pontos de compras identificadas entram como disponíveis na hora. Compras com cartão podem levar até 48 h.',fill:'cor/texto/secundario',w:'fill'}]},f);
  nota.x=32; nota.y=card.y+card.height+16; nota.counterAxisSizingMode='FIXED';
  await botao(f,32,760,'Ver comprovante','Contorno','Padrão');
  ids.detalheLancamento=f.id;
}
SD.x=0; SD.y=3600;

// ===================== E · MISSÕES DOURADAS =====================
const SE=mkSection('E · Missões Douradas',3); PAGE.appendChild(SE); await secTitle(SE,'E · Missões Douradas');

// --- 15 · Missões ---
{
  const f=await scr(SE,'15 · Missões Douradas',0);
  await glow(f,50,40,300,0.18,170);
  await statusbar(f);
  const hd=await N({t:'al',dir:'VERTICAL',w:326,gap:5},f); hd.x=32; hd.y=68;
  await N({t:'text',st:'Título/H1',tx:'Missões Douradas',fill:'cor/texto/primario'},hd);
  await N({t:'text',st:'Corpo/Padrão',tx:'Cada missão é um motivo a mais para voltar.',fill:'cor/texto/secundario'},hd);
  const res=await N({t:'al',dir:'VERTICAL',w:326,r:22,p:18,gap:13,fill:{c:'#F9C115',o:0.1},stroke:'cor/borda/ouro',name:'resumo do mês'},f);
  res.x=32; res.y=152; res.counterAxisSizingMode='FIXED';
  await N({t:'al',dir:'HORIZONTAL',w:'fill',ji:'SPACE_BETWEEN',ai:'CENTER',ch:[
    {t:'al',dir:'HORIZONTAL',gap:9,ai:'CENTER',ch:[
      {t:'ico',n:'trofeu',s:19,c:'#F9C115'},
      {t:'text',st:'Corpo/Forte',tx:'2 de 5 concluídas em novembro',fill:'cor/texto/primario'}]},
    {t:'text',st:'Corpo/Forte',tx:'40%',fill:'cor/texto/ouro'}]},res);
  await N({t:'al',dir:'HORIZONTAL',w:'fill',h:9,r:999,clip:true,fill:{c:'#462302',o:0.5},ch:[{t:'rect',w:116,h:9,r:999,fill:{g:OURO,a:90}}]},res);
  await chips(f,32,282,['Ativas','Concluídas','Todas'],0);
  const dados=[
    ['Em andamento',{titulo:'Sequência Dourada',desc:'3 de 4 compras este mês',rec:'+150 Pontos',pz:'Faltam 6 dias'}],
    ['Em andamento',{titulo:'Experimente um sabor novo',desc:'0 de 1 · Costela com requeijão',rec:'+80 Pontos',pz:'Faltam 12 dias'}],
    ['Concluída',{titulo:'Indique um amigo',desc:'1 de 1 · Ana entrou no clube',rec:'+200 Pontos',pz:'Concluída ontem'}],
    ['Bloqueada',{titulo:'Maratona de sabores',desc:'Desbloqueia no nível Ouro',rec:'+300 Pontos',pz:'Bloqueada'}]];
  let y=340;
  for(const [est,d] of dados){
    const c=await N({t:'inst',k:'Card de Missão|Estado='+est},f); c.x=32; c.y=y;
    txAll(c,{'título':d.titulo,'descrição':d.desc});
    // o rodapé tem dois textos sem nome: [0] recompensa, [1] prazo
    const rod=c.findOne(n=>n.name==='rodapé');
    if(rod){txIn(rod,0,d.rec); txIn(rod,1,d.pz);}
    if(est==='Em andamento'&&d.titulo.indexOf('sabor')>0){const p=c.findOne(n=>n.name==='preenchimento'); if(p)p.resize(10,9);}
    y+=c.height+14;
  }
  await nav(f,'Missões');
  ids.missoes=f.id;
}

// --- 16 · Detalhe da missão ---
{
  const f=await scr(SE,'16 · Detalhe da missão',1);
  await glow(f,85,80,220,0.26,150);
  await statusbar(f);
  await appbar(f,'Missão Dourada',{actionIcon:'compartilhar'});
  const top=await N({t:'al',dir:'VERTICAL',w:390,gap:16,ai:'CENTER'},f); top.x=0; top.y=138;
  await N({t:'al',dir:'VERTICAL',w:96,h:96,r:32,ai:'CENTER',ji:'CENTER',fill:{g:OURO},ef:'Brilho/Ouro Forte',ch:[{t:'ico',n:'fogo',s:44,c:'#462302'}]},top);
  await N({t:'al',dir:'VERTICAL',w:326,gap:8,ai:'CENTER',ch:[
    {t:'text',st:'Título/H1',tx:'Sequência Dourada',fill:'cor/texto/primario',ta:'CENTER',w:326},
    {t:'text',st:'Corpo/Grande',tx:'Faça 4 compras no mesmo mês e ganhe um bônus. A sequência reinicia no dia 1º.',fill:'cor/texto/secundario',ta:'CENTER',w:326}]},top);
  const pc=await N({t:'al',dir:'VERTICAL',w:326,r:22,p:20,gap:14,fill:'cor/fundo/elevado',stroke:'cor/borda/ouro',name:'progresso'},f);
  pc.x=32; pc.y=398; pc.counterAxisSizingMode='FIXED';
  await N({t:'al',dir:'HORIZONTAL',w:'fill',ji:'SPACE_BETWEEN',ai:'CENTER',ch:[
    {t:'al',dir:'VERTICAL',gap:1,ch:[
      {t:'text',st:'Rótulo/Overline',tx:'Seu progresso',uc:true,fill:'cor/texto/sutil'},
      {t:'text',st:'Número/Grande',tx:'3 de 4 compras',fill:'cor/texto/primario'}]},
    {t:'text',st:'Display/Saldo',sz:40,tx:'75%',fill:'cor/texto/ouro'}]},pc);
  await N({t:'al',dir:'HORIZONTAL',w:'fill',h:12,r:999,clip:true,fill:'#2B2B2B',ch:[{t:'rect',w:214,h:12,r:999,fill:{g:OURO,a:90}}]},pc);
  await N({t:'al',dir:'HORIZONTAL',w:'fill',ji:'SPACE_BETWEEN',ai:'CENTER',ch:[
    {t:'al',dir:'HORIZONTAL',gap:6,ai:'CENTER',ch:[{t:'ico',n:'relogio',s:15,c:'#8A8A8A'},{t:'text',st:'Corpo/Pequeno',tx:'Faltam 6 dias',fill:'cor/texto/sutil'}]},
    {t:'al',dir:'HORIZONTAL',gap:6,ai:'CENTER',r:999,p:[5,11],fill:{c:'#F9C115',o:0.14},ch:[
      {t:'ico',n:'brilho',s:14,c:'#F9C115'},{t:'text',st:'Corpo/Pequeno',fo:{family:'Poppins',style:'SemiBold'},tx:'+150 Pontos',fill:'cor/texto/ouro'}]}]},pc);
  await secHead(f,32,pc.y+pc.height+26,'Como funciona',false);
  let sy=pc.y+pc.height+58;
  const passos=[['1','Compre em qualquer unidade','Presencial, iFood ou 99Food contam.'],
                ['2','Identifique-se no caixa','Pelo telefone ou pelo seu QR Code.'],
                ['3','Complete as 4 compras','O bônus cai na carteira na hora.']];
  for(const [n,t1,t2] of passos){
    const r=await N({t:'al',dir:'HORIZONTAL',w:326,gap:13,ai:'MIN',ch:[
      {t:'al',dir:'VERTICAL',w:30,h:30,r:999,ai:'CENTER',ji:'CENTER',fill:{c:'#F9C115',o:0.14},ch:[{t:'text',st:'Corpo/Forte',tx:n,fill:'cor/texto/ouro'}]},
      {t:'al',dir:'VERTICAL',w:'fill',gap:2,ch:[
        {t:'text',st:'Corpo/Forte',tx:t1,fill:'cor/texto/primario',w:'fill'},
        {t:'text',st:'Corpo/Pequeno',tx:t2,fill:'cor/texto/sutil',w:'fill'}]}]},f);
    r.x=32;r.y=sy;sy+=r.height+14;
  }
  await botao(f,32,760,'Fazer meu pedido','Ouro','Padrão');
  ids.detalheMissao=f.id;
}

// --- 17 · Missão concluída (celebração) ---
{
  const f=await scr(SE,'17 · Missão concluída',2);
  const col=await celebra(f,{top:176});
  await N({t:'al',dir:'VERTICAL',w:116,h:116,r:40,ai:'CENTER',ji:'CENTER',fill:{g:OURO},ef:'Brilho/Ouro Forte',ch:[{t:'ico',n:'check',s:56,c:'#462302'}]},col);
  await N({t:'al',dir:'VERTICAL',w:326,gap:8,ai:'CENTER',ch:[
    {t:'text',st:'Rótulo/Overline',tx:'Missão Dourada',uc:true,fill:'cor/texto/ouro'},
    {t:'text',st:'Título/H1',tx:'Sequência\nconcluída!',fill:'cor/texto/primario',ta:'CENTER',w:326}]},col);
  await N({t:'al',dir:'VERTICAL',gap:-4,ai:'CENTER',ch:[
    {t:'text',st:'Display/Saldo',tx:'+150',fill:{g:OURO,a:90}},
    {t:'text',st:'Corpo/Forte',tx:'Pontos Dourados',fill:'cor/texto/secundario'}]},col);
  const rc=await N({t:'al',dir:'HORIZONTAL',w:326,r:20,p:16,gap:13,ai:'CENTER',fill:'cor/fundo/elevado',stroke:'cor/borda/sutil',name:'resumo'},f);
  rc.x=32; rc.y=622; rc.counterAxisSizingMode='FIXED';
  await N({t:'al',dir:'VERTICAL',w:44,h:44,r:14,ai:'CENTER',ji:'CENTER',fill:{c:'#F9C115',o:0.14},ch:[{t:'ico',n:'fogo',s:22,c:'#F9C115'}]},rc);
  await N({t:'al',dir:'VERTICAL',w:'fill',gap:3,ch:[
    {t:'text',st:'Corpo/Forte',tx:'Sequência Dourada',fill:'cor/texto/primario'},
    {t:'text',st:'Corpo/Pequeno',tx:'4 de 4 compras · novembro de 2026',fill:'cor/texto/sutil'}]},rc);
  await botao(f,32,714,'Ver minhas recompensas','Ouro','Padrão');
  await botao(f,32,776,'Continuar','Fantasma','Padrão');
  ids.missaoConcluida=f.id;
}
SE.x=0; SE.y=4800;

return {ids, sections:{D:SD.id,E:SE.id}};
