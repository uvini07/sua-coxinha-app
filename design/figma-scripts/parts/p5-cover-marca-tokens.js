// ===== PARTE 5 · Página 00 · Cover + Marca & Fundamentos + Design Tokens =====
await figma.setCurrentPageAsync(DS);
const ids={};
async function secBox(name,x,w,h){
  const S=figma.createSection(); S.name=name; S.fills=[sol('#0A0A0A')];
  S.resizeWithoutConstraints(w,h); DS.appendChild(S); S.x=x; S.y=0; return S;
}
async function h2(S,t,x,y){const n=await N({t:'text',st:'Título/H2',tx:t,fill:'#FFFFFF'},S);n.x=x;n.y=y;return n;}
async function lead(S,t,x,y,w){const n=await N({t:'text',st:'Corpo/Grande',tx:t,fill:'#8A8A8A',w:w||620},S);n.x=x;n.y=y;return n;}

// ===================== ① COVER =====================
{
  const S=await secBox('① Cover',0,1560,1060);
  const f=await N({t:'frame',name:'Cover · Pontos Dourados',w:1440,h:900,fill:'cor/fundo/base',clip:true},S);
  f.x=60; f.y=80;
  await glow(f,-180,420,760,0.26,260);
  for(const [s,x,y,o] of [[520,1000,-120,0.05],[300,-90,560,0.05],[180,1180,640,0.05]]){
    const g=inst('Gota · sub-marca'); f.appendChild(g); g.rescale(s/g.width); g.opacity=o; g.x=x; g.y=y;
  }
  const col=await N({t:'al',dir:'VERTICAL',gap:34,name:'conteúdo'},f); col.x=110; col.y=210;
  const lg=await N({t:'inst',k:'Logo · Sua Coxinha (fundo escuro)'},col); lg.rescale(230/lg.width);
  await N({t:'al',dir:'VERTICAL',gap:14,ch:[
    {t:'text',st:'Display/XL',sz:112,lh:106,tx:'PONTOS\nDOURADOS',fill:{g:OURO,a:0},ls:-2},
    {t:'rect',w:120,h:4,r:999,fill:{g:OURO,a:0}},
    {t:'text',st:'Título/H2',sz:28,tx:'Sua compra vale ouro.',fill:'cor/texto/primario'},
    {t:'text',st:'Corpo/Grande',sz:18,tx:'Aplicativo mobile do clube de relacionamento da Sua Coxinha.',fill:'cor/texto/secundario'}]},col);
  const meta=await N({t:'al',dir:'HORIZONTAL',gap:0,ai:'CENTER',name:'rodapé'},f); meta.x=110; meta.y=790;
  const metas=[['Versão','1.0 · out/2026'],['Entregável','Design system + fluxos'],['Telas','37'],['Formato','iPhone · 390 × 844']];
  for(let i=0;i<metas.length;i++){
    const [k,v]=metas[i];
    await N({t:'al',dir:'VERTICAL',gap:5,p:[0,44,0,i===0?0:44],ch:[
      {t:'text',st:'Rótulo/Overline',tx:k,uc:true,fill:'cor/texto/sutil'},
      {t:'text',st:'Corpo/Forte',tx:v,fill:'cor/texto/primario'}]},meta);
    if(i<metas.length-1) await N({t:'rect',w:1,h:34,fill:'cor/borda/sutil'},meta);
  }
  ids.cover=f.id;
}

