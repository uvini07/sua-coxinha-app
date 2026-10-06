// ===== PARTE 3 · G · Clube (3) + H · QR Code (2) + I · Perfil (3) =====
const PAGE=await figma.getNodeByIdAsync('5:2'); await figma.setCurrentPageAsync(PAGE);
const ids={};
// nav sem aba ativa (telas alcançadas pelo avatar, não pela barra)
async function navNeutro(f){
  const n=await nav(f,'Início');
  const ab=n.findOne(x=>x.name==='aba Início');
  if(ab){ab.findAll(x=>x.type==='VECTOR').forEach(x=>{x.strokes=[sol('#5C5C5C')];});const t=ab.findOne(x=>x.type==='TEXT');if(t)t.fills=[sol('cor/texto/sutil')];}
  return n;
}
function parceiro(f,x,y,icone,nome,cat,ben){
  return (async()=>{
    const p=await N({t:'inst',k:'Card de Parceiro'},f); p.x=x; p.y=y;
    txAll(p,{'nome':nome,'categoria':cat});
    // o texto do benefício não tem nome próprio no componente
    const bn=p.findOne(n=>n.name==='benefício'); if(bn)txIn(bn,0,ben);
    swapIcon(p,icone,'#F9C115',0); // 0 = ícone do logo, 1 = chevron
    return p;})();
}

// ===================== G · CLUBE =====================
const SG=mkSection('G · Clube de Benefícios',3); PAGE.appendChild(SG); await secTitle(SG,'G · Clube de Benefícios');

// --- 23 · Clube ---
{
  const f=await scr(SG,'23 · Clube Sua Coxinha',0);
  await glow(f,55,40,290,0.16,170);
  await statusbar(f);
  const hd=await N({t:'al',dir:'VERTICAL',w:326,gap:4},f); hd.x=32; hd.y=68;
  await N({t:'text',st:'Título/H1',tx:'Clube',fill:'cor/texto/primario'},hd);
  await N({t:'text',st:'Corpo/Padrão',tx:'Ser cliente Sua Coxinha abre portas.',fill:'cor/texto/secundario'},hd);
  const hero=await N({t:'al',dir:'HORIZONTAL',w:326,h:112,r:24,p:[0,20],gap:14,ai:'CENTER',clip:true,fill:{g:OURO},ef:'Brilho/Ouro',name:'destaque'},f);
  hero.x=32; hero.y=148; hero.primaryAxisSizingMode='FIXED'; hero.counterAxisSizingMode='FIXED';
  const gd=inst('Gota · sub-marca'); hero.appendChild(gd); gd.layoutPositioning='ABSOLUTE'; gd.rescale(130/gd.width);
  gd.findAll(x=>'fills' in x&&x.type!=='FRAME').forEach(x=>{x.fills=[sol('#462302')];}); gd.opacity=0.08; gd.x=250; gd.y=-16;
  await N({t:'al',dir:'VERTICAL',w:'fill',gap:5,ch:[
    {t:'text',st:'Rótulo/Overline',tx:'Seu nível Ouro',uc:true,fill:'#462302',op:0.75},
    {t:'text',st:'Título/H3',tx:'14 benefícios liberados',fill:'#462302'},
    {t:'text',st:'Corpo/Pequeno',tx:'Sem precisar gastar pontos.',fill:'#462302',op:0.8}]},hero);
  await N({t:'ico',n:'seta-dir',s:22,c:'#462302'},hero);
  const grid=await N({t:'al',dir:'HORIZONTAL',w:326,gap:12,name:'categorias'},f); grid.x=32; grid.y=282; grid.layoutWrap='WRAP'; grid.counterAxisSpacing=12;
  for(const [ic,nm,qt] of [['halter','Saúde & Bem-estar','8 parceiros'],['formatura','Educação','5 parceiros'],['filme','Lazer','6 parceiros'],['tesoura','Serviços','9 parceiros']]){
    await N({t:'al',dir:'VERTICAL',w:157,h:106,r:20,p:16,gap:8,ji:'SPACE_BETWEEN',fill:'cor/fundo/elevado',stroke:'cor/borda/sutil',ch:[
      {t:'ico',n:ic,s:24,c:'#F9C115'},
      {t:'al',dir:'VERTICAL',gap:2,ch:[
        {t:'text',st:'Corpo/Forte',tx:nm,fill:'cor/texto/primario',w:125},
        {t:'text',st:'Corpo/Pequeno',tx:qt,fill:'cor/texto/sutil'}]}]},grid);
  }
  await secHead(f,32,528,'Perto de você');
  await parceiro(f,32,562,'halter','Smart Fit Cajamar','Saúde & Bem-estar · 1,2 km','20% de desconto');
  await parceiro(f,32,660,'formatura','Wizard Idiomas','Educação · 2,4 km','1ª mensalidade grátis');
  await nav(f,'Clube');
  ids.clube=f.id;
}

