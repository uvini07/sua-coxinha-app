// DADOS DO CLUBE
//
// Produtos, preços e unidades vêm do cardápio real (src/lojas/*/produtos.js do site).
// A economia de pontos abaixo é DEMONSTRATIVA — o briefing determina que toda regra
// seja parametrizável no painel administrativo. Trocar estes números é a conta de
// margem do negócio, não uma decisão de produto:
//
//   ganho:  2 pontos por R$ 1,00 gasto
//   troca:  ~20 pontos por R$ 1,00 de recompensa  (≈ 10% de retorno)
//
// Enquanto não existe backend, este arquivo é a fonte de dados do app.

export const PONTOS_POR_REAL = 2

export const UNIDADES = [
  { id: 'cajamar', nome: 'Cajamar', bairro: 'Portal dos Ipês', endereco: 'Av. Ten. Marques, 4511 – Sala 3' },
  { id: 'jundiai', nome: 'Jundiaí', bairro: 'Centro', endereco: 'Jundiaí – SP' },
]

export const NIVEIS = [
  {
    id: 'bronze',
    nome: 'BRONZE',
    minimo: 0,
    cor: 'var(--nivel-bronze)',
    gradiente: 'linear-gradient(135deg, #f0be92, #c8792f 45%, #7e4412)',
    icone: 'escudo',
    beneficios: ['Acesso ao catálogo de recompensas', 'Missões Douradas do mês'],
  },
  {
    id: 'prata',
    nome: 'PRATA',
    minimo: 1000,
    cor: 'var(--nivel-prata)',
    gradiente: 'linear-gradient(135deg, #ffffff, #c9ced6 45%, #878d97)',
    icone: 'escudo',
    beneficios: ['Tudo do Bronze', 'Clube de benefícios dos parceiros', 'Oferta de aniversário'],
  },
  {
    id: 'ouro',
    nome: 'OURO',
    minimo: 3000,
    cor: 'var(--nivel-ouro)',
    gradiente: 'var(--gradiente-ouro)',
    icone: 'trofeu',
    beneficios: [
      'Tudo do Prata',
      'Recompensas exclusivas do nível',
      'Pontos em dobro no mês do aniversário',
      'Prioridade em lançamentos',
    ],
  },
  {
    id: 'diamante',
    nome: 'DIAMANTE',
    minimo: 5000,
    cor: 'var(--nivel-diamante)',
    gradiente: 'linear-gradient(135deg, #eafbff, #7fd6e8 45%, #2e93ae)',
    icone: 'brilho',
    beneficios: [
      'Tudo do Ouro',
      'Convites para experiências da marca',
      'Atendimento e novidades em primeira mão',
    ],
  },
]

export function nivelDe(acumulado) {
  let atual = NIVEIS[0]
  for (const n of NIVEIS) if (acumulado >= n.minimo) atual = n
  const proximo = NIVEIS[NIVEIS.indexOf(atual) + 1] || null
  const base = atual.minimo
  const alvo = proximo ? proximo.minimo : atual.minimo
  const progresso = proximo ? Math.min(1, (acumulado - base) / (alvo - base)) : 1
  return { atual, proximo, progresso, faltam: proximo ? Math.max(0, alvo - acumulado) : 0 }
}

export const CATEGORIAS_RECOMPENSA = [
  { id: 'tudo', nome: 'Tudo' },
  { id: 'coxinhas', nome: 'Coxinhas' },
  { id: 'combos', nome: 'Combos' },
  { id: 'doces', nome: 'Doces' },
  { id: 'casa', nome: 'Para casa' },
]