// ===================== ② MARCA & FUNDAMENTOS =====================
{
  const S=await secBox('② Marca & Fundamentos',1660,1620,1060);
  await h2(S,'Marca & Fundamentos',70,56);
  await lead(S,'Tudo abaixo vem da guia de marca oficial da Sua Coxinha. Nada foi inventado para o app — o que o Pontos Dourados acrescenta é a forma de usar o ouro.',70,100,900);
  // logos
  await N({t:'text',st:'Rótulo/Overline',tx:'Logo',uc:true,fill:'#8A8A8A'},S).then(n=>{n.x=70;n.y=184;});
  const lrow=await N({t:'al',dir:'HORIZONTAL',gap:24,name:'logos'},S); lrow.x=70; lrow.y=214;
  const bgs=[['cor/fundo/base','escuro',1],['#FFFFFF','claro',0],[null,'ouro',2]];
  for(const [bg,nome,tipo] of bgs){
    const box=await N({t:'al',dir:'VERTICAL',w:300,h:160,r:20,ai:'CENTER',ji:'CENTER',fill:tipo===2?{g:OURO}:bg,stroke:tipo===1?'cor/borda/sutil':undefined,name:'logo '+nome},lrow);
    box.primaryAxisSizingMode='FIXED'; box.counterAxisSizingMode='FIXED';
    if(tipo===1){const l=await N({t:'inst',k:'Logo · Sua Coxinha (fundo escuro)'},box); l.rescale(190/l.width);}
    else {const src=await figma.getNodeByIdAsync('5:125'); const cl=src.clone(); box.appendChild(cl); cl.rescale(190/cl.width);}
  }
  // cores
  await N({t:'text',st:'Rótulo/Overline',tx:'Paleta oficial',uc:true,fill:'#8A8A8A'},S).then(n=>{n.x=70;n.y=416;});
  const crow=await N({t:'al',dir:'HORIZONTAL',gap:20,name:'cores'},S); crow.x=70; crow.y=446;
  const PAL=[['Preto Gourmet','#131313','19, 19, 19','#FFFFFF'],['Branco','#FFFFFF','255, 255, 255','#131313'],
             ['Amarelo Coxinha','#F9C115','249, 193, 21','#462302'],['Amarelo Mágico','#FFEB4A','255, 235, 74','#462302'],
             ['Marrom Churros','#462302','70, 35, 2','#FFEB4A']];
  for(const [nm,hex,rgb,fg] of PAL){
    const c=await N({t:'al',dir:'VERTICAL',w:280,h:200,r:20,p:20,gap:4,ji:'MAX',fill:hex,stroke:hex==='#131313'?'cor/borda/media':undefined,name:nm},crow);
    c.primaryAxisSizingMode='FIXED'; c.counterAxisSizingMode='FIXED';
    await N({t:'text',st:'Título/H4',tx:nm,fill:fg},c);
    await N({t:'text',st:'Corpo/Pequeno',tx:hex+'  ·  RGB '+rgb,fill:fg,op:0.75},c);
  }
  // 60/30/10
  const rr=await N({t:'al',dir:'VERTICAL',w:600,r:22,p:24,gap:16,fill:'cor/fundo/elevado',stroke:'cor/borda/sutil',name:'regra 60/30/10'},S);
  rr.x=70; rr.y=690; rr.counterAxisSizingMode='FIXED';
  await N({t:'text',st:'Título/H3',tx:'Regra 60/30/10 no app',fill:'cor/texto/primario'},rr);
  await N({t:'text',st:'Corpo/Padrão',tx:'60% Preto Gourmet nas superfícies · 30% branco em texto e cartões · 10% ouro só onde existe conquista. É a proporção do manual — e é ela que faz o dourado parecer precioso.',fill:'cor/texto/secundario',w:'fill'},rr);
  const bar=await N({t:'al',dir:'HORIZONTAL',w:'fill',h:44,r:12,clip:true,gap:0},rr);
  await N({t:'rect',w:331,h:44,fill:'#131313'},bar);
  await N({t:'rect',w:166,h:44,fill:'#FFFFFF'},bar);
  await N({t:'rect',w:55,h:44,fill:{g:OURO}},bar);
  // tipografia
  const tp=await N({t:'al',dir:'VERTICAL',w:860,r:22,p:28,gap:20,fill:'cor/fundo/elevado',stroke:'cor/borda/sutil',name:'tipografia'},S);
  tp.x=700; tp.y=690; tp.counterAxisSizingMode='FIXED';
  await N({t:'text',st:'Título/H3',tx:'Tipografia',fill:'cor/texto/primario'},tp);
  await N({t:'text',st:'Display/XL',tx:'PONTOS DOURADOS',fill:'cor/texto/primario'},tp);
  await N({t:'text',st:'Corpo/Grande',tx:'Satoshi para textos — geométrica, legível em corpos pequenos, com números bem desenhados para saldo e pontuação.',fill:'cor/texto/secundario',w:'fill'},tp);
  const av=await N({t:'al',dir:'HORIZONTAL',w:'fill',r:16,p:16,gap:12,ai:'MIN',fill:{c:'#FFB020',o:0.12},stroke:'cor/sinal/alerta',name:'aviso de fonte'},tp);
  await N({t:'ico',n:'info',s:20,c:'#FFB020'},av);
  await N({t:'text',st:'Corpo/Padrão',tx:'Brown Beige e Satoshi não estão instaladas neste Figma. O arquivo usa Baloo 2 (títulos) e Poppins (textos) como equivalentes. Instalando os arquivos de guia_de_marca/ no sistema, basta um Substituir fonte — toda a hierarquia já está em estilos de texto.',fill:'cor/texto/secundario',w:'fill'},av);
  ids.marca=S.id;
}