// --- 24 · Categoria ---
{
  const f=await scr(SG,'24 · Clube · categoria',1);
  await statusbar(f);
  await appbar(f,'Saúde & Bem-estar',{actionIcon:'busca'});
  await chips(f,32,122,['Todos','Cajamar','Jundiaí'],0);
  const L=[['halter','Smart Fit Cajamar','Academia · 1,2 km','20% de desconto'],
           ['halter','Studio Pilates Ipês','Pilates · 2,0 km','1ª aula gratuita'],
           ['escudo','Odonto Família','Odontologia · 1,8 km','Avaliação sem custo'],
           ['coracao','Clínica Vida Leve','Nutrição · 3,1 km','15% na consulta'],
           ['brilho','Espaço Zen','Massoterapia · 2,7 km','10% em pacotes']];
  let y=182;
  for(const [ic,nm,cat,ben] of L){ const p=await parceiro(f,32,y,ic,nm,cat,ben); y+=p.height+12; }
  await nav(f,'Clube');
  ids.clubeCategoria=f.id;
}

// --- 25 · Detalhe do parceiro ---
{
  const f=await scr(SG,'25 · Detalhe do parceiro',2);
  const im=await N({t:'rect',w:390,h:248,fill:{im:IMG.loja,mode:'FILL'},name:'foto'},f); im.x=0; im.y=0;
  const fade=await N({t:'rect',w:390,h:248,fill:{g:[[0,'#131313',0],[.55,'#131313',.3],[1,'#131313',1]],a:90},name:'degradê'},f); fade.x=0; fade.y=0;
  await statusbar(f);
  await appbar(f,'',{closeIcon:true,actionIcon:'compartilhar'});
  const lg=await N({t:'al',dir:'VERTICAL',w:76,h:76,r:24,ai:'CENTER',ji:'CENTER',fill:'cor/fundo/elevado',stroke:'cor/borda/ouro',sw:1.5,name:'logo',ch:[{t:'ico',n:'halter',s:36,c:'#F9C115'}]},f);
  lg.x=32; lg.y=206;
  const hd=await N({t:'al',dir:'VERTICAL',w:326,gap:5},f); hd.x=32; hd.y=300;
  await N({t:'text',st:'Título/H1',tx:'Smart Fit Cajamar',fill:'cor/texto/primario'},hd);
  await N({t:'al',dir:'HORIZONTAL',gap:9,ai:'CENTER',ch:[
    {t:'text',st:'Corpo/Padrão',tx:'Saúde & Bem-estar',fill:'cor/texto/secundario'},
    {t:'ell',w:4,h:4,fill:'cor/texto/sutil'},
    {t:'text',st:'Corpo/Padrão',tx:'1,2 km',fill:'cor/texto/secundario'}]},hd);
  const ben=await N({t:'al',dir:'VERTICAL',w:326,r:22,p:18,gap:7,fill:{c:'#F9C115',o:0.1},stroke:'cor/borda/ouro',name:'benefício'},f);
  ben.x=32; ben.y=382; ben.counterAxisSizingMode='FIXED';
  await N({t:'al',dir:'HORIZONTAL',gap:9,ai:'CENTER',ch:[
    {t:'ico',n:'ticket',s:20,c:'#F9C115'},
    {t:'text',st:'Título/H3',tx:'20% de desconto',fill:'cor/texto/ouro'}]},ben);
  await N({t:'text',st:'Corpo/Padrão',tx:'Em qualquer plano mensal, sem taxa de adesão. Válido para níveis Prata ou superior.',fill:'cor/texto/secundario',w:'fill'},ben);
  await secHead(f,32,ben.y+ben.height+24,'Como usar',false);
  let y=ben.y+ben.height+54;
  for(const [n,t] of [['1','Gere seu cupom aqui no app'],['2','Apresente na recepção do parceiro'],['3','O desconto vale enquanto o plano durar']]){
    const r=await N({t:'al',dir:'HORIZONTAL',w:326,gap:12,ai:'CENTER',ch:[
      {t:'al',dir:'VERTICAL',w:26,h:26,r:999,ai:'CENTER',ji:'CENTER',fill:{c:'#F9C115',o:0.14},ch:[{t:'text',st:'Corpo/Pequeno',fo:{family:'Poppins',style:'SemiBold'},tx:n,fill:'cor/texto/ouro'}]},
      {t:'text',st:'Corpo/Padrão',tx:t,fill:'cor/texto/secundario',w:'fill'}]},f);
    r.x=32;r.y=y;y+=r.height+12;
  }
  const inf=await infoCard(f,[['Endereço','Av. Ten. Marques, 4511'],['Funcionamento','Seg a sáb · 6h às 22h']],{});
  inf.x=32; inf.y=y+6;
  const bar=await N({t:'al',dir:'VERTICAL',w:390,h:96,p:[16,32],ai:'CENTER',fill:'cor/fundo/elevado',ef:'Sombra/Nav',name:'barra de ação'},f);
  bar.x=0; bar.y=748; bar.primaryAxisSizingMode='FIXED'; bar.counterAxisSizingMode='FIXED';
  const b=await N({t:'inst',k:'Botão|Estilo=Ouro, Estado=Padrão'},bar); b.resize(326,52); tx(b,'rótulo','Gerar meu cupom');
  ids.parceiro=f.id;
}
SG.x=0; SG.y=7200;