export const RECOMPENSAS = [
  {
    id: 'coxinha-g',
    nome: 'Coxinha G',
    descricao: 'Do sabor que você escolher no balcão',
    detalhe:
      'A clássica da casa no tamanho grande. Você escolhe o recheio na hora: frango, Catupiry®, costela, queijo, pizza, carne seca, cheddar com bacon ou caipira.',
    pontos: 300,
    preco: 1490,
    categoria: 'coxinhas',
    imagem: 'coxinha-g.webp',
    inclui: ['1 Coxinha G do sabor que você escolher', 'Acompanha 1 molho da casa', 'Retirada na unidade escolhida'],
  },
  {
    id: 'coxinha-m',
    nome: 'Coxinha M',
    descricao: 'O tamanho do dia a dia',
    detalhe: 'A mesma massa e o mesmo recheio da G, no tamanho de matar a fome entre uma coisa e outra.',
    pontos: 200,
    preco: 990,
    categoria: 'coxinhas',
    imagem: 'coxinha-m.webp',
    inclui: ['1 Coxinha M do sabor que você escolher', 'Retirada na unidade escolhida'],
  },
  {
    id: 'coxinha-gourmet',
    nome: 'Coxinha Gourmet',
    descricao: 'A mini para provar sem compromisso',
    detalhe: 'Versão pequena para experimentar um sabor novo — e completar a missão do mês de quebra.',
    pontos: 60,
    preco: 250,
    categoria: 'coxinhas',
    imagem: 'coxinha-gourmet.webp',
    inclui: ['1 Coxinha Gourmet', 'Retirada na unidade escolhida'],
  },
  {
    id: 'churros-gourmet',
    nome: 'Churros Gourmet',
    descricao: 'Recheado, quentinho, na hora',
    detalhe: 'Churros gourmet com o recheio da casa. Peça quente e coma na hora — é como ele é melhor.',
    pontos: 260,
    preco: 1290,
    categoria: 'doces',
    imagem: 'churros-gourmet.webp',
    inclui: ['1 Churros Gourmet recheado', 'Retirada na unidade escolhida'],
  },
  {
    id: 'copo-magico',
    nome: 'Copo Mágico Doce',
    descricao: 'Churros e sorvete no mesmo copo',
    detalhe: 'Mini churros e sorvete juntos no copo. É a sobremesa que as crianças pedem e os adultos terminam.',
    pontos: 380,
    preco: 1890,
    categoria: 'doces',
    imagem: 'copo-magico-doce.webp',
    inclui: ['1 Copo Mágico Doce', 'Retirada na unidade escolhida'],
  },
  {
    id: 'mini-churros',
    nome: 'Mini Churros Recheados',
    descricao: 'Caixa com 10 unidades',
    detalhe: 'Dez mini churros recheados na caixa. Bom para dividir — ou não.',
    pontos: 260,
    preco: 1290,
    categoria: 'doces',
    imagem: 'mini-churros.webp',
    inclui: ['10 mini churros recheados', '1 sabor por caixa', 'Retirada na unidade escolhida'],
  },
  {
    id: 'combo-pra-voce',
    nome: 'Combo Pra Você',
    descricao: 'Coxinha G, bebida e churros',
    detalhe: 'O combo de uma pessoa só: uma Coxinha G, uma bebida e um churros para fechar.',
    pontos: 420,
    preco: 2090,
    categoria: 'combos',
    imagem: 'coxinha-combo.webp',
    inclui: ['1 Coxinha G', '1 bebida', '1 Churros Gourmet'],
  },
  {
    id: 'combo-casal',
    nome: 'Combo Casal',
    descricao: '2 coxinhas G, 2 bebidas e sobremesa',
    detalhe: 'Para dois: duas Coxinhas G do sabor que vocês escolherem, duas bebidas e a sobremesa.',
    pontos: 900,
    preco: 4480,
    categoria: 'combos',
    imagem: 'combo-casal.webp',
    inclui: ['2 Coxinhas G', '2 bebidas', '1 sobremesa'],
  },
  {
    id: 'mini-gostosuras',
    nome: 'Caixa de Mini Gostosuras',
    descricao: '20 salgadinhos para a mesa',
    detalhe: 'A caixa de festa: vinte mini salgados com até dois sabores. Para levar quando a visita chegar.',
    pontos: 460,
    preco: 2290,
    categoria: 'combos',
    imagem: 'cesta-mini-coxinhas.webp',
    inclui: ['20 mini salgados', 'Até 2 sabores por caixa', 'Pedido com 24 h de antecedência'],
  },
  {
    id: 'congelados',
    nome: 'Mini Coxinhas Congeladas',
    descricao: 'Para fritar em casa',
    detalhe: 'O pacote de congelados para ter coxinha em casa a qualquer hora. Vai do freezer para a frigideira.',
    pontos: 600,
    preco: 2990,
    categoria: 'casa',
    imagem: 'congelados.webp',
    inclui: ['1 pacote de mini coxinhas congeladas', 'Modo de preparo na embalagem'],
  },
  {
    id: 'molho',
    nome: 'Molho da casa',
    descricao: 'Cremoso, alho picante ou goiabinha',
    detalhe: 'Um pote do molho que você quiser: cremoso suave, cremoso moderado, alho picante ou pimenta agridoce goiabinha.',
    pontos: 400,
    preco: 1990,
    categoria: 'casa',
    imagem: 'molhos-salgados.webp',
    inclui: ['1 pote de molho da casa', 'Sabor a escolher na retirada'],
  },
]