// ===================== ③ DESIGN TOKENS =====================
{
  const S=await secBox('③ Design Tokens',3380,1700,1060);
  await h2(S,'Design Tokens',70,56);
  await lead(S,'83 variáveis em quatro coleções, com escopos e code syntax web. As semânticas são alias das primitivas — trocar uma primitiva propaga para todo o app.',70,100,900);
  // cores semânticas
  await N({t:'text',st:'Rótulo/Overline',tx:'Cor · semântica',uc:true,fill:'#8A8A8A'},S).then(n=>{n.x=70;n.y=184;});
  const TOK=[['cor/fundo/base','#131313'],['cor/fundo/elevado','#1A1A1A'],['cor/fundo/superficie','#212121'],
             ['cor/texto/primario','#FFFFFF'],['cor/texto/secundario','#8A8A8A'],['cor/texto/ouro','#F9C115'],
             ['cor/ouro/claro','#FFEB4A'],['cor/ouro/base','#F9C115'],['cor/ouro/escuro','#C98A0A'],['cor/ouro/profundo','#462302'],
             ['cor/nivel/bronze','#C8792F'],['cor/nivel/prata','#C9CED6'],['cor/nivel/ouro','#F9C115'],['cor/nivel/diamante','#7FD6E8'],
             ['cor/sinal/sucesso','#3DD68C'],['cor/sinal/alerta','#FFB020'],['cor/sinal/erro','#FF5A5A'],['cor/sinal/info','#5AC8FA']];
  const tg=await N({t:'al',dir:'HORIZONTAL',w:1560,gap:16,name:'tokens de cor'},S); tg.x=70; tg.y=214; tg.layoutWrap='WRAP'; tg.counterAxisSpacing=16;
  for(const [nome,hex] of TOK){
    await N({t:'al',dir:'HORIZONTAL',w:250,r:14,p:12,gap:12,ai:'CENTER',fill:'cor/fundo/elevado',stroke:'cor/borda/sutil',ch:[
      {t:'rect',w:36,h:36,r:10,fill:nome,stroke:'cor/borda/sutil'},
      {t:'al',dir:'VERTICAL',w:'fill',gap:1,ch:[
        {t:'text',st:'Corpo/Pequeno',fo:{family:'Poppins',style:'SemiBold'},tx:nome,fill:'cor/texto/primario'},
        {t:'text',st:'Corpo/Pequeno',sz:11,tx:hex,fill:'cor/texto/sutil'}]}]},tg);
  }
  // espaçamento
  const sp=await N({t:'al',dir:'VERTICAL',w:500,r:22,p:24,gap:14,fill:'cor/fundo/elevado',stroke:'cor/borda/sutil',name:'espaço'},S);
  sp.x=70; sp.y=560; sp.counterAxisSizingMode='FIXED';
  await N({t:'text',st:'Título/H3',tx:'Espaço',fill:'cor/texto/primario'},sp);
  for(const v of [4,8,12,16,24,32,48]){
    await N({t:'al',dir:'HORIZONTAL',w:'fill',gap:14,ai:'CENTER',ch:[
      {t:'text',st:'Corpo/Pequeno',tx:'espaco/'+v,fill:'cor/texto/sutil',w:92},
      {t:'rect',w:v*4,h:14,r:5,fill:{g:OURO,a:0}},
      {t:'text',st:'Corpo/Pequeno',tx:v+' px',fill:'cor/texto/secundario'}]},sp);
  }
  // raio
  const rd=await N({t:'al',dir:'VERTICAL',w:500,r:22,p:24,gap:16,fill:'cor/fundo/elevado',stroke:'cor/borda/sutil',name:'raio'},S);
  rd.x=600; rd.y=560; rd.counterAxisSizingMode='FIXED';
  await N({t:'text',st:'Título/H3',tx:'Raio',fill:'cor/texto/primario'},rd);
  const rrow=await N({t:'al',dir:'HORIZONTAL',w:'fill',gap:14,ai:'CENTER'},rd);
  for(const [nm,v] of [['xs',8],['sm',12],['md',16],['lg',20],['xl',28],['2xl',36]]){
    await N({t:'al',dir:'VERTICAL',gap:7,ai:'CENTER',ch:[
      {t:'rect',w:58,h:58,r:v,fill:'cor/fundo/superficie',stroke:'cor/borda/ouro'},
      {t:'text',st:'Corpo/Pequeno',sz:11,tx:nm,fill:'cor/texto/sutil'}]},rrow);
  }
  await N({t:'text',st:'Corpo/Pequeno',tx:'raio/pill = 999 para botões, chips e pílulas.',fill:'cor/texto/sutil'},rd);
  // estilos de texto
  const ty=await N({t:'al',dir:'VERTICAL',w:560,r:22,p:24,gap:14,fill:'cor/fundo/elevado',stroke:'cor/borda/sutil',name:'estilos de texto'},S);
  ty.x=1130; ty.y=560; ty.counterAxisSizingMode='FIXED';
  await N({t:'text',st:'Título/H3',tx:'Estilos de texto',fill:'cor/texto/primario'},ty);
  for(const [st,ex] of [['Display/Saldo','1.280'],['Título/H1','Missões Douradas'],['Título/H3','Resgate agora'],['Corpo/Grande','Sua compra vale ouro.'],['Corpo/Padrão','Pontos creditados na hora.'],['Rótulo/Overline','Seu saldo dourado']]){
    await N({t:'al',dir:'HORIZONTAL',w:'fill',gap:16,ai:'CENTER',ch:[
      {t:'text',st:'Corpo/Pequeno',sz:11,tx:st,fill:'cor/texto/sutil',w:112},
      {t:'text',st:st,tx:ex,fill:'cor/texto/primario',w:'fill'}]},ty);
  }
  // efeitos
  const ef=await N({t:'al',dir:'HORIZONTAL',w:1030,r:22,p:24,gap:24,ai:'CENTER',fill:'cor/fundo/elevado',stroke:'cor/borda/sutil',name:'efeitos'},S);
  ef.x=70; ef.y=870; ef.counterAxisSizingMode='FIXED';
  for(const [nm,fl,efx] of [['Sombra/Card','cor/fundo/superficie','Sombra/Card'],['Sombra/Elevada','cor/fundo/superficie','Sombra/Elevada'],['Brilho/Ouro',null,'Brilho/Ouro'],['Brilho/Ouro Forte',null,'Brilho/Ouro Forte']]){
    await N({t:'al',dir:'VERTICAL',gap:10,ai:'CENTER',ch:[
      {t:'rect',w:120,h:72,r:18,fill:fl?fl:{g:OURO},ef:efx},
      {t:'text',st:'Corpo/Pequeno',sz:11,tx:nm,fill:'cor/texto/sutil'}]},ef);
  }
  ids.tokens=S.id;
}
return {ids};