// ===================== H · QR CODE =====================
const SH=mkSection('H · QR Code',2); PAGE.appendChild(SH); await secTitle(SH,'H · QR Code');

// --- 26 · Meu QR Code ---
{
  const f=await scr(SH,'26 · Meu QR Code',0);
  await glow(f,-15,180,420,0.28,190);
  await statusbar(f);
  await appbar(f,'Identificação',{closeIcon:true,noAction:true});
  const card=await N({t:'al',dir:'VERTICAL',w:326,r:28,p:[24,24,22,24],gap:18,ai:'CENTER',fill:'#FFFFFF',ef:'Sombra/Elevada',name:'cartão'},f);
  card.x=32; card.y=150; card.counterAxisSizingMode='FIXED';
  const av=await N({t:'inst',k:'Avatar|Tamanho=M'},card);
  await N({t:'al',dir:'VERTICAL',gap:7,ai:'CENTER',ch:[
    {t:'text',st:'Título/H3',tx:'Marcelo Jordão',fill:'#131313'},
    {t:'al',dir:'HORIZONTAL',gap:6,ai:'CENTER',r:999,p:[5,12,5,10],fill:{c:'#F9C115',o:0.22},ch:[
      {t:'ico',n:'trofeu',s:14,c:'#8A5A06'},
      {t:'text',st:'Rótulo/Overline',tx:'Nível Ouro · 1.280 pts',uc:true,fill:'#462302'}]}]},card);
  await N({t:'svg',svg:qrSvg(20261105,25,8),name:'QR Code'},card);
  await N({t:'al',dir:'HORIZONTAL',r:12,p:[9,16],fill:'#F2F1EE',ch:[{t:'text',st:'Corpo/Forte',tx:'PD · 4417 · 0982',fill:'#131313',ls:8}]},card);
  await N({t:'text',st:'Corpo/Pequeno',tx:'Mostre este código no caixa antes de pagar.',fill:'#5C5C5C',ta:'CENTER',w:278},card);
  const alt=await N({t:'al',dir:'VERTICAL',w:326,gap:12,ai:'CENTER'},f); alt.x=32; alt.y=card.y+card.height+28;
  await N({t:'text',st:'Corpo/Pequeno',tx:'Ou informe seu telefone no caixa',fill:'cor/texto/sutil'},alt);
  await N({t:'al',dir:'HORIZONTAL',gap:10,ai:'CENTER',r:16,p:[13,18],fill:'cor/fundo/elevado',stroke:'cor/borda/sutil',ch:[
    {t:'ico',n:'usuario',s:19,c:'#F9C115'},
    {t:'text',st:'Título/H4',tx:'(11) 98765-4321',fill:'cor/texto/primario'}]},alt);
  const dica=await N({t:'al',dir:'HORIZONTAL',gap:8,ai:'CENTER',r:999,p:[8,14],fill:{c:'#FFFFFF',o:0.06},name:'dica',ch:[
    {t:'ico',n:'brilho',s:15,c:'#8A8A8A'},
    {t:'text',st:'Corpo/Pequeno',tx:'Brilho da tela no máximo',fill:'cor/texto/sutil'}]},f);
  dica.x=104; dica.y=784;
  ids.meuQR=f.id;
}