export const MISSOES = [
  {
    id: 'sequencia',
    titulo: 'Sequência Dourada',
    descricao: 'Faça 4 compras no mesmo mês',
    detalhe:
      'Quatro compras no mesmo mês e o bônus é seu. A sequência reinicia no dia 1º — vale compra presencial, iFood e 99Food.',
    icone: 'fogo',
    meta: 4,
    feito: 3,
    recompensa: 150,
    prazo: 'Faltam 6 dias',
    comoFunciona: [
      ['Compre em qualquer unidade', 'Presencial, iFood ou 99Food contam.'],
      ['Identifique-se no caixa', 'Pelo telefone ou pelo seu QR Code.'],
      ['Complete as 4 compras', 'O bônus cai na carteira na hora.'],
    ],
  },
  {
    id: 'sabor-novo',
    titulo: 'Experimente um sabor novo',
    descricao: 'Peça um recheio que você ainda não provou',
    detalhe:
      'São oito recheios no balcão e você sempre pede os mesmos. Prove um que ainda não entrou na sua lista e leve pontos por isso.',
    icone: 'brilho',
    meta: 1,
    feito: 0,
    recompensa: 80,
    prazo: 'Faltam 12 dias',
    comoFunciona: [
      ['Escolha um recheio novo', 'Costela, caipira e carne seca são os menos pedidos.'],
      ['Peça no balcão', 'Vale na Coxinha G, M ou Gourmet.'],
      ['Pronto', 'Os pontos entram assim que a compra for identificada.'],
    ],
  },
  {
    id: 'indicacao',
    titulo: 'Indique um amigo',
    descricao: 'Alguém entra no clube pelo seu convite',
    detalhe: 'Mande seu convite. Quando a pessoa fizer a primeira compra identificada, vocês dois ganham pontos.',
    icone: 'pessoas',
    meta: 1,
    feito: 1,
    recompensa: 200,
    prazo: 'Concluída ontem',
    concluida: true,
    comoFunciona: [
      ['Mande seu convite', 'Pelo WhatsApp, em dois toques.'],
      ['A pessoa se cadastra', 'Com o telefone dela, no caixa ou no app.'],
      ['Primeira compra feita', 'Os pontos entram para os dois.'],
    ],
  },
  {
    id: 'maratona',
    titulo: 'Maratona de sabores',
    descricao: 'Prove 5 recheios diferentes',
    detalhe: 'A missão longa: cinco recheios diferentes ao longo do trimestre. Quem termina ganha o selo e o bônus cheio.',
    icone: 'trofeu',
    meta: 5,
    feito: 0,
    recompensa: 300,
    prazo: 'Desbloqueia no nível Diamante',
    bloqueada: true,
    comoFunciona: [
      ['Chegue ao Diamante', 'A missão abre junto com o nível.'],
      ['Prove 5 recheios', 'Um por compra, sem repetir.'],
      ['Ganhe o selo', 'Mais 300 pontos na carteira.'],
    ],
  },
]

export const CATEGORIAS_CLUBE = [
  { id: 'saude', nome: 'Saúde & Bem-estar', icone: 'halter' },
  { id: 'educacao', nome: 'Educação', icone: 'formatura' },
  { id: 'lazer', nome: 'Lazer', icone: 'filme' },
  { id: 'servicos', nome: 'Serviços', icone: 'tesoura' },
]