// --- 27 · Pontos creditados ---
{
  const f=await scr(SH,'27 · Pontos creditados',1);
  await glow(f,65,70,260,0.26,160);
  await statusbar(f);
  const top=await N({t:'al',dir:'VERTICAL',w:390,gap:12,ai:'CENTER'},f); top.x=0; top.y=86;
  await N({t:'al',dir:'VERTICAL',w:72,h:72,r:999,ai:'CENTER',ji:'CENTER',fill:{g:OURO},ef:'Brilho/Ouro Forte',ch:[{t:'ico',n:'check',s:36,c:'#462302'}]},top);
  await N({t:'al',dir:'VERTICAL',gap:-2,ai:'CENTER',ch:[
    {t:'text',st:'Display/Saldo',tx:'+120',fill:{g:OURO,a:90}},
    {t:'text',st:'Corpo/Forte',tx:'Pontos Dourados',fill:'cor/texto/secundario'}]},top);
  await N({t:'text',st:'Título/H3',tx:'Compra identificada!',fill:'cor/texto/primario'},top);
  const rec=await N({t:'al',dir:'VERTICAL',w:326,r:22,p:18,gap:12,fill:'cor/fundo/elevado',stroke:'cor/borda/sutil',name:'comprovante'},f);
  rec.x=32; rec.y=340; rec.counterAxisSizingMode='FIXED';
  await N({t:'al',dir:'HORIZONTAL',w:'fill',ji:'SPACE_BETWEEN',ai:'CENTER',ch:[
    {t:'text',st:'Rótulo/Overline',tx:'Cajamar · Portal dos Ipês',uc:true,fill:'cor/texto/sutil'},
    {t:'text',st:'Corpo/Pequeno',tx:'14:32',fill:'cor/texto/sutil'}]},rec);
  for(const [q,nm,vl] of [['2×','Coxinha G','R$ 29,80'],['1×','Combo Pra Você','R$ 20,90'],['1×','Molho Cremoso','R$ 9,10']]){
    await N({t:'al',dir:'HORIZONTAL',w:'fill',gap:10,ai:'CENTER',ch:[
      {t:'text',st:'Corpo/Pequeno',fo:{family:'Poppins',style:'SemiBold'},tx:q,fill:'cor/texto/ouro'},
      {t:'text',st:'Corpo/Padrão',tx:nm,fill:'cor/texto/secundario',w:'fill'},
      {t:'text',st:'Corpo/Padrão',tx:vl,fill:'cor/texto/primario'}]},rec);
  }
  await N({t:'rect',w:'fill',h:1,fill:'cor/borda/sutil',dash:[5,5]},rec);
  await N({t:'al',dir:'HORIZONTAL',w:'fill',ji:'SPACE_BETWEEN',ai:'CENTER',ch:[
    {t:'text',st:'Corpo/Forte',tx:'Total',fill:'cor/texto/primario'},
    {t:'text',st:'Número/Médio',sz:18,tx:'R$ 59,80',fill:'cor/texto/primario'}]},rec);
  const pr=await N({t:'al',dir:'VERTICAL',w:326,r:22,p:18,gap:12,fill:{c:'#F9C115',o:0.1},stroke:'cor/borda/ouro',name:'próximo nível'},f);
  pr.x=32; pr.y=rec.y+rec.height+18; pr.counterAxisSizingMode='FIXED';
  await N({t:'al',dir:'HORIZONTAL',w:'fill',gap:11,ai:'CENTER',ch:[
    {t:'ico',n:'tendencia',s:20,c:'#F9C115'},
    {t:'text',st:'Corpo/Forte',tx:'Faltam 320 pontos para o Diamante',fill:'cor/texto/primario',w:'fill'}]},pr);
  await N({t:'al',dir:'HORIZONTAL',w:'fill',h:9,r:999,clip:true,fill:{c:'#462302',o:0.5},ch:[{t:'rect',w:206,h:9,r:999,fill:{g:OURO,a:90}}]},pr);
  await botao(f,32,714,'Ver minha carteira','Ouro','Padrão');
  await botao(f,32,776,'Fechar','Fantasma','Padrão');
  ids.pontosCreditados=f.id;
}
SH.x=0; SH.y=8400;

// ===================== I · PERFIL =====================
const SI=mkSection('I · Perfil',3); PAGE.appendChild(SI); await secTitle(SI,'I · Perfil');
async function toggle(par,on){return N({t:'al',dir:'HORIZONTAL',w:48,h:28,r:999,p:[3],ai:'CENTER',ji:on?'MAX':'MIN',fill:on?{g:OURO}:'cor/fundo/superficie',stroke:on?undefined:'cor/borda/media',ch:[{t:'ell',w:22,h:22,fill:on?'#462302':'#8A8A8A'}]},par);}

// --- 28 · Perfil ---
{
  const f=await scr(SI,'28 · Perfil',0);
  await glow(f,70,30,250,0.16,160);
  await statusbar(f);
  const hd=await N({t:'al',dir:'HORIZONTAL',w:326,ji:'SPACE_BETWEEN',ai:'CENTER'},f); hd.x=32; hd.y=66;
  await N({t:'text',st:'Título/H2',tx:'Perfil',fill:'cor/texto/primario'},hd);
  await N({t:'al',dir:'VERTICAL',w:40,h:40,r:999,ai:'CENTER',ji:'CENTER',fill:'cor/fundo/elevado',stroke:'cor/borda/sutil',ch:[{t:'ico',n:'engrenagem',s:20,c:'#FFFFFF'}]},hd);
  const pb=await N({t:'al',dir:'VERTICAL',w:390,gap:10,ai:'CENTER'},f); pb.x=0; pb.y=126;
  await N({t:'inst',k:'Avatar|Tamanho=G'},pb);
  await N({t:'al',dir:'VERTICAL',gap:2,ai:'CENTER',ch:[
    {t:'text',st:'Título/H2',tx:'Marcelo Jordão',fill:'cor/texto/primario'},
    {t:'text',st:'Corpo/Padrão',tx:'(11) 98765-4321 · Cajamar',fill:'cor/texto/sutil'}]},pb);
  const nc=await N({t:'al',dir:'HORIZONTAL',w:326,r:22,p:16,gap:14,ai:'CENTER',fill:'cor/fundo/elevado',stroke:'cor/borda/ouro',name:'nível'},f);
  nc.x=32; nc.y=306; nc.counterAxisSizingMode='FIXED';
  const selo=await N({t:'inst',k:'Selo de Nível|Nível=Ouro'},nc); selo.rescale(0.62);
  await N({t:'al',dir:'VERTICAL',w:'fill',gap:7,ch:[
    {t:'al',dir:'HORIZONTAL',w:'fill',ji:'SPACE_BETWEEN',ai:'CENTER',ch:[
      {t:'text',st:'Título/H4',tx:'Nível Ouro',fill:'cor/texto/primario'},
      {t:'text',st:'Corpo/Pequeno',fo:{family:'Poppins',style:'SemiBold'},tx:'Faltam 320',fill:'cor/texto/ouro'}]},
    {t:'al',dir:'HORIZONTAL',w:'fill',h:8,r:999,clip:true,fill:'#2B2B2B',ch:[{t:'rect',w:140,h:8,r:999,fill:{g:OURO,a:90}}]},
    {t:'text',st:'Corpo/Pequeno',tx:'Próximo nível: Diamante',fill:'cor/texto/sutil'}]},nc);
  const st=await N({t:'al',dir:'HORIZONTAL',w:326,gap:10},f); st.x=32; st.y=nc.y+nc.height+16;
  for(const [v,l] of [['4.680','Pontos no total'],['12','Resgates'],['out/25','Membro desde']]){
    await N({t:'al',dir:'VERTICAL',w:'fill',h:76,r:18,gap:3,ai:'CENTER',ji:'CENTER',fill:'cor/fundo/elevado',stroke:'cor/borda/sutil',ch:[
      {t:'text',st:'Número/Médio',sz:19,tx:v,fill:'cor/texto/primario'},
      {t:'text',st:'Corpo/Pequeno',sz:11,tx:l,fill:'cor/texto/sutil',ta:'CENTER',w:92}]},st);
  }
  let y=st.y+st.height+18;
  for(const [ic,lb,vl] of [['usuario','Dados pessoais',''],['pin','Unidade preferida','Cajamar'],['ticket','Meus vouchers','4'],['sino','Notificações',''],['pessoas','Indicar amigos','+200 pts']]){
    const it=await N({t:'inst',k:'Item de Menu'},f); it.x=32; it.y=y;
    txAll(it,{'rótulo':lb,'valor':vl});
    swapIcon(it,ic,'#8A8A8A',0); // 0 = ícone da esquerda, 1 = chevron
    y+=it.height;
    const d=await N({t:'rect',w:294,h:1,fill:'cor/borda/sutil'},f); d.x=64; d.y=y;
  }
  await navNeutro(f);
  ids.perfil=f.id;
}