export const PARCEIROS = [
  {
    id: 'academia',
    nome: 'Smart Fit Cajamar',
    categoria: 'saude',
    tipo: 'Academia',
    distancia: '1,2 km',
    beneficio: '20% de desconto',
    detalhe: 'Em qualquer plano mensal, sem taxa de adesão.',
    nivelMinimo: 'prata',
    endereco: 'Av. Ten. Marques, 4511',
    horario: 'Seg a sáb · 6h às 22h',
    icone: 'halter',
    comoUsar: ['Gere seu cupom aqui no app', 'Apresente na recepção', 'O desconto vale enquanto o plano durar'],
  },
  {
    id: 'pilates',
    nome: 'Studio Pilates Ipês',
    categoria: 'saude',
    tipo: 'Pilates',
    distancia: '2,0 km',
    beneficio: '1ª aula gratuita',
    detalhe: 'Aula experimental sem compromisso, com agendamento.',
    nivelMinimo: 'bronze',
    endereco: 'Rua das Palmeiras, 220',
    horario: 'Seg a sex · 7h às 21h',
    icone: 'coracao',
    comoUsar: ['Gere seu cupom', 'Agende pelo telefone do studio', 'Leve o cupom na primeira aula'],
  },
  {
    id: 'odonto',
    nome: 'Odonto Família',
    categoria: 'saude',
    tipo: 'Odontologia',
    distancia: '1,8 km',
    beneficio: 'Avaliação sem custo',
    detalhe: 'Primeira avaliação clínica gratuita para membros do clube.',
    nivelMinimo: 'bronze',
    endereco: 'Av. Brasil, 870',
    horario: 'Seg a sex · 8h às 18h',
    icone: 'escudo',
    comoUsar: ['Gere seu cupom', 'Marque pelo WhatsApp da clínica', 'Apresente na recepção'],
  },
  {
    id: 'idiomas',
    nome: 'Wizard Idiomas',
    categoria: 'educacao',
    tipo: 'Escola de idiomas',
    distancia: '2,4 km',
    beneficio: '1ª mensalidade grátis',
    detalhe: 'Na matrícula de qualquer curso regular.',
    nivelMinimo: 'prata',
    endereco: 'Rua XV de Novembro, 1200',
    horario: 'Seg a sáb · 8h às 20h',
    icone: 'formatura',
    comoUsar: ['Gere seu cupom', 'Leve na unidade no ato da matrícula', 'Válido uma vez por CPF'],
  },
  {
    id: 'faculdade',
    nome: 'Centro Universitário',
    categoria: 'educacao',
    tipo: 'Graduação e pós',
    distancia: '5,1 km',
    beneficio: '15% na mensalidade',
    detalhe: 'Desconto para membros Ouro e Diamante em cursos presenciais.',
    nivelMinimo: 'ouro',
    endereco: 'Rodovia Anhanguera, km 33',
    horario: 'Seg a sex · 8h às 22h',
    icone: 'livro',
    comoUsar: ['Gere seu cupom', 'Informe no processo seletivo', 'Desconto aplicado na matrícula'],
  },
  {
    id: 'cinema',
    nome: 'Cinemark Jundiaí',
    categoria: 'lazer',
    tipo: 'Cinema',
    distancia: '8,3 km',
    beneficio: 'Ingresso meia-entrada',
    detalhe: 'De segunda a quinta, em qualquer sessão 2D.',
    nivelMinimo: 'prata',
    endereco: 'Shopping Maxi, Piso 2',
    horario: 'Todos os dias · 13h às 23h',
    icone: 'filme',
    comoUsar: ['Gere seu cupom', 'Apresente na bilheteria', 'Um ingresso por cupom'],
  },
  {
    id: 'parque',
    nome: 'Parque Aventura',
    categoria: 'lazer',
    tipo: 'Lazer em família',
    distancia: '12 km',
    beneficio: 'Criança não paga',
    detalhe: 'Uma criança de até 10 anos por adulto pagante, aos domingos.',
    nivelMinimo: 'ouro',
    endereco: 'Estrada do Parque, s/n',
    horario: 'Sáb e dom · 9h às 18h',
    icone: 'coracao',
    comoUsar: ['Gere seu cupom', 'Apresente na entrada', 'Válido aos domingos'],
  },
  {
    id: 'barbearia',
    nome: 'Barbearia do Tico',
    categoria: 'servicos',
    tipo: 'Barbearia',
    distancia: '0,9 km',
    beneficio: '25% no corte',
    detalhe: 'De terça a quinta, com hora marcada.',
    nivelMinimo: 'bronze',
    endereco: 'Rua Sete de Setembro, 45',
    horario: 'Ter a sáb · 9h às 20h',
    icone: 'tesoura',
    comoUsar: ['Gere seu cupom', 'Agende pelo WhatsApp', 'Mostre na hora de pagar'],
  },
  {
    id: 'otica',
    nome: 'Ótica Visão Clara',
    categoria: 'servicos',
    tipo: 'Ótica',
    distancia: '1,5 km',
    beneficio: '30% nas lentes',
    detalhe: 'Na compra de armação, com exame de vista gratuito.',
    nivelMinimo: 'prata',
    endereco: 'Av. Ten. Marques, 3900',
    horario: 'Seg a sáb · 9h às 19h',
    icone: 'escudo',
    comoUsar: ['Gere seu cupom', 'Apresente na loja', 'Válido com a compra de armação'],
  },
]

export const HISTORICO_INICIAL = [
  { id: 'h1', tipo: 'ganho', titulo: 'Compra na Sua Coxinha', detalhe: 'Cajamar · 12 nov, 14:32', pontos: 120, valor: 5980, data: '2026-11-12' },
  { id: 'h2', tipo: 'bonus', titulo: 'Missão Dourada concluída', detalhe: 'Indique um amigo · 10 nov', pontos: 200, data: '2026-11-10' },
  { id: 'h3', tipo: 'resgate', titulo: 'Resgate de recompensa', detalhe: 'Coxinha G · 08 nov', pontos: -300, data: '2026-11-08' },
  { id: 'h4', tipo: 'ganho', titulo: 'Compra na Sua Coxinha', detalhe: 'Jundiaí · 05 nov, 19:08', pontos: 86, valor: 4300, data: '2026-11-05' },
  { id: 'h5', tipo: 'expirado', titulo: 'Pontos expirados', detalhe: 'Validade de 12 meses · 01 nov', pontos: -45, data: '2026-11-01' },
  { id: 'h6', tipo: 'bonus', titulo: 'Bônus de aniversário', detalhe: 'Pontos em dobro no mês · 22 out', pontos: 240, data: '2026-10-22' },
  { id: 'h7', tipo: 'ganho', titulo: 'Compra na Sua Coxinha', detalhe: 'Cajamar · 18 out, 12:40', pontos: 104, valor: 5200, data: '2026-10-18' },
  { id: 'h8', tipo: 'ganho', titulo: 'Compra na Sua Coxinha', detalhe: 'Cajamar · 09 out, 18:15', pontos: 64, valor: 3200, data: '2026-10-09' },
]

export const NOTIFICACOES_INICIAIS = [
  { id: 'n1', icone: 'brilho', titulo: 'Você ganhou 200 Pontos Dourados', texto: 'Missão “Indique um amigo” concluída — a Ana entrou no clube.', tempo: 'há 2 h', nova: true },
  { id: 'n2', icone: 'presente', titulo: 'Uma nova recompensa está disponível', texto: 'Churros Gourmet entrou no catálogo por 260 pontos.', tempo: 'há 5 h', nova: true },
  { id: 'n3', icone: 'relogio', titulo: 'Seus pontos expiram em 7 dias', texto: '90 Pontos Dourados vencem em 19 de novembro.', tempo: 'ontem', nova: false },
  { id: 'n4', icone: 'tendencia', titulo: 'Você está a 320 pontos do Diamante', texto: 'Mais duas compras e o próximo nível é seu.', tempo: '2 dias', nova: false },
  { id: 'n5', icone: 'alvo', titulo: 'Você desbloqueou uma Missão Dourada', texto: '“Experimente um sabor novo” vale 80 pontos.', tempo: '4 dias', nova: false },
]

export const USUARIO_INICIAL = {
  nome: 'Marcelo Jordão',
  primeiroNome: 'Marcelo',
  telefone: '(11) 98765-4321',
  email: 'marcelinhojordao07@gmail.com',
  cpf: '123.456.789-00',
  nascimento: '07/04/1996',
  unidade: 'cajamar',
  membroDesde: 'out/2025',
  codigo: 'PD-4417-0982',
  saldo: 1280,
  pendentes: 180,
  aExpirar: 90,
  acumulado: 4680,
  resgates: 12,
}