// --- 29 · Dados pessoais ---
{
  const f=await scr(SI,'29 · Dados pessoais',1);
  await statusbar(f);
  await appbar(f,'Dados pessoais',{noAction:true});
  const av=await N({t:'al',dir:'VERTICAL',w:390,gap:10,ai:'CENTER'},f); av.x=0; av.y=126;
  await N({t:'inst',k:'Avatar|Tamanho=G'},av);
  await N({t:'text',st:'Corpo/Pequeno',fo:{family:'Poppins',style:'SemiBold'},tx:'Trocar foto',fill:'cor/texto/ouro'},av);
  let y=268;
  for(const [lb,vl,est] of [['Nome completo','Marcelo Jordão','Preenchido'],['Telefone / WhatsApp','(11) 98765-4321','Preenchido'],['E-mail','marcelinhojordao07@gmail.com','Preenchido'],['CPF','123.456.789-00','Preenchido'],['Data de nascimento','07 / 04 / 1996','Preenchido']]){
    const c=await N({t:'inst',k:'Campo de Texto|Estado='+est},f); c.x=32; c.y=y; c.resize(326,c.height);
    txAll(c,{'rótulo':lb,'valor':vl}); y+=c.height+16;
  }
  await botao(f,32,760,'Salvar alterações','Ouro','Padrão');
  ids.dadosPessoais=f.id;
}

// --- 30 · Configurações ---
{
  const f=await scr(SI,'30 · Configurações',2);
  await statusbar(f);
  await appbar(f,'Configurações',{noAction:true});
  await overline(f,32,128,'Como falamos com você','cor/texto/sutil');
  let y=156;
  for(const [lb,sub,on] of [['Notificações do app','Pontos, missões e recompensas',1],['WhatsApp','Avisos de expiração e ofertas',1],['E-mail','Resumo mensal da carteira',0],['Ofertas personalizadas','Baseadas no seu histórico',1]]){
    const r=await N({t:'al',dir:'HORIZONTAL',w:326,p:[14,0],gap:14,ai:'CENTER'},f); r.x=32; r.y=y; r.counterAxisSizingMode='FIXED';
    await N({t:'al',dir:'VERTICAL',w:'fill',gap:2,ch:[
      {t:'text',st:'Corpo/Grande',tx:lb,fill:'cor/texto/primario'},
      {t:'text',st:'Corpo/Pequeno',tx:sub,fill:'cor/texto/sutil'}]},r);
    await toggle(r,on);
    y+=r.height;
    const d=await N({t:'rect',w:326,h:1,fill:'cor/borda/sutil'},f); d.x=32; d.y=y;
  }
  await overline(f,32,y+28,'Privacidade e conta','cor/texto/sutil');
  y+=56;
  for(const [ic,lb] of [['escudo','Termos de uso'],['cadeado','Política de privacidade'],['livro','Como os pontos funcionam'],['info','Ajuda e contato']]){
    const it=await N({t:'inst',k:'Item de Menu'},f); it.x=32; it.y=y;
    txAll(it,{'rótulo':lb,'valor':''});
    swapIcon(it,ic,'#8A8A8A',0);
    y+=it.height;
  }
  const sair=await N({t:'al',dir:'HORIZONTAL',w:326,gap:11,ai:'CENTER',p:[16,0]},f); sair.x=32; sair.y=y+10;
  await N({t:'ico',n:'sair',s:20,c:'#FF5A5A'},sair);
  await N({t:'text',st:'Corpo/Grande',tx:'Sair da conta',fill:'cor/sinal/erro'},sair);
  const ver=await N({t:'text',st:'Corpo/Pequeno',tx:'Pontos Dourados · versão 1.0.0',fill:'cor/texto/sutil',ta:'CENTER',w:326},f);
  ver.x=32; ver.y=800;
  ids.configuracoes=f.id;
}
SI.x=0; SI.y=9600;
return {ids, sections:{G:SG.id,H:SH.id,I:SI.id}};
