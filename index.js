/**
 * Colmeia Bot — Filas 1x1 / 2x2 / 3x3 / 4x4
 * -------------------------------------------------
 * Painéis de fila:
 *  - Comandos: !painel1x1, !painel2x2, !painel3x3, !painel4x4.
 *  - Variante opcional depois do formato: "misto" ou "emu"
 *    (ex.: "!painel1x1 misto", "!painel4x4 emu") — só muda o rótulo.
 *  - Valor opcional depois (ou depois da variante), aceita vários
 *    separados por PONTO pra criar uma aba/painel pra cada um (não
 *    vírgula, porque a vírgula já é usada pro centavo, ex: R$2,00):
 *      "!painel1x1 R$2,00"
 *      "!painel1x1 misto R$2,00.R$4,00"   -> 2 painéis independentes
 *      "!painel4x4 emu 2.4.6"              -> 3 painéis independentes
 *  - Cada painel tem sua própria fila (Gel Normal / Gel Inf) e só fecha
 *    quando atinge a capacidade do formato (1x1=2, 2x2=4, 3x3=6, 4x4=8
 *    jogadores). Hoje o mediador define UM vencedor entre todos os
 *    jogadores da partida (não há separação em "times" na hora de
 *    escolher o vencedor).
 *  1) Fila fecha -> cria TÓPICO PRIVADO "fila-<numero>",
 *     adiciona todos os jogadores, manda embed com Confirmar/Cancelar.
 *  2) Quando todos confirmam:
 *       - some os botões de confirmar/cancelar
 *       - pega o PRIMEIRO mediador da fila de mediadores (veja abaixo)
 *       - manda a "ficha da partida": Jogadores, Mediador, Formato,
 *         Taxa de Inscrição — com botões Regras / QR / Cancelar, e um
 *         menu de seleção com a opção "Finalizar Aposta"
 *       - manda o bloco de Valor + Chave Pix do mediador
 *       - manda o aviso "MUDOU A FORMA DE MOSTRAR A TELA"
 *  3) "Finalizar Aposta" (só cargo mediador) -> select pra escolher o
 *     vencedor -> select "Vencedor por W.O." ou "Vencedor por Vitória"
 *     -> manda a mensagem de partida encerrada, registra a vitória no
 *     ranking do jogador e o ganho do mediador no ranking-adm.
 *  4) Botão "Cancelar" (em qualquer etapa) faz a contagem regressiva,
 *     remove os jogadores do tópico e exclui o tópico.
 *
 * Fila de mediadores (!painelmediador) segue o padrão Entrar/Sair
 * (FIFO). Tudo de mediador (entrar na fila, cadastrar Pix, finalizar,
 * cancelar...) funciona SÓ pra quem tem o cargo configurado com
 * !setcargomediador (ou o CEO, de !setcargoceo). Quem perde o cargo sai
 * da fila sozinho.
 *
 * Cadastro de mediador (!painelpix): autosserviço com validação da
 * chave Pix (e-mail/CPF/CNPJ/telefone/chave aleatória) — se algo
 * estiver errado o bot avisa o motivo. Admins também podem cadastrar
 * manualmente com !addmediador, !removermediador e !listamediadores.
 *
 * Tickets (!painelticket): só abre ticket se tiver suporte na fila de
 * suporte (!painelfilasuporte). Cada ticket vira um tópico PRIVADO só com a
 * pessoa e o suporte da vez (revezamento). Botões: "Resolvido" (suporte) e,
 * em problema de pagamento/reembolso, "Informar Mediador" (nome + quanto ele
 * deve). Usar o ticket de novo com um já aberto esconde o canal do ticket
 * pra pessoa por 1 hora. Suporte (fila, cadastro de Pix, atender) funciona
 * SÓ pra quem tem o cargo do !setcargosuporte (ou o CEO).
 *
 * (Os comandos !addmediadoracesso/!removermediadoracesso/
 * !listamediadoresacesso foram desativados: o acesso de mediador agora é
 * só pelo cargo do !setcargomediador.)
 *
 * Rankings:
 *  - !painelranking      -> vitórias dos jogadores (Meu Perfil / Ranking).
 *  - !painelrankingadm   -> horas na fila + ganhos (R$0,50/fila) dos
 *    mediadores, com top semanal/mensal/total e coroa no 1º lugar.
 *
 * Pix automático (por mediador): cada mediador cadastra a PRÓPRIA API
 * (Mercado Pago) no painel !painelapi (Cadastrar / Gerar nova / Excluir /
 * Minha API). Nas partidas de mediador COM API, o bot mostra o exemplo
 * "PAGAMENTO VIA PIX" embaixo das regras e, quando um jogador manda
 * "pg / pago / paguei / att pago + nome", confere o Pix (valor da fila +
 * taxa, nome do pagador) e mostra: Verificando -> Pix confirmado 🟢
 * (x/y) -> Criando sala. Cada mensagem apaga a anterior. Sem API, o bot
 * não faz nada disso. Dados em pix-apis.json (use Volume no Railway).
 *
 * Análise de tela por Google Meet (!painelmeet) — MODO MANUAL: o botão
 * "Criar link" abre um tópico privado "tela-<usuário>" (1 por pessoa) com o
 * passo a passo pra criar a reunião no Google Meet, o aviso "MUDOU A FORMA
 * DE MOSTRAR A TELA" e, embaixo dele, o botão "Finalizar link" (apaga o
 * tópico). Se ninguém finalizar, o tópico é apagado sozinho em 1 hora.
 * Não precisa de API do Google. (As variáveis GOOGLE_* / MEET_* e o código
 * que criava a reunião automática ficaram no arquivo, mas não são usados.)
 *
 * Requisitos:
 *   npm install discord.js qrcode jimp@0.22
 *
 * Configuração (variáveis de ambiente recomendadas):
 *   DISCORD_TOKEN         -> token do bot
 *   VALOR_APOSTA           -> ex: "R$1,00" (Taxa de Inscrição padrão,
 *                             usada quando o painel é criado sem valor)
 *   ACRESCIMO_MEDIADOR      -> ex: "0.50" (acréscimo pago ao mediador
 *                             sobre o valor da fila; também é o ganho
 *                             registrado no ranking-adm por fila)
 *   REGRAS_URL             -> link pro canal/página de regras
 *   TUTORIAL_URL            -> link pro tutorial de cadastro de Pix
 *   (Cargo de mediador: configure no Discord com !setcargomediador @cargo
 *    e confira com !vercargos — não usa mais variável de ambiente.)
 *   DATA_DIR                -> pasta dos arquivos .json (no Railway, aponte
 *                             pra um Volume, ex.: /data, pra não perder
 *                             painéis e cadastros a cada deploy)
 *   DONO_USER_ID            -> ID de USUÁRIO (não de cargo) que sempre
 *                             tem acesso total de CEO/Mediador, mesmo
 *                             que o cargo dele esteja mal configurado.
 *                             "Acesso de emergência" (vazio = desativado).
 *                             Só existe UM dono fixo.
 *
 * Os dados ficam salvos em arquivos .json na mesma pasta do bot:
 * mediadores.json, ranking.json, ranking-adm.json
 * — não precisa editar código pra isso.
 */

const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionsBitField,
  ChannelType,
  AttachmentBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
} = require('discord.js');
const QRCode = require('qrcode');
const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

// Grava o .json em um arquivo temporário e só depois troca pelo definitivo:
// se o bot cair/reiniciar no meio da gravação, o arquivo antigo continua
// inteiro (antes podia ficar corrompido e o bot "esquecia" tudo).
function escreverJsonAtomico(caminho, dados) {
  const tmp = `${caminho}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(dados, null, 2), 'utf-8');
  fs.renameSync(tmp, caminho);
}

// Pasta onde ficam os arquivos .json (painéis, partidas, cadastros...).
// No Railway, crie um Volume (ex.: montado em /data) e defina
// DATA_DIR=/data — sem isso os arquivos somem a cada novo deploy e os
// painéis já postados deixam de funcionar. Sem DATA_DIR usa a pasta do bot.
const DATA_DIR = process.env.DATA_DIR || __dirname;
try {
  fs.mkdirSync(DATA_DIR, { recursive: true });
} catch (err) {
  console.error('⚠️ Não consegui criar a pasta de dados:', err.message);
}

// ------------------- CONFIG -------------------
const TOKEN = process.env.DISCORD_TOKEN || process.env.TOKEN || 'SEU_TOKEN_AQUI';
const VALOR_APOSTA_PADRAO = process.env.VALOR_APOSTA || 'R$1,00'; // Taxa de Inscrição (valor padrão, usado quando "!painelXxX" é chamado sem valor)

// Converte "R$2,00" -> 2.00 (número). Retorna null se não conseguir entender.
function parseValorBR(texto) {
  if (!texto) return null;
  const limpo = texto.replace(/[^\d,\.]/g, '').replace(',', '.');
  const numero = parseFloat(limpo);
  return isNaN(numero) ? null : numero;
}

// Converte 2.5 -> "R$2,50"
function formatarValorBR(numero) {
  return `R$${numero.toFixed(2).replace('.', ',')}`;
}

// Valor pago ao mediador = valor da fila (de um painel específico) +
// acréscimo. Se o valor não puder ser entendido como número, cai no
// valor padrão + acréscimo.
function calcularValorMediador(valorFila) {
  const valorFilaNumero = parseValorBR(valorFila);
  const base = valorFilaNumero !== null ? valorFilaNumero : (parseValorBR(VALOR_APOSTA_PADRAO) || 0);
  return formatarValorBR(base + ACRESCIMO_MEDIADOR);
}
// Valor pago ao mediador = valor da fila + um acréscimo fixo (calculado
// automaticamente). Configure o acréscimo em ACRESCIMO_MEDIADOR (em
// reais, use ponto: "0.50" = 50 centavos). Esse mesmo valor também é o
// ganho registrado no ranking-adm por fila finalizada.
const ACRESCIMO_MEDIADOR = parseFloat(process.env.ACRESCIMO_MEDIADOR || '0.50');
const NOME_ORG = 'Colmeia';
const COR_AMARELA = 0xF1C40F;

// ---------- FORMATOS DE PAINEL (1x1 / 2x2 / 3x3 / 4x4) ----------
// capacidade = total de jogadores necessários pra fechar a fila (soma
// dos dois lados). Ex.: 2x2 -> 2 jogadores de cada time -> 4 no total.
const FORMATOS = {
  '1x1': { capacidade: 2 },
  '2x2': { capacidade: 4 },
  '3x3': { capacidade: 6 },
  '4x4': { capacidade: 8 },
};

// Variantes aceitas depois do formato, ex: "!painel1x1 misto" ou
// "!painel4x4 emu". Só muda o rótulo mostrado no painel, a mecânica é
// a mesma.
const VARIANTES_VALIDAS = ['misto', 'emu'];

// Sem variante: "1x1 Mobile". Com variante (misto/emu): some o "Mobile"
// e usa o nome escolhido no lugar, ex: "1x1 Misto", "4x4 Emu".
function montarRotuloFormato(formatoChave, variante) {
  if (!variante) return `${formatoChave} Mobile`;
  const nomeVariante = variante.charAt(0).toUpperCase() + variante.slice(1);
  return `${formatoChave} ${nomeVariante}`;
}

// Cada painel postado (!painel1x1, !painel2x2 ...) vira uma instância
// independente aqui dentro, indexada por um ID curto. Isso permite ter
// várias "abas" de valores diferentes ao mesmo tempo (ex.:
// "!painel1x1 R$2,00.R$4,00" cria 2 painéis independentes, um pra
// R$2,00 e outro pra R$4,00), sem misturar jogadores de uma aba com os
// de outra.
//
// Fica salvo em arquivo (paineis-fila.json) pra sobreviver a reinícios
// do bot — sem isso, todo painel já postado "morria" (dava erro "Esse
// painel não existe mais") toda vez que o bot reiniciava.
const CAMINHO_PAINEIS_FILA = path.join(DATA_DIR, 'paineis-fila.json');

function carregarPaineisFila() {
  try {
    const conteudo = fs.readFileSync(CAMINHO_PAINEIS_FILA, 'utf-8');
    return new Map(JSON.parse(conteudo));
  } catch (err) {
    return new Map();
  }
}

function salvarPaineisFila() {
  escreverJsonAtomico(CAMINHO_PAINEIS_FILA, Array.from(painelInstancias.entries()));
}

const painelInstancias = carregarPaineisFila();
let contadorPainel = 0;
function novoIdPainel() {
  contadorPainel += 1;
  return `p${contadorPainel}${Date.now().toString(36).slice(-4)}`;
}

// Se o bot não conhece mais um painel (ex.: o arquivo de dados foi
// perdido num novo deploy), reconstrói ele a partir da própria mensagem
// do painel (título "1x1 Mobile | R$1,00" + ID nos botões) — assim o
// painel antigo continua funcionando e ninguém vê erro.
function restaurarInstanciaPainel(painelId, mensagem) {
  try {
    if (!mensagem) return null;
    const indice = mensagem.components.findIndex((linha) =>
      linha.components.some((botao) => botao.customId && botao.customId.endsWith(`:${painelId}`))
    );
    const embed = mensagem.embeds[indice === -1 ? 0 : indice];
    const titulo = (embed && embed.title) || '';
    const partes = titulo.split(' | ');
    const rotulo = (partes[0] || '').trim();
    const valor = partes.slice(1).join(' | ').trim();
    if (!rotulo || !valor) return null;

    for (const formatoChave of Object.keys(FORMATOS)) {
      for (const variante of [null, 'misto', 'emu']) {
        if (montarRotuloFormato(formatoChave, variante) === rotulo) {
          return criarInstanciaPainel(formatoChave, variante, valor, painelId);
        }
      }
    }
  } catch (err) {
    console.error('⚠️ Não consegui restaurar o painel antigo:', err.message);
  }
  return null;
}

// Define as "filas" (abas de entrada) de um painel:
//  - Padrão (sem variante, ou variante "emu") e sempre no 1x1: as duas
//    filas de sempre, "Gel Normal" e "Gel Inf".
//  - Variante "misto" no 2x2/3x3/4x4: em vez de Gel Normal/Gel Inf,
//    usa N filas "1 Emu", "2 Emu"... (N = capacidade/2 - 1), ou seja
//    2x2 misto = só "1 Emu", 3x3 misto = "1 Emu"/"2 Emu", 4x4 misto =
//    "1 Emu"/"2 Emu"/"3 Emu". Cada fila funciona exatamente como antes:
//    fecha sozinha ao atingir a capacidade do formato.
function definirFilasInstancia(formatoChave, variante) {
  if (formatoChave === '1x1') {
    return [
      { key: 'normal', label: 'Gel Normal', tipo: 'gel' },
      { key: 'inf', label: 'Gel Inf', tipo: 'gel' },
    ];
  }

  if (variante === 'misto') {
    const numFilas = FORMATOS[formatoChave].capacidade / 2 - 1;
    const filas = [];
    for (let i = 1; i <= numFilas; i++) {
      filas.push({ key: `emu${i}`, label: `${i} Emu`, tipo: 'emu' });
    }
    return filas;
  }

  // 2x2/3x3/4x4 sem variante misto: fila única, só Entrar/Sair.
  return [{ key: 'unica', label: 'Jogadores', tipo: 'unica' }];
}

function criarInstanciaPainel(formatoChave, variante, valor, idExistente) {
  const id = idExistente || novoIdPainel();
  const filasDef = definirFilasInstancia(formatoChave, variante);
  const filas = {};
  for (const f of filasDef) filas[f.key] = [];

  const instancia = {
    id,
    formatoChave,
    variante,
    rotuloFormato: montarRotuloFormato(formatoChave, variante),
    // Mínimo pra fechar a fila e confirmar a sala: sempre 2 pessoas,
    // em qualquer formato (1x1/2x2/3x3/4x4) e variante (misto/emu).
    capacidade: 2,
    valor,
    filasDef,
    filas,
  };
  painelInstancias.set(id, instancia);
  salvarPaineisFila();
  return instancia;
}

// ---------- IMAGENS (hospedadas fora do Google Drive, que não expõe
// link direto de imagem) ----------
const IMG_TROFEU = 'https://kommodo.ai/i/JCELExrRiRmbJRlcG49d';
const IMG_COROA_URL = 'https://kommodo.ai/i/CVP9M0WQgcrtuyxTQexJ';
const IMG_BOTAO_RANKING = 'https://kommodo.ai/i/jkzw2KFaoMswTYzSylAU';
const IMG_GELO = 'https://kommodo.ai/i/DRghn4dYxdbsAtbjuOZV';
const IMG_BOTAO_SAIDA = 'https://kommodo.ai/i/N7VRBMdb6o6EDeM9FY4t';

// Emojis customizados dos botões do painel de fila (Gel / Sair).
// O bot sobe as duas imagens abaixo como emojis do servidor sozinho, na
// primeira vez que liga (precisa da permissão "Gerenciar
// Emojis e Figurinhas"). Se você preferir subir manualmente, defina
// EMOJI_GEL / EMOJI_SAIR (formato <:nome:ID>) nas variáveis de ambiente
// que o bot usa elas direto e nem tenta criar as automáticas.
const EMOJI_GEL_IMAGEM_URL = process.env.EMOJI_GEL_IMAGEM_URL || IMG_GELO;
const EMOJI_SAIR_IMAGEM_URL = process.env.EMOJI_SAIR_IMAGEM_URL || IMG_BOTAO_SAIDA;
const EMOJI_FINALIZAR_IMAGEM_URL =
  process.env.EMOJI_FINALIZAR_IMAGEM_URL ||
  'https://drive.google.com/uc?export=view&id=1R_LHVMgxE5P9mNuGpC35tSaRWOofDS70';
const EMOJI_COROA_IMAGEM_URL = process.env.EMOJI_COROA_IMAGEM_URL || IMG_COROA_URL;
const EMOJI_TROFEU_IMAGEM_URL = process.env.EMOJI_TROFEU_IMAGEM_URL || IMG_TROFEU;
const EMOJI_RANKING_IMAGEM_URL = process.env.EMOJI_RANKING_IMAGEM_URL || IMG_BOTAO_RANKING;

let EMOJI_GEL = process.env.EMOJI_GEL || '🧪';
let EMOJI_SAIR = process.env.EMOJI_SAIR || '↪️';
let EMOJI_FINALIZAR = process.env.EMOJI_FINALIZAR || '🏁';
let EMOJI_COROA = process.env.EMOJI_COROA || '👑';
let EMOJI_TROFEU = process.env.EMOJI_TROFEU || '🏆';
let EMOJI_RANKING = process.env.EMOJI_RANKING || '📊';
// Emoji dos botões de fila "N Emu" (variante misto do 2x2/3x3/4x4).
let EMOJI_PC = process.env.EMOJI_PC || '🖥️';
// Emoji da coroa usada no botão "Ranking" dos painéis (diferente da
// coroa que marca o 1º lugar dentro do ranking, essa é EMOJI_COROA).
let EMOJI_COROA_2 = process.env.EMOJI_COROA_2 || '👑';
// Logo da organização (:org_colmeia:), usada como thumbnail (canto
// superior direito) dos painéis de fila e dos painéis de ranking.
let EMOJI_ORG = process.env.EMOJI_ORG || '';
let EMOJI_ORG_URL = process.env.EMOJI_ORG_URL || IMG_TROFEU;
// Emoji do botão QR na ficha da partida.
let EMOJI_QR = process.env.EMOJI_QR || '🔳';
// Emoji/imagem "colmeia_1", usado como thumbnail no lugar da imagem
// quebrada em Meu Perfil e em todos os rankings.
let EMOJI_COLMEIA1 = process.env.EMOJI_COLMEIA1 || '';
let EMOJI_COLMEIA1_URL = process.env.EMOJI_COLMEIA1_URL || IMG_TROFEU;
// Emoji "abelhas" -> usado como thumbnail no card "ID e Senha".
let EMOJI_ABELHAS_URL = process.env.EMOJI_ABELHAS_URL || IMG_TROFEU;
// Emojis usados em Meu Perfil / Ranking-ADM.
let EMOJI_DINDIN = process.env.EMOJI_DINDIN || '💰';
let EMOJI_PROGRESSO = process.env.EMOJI_PROGRESSO || '⏱️';
let EMOJI_MNRAMIO = process.env.EMOJI_MNRAMIO || '📈';
let EMOJI_GIRO = process.env.EMOJI_GIRO || '🔄';
let EMOJI_GIRO_OURO = process.env.EMOJI_GIRO_OURO || '🔄';
// Emoji do botão "Entrar" nos painéis de fila única (2x2/3x3/4x4 sem misto).
let EMOJI_ENTRA = process.env.EMOJI_ENTRA || '➡️';
let EMOJI_COPIAR = process.env.EMOJI_COPIAR || '📋';
let EMOJI_INFO = process.env.EMOJI_INFO || 'ℹ️';

// ---- Config de cargos (persistido em arquivo, editável por comando) ----
// CEO/Mediador/Analista/Suporte podem ser configurados pelo .env OU por
// comando direto no Discord (!setcargoceo, !setcargomediador, etc) —
// o que for configurado por comando tem prioridade e fica salvo em
// arquivo, sem precisar reiniciar o bot nunca mais.
const CAMINHO_CONFIG_CARGOS = path.join(DATA_DIR, 'config-cargos.json');
let CONFIG_CARGOS = {};
try {
  CONFIG_CARGOS = JSON.parse(fs.readFileSync(CAMINHO_CONFIG_CARGOS, 'utf-8'));
} catch (err) {
  CONFIG_CARGOS = {};
}

// Cargo "CEO": tem as mesmas permissões do cargo Mediador em tudo,
// mais acesso total aos comandos do bot (configure o ID do cargo).
let CEO_ROLE_ID = CONFIG_CARGOS.ceoRoleId || process.env.CEO_ROLE_ID || null;

// Dono fixo do bot: esse ID de USUÁRIO (não de cargo) sempre passa em
// qualquer checagem de CEO/Mediador, não importa se o cargo dele no
// servidor está configurado certo ou não. É um "acesso de emergência"
// pra nunca ficar travado por causa de configuração de cargo errada.
// Coloque seu ID de usuário do Discord aqui (ou na variável de
// ambiente DONO_USER_ID) — clique direito no seu perfil, com o Modo
// Desenvolvedor ativado, e "Copiar ID do Usuário".
const DONO_USER_ID = process.env.DONO_USER_ID || null;

// Canal fixo onde os tópicos de partida (fila) são sempre criados,
// não importa em qual canal o botão do painel foi clicado.
// https://discord.com/channels/1541228432879259760/1541242653532750005
const CANAL_FILAS_ID = process.env.CANAL_FILAS_ID || '1541242653532750005';

// Cria (uma vez) os emojis personalizados "colmeia_gel" e "colmeia_sair"
// em cada servidor onde o bot está, a partir das imagens configuradas
// acima, e passa a usá-los nos botões do painel. Se EMOJI_GEL/EMOJI_SAIR
// já foram definidos manualmente por variável de ambiente, não mexe em
// nada.
// Procura, na ordem, um emoji do servidor com um desses nomes (os que
// você já criou manualmente entram primeiro). Se não achar nenhum,
// cria um novo a partir da imagem de referência.
async function buscarOuCriarEmoji(guild, nomesPossiveis, urlImagem, nomeParaCriar) {
  // Sem isso, a cache de emojis pode estar incompleta (principalmente
  // logo depois do bot ligar) e o bot não acha emojis que já existem
  // no servidor, tentando criar duplicado toda vez.
  await guild.emojis.fetch().catch(() => {});

  for (const nome of nomesPossiveis) {
    const encontrado = guild.emojis.cache.find((e) => e.name === nome);
    if (encontrado) return encontrado;
  }
  return guild.emojis.create({ attachment: urlImagem, name: nomeParaCriar });
}

async function garantirEmojisPersonalizados() {
  if (
    process.env.EMOJI_GEL &&
    process.env.EMOJI_SAIR &&
    process.env.EMOJI_FINALIZAR &&
    process.env.EMOJI_COROA &&
    process.env.EMOJI_TROFEU &&
    process.env.EMOJI_RANKING &&
    process.env.EMOJI_PC &&
    process.env.EMOJI_COROA_2 &&
    process.env.EMOJI_ORG
  )
    return;

  for (const guild of client.guilds.cache.values()) {
    const tentar = async (label, fn) => {
      try {
        await fn();
      } catch (err) {
        console.error(
          `⚠️ Não consegui preparar o emoji "${label}" no servidor "${guild.name}" (verifique a permissão "Gerenciar Emojis e Figurinhas", se o nome do emoji existe no servidor, e se a imagem de fallback está acessível publicamente):`,
          err.message
        );
      }
    };

    await tentar('gelo', async () => {
      if (process.env.EMOJI_GEL) return;
      const emoji = await buscarOuCriarEmoji(guild, ['gelo', 'colmeia_gel'], EMOJI_GEL_IMAGEM_URL, 'gelo');
      EMOJI_GEL = `<:${emoji.name}:${emoji.id}>`;
    });

    await tentar('saida', async () => {
      if (process.env.EMOJI_SAIR) return;
      const emoji = await buscarOuCriarEmoji(guild, ['saida', 'colmeia_sair'], EMOJI_SAIR_IMAGEM_URL, 'saida');
      EMOJI_SAIR = `<:${emoji.name}:${emoji.id}>`;
    });

    await tentar('finalizar', async () => {
      if (process.env.EMOJI_FINALIZAR) return;
      const emoji = await buscarOuCriarEmoji(guild, ['finalizar', 'colmeia_finalizar'], EMOJI_FINALIZAR_IMAGEM_URL, 'finalizar');
      EMOJI_FINALIZAR = `<:${emoji.name}:${emoji.id}>`;
    });

    await tentar('coroa_1', async () => {
      if (process.env.EMOJI_COROA) return;
      const emoji = await buscarOuCriarEmoji(guild, ['coroa_1', 'coroa', 'colmeia_coroa'], EMOJI_COROA_IMAGEM_URL, 'coroa_1');
      EMOJI_COROA = `<:${emoji.name}:${emoji.id}>`;
    });

    await tentar('trofeus', async () => {
      if (process.env.EMOJI_TROFEU) return;
      const emoji = await buscarOuCriarEmoji(guild, ['trofeus', 'trofeu', 'colmeia_trofeu'], EMOJI_TROFEU_IMAGEM_URL, 'trofeus');
      EMOJI_TROFEU = `<:${emoji.name}:${emoji.id}>`;
    });

    await tentar('ranking', async () => {
      if (process.env.EMOJI_RANKING) return;
      const emoji = await buscarOuCriarEmoji(guild, ['ranking', 'console', 'colmeia_ranking'], EMOJI_RANKING_IMAGEM_URL, 'ranking');
      EMOJI_RANKING = `<:${emoji.name}:${emoji.id}>`;
    });

    await tentar('pc', async () => {
      if (process.env.EMOJI_PC) return;
      const emoji = await buscarOuCriarEmoji(guild, ['pc', 'colmeia_pc'], EMOJI_TROFEU_IMAGEM_URL, 'pc');
      EMOJI_PC = `<:${emoji.name}:${emoji.id}>`;
    });

    await tentar('coroa_2', async () => {
      if (process.env.EMOJI_COROA_2) return;
      const emoji = await buscarOuCriarEmoji(guild, ['coroa_2', 'colmeia_coroa_2'], EMOJI_COROA_IMAGEM_URL, 'coroa_2');
      EMOJI_COROA_2 = `<:${emoji.name}:${emoji.id}>`;
    });

    await tentar('org_colmeia', async () => {
      if (process.env.EMOJI_ORG) return;
      const emoji = await buscarOuCriarEmoji(guild, ['org_colmeia', 'colmeia_org'], EMOJI_TROFEU_IMAGEM_URL, 'org_colmeia');
      EMOJI_ORG = `<:${emoji.name}:${emoji.id}>`;
      EMOJI_ORG_URL = emoji.imageURL({ extension: 'png', size: 128 });
    });

    await tentar('qr', async () => {
      if (process.env.EMOJI_QR) return;
      const emoji = await buscarOuCriarEmoji(guild, ['qr', 'colmeia_qr'], EMOJI_TROFEU_IMAGEM_URL, 'qr');
      EMOJI_QR = `<:${emoji.name}:${emoji.id}>`;
    });

    await tentar('colmeia_1', async () => {
      if (process.env.EMOJI_COLMEIA1) return;
      const emoji = await buscarOuCriarEmoji(guild, ['colmeia_1', 'colmeia1'], EMOJI_TROFEU_IMAGEM_URL, 'colmeia_1');
      EMOJI_COLMEIA1 = `<:${emoji.name}:${emoji.id}>`;
      EMOJI_COLMEIA1_URL = emoji.imageURL({ extension: 'png', size: 128 });
    });

    await tentar('abelhas', async () => {
      if (process.env.EMOJI_ABELHAS_URL) return;
      // Procura o emoji "abelhas" que já existe no servidor (não cria
      // um novo se já tiver um com esse nome).
      const emoji = await buscarOuCriarEmoji(guild, ['abelhas', 'abelha', 'colmeia_abelhas'], EMOJI_TROFEU_IMAGEM_URL, 'abelhas');
      EMOJI_ABELHAS_URL = emoji.imageURL({ extension: 'png', size: 256 });
    });

    await tentar('dindin', async () => {
      if (process.env.EMOJI_DINDIN) return;
      const emoji = await buscarOuCriarEmoji(guild, ['dindin', 'colmeia_dindin'], EMOJI_TROFEU_IMAGEM_URL, 'dindin');
      EMOJI_DINDIN = `<:${emoji.name}:${emoji.id}>`;
    });

    await tentar('progresso', async () => {
      if (process.env.EMOJI_PROGRESSO) return;
      const emoji = await buscarOuCriarEmoji(guild, ['progresso', 'colmeia_progresso'], EMOJI_TROFEU_IMAGEM_URL, 'progresso');
      EMOJI_PROGRESSO = `<:${emoji.name}:${emoji.id}>`;
    });

    await tentar('mnramio', async () => {
      if (process.env.EMOJI_MNRAMIO) return;
      const emoji = await buscarOuCriarEmoji(guild, ['mnramio', 'colmeia_mnramio'], EMOJI_TROFEU_IMAGEM_URL, 'mnramio');
      EMOJI_MNRAMIO = `<:${emoji.name}:${emoji.id}>`;
    });

    await tentar('giro', async () => {
      if (process.env.EMOJI_GIRO) return;
      const emoji = await buscarOuCriarEmoji(guild, ['giro', 'colmeia_giro'], EMOJI_TROFEU_IMAGEM_URL, 'giro');
      EMOJI_GIRO = `<:${emoji.name}:${emoji.id}>`;
    });

    await tentar('giro_ouro', async () => {
      if (process.env.EMOJI_GIRO_OURO) return;
      const emoji = await buscarOuCriarEmoji(guild, ['giro_ouro', 'colmeia_giro_ouro'], EMOJI_TROFEU_IMAGEM_URL, 'giro_ouro');
      EMOJI_GIRO_OURO = `<:${emoji.name}:${emoji.id}>`;
    });

    await tentar('ggppss', async () => {
      if (process.env.EMOJI_ENTRA) return;
      const emoji = await buscarOuCriarEmoji(guild, ['ggppss', 'colmeia_ggppss'], EMOJI_TROFEU_IMAGEM_URL, 'ggppss');
      EMOJI_ENTRA = `<:${emoji.name}:${emoji.id}>`;
    });

    await tentar('copiar', async () => {
      if (process.env.EMOJI_COPIAR) return;
      const emoji = await buscarOuCriarEmoji(guild, ['copiar', 'colmeia_copiar'], EMOJI_TROFEU_IMAGEM_URL, 'copiar');
      EMOJI_COPIAR = `<:${emoji.name}:${emoji.id}>`;
    });

    await tentar('informacoes', async () => {
      if (process.env.EMOJI_INFO) return;
      const emoji = await buscarOuCriarEmoji(guild, ['informaes', 'informações', 'informacoes', 'colmeia_info'], EMOJI_TROFEU_IMAGEM_URL, 'informacoes');
      EMOJI_INFO = `<:${emoji.name}:${emoji.id}>`;
    });
  }
}

// Salva um cargo configurado (chave: 'ceoRoleId', 'mediadorRoleId',
// 'analistaRoleId' ou 'suporteRoleId') no arquivo, pra sobreviver a
// reinícios do bot sem precisar mexer no .env.
function salvarConfigCargo(chave, valor) {
  CONFIG_CARGOS[chave] = valor;
  escreverJsonAtomico(CAMINHO_CONFIG_CARGOS, CONFIG_CARGOS);
}

// Tira o ID de um cargo mencionado na mensagem (@Cargo) ou, se não tiver
// menção, o primeiro número longo que aparecer no texto (ID colado à mão).
function extrairIdDeCargo(message) {
  const cargoMencionado = message.mentions.roles.first();
  if (cargoMencionado) return cargoMencionado.id;
  const match = message.content.match(/\d{15,25}/);
  return match ? match[0] : null;
}
const TUTORIAL_URL = process.env.TUTORIAL_URL || 'https://discord.com';
// Faltava essa declaração — sem ela, todo botão "Regras" (ficha da
// partida, cadastro de Pix) quebrava com "REGRAS_URL is not defined".
const REGRAS_URL = process.env.REGRAS_URL || 'https://discord.com/channels/1541228432879259760/1541259460884963361';
const COR_DOURADA = 0xD4AF37;
// Cargo de Mediador: vem SÓ do comando !setcargomediador (nada de .env).
let MEDIADOR_ROLE_ID = CONFIG_CARGOS.mediadorRoleId || null;
// Cargo dado automaticamente pra quem entra no servidor.
const MEMBRO_ROLE_ID = process.env.MEMBRO_ROLE_ID || null;
// Cargo de Suporte: vem SÓ do comando !setcargosuporte (nada de .env).
let SUPORTE_ROLE_ID = CONFIG_CARGOS.suporteRoleId || null;
// Canal onde o bot avisa quando um ticket de suporte cai em "Outros"
// (fica um suporte precisando entrar na fila pra atender).
// https://discord.com/channels/1541228432879259760/1541248202228113479
const CANAL_AVISO_SUPORTE_ID = process.env.CANAL_AVISO_SUPORTE_ID || '1541248202228113479';

// Chave Pix padrão, usada se o mediador sorteado ainda não se cadastrou.
const PIX_PADRAO = process.env.CHAVE_PIX_PADRAO || 'colmeia.org@gmail.com';

// ---- Validação da chave Pix ----
function cnpjValido(d) {
  if (!/^\d{14}$/.test(d) || /^(\d)\1{13}$/.test(d)) return false;
  const digito = (base) => {
    const pesos = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let soma = 0;
    for (let i = 0; i < base.length; i++) soma += Number(base[i]) * pesos[i];
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  return digito(d.slice(0, 12)) === Number(d[12]) && digito(d.slice(0, 13)) === Number(d[13]);
}

// Telefone brasileiro (com ou sem +55) -> "+55DDNÚMERO", ou null se inválido.
function telefonePixNormalizado(digitos) {
  let nacional = digitos;
  if (digitos.length >= 12 && digitos.startsWith('55')) nacional = digitos.slice(2);
  if (!/^\d{10,11}$/.test(nacional)) return null;
  const ddd = Number(nacional.slice(0, 2));
  if (ddd < 11 || ddd > 99) return null;
  if (nacional.length === 11 && nacional[2] !== '9') return null;
  return `+55${nacional}`;
}

// Descobre o tipo da chave Pix, confere se é válida e devolve ela já
// padronizada. Retorno: { tipo, chave } se estiver certa, ou { erro }.
function analisarChavePix(entrada) {
  const bruto = (entrada || '').trim();
  if (!bruto) return { erro: 'Você precisa informar uma chave Pix.' };
  const ajuda = 'Use um **CPF**, **CNPJ**, **telefone** (com DDD), **e-mail @gmail.com** ou **chave aleatória**.';

  // E-mail: só Gmail completo (nome@gmail.com), como sempre foi.
  if (bruto.includes('@')) {
    if (!/^[^\s@]+@gmail\.com$/i.test(bruto)) {
      return { erro: 'Esse e-mail não é válido. Só aceitamos e-mails completos terminando em **@gmail.com** (ex: nome@gmail.com).' };
    }
    return { tipo: 'E-mail', chave: bruto.toLowerCase() };
  }

  // Chave aleatória (UUID).
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bruto)) {
    return { tipo: 'Chave aleatória', chave: bruto.toLowerCase() };
  }

  // Números (aceita pontos, traços, barras, espaços, parênteses e +).
  const semFormatacao = bruto.replace(/[\s.\-\/()]/g, '');
  if (!/^\+?\d+$/.test(semFormatacao)) return { erro: `Essa chave Pix não é válida. ${ajuda}` };
  const digitos = semFormatacao.replace('+', '');
  const escritoComoTelefone = bruto.startsWith('+') || /[()]/.test(bruto);

  if (escritoComoTelefone) {
    const tel = telefonePixNormalizado(digitos);
    return tel ? { tipo: 'Telefone', chave: tel } : { erro: 'Esse telefone não é válido. Informe com DDD (ex: +5511912345678).' };
  }

  if (digitos.length === 11) {
    if (cpfValido(digitos)) return { tipo: 'CPF', chave: digitos };
    const tel = telefonePixNormalizado(digitos);
    if (tel) return { tipo: 'Telefone', chave: tel };
    return { erro: 'Esse CPF/telefone não é válido. Confira os números.' };
  }

  if (digitos.length === 14) {
    return cnpjValido(digitos) ? { tipo: 'CNPJ', chave: digitos } : { erro: 'Esse CNPJ não é válido. Confira os números.' };
  }

  if ([10, 12, 13].includes(digitos.length)) {
    const tel = telefonePixNormalizado(digitos);
    if (tel) return { tipo: 'Telefone', chave: tel };
  }

  return { erro: `Essa chave Pix não é válida. ${ajuda}` };
}

// Confere a chave Pix (e o nome/QR, se informados) antes de salvar o
// cadastro. Retorna null se estiver tudo certo, ou uma mensagem de erro
// explicando o que deu errado.
function validarCadastroMediador(chave, nome, qrcodeUrl) {
  const analise = analisarChavePix(chave);
  if (analise.erro) return analise.erro;

  if (nome && nome.trim().length > 60) return 'O nome pode ter no máximo 60 caracteres.';

  if (qrcodeUrl && qrcodeUrl.trim()) {
    const link = qrcodeUrl.trim();
    if (link.length > 500 || !/^https?:\/\/[^\s]+$/i.test(link)) {
      return 'O link do QR Code precisa começar com **http://** ou **https://** (ou deixe em branco pra gerar automático).';
    }
  }

  return null;
}

// ---- Cadastro de mediadores (persistido em arquivo) ----
// Cada mediador cadastra a própria chave sozinho, pelo painel de botões
// "Cadastrar Pix" (abre um formulário). Formato salvo por mediador:
//   { chave: '...', nome: '...' | null, qrcodeUrl: '...' | null }
const CAMINHO_DADOS_MEDIADORES = path.join(DATA_DIR, 'mediadores.json');

function carregarMediadorPix() {
  try {
    const conteudo = fs.readFileSync(CAMINHO_DADOS_MEDIADORES, 'utf-8');
    return JSON.parse(conteudo);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      // existe mas não dá pra ler: guarda uma cópia antes de qualquer
      // novo cadastro sobrescrever, pra não perder os Pix cadastrados.
      try {
        fs.copyFileSync(CAMINHO_DADOS_MEDIADORES, `${CAMINHO_DADOS_MEDIADORES}.corrompido-${Date.now()}`);
      } catch (e) {}
      console.error('⚠️ mediadores.json ilegível — guardei uma cópia (.corrompido-...):', err.message);
    }
    return {}; // arquivo ainda não existe ou está vazio
  }
}

function salvarMediadorPix(mapa) {
  escreverJsonAtomico(CAMINHO_DADOS_MEDIADORES, mapa);
}

let MEDIADOR_PIX = carregarMediadorPix();

// ---- Lista de "mediadores extras" (persistido em arquivo) ----
// Além de quem tem o cargo MEDIADOR_ROLE_ID, dá pra dar acesso de
// Mediador (Cancelar, Finalizar Aposta, Escolher Vencedor, etc.) pra
// pessoas específicas direto pelo Discord, com !addmediadoracesso e
// !removermediadoracesso — sem precisar mexer em cargo nem no .env.
// Formato salvo: array de IDs de usuário. (Só existe UM dono/CEO fixo,
// configurado em DONO_USER_ID no .env — isso aqui é só pra mediador.)
const CAMINHO_MEDIADORES_EXTRAS = path.join(DATA_DIR, 'mediadores-extras.json');

function carregarMediadoresExtras() {
  try {
    const conteudo = fs.readFileSync(CAMINHO_MEDIADORES_EXTRAS, 'utf-8');
    return JSON.parse(conteudo);
  } catch (err) {
    return []; // arquivo ainda não existe ou está vazio
  }
}

function salvarMediadoresExtras(lista) {
  escreverJsonAtomico(CAMINHO_MEDIADORES_EXTRAS, lista);
}

let MEDIADORES_EXTRAS = carregarMediadoresExtras();

// ---------- BLACKLIST (IDs de Free Fire banidos) ----------
const CAMINHO_BLACKLIST = path.join(DATA_DIR, 'blacklist.json');

function carregarBlacklist() {
  try {
    return JSON.parse(fs.readFileSync(CAMINHO_BLACKLIST, 'utf-8'));
  } catch (err) {
    return {}; // { "123456789": { motivo: "...", ts: 123 } }
  }
}
function salvarBlacklist(mapa) {
  escreverJsonAtomico(CAMINHO_BLACKLIST, mapa);
}
let BLACKLIST = carregarBlacklist();

// Pessoa que é marcada quando alguém abre um tópico de "Receber
// Pagamento" (você, no caso). Se não configurar, marca o cargo CEO.
const CEO_USER_ID = process.env.CEO_USER_ID || null;

// ---- Ranking de vitórias (persistido em arquivo) ----
// { userId: quantidadeDeVitorias }
const CAMINHO_DADOS_RANKING = path.join(DATA_DIR, 'ranking.json');

function carregarRanking() {
  try {
    const conteudo = fs.readFileSync(CAMINHO_DADOS_RANKING, 'utf-8');
    return JSON.parse(conteudo);
  } catch (err) {
    return {};
  }
}

function salvarRanking(mapa) {
  escreverJsonAtomico(CAMINHO_DADOS_RANKING, mapa);
}

let RANKING_VITORIAS = carregarRanking();

function registrarVitoria(userId) {
  RANKING_VITORIAS[userId] = (RANKING_VITORIAS[userId] || 0) + 1;
  salvarRanking(RANKING_VITORIAS);
}

function removerVitoria(userId) {
  if (!RANKING_VITORIAS[userId]) return;
  RANKING_VITORIAS[userId] -= 1;
  if (RANKING_VITORIAS[userId] <= 0) delete RANKING_VITORIAS[userId];
  salvarRanking(RANKING_VITORIAS);
}

// Define quem ganhou a rodada SEM contar a vitória duas vezes: se o
// mediador começou a finalizar, escolheu um vencedor e depois foi pra
// revanche (ou escolheu outro), a vitória anterior é desfeita antes.
function definirVitoriaDaPartida(partida, novoVencedorId) {
  if (partida.vitoriaRegistradaDe === novoVencedorId) return;
  if (partida.vitoriaRegistradaDe) removerVitoria(partida.vitoriaRegistradaDe);
  registrarVitoria(novoVencedorId);
  partida.vitoriaRegistradaDe = novoVencedorId;
}

// ---- Ranking-adm: horas na fila de mediador + ganhos (R$0,50/fila) ----
// { userId: { segundos: N, entradaTs: N|undefined, ganhos: [{ts, valor}] } }
const CAMINHO_DADOS_ADM = path.join(DATA_DIR, 'ranking-adm.json');

function carregarRankingAdm() {
  try {
    return JSON.parse(fs.readFileSync(CAMINHO_DADOS_ADM, 'utf-8'));
  } catch (err) {
    return {};
  }
}
function salvarRankingAdm(mapa) {
  escreverJsonAtomico(CAMINHO_DADOS_ADM, mapa);
}
let DADOS_ADM = carregarRankingAdm();

function pegarDadosAdm(userId) {
  if (!DADOS_ADM[userId]) DADOS_ADM[userId] = { segundos: 0, ganhos: [] };
  return DADOS_ADM[userId];
}
function iniciarSessaoAdm(userId) {
  const dados = pegarDadosAdm(userId);
  dados.entradaTs = Date.now();
  salvarRankingAdm(DADOS_ADM);
}
function encerrarSessaoAdm(userId) {
  const dados = pegarDadosAdm(userId);
  if (dados.entradaTs) {
    dados.segundos += Math.floor((Date.now() - dados.entradaTs) / 1000);
    delete dados.entradaTs;
    salvarRankingAdm(DADOS_ADM);
  }
}
function registrarGanhoAdm(userId, valor) {
  const dados = pegarDadosAdm(userId);
  dados.ganhos.push({ ts: Date.now(), valor });
  salvarRankingAdm(DADOS_ADM);
}

// ---------- RANKING/DADOS DE SUPORTE (mesmo padrão do analista) ----------
const CAMINHO_DADOS_SUPORTE = path.join(DATA_DIR, 'ranking-suporte.json');

function carregarRankingSuporte() {
  try {
    return JSON.parse(fs.readFileSync(CAMINHO_DADOS_SUPORTE, 'utf-8'));
  } catch (err) {
    return {};
  }
}
function salvarRankingSuporte(mapa) {
  escreverJsonAtomico(CAMINHO_DADOS_SUPORTE, mapa);
}
let DADOS_SUPORTE = carregarRankingSuporte();

function pegarDadosSuporte(userId) {
  if (!DADOS_SUPORTE[userId]) DADOS_SUPORTE[userId] = { segundos: 0, atendimentos: 0, ganhos: [] };
  return DADOS_SUPORTE[userId];
}
function iniciarSessaoSuporte(userId) {
  const dados = pegarDadosSuporte(userId);
  dados.entradaTs = Date.now();
  salvarRankingSuporte(DADOS_SUPORTE);
}
function encerrarSessaoSuporte(userId) {
  const dados = pegarDadosSuporte(userId);
  if (dados.entradaTs) {
    dados.segundos += Math.floor((Date.now() - dados.entradaTs) / 1000);
    delete dados.entradaTs;
    salvarRankingSuporte(DADOS_SUPORTE);
  }
}
function registrarAtendimentoSuporte(userId) {
  const dados = pegarDadosSuporte(userId);
  dados.atendimentos += 1;
  salvarRankingSuporte(DADOS_SUPORTE);
}

// ---------- CADASTRO PIX DO SUPORTE (mesmo padrão do analista) ----------
const CAMINHO_SUPORTE_PIX = path.join(DATA_DIR, 'suporte-pix.json');

function carregarSuportePix() {
  try {
    return JSON.parse(fs.readFileSync(CAMINHO_SUPORTE_PIX, 'utf-8'));
  } catch (err) {
    return {};
  }
}
function salvarSuportePix(mapa) {
  escreverJsonAtomico(CAMINHO_SUPORTE_PIX, mapa);
}
let SUPORTE_PIX = carregarSuportePix();

// Suporte (fila, cadastro de Pix, atender/resolver ticket) só vale pra quem
// tem o cargo configurado com !setcargosuporte (ou o cargo CEO, de
// !setcargoceo). Tirou o cargo, perdeu o acesso.
async function membroPodeSuportar(member, guild) {
  if (!member) return false;
  if (CONFIG_CARGOS.suporteRoleId && (await membroTemCargo(member, CONFIG_CARGOS.suporteRoleId, guild))) return true;
  if (CONFIG_CARGOS.ceoRoleId && (await membroTemCargo(member, CONFIG_CARGOS.ceoRoleId, guild))) return true;
  return false;
}

async function usuarioPodeSuportar(interaction) {
  return membroPodeSuportar(interaction.member, interaction.guild);
}

// Soma os ganhos de uma lista [{ts, valor}] a partir de uma data (ms).
function somarGanhosDesde(lista, desdeTs) {
  return lista.filter((g) => g.ts >= desdeTs).reduce((soma, g) => soma + g.valor, 0);
}
function formatarHoras(segundos) {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  return `${h}h${String(m).padStart(2, '0')}min`;
}
function segundosAcumulados(dados) {
  const emAndamento = dados.entradaTs ? Math.floor((Date.now() - dados.entradaTs) / 1000) : 0;
  return dados.segundos + emAndamento;
}

// Links do aviso "mudou a forma de mostrar a tela"
const LINK_ANDROID = 'https://play.google.com/store/apps/details?id=com.google.android.apps.tachyon';
const LINK_IOS = 'https://apps.apple.com/br/app/google-meet/id1096918571';
const LINK_WINDOWS = 'https://meet.google.com/home?authuser=0';
// ------------------------------------------------

// Controla quais números de tópico já foram usados, pra não repetir.
const numerosUsados = new Set();
// Guarda o próximo número da sequência, enquanto houver pelo menos uma
// fila ativa. Quando todas as filas terminam (partidas.size === 0), a
// sequência reinicia com um número aleatório novo.
let proximoNumeroSequencial = null;

function gerarNumeroFilaAleatorio() {
  // Sem nenhuma fila ativa agora -> começa uma sequência nova a partir
  // de um número aleatório.
  if (partidas.size === 0 || proximoNumeroSequencial === null) {
    let numero;
    do {
      numero = Math.floor(Math.random() * 999999) + 1;
    } while (numerosUsados.has(numero));
    numerosUsados.add(numero);
    proximoNumeroSequencial = numero + 1;
    return numero;
  }

  // Já tem fila(s) ativa(s) -> continua a sequência em ordem (fica bem
  // mais fácil de acompanhar quando pega muitas filas seguidas).
  let numero = proximoNumeroSequencial;
  while (numerosUsados.has(numero)) numero++;
  numerosUsados.add(numero);
  proximoNumeroSequencial = numero + 1;
  return numero;
}

// Estado das partidas em confirmação/ficha, indexado pelo ID do tópico.
// { jogadores: [userId,...], confirmados: Set, nomeFila, rotuloFormato,
//   valor, mediadorId, vencedorId, cancelando: bool }
//
// Fica salvo em arquivo (partidas.json) pra sobreviver a reinícios do
// bot — sem isso, se o bot reiniciasse com uma partida em andamento
// (aguardando confirmação, sala, ou vencedor), essa partida "sumia" e
// as opções paravam de funcionar no meio do processo.
const CAMINHO_PARTIDAS = path.join(DATA_DIR, 'partidas.json');

function carregarPartidas() {
  try {
    const conteudo = fs.readFileSync(CAMINHO_PARTIDAS, 'utf-8');
    const entradas = JSON.parse(conteudo);
    return new Map(
      entradas.map(([threadId, partida]) => [threadId, { ...partida, confirmados: new Set(partida.confirmados || []) }])
    );
  } catch (err) {
    return new Map();
  }
}

function salvarPartidas() {
  const entradas = Array.from(partidas.entries()).map(([threadId, partida]) => {
    // "salaMessage" e "mensagensConfirmacao" são referências vivas de
    // mensagem do Discord.js — não dá (nem precisa) salvar isso em
    // arquivo, só os dados puros.
    const { salaMessage, mensagensConfirmacao, ...dadosSalvaveis } = partida;
    return [threadId, { ...dadosSalvaveis, confirmados: Array.from(partida.confirmados) }];
  });
  escreverJsonAtomico(CAMINHO_PARTIDAS, entradas);
}

const partidas = carregarPartidas();

// Repovoa os números de fila já em uso (importante depois de reiniciar
// o bot com partidas ainda ativas — sem isso, um número já usado por
// uma partida em andamento podia ser sorteado de novo pra uma nova).
for (const partida of partidas.values()) {
  if (partida.numeroFila) numerosUsados.add(partida.numeroFila);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers, // necessário pra sortear o mediador pelo cargo
    GatewayIntentBits.GuildPresences, // necessário pra detectar quando o mediador fecha o Discord (fica offline)
    GatewayIntentBits.GuildMessageReactions, // necessário pra apagar reações colocadas nos painéis
  ],
});

// ---------- SEM REAÇÕES NOS PAINÉIS ----------
// Painéis do bot (mensagens do bot com botões: filas, Gel Normal/Gel Inf etc.)
// não aceitam emoji: qualquer reação colocada é apagada na hora. Usa o evento
// "raw" pra funcionar também em painéis antigos que não estão no cache.
// Precisa da permissão "Gerenciar Mensagens" (o bot já usa).
const cachePainelSemReacao = new Map();
client.on('raw', async (pacote) => {
  try {
    if (!pacote || pacote.t !== 'MESSAGE_REACTION_ADD') return;
    const d = pacote.d;
    if (!d || !d.guild_id || !client.user || d.user_id === client.user.id) return;

    let mensagem = null;
    let ehPainel = cachePainelSemReacao.get(d.message_id);
    if (ehPainel === undefined) {
      const canal = client.channels.cache.get(d.channel_id) || (await client.channels.fetch(d.channel_id).catch(() => null));
      if (!canal || !canal.messages) return;
      mensagem = await canal.messages.fetch(d.message_id).catch(() => null);
      if (!mensagem) return;
      ehPainel = mensagem.author.id === client.user.id && mensagem.components.length > 0;
      if (cachePainelSemReacao.size > 500) cachePainelSemReacao.clear();
      cachePainelSemReacao.set(d.message_id, ehPainel);
    }
    if (!ehPainel) return;

    if (!mensagem) {
      const canal = client.channels.cache.get(d.channel_id) || (await client.channels.fetch(d.channel_id).catch(() => null));
      mensagem = canal && canal.messages ? await canal.messages.fetch(d.message_id).catch(() => null) : null;
    }
    if (mensagem) await mensagem.reactions.removeAll().catch(() => {});
  } catch (err) {
    console.error('⚠️ Erro ao apagar reação do painel:', err.message);
  }
});

// ---------- PAINEL PRINCIPAL (fila de entrada) ----------

function montarEmbedPainel(instancia) {
  const embed = new EmbedBuilder()
    .setColor(COR_AMARELA)
    .setAuthor({ name: NOME_ORG })
    .setTitle(`${instancia.rotuloFormato} | ${instancia.valor}`)
    .setThumbnail(EMOJI_ORG_URL);

  for (const f of instancia.filasDef) {
    embed.addFields({
      name: `${f.label}:`,
      value: instancia.filas[f.key].length
        ? instancia.filas[f.key].map((id) => `<@${id}>`).join('\n')
        : 'Nenhum jogador na fila.',
    });
  }

  return embed;
}

function montarBotoesPainel(instancia) {
  const botoes = instancia.filasDef.map((f) => {
    if (f.tipo === 'unica') {
      return new ButtonBuilder()
        .setCustomId(`fila_${f.key}:${instancia.id}`)
        .setLabel('Entrar')
        .setEmoji(EMOJI_ENTRA)
        .setStyle(ButtonStyle.Success);
    }
    return new ButtonBuilder()
      .setCustomId(`fila_${f.key}:${instancia.id}`)
      .setLabel(f.label)
      .setEmoji(f.tipo === 'emu' ? EMOJI_PC : EMOJI_GEL)
      .setStyle(ButtonStyle.Secondary);
  });

  botoes.push(
    new ButtonBuilder().setCustomId(`fila_sair:${instancia.id}`).setLabel('Sair').setEmoji(EMOJI_SAIR).setStyle(ButtonStyle.Danger)
  );

  return new ActionRowBuilder().addComponents(...botoes);
}

async function atualizarPainel(interaction, instancia) {
  const mensagem = interaction.message;
  const linhasAtuais = mensagem.components;

  // Acha em qual posição (embed + linha de botões) esse painel está
  // dentro da mensagem — necessário porque, quando o admin posta vários
  // valores de uma vez, todos os painéis ficam juntos na MESMA mensagem
  // (pra evitar o Discord esconder o nome/foto do bot em mensagens seguidas).
  const indice = linhasAtuais.findIndex((linha) =>
    linha.components.some((botao) => botao.customId && botao.customId.endsWith(`:${instancia.id}`))
  );

  if (indice === -1) {
    return interaction.update({
      embeds: [montarEmbedPainel(instancia)],
      components: [montarBotoesPainel(instancia)],
    });
  }

  const novosEmbeds = mensagem.embeds.map((e) => EmbedBuilder.from(e));
  const novosComponents = linhasAtuais.map((linha) => ActionRowBuilder.from(linha));

  novosEmbeds[indice] = montarEmbedPainel(instancia);
  novosComponents[indice] = montarBotoesPainel(instancia);

  await interaction.update({ embeds: novosEmbeds, components: novosComponents });
}

// ---------- EMBED DE CONFIRMAÇÃO (dentro do tópico) ----------

function montarEmbedConfirmacao(partida) {
  const confirmados = [...partida.confirmados].map((id) => `<@${id}>`);
  return new EmbedBuilder()
    .setColor(COR_AMARELA)
    .setAuthor({ name: NOME_ORG })
    .setTitle(`${partida.rotuloFormato} - ${partida.nomeFila} | ${partida.valor}`)
    .addFields({
      name: 'Confirmados:',
      value: confirmados.length ? confirmados.join('\n') : 'Ninguém confirmou ainda.',
    });
}

function montarBotoesConfirmacao() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('partida_confirmar').setLabel('Confirmar').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('partida_cancelar').setLabel('Cancelar').setStyle(ButtonStyle.Danger)
  );
}

// ---------- FICHA DA PARTIDA (após confirmação, com mediador) ----------

function montarEmbedFicha(partida) {
  const metade = partida.jogadores.length / 2;
  const timeA = partida.jogadores.slice(0, metade).map((id) => `<@${id}>`).join(' e ');
  const timeB = partida.jogadores.slice(metade).map((id) => `<@${id}>`).join(' e ');

  return new EmbedBuilder()
    .setColor(COR_AMARELA)
    .setAuthor({ name: NOME_ORG })
    .setTitle(`${partida.rotuloFormato} - ${partida.nomeFila} | ${partida.valor}`)
    .addFields(
      { name: 'Jogadores:', value: `${timeA} vs ${timeB}` },
      { name: 'Mediador:', value: partida.mediadorId ? `<@${partida.mediadorId}>` : 'Nenhum mediador disponível no momento.' },
      { name: 'Formato:', value: partida.rotuloFormato },
      { name: 'Taxa de Inscrição:', value: partida.valor }
    );
}

function montarBotoesFicha() {
  const botoes = [];

  // botão de link é o único que pode travar por causa de URL inválida
  // — isolado num try/catch pra nunca derrubar QR/Cancelar por causa dele
  try {
    botoes.push(new ButtonBuilder().setLabel('Regras').setEmoji('📚').setStyle(ButtonStyle.Link).setURL(REGRAS_URL));
  } catch (err) {
    console.error('⚠️ Não consegui montar o botão de Regras (URL inválida?):', err.message);
  }

  botoes.push(
    new ButtonBuilder().setCustomId('ficha_qr').setLabel('QR').setEmoji(EMOJI_QR).setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('ficha_cancelar').setLabel('Cancelar').setEmoji(EMOJI_SAIR).setStyle(ButtonStyle.Danger)
  );

  return new ActionRowBuilder().addComponents(...botoes);
}

// ---------- FINALIZAR APOSTA / DEFINIR VENCEDOR (só mediador) ----------

// Checagem de cargo à prova de falhas: o Discord às vezes entrega um
// "member" parcial (ex.: cache vazio, ou vindo de uma interação sem o
// member completo carregado). Nesses casos, member.roles.cache pode
// não existir ou não ter todos os cargos. Esse helper tenta de várias
// formas antes de desistir, e busca o member completo do servidor como
// último recurso.
async function membroTemCargo(member, roleId, guild) {
  if (!roleId) return false;
  if (!member) return false;

  // Forma normal: GuildMember com roles.cache (Collection)
  if (member.roles && typeof member.roles.cache?.has === 'function') {
    if (member.roles.cache.has(roleId)) return true;
  }

  // Forma alternativa: member parcial, roles como array de IDs
  if (Array.isArray(member.roles) && member.roles.includes(roleId)) return true;
  if (Array.isArray(member._roles) && member._roles.includes(roleId)) return true;

  // Último recurso: busca o member direto do servidor (ignora cache
  // velho/incompleto) — só faz isso se tiver o guild disponível.
  const guildParaBuscar = guild || member.guild;
  if (guildParaBuscar) {
    try {
      const membroCompleto = await guildParaBuscar.members.fetch(member.id || member.user?.id);
      return membroCompleto.roles.cache.has(roleId);
    } catch (err) {
      return false;
    }
  }

  return false;
}

// ID do usuário, tirado do "member" independente do formato que ele
// vier (GuildMember normal, member parcial, etc).
function pegarIdDoMembro(member) {
  if (!member) return null;
  return member.id || member.user?.id || null;
}

async function membroECeo(member, guild) {
  const id = pegarIdDoMembro(member);
  if (DONO_USER_ID && id === DONO_USER_ID) return true;
  return CEO_ROLE_ID ? membroTemCargo(member, CEO_ROLE_ID, guild) : false;
}

// Mediar (fila de mediadores, cadastro de Pix, Finalizar Aposta, Cancelar,
// Escolher Vencedor...) só vale pra quem tem o cargo configurado com
// !setcargomediador (ou o cargo CEO, de !setcargoceo). Nada de lista
// extra por pessoa, de .env ou de ID de dono: tirou o cargo, perdeu o acesso.
async function membroPodeMediar(member, guild) {
  if (!member) return false;
  if (CONFIG_CARGOS.mediadorRoleId && (await membroTemCargo(member, CONFIG_CARGOS.mediadorRoleId, guild))) return true;
  if (CONFIG_CARGOS.ceoRoleId && (await membroTemCargo(member, CONFIG_CARGOS.ceoRoleId, guild))) return true;
  return false;
}

async function usuarioECeo(interaction) {
  return membroECeo(interaction.member, interaction.guild);
}

// Mesma checagem, só que pra comandos de texto (!comando), onde a
// gente recebe uma "message" do Discord.js em vez de uma "interaction".
async function usuarioECeoMensagem(message) {
  return membroECeo(message.member, message.guild);
}

async function usuarioPodeMediar(interaction) {
  return membroPodeMediar(interaction.member, interaction.guild);
}

// Quantas vezes cada pessoa já tentou usar Finalizar Aposta/Escolher
// Vencedor/W.O./Cancelar sem ter o cargo de mediador. Vale pra
// QUALQUER partida/fila (não reseta por partida) — só reseta se o bot
// reiniciar.
const tentativasNegadasMediador = new Map();

// 1ª tentativa sem cargo: mostra o aviso normal. 2ª tentativa: mostra
// um aviso diferente. Da 3ª em diante: não mostra mais nenhuma
// mensagem (só recusa a ação por baixo dos panos).
async function negarAcessoMediador(interaction) {
  const tentativaAtual = (tentativasNegadasMediador.get(interaction.user.id) || 0) + 1;
  tentativasNegadasMediador.set(interaction.user.id, tentativaAtual);

  if (tentativaAtual === 1) {
    return interaction.reply({ content: 'Só quem tem o cargo de mediador pode usar essa opção.', ephemeral: true });
  }
  if (tentativaAtual === 2) {
    return interaction.reply({ content: 'Essa opção continua só pra quem tem o cargo de mediador.', ephemeral: true });
  }
  // 3ª tentativa em diante: reconhece o clique sem mostrar nada.
  return interaction.deferUpdate().catch(() => {});
}

function montarSelectFinalizarAposta() {
  const select = new StringSelectMenuBuilder()
    .setCustomId('ficha_menu_opcoes')
    .setPlaceholder('Selecione uma opção')
    .addOptions(
      {
        label: 'Finalizar Aposta',
        description: 'Encerra a aposta.',
        value: 'finalizar_aposta',
        emoji: EMOJI_FINALIZAR,
      },
      {
        label: 'Revanche',
        description: 'Escolhe o vencedor e começa uma nova fila com outro valor.',
        value: 'revanche',
        emoji: EMOJI_GIRO,
      }
    );
  return new ActionRowBuilder().addComponents(select);
}

async function pegarNomeExibicao(guild, userId) {
  try {
    const membro = await guild.members.fetch(userId);
    return membro.displayName;
  } catch (err) {
    return `Usuário ${userId}`;
  }
}

async function montarSelectEscolherVencedor(guild, partida, customId = 'ficha_escolher_vencedor') {
  const opcoes = await Promise.all(
    partida.jogadores.map(async (id) => {
      const nome = await pegarNomeExibicao(guild, id);
      return { label: nome, description: id, value: id };
    })
  );

  const select = new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder('Escolha o vencedor')
    .addOptions(...opcoes);
  return new ActionRowBuilder().addComponents(select);
}

function montarEmbedEscolherVencedor() {
  return new EmbedBuilder()
    .setColor(COR_AMARELA)
    .setAuthor({ name: NOME_ORG })
    .setTitle('Definir Vencedor')
    .setDescription('Selecione o vencedor da partida abaixo.');
}

function montarEmbedVencedorDefinido(partida) {
  return new EmbedBuilder()
    .setColor(COR_AMARELA)
    .setAuthor({ name: NOME_ORG })
    .setTitle('🏆 Vencedor da Partida')
    .setDescription(
      `O jogador <@${partida.vencedorId}> venceu esta partida e ganhou **+1 Vitória**!` +
        (partida.mediadorFinalId ? `\n🛡️ Mediador: <@${partida.mediadorFinalId}>` : '')
    );
}

function montarEmbedEscolherMediador(partida) {
  return new EmbedBuilder()
    .setColor(COR_AMARELA)
    .setAuthor({ name: NOME_ORG })
    .setTitle('🛡️ Definir Mediador')
    .setDescription(
      `O jogador <@${partida.vencedorId}> venceu e ganhou **+1 Vitória**!\n` +
        'Agora selecione abaixo o mediador que mediou esta partida.'
    );
}

// Mediadores pra escolher no fim da aposta: o da partida (primeiro), quem
// está finalizando e os demais mediadores cadastrados que ainda têm o cargo.
async function montarSelectEscolherMediador(guild, partida, quemFinalizaId) {
  const ids = [];
  const add = (id) => {
    if (id && !ids.includes(id)) ids.push(id);
  };
  add(partida.mediadorId);
  add(quemFinalizaId);
  Object.keys(MEDIADOR_PIX).forEach(add);

  const membros = await guild.members.fetch({ user: ids.slice(0, 100) }).catch(() => null);
  const opcoes = [];
  for (const id of ids) {
    const membro = membros && membros.get(id);
    if (!membro) continue;
    if (!(await membroPodeMediar(membro, guild))) continue;
    opcoes.push({
      label: membro.displayName.slice(0, 100),
      description: id === partida.mediadorId ? 'Mediador da partida' : id,
      value: id,
    });
    if (opcoes.length === 25) break;
  }
  if (!opcoes.length) return null;

  const select = new StringSelectMenuBuilder()
    .setCustomId('ficha_escolher_mediador')
    .setPlaceholder('Escolha o mediador')
    .addOptions(...opcoes);
  return new ActionRowBuilder().addComponents(select);
}

// Apaga uma mensagem de passo (finalizar/revanche) que ficou pra trás.
async function apagarMensagemDeFluxo(canal, partida, campo) {
  const id = partida[campo];
  if (!id) return;
  delete partida[campo];
  await canal.messages.delete(id).catch(() => {});
}

function montarSelectTipoVitoria() {
  const select = new StringSelectMenuBuilder()
    .setCustomId('ficha_tipo_vitoria')
    .setPlaceholder('Selecione uma opção')
    .addOptions(
      { label: 'Vencedor por W.O.', value: 'wo' },
      { label: 'Vencedor por Vitória', value: 'vitoria' }
    );
  return new ActionRowBuilder().addComponents(select);
}

function montarEmbedPartidaEncerrada(porWO) {
  return new EmbedBuilder()
    .setColor(COR_AMARELA)
    .setAuthor({ name: NOME_ORG })
    .setTitle(porWO ? '✅ Aposta finalizada, vencedor por W.O.' : '✅ Aposta finalizada')
    .setDescription('Estou armazenando as mensagens dessa aposta.\n↪️ Esse tópico está sendo finalizado.');
}

function pegarDadosMediador(mediadorId) {
  const dados = MEDIADOR_PIX[mediadorId];
  if (!dados) return null;
  // compatibilidade com cadastros antigos (salvos como texto puro)
  if (typeof dados === 'string') return { chave: dados, nome: null, qrcodeUrl: null };
  return dados;
}

// Identifica o tipo de uma chave Pix pelo formato.
// Gera o QR code do Pix grande (400x400) com o emoji das abelhas
// centralizado por cima, com fundo branco atrás pra não atrapalhar a
// leitura (o QR usa correção de erro alta, então aguenta ter até ~30%
// coberto no meio sem parar de funcionar).
async function gerarQrComLogo(chave) {
  const bufferQr = await QRCode.toBuffer(chave, { width: 500, margin: 1, errorCorrectionLevel: 'H' });
  const imagemQr = await Jimp.read(bufferQr);

  try {
    const logo = await Jimp.read(EMOJI_ABELHAS_URL);
    const tamanhoLogo = Math.floor(imagemQr.bitmap.width * 0.22);
    logo.resize(tamanhoLogo, tamanhoLogo);

    // fundo branco quadrado atrás do logo, um pouco maior que ele,
    // pra destacar e não misturar com os quadradinhos do QR
    const fundo = new Jimp(tamanhoLogo + 20, tamanhoLogo + 20, 0xffffffff);

    const x = (imagemQr.bitmap.width - fundo.bitmap.width) / 2;
    const y = (imagemQr.bitmap.height - fundo.bitmap.height) / 2;
    imagemQr.composite(fundo, x, y);
    imagemQr.composite(logo, x + 10, y + 10);
  } catch (err) {
    console.error('⚠️ Não consegui colocar o emoji no meio do QR code (gerando sem ele):', err.message);
  }

  return imagemQr.getBufferAsync(Jimp.MIME_PNG);
}

function detectarTipoChavePix(chave) {
  const valor = (chave || '').trim();
  if (/^\d{11}$/.test(valor.replace(/[.\-]/g, ''))) return 'CPF';
  if (/^\d{14}$/.test(valor.replace(/[.\-/]/g, ''))) return 'CNPJ';
  // Telefone: aceita qualquer quantidade de dígitos, com ou sem
  // espaço/parênteses/traço (ex: "11 98888-7777", "+55 11988887777").
  if (/^\+?\d+$/.test(valor.replace(/[\s()\-]/g, ''))) return 'Telefone';
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) return 'E-mail';
  // Chave aleatória (EVP): formato padrão de UUID.
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor)) return 'Aleatória';
  // Qualquer outra coisa que não bateu em nenhum formato acima também
  // é tratada como chave aleatória (o bot reconhece e aceita normal).
  return 'Aleatória';
}

// Cor aleatória (azul ou verde) pras mensagens de aviso do bot.
function corAvisoBot() {
  return Math.random() < 0.5 ? 0x3498db : 0x2ecc71;
}

function embedAvisoBot(texto) {
  return new EmbedBuilder().setColor(corAvisoBot()).setDescription(texto);
}

// Máximo de filas simultâneas que a mesma pessoa pode ocupar ao mesmo
// tempo, contando TODOS os painéis (não só o mesmo formato).
const MAX_FILAS_SIMULTANEAS = 2;

function contarFilasDoUsuario(userId) {
  let total = 0;
  for (const instancia of painelInstancias.values()) {
    for (const chave of Object.keys(instancia.filas)) {
      if (instancia.filas[chave].includes(userId)) total++;
    }
  }
  return total;
}

function pegarChavePix(mediadorId) {
  const dados = pegarDadosMediador(mediadorId);
  return (dados && dados.chave) || PIX_PADRAO;
}

// ---------- PAINEL DE CADASTRO PIX (mediadores se cadastram sozinhos) ----------

// ---------- BLACKLIST (verificar ID do Free Fire) ----------

// ---------- PAINEL DE SALAS AUTOMÁTICAS ----------

function montarEmbedPainelSalasAutomaticas() {
  return new EmbedBuilder()
    .setColor(COR_AMARELA)
    .setAuthor({ name: NOME_ORG })
    .setTitle('🤖 Salas Automáticas')
    .setDescription('Escolha uma opção abaixo: crie uma sala nova ou veja quantas salas ainda restam no estoque.');
}

// Canal com o tutorial das salas automáticas: o botão "Tutorial" do painel
// leva direto pra ele. Dá pra trocar com a variável TUTORIAL_SALAS_URL.
const TUTORIAL_SALAS_URL =
  process.env.TUTORIAL_SALAS_URL || 'https://discord.com/channels/1541228432879259760/1561404620385951886';

// Tempo até o tópico de sala automática ser apagado sozinho (se ninguém
// apertar "Finalizar"): 5 horas.
const TOPICO_SALAS_DURACAO_MS = 5 * 60 * 60 * 1000;

function montarBotoesPainelSalasAutomaticas() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('salasbot_criar').setLabel('Criar Sala').setEmoji('🎮').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('salasbot_estoque').setLabel('Salas Restantes').setEmoji('📦').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setLabel('Tutorial').setEmoji('📖').setStyle(ButtonStyle.Link).setURL(TUTORIAL_SALAS_URL)
  );
}

function montarEmbedPainelBlacklist() {
  return new EmbedBuilder()
    .setColor(COR_DOURADA)
    .setTitle('Blacklist')
    .setDescription('Clique no botão abaixo para verificar um ID na blacklist.');
}

function montarBotoesPainelBlacklist() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('blacklist_verificar').setLabel('Verificar ID').setEmoji('🔍').setStyle(ButtonStyle.Secondary)
  );
}

function montarModalBlacklist() {
  const modal = new ModalBuilder().setCustomId('modal_blacklist').setTitle('Verificação de ID na Blacklist');

  const inputId = new TextInputBuilder()
    .setCustomId('input_id_blacklist')
    .setLabel('Digite o ID que você deseja verificar:')
    .setPlaceholder('Ex: 123456789')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(inputId));
  return modal;
}

function montarEmbedResultadoBlacklist(id, registro) {
  if (registro) {
    return new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle('🚫 ID encontrado na Blacklist')
      .addFields(
        { name: 'ID:', value: id },
        { name: 'Motivo:', value: registro.motivo || 'Não informado' }
      );
  }
  return new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle('✅ ID não está na Blacklist')
    .addFields({ name: 'ID:', value: id });
}

function montarEmbedPainelPix() {
  return new EmbedBuilder()
    .setColor(COR_DOURADA)
    .setTitle('Painel de Cadastro PIX Mediador')
    .setDescription('Clique nos botões abaixo para verificar ou cadastrar sua chave PIX.');
}

function montarBotoesPainelPix() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('mediador_cadastrar_pix').setLabel('Cadastrar Pix').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('mediador_verificar_cadastro').setLabel('Verificar Cadastro').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('mediador_gerar_novo_pix').setLabel('Gerar Novo Pix').setEmoji(EMOJI_GIRO_OURO).setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('mediador_excluir_pix').setLabel('Excluir Pix').setEmoji('🗑️').setStyle(ButtonStyle.Danger)
  );
}

function montarModalCadastroMediador() {
  const modal = new ModalBuilder().setCustomId('modal_cadastro_mediador').setTitle('Cadastro Mediador');

  const inputPix = new TextInputBuilder()
    .setCustomId('input_pix')
    .setLabel('Informe a chave PIX.')
    .setPlaceholder('CPF, CNPJ, telefone, e-mail @gmail.com ou aleatória')
    .setMaxLength(100)
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const inputNome = new TextInputBuilder()
    .setCustomId('input_nome')
    .setLabel('Informe seu nome. (Opcional)')
    .setPlaceholder('Nome que irá aparecer na hora do pagamento')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  const inputQrcode = new TextInputBuilder()
    .setCustomId('input_qrcode')
    .setLabel('Link da imagem do QR Code. (Opcional)')
    .setPlaceholder('Caso não tenha, será gerado automaticamente.')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder().addComponents(inputPix),
    new ActionRowBuilder().addComponents(inputNome),
    new ActionRowBuilder().addComponents(inputQrcode)
  );

  return modal;
}

function montarModalGerarNovoPix() {
  const modal = new ModalBuilder().setCustomId('modal_gerar_novo_pix').setTitle('Gerar Novo Pix');

  const inputPix = new TextInputBuilder()
    .setCustomId('input_pix')
    .setLabel('Informe a nova chave PIX.')
    .setPlaceholder('CPF, CNPJ, telefone, e-mail @gmail.com ou aleatória')
    .setMaxLength(100)
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const inputNome = new TextInputBuilder()
    .setCustomId('input_nome')
    .setLabel('Informe seu nome. (Opcional)')
    .setPlaceholder('Nome que irá aparecer na hora do pagamento')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  const inputQrcode = new TextInputBuilder()
    .setCustomId('input_qrcode')
    .setLabel('Link da imagem do novo QR Code. (Opcional)')
    .setPlaceholder('Caso não tenha, será gerado automaticamente.')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder().addComponents(inputPix),
    new ActionRowBuilder().addComponents(inputNome),
    new ActionRowBuilder().addComponents(inputQrcode)
  );

  return modal;
}

function montarEmbedCadastroMediador(usuario, dados) {
  const nomeExibicao = dados.nome && dados.nome.trim() ? dados.nome.trim() : usuario.username;

  return new EmbedBuilder()
    .setColor(COR_DOURADA)
    .setAuthor({ name: usuario.username, iconURL: usuario.displayAvatarURL() })
    .setTitle(`Cadastro de ${nomeExibicao}`)
    .addFields(
      { name: 'Mediador:', value: `<@${usuario.id}>` },
      { name: 'Nome:', value: nomeExibicao },
      { name: 'Chave:', value: `\`${dados.chave}\`` },
      ...(dados.tipo ? [{ name: 'Tipo:', value: dados.tipo }] : [])
    );
}

function montarBotoesCadastroMediador() {
  // Painel de cadastro Pix não leva mais botão de Regras.
  return null;
}

// ---------- MENSAGENS AUXILIARES ----------

function montarEmbedNotificacaoBonita(partida) {
  return new EmbedBuilder()
    .setColor(COR_AMARELA)
    .setAuthor({ name: NOME_ORG })
    .setTitle('✅ Partida Confirmada!')
    .setDescription(`${partida.jogadores.map((id) => `<@${id}>`).join(', ')} confirmaram a partida.\nBoa sorte! 🍀`);
}

function montarEmbedValorPix(partida) {
  const chave = pegarChavePix(partida.mediadorId) || PIX_PADRAO || 'Não configurada';
  const valorMediador = calcularValorMediador(partida.valor) || partida.valor || 'R$0,00';
  return new EmbedBuilder()
    .setColor(COR_AMARELA)
    .addFields(
      { name: 'Valor:', value: `↳ ${valorMediador}` },
      { name: 'CHAVE PIX:', value: `${chave}` }
    );
}

function montarEmbedAguardandoPagamento(partida) {
  return new EmbedBuilder()
    .setColor(COR_AMARELA)
    .setAuthor({ name: NOME_ORG })
    .setTitle('⏳ Aguardando pagamento')
    .setDescription(
      `Sala recebida! Aguardando o pagamento da taxa de inscrição no valor de **${partida.valor}** para liberar a sala.`
    );
}


// ---------- PIX COM VALOR PRÉ-DEFINIDO (QR code / "copia e cola") ----------
// Monta o BR Code do Pix (padrão do Banco Central) com o valor já
// preenchido: quem lê o QR code só confirma o pagamento, sem digitar.
// O valor do QR = valor da fila + taxa do mediador (ACRESCIMO_MEDIADOR).

function crc16Pix(texto) {
  let crc = 0xffff;
  for (let i = 0; i < texto.length; i++) {
    crc ^= texto.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function campoPix(id, valor) {
  return id + String(valor.length).padStart(2, '0') + valor;
}

function cpfValido(d) {
  if (!/^\d{11}$/.test(d) || /^(\d)\1{10}$/.test(d)) return false;
  for (const tam of [9, 10]) {
    let soma = 0;
    for (let i = 0; i < tam; i++) soma += Number(d[i]) * (tam + 1 - i);
    let resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    if (resto !== Number(d[tam])) return false;
  }
  return true;
}

// Deixa a chave no formato que o Pix exige dentro do QR code:
// CPF/CNPJ só com números, telefone com +55, e-mail e aleatória em
// minúsculas.
function normalizarChavePix(chave) {
  const bruto = (chave || '').trim();
  if (bruto.includes('@')) return bruto.toLowerCase();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bruto)) return bruto.toLowerCase();
  const digitos = bruto.replace(/\D/g, '');
  if (bruto.startsWith('+')) return `+${digitos}`;
  if (digitos.length === 14) return digitos;
  if (digitos.length === 11) return cpfValido(digitos) ? digitos : `+55${digitos}`;
  if (digitos.length === 10) return `+55${digitos}`;
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith('55')) return `+${digitos}`;
  return bruto;
}

function limparTextoPix(texto, max, padrao) {
  const limpo = (texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .trim()
    .toUpperCase()
    .slice(0, max)
    .trim();
  return limpo || padrao;
}

// Valor da fila + taxa do mediador, como número (ex.: fila R$2,00 -> 2.5)
function valorFilaMaisTaxa(valorFila) {
  const base = parseValorBR(valorFila);
  const valorBase = base !== null ? base : parseValorBR(VALOR_APOSTA_PADRAO) || 0;
  return Math.round((valorBase + ACRESCIMO_MEDIADOR) * 100) / 100;
}

// Código do "Pix copia e cola" com o VALOR JÁ PREDEFINIDO (campo 54) e só a
// chave do mediador. Sem nome e sem cidade: o padrão do Pix exige os campos
// 59 (nome) e 60 (cidade), então vão com 1 letra neutra, só pra o código
// continuar válido em qualquer banco. Quem paga vê o nome do dono da chave
// pelo próprio app do banco.
function gerarPayloadPix({ chave, valor }) {
  const conta = campoPix('00', 'br.gov.bcb.pix') + campoPix('01', normalizarChavePix(chave));
  let payload =
    campoPix('00', '01') +
    campoPix('01', '11') +
    campoPix('26', conta) +
    campoPix('52', '0000') +
    campoPix('53', '986');
  if (valor && valor > 0) payload += campoPix('54', valor.toFixed(2));
  payload +=
    campoPix('58', 'BR') +
    campoPix('59', 'N') +
    campoPix('60', 'C') +
    campoPix('62', campoPix('05', '***'));
  payload += '6304';
  return payload + crc16Pix(payload);
}

// ---------- REVANCHE (opção do menu do mediador) ----------

function montarEmbedRevancheEscolherVencedor() {
  return new EmbedBuilder()
    .setColor(COR_AMARELA)
    .setAuthor({ name: NOME_ORG })
    .setTitle('🔁 Revanche')
    .setDescription('Selecione o vencedor desta partida. A fila **não** será finalizada: depois você escolhe o valor da revanche.');
}

function montarEmbedRevancheEscolherValor(partida) {
  return new EmbedBuilder()
    .setColor(COR_AMARELA)
    .setAuthor({ name: NOME_ORG })
    .setTitle('🔁 Valor da Revanche')
    .setDescription(
      `O jogador <@${partida.revancheVencedorId}> venceu esta partida e ganhou **+1 Vitória**!\n\n` +
        'Escolha abaixo o valor da revanche.'
    );
}

function montarSelectValorRevanche() {
  const select = new StringSelectMenuBuilder()
    .setCustomId('revanche_valor_escolhido')
    .setPlaceholder('Escolha o valor da revanche')
    .addOptions(
      VALORES_TROCA_RAPIDA.map((v) => ({
        label: `R$ ${v}`,
        value: v,
        emoji: v === '50,00' || v === '100,00' ? '💵' : '💸',
      }))
    );
  return new ActionRowBuilder().addComponents(select);
}

// "Revanche definida" já com o Valor e a Chave Pix do mediador na mesma
// mensagem (os botões QR e Copiar ficam embaixo dela).
function montarEmbedRevancheDefinida(partida, vencedorAnteriorId) {
  const chave = pegarChavePix(partida.mediadorId) || PIX_PADRAO || 'Não configurada';
  return new EmbedBuilder()
    .setColor(COR_AMARELA)
    .setAuthor({ name: NOME_ORG })
    .setTitle(`🔁 Revanche #${partida.revanches} definida`)
    .setDescription(
      `Vencedor da partida anterior: <@${vencedorAnteriorId}>\n` +
        `Nova fila: **${partida.valor}**\n\n` +
        'Façam o pagamento abaixo e aguardem o mediador mandar a nova sala.'
    )
    .addFields(
      { name: 'Valor:', value: `↳ ${calcularValorMediador(partida.valor)}` },
      { name: 'CHAVE PIX:', value: `${chave}` }
    );
}

function montarBotoesQrPix() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ficha_qr').setLabel('QR').setEmoji(EMOJI_QR).setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('ficha_copiar_pix').setLabel('Copiar').setEmoji(EMOJI_COPIAR).setStyle(ButtonStyle.Secondary)
  );
}

// ---------- SALA (ID/SENHA) — só Mediador/CEO pode gerar e mexer ----------

// Nome do canal quando vira "pagar": "pagar-R$50,00💰" (valor formatado
// bonitinho, com vírgula, e o emoji de dinheiro do lado direito).
function nomeCanalPagar(valor) {
  return `pagar-${valor}💰`;
}

// Emoji ":c:" do servidor, mostrado BEM GRANDE (thumbnail, no lado direito)
// no card "ID e Senha". O bot procura o emoji de nome "c" nos servidores
// quando liga. Dá pra forçar outra imagem com a variável EMOJI_SALA_URL.
let URL_EMOJI_SALA = process.env.EMOJI_SALA_URL || null;
async function carregarEmojiSala() {
  if (process.env.EMOJI_SALA_URL) return;
  for (const guild of client.guilds.cache.values()) {
    await guild.emojis.fetch().catch(() => {});
    const emoji = guild.emojis.cache.find((e) => e.name === 'c');
    if (emoji) {
      URL_EMOJI_SALA = emoji.imageURL({ extension: emoji.animated ? 'gif' : 'png', size: 128 });
      return;
    }
  }
  console.error('⚠️ Não achei o emoji ":c:" em nenhum servidor — o card "ID e Senha" vai sair sem a imagem grande.');
}

function montarEmbedSala(partida) {
  const embed = new EmbedBuilder()
    .setColor(COR_AMARELA)
    .setAuthor({ name: NOME_ORG })
    .setTitle('🎮 ID e Senha')
    .addFields(
      { name: 'ID e Senha:', value: `${partida.salaId}\n${partida.salaSenha}`, inline: true },
      { name: 'Valor e Modo:', value: `${partida.valor}\n${partida.rotuloFormato}`, inline: true }
    );
  if (URL_EMOJI_SALA) embed.setThumbnail(URL_EMOJI_SALA);
  return embed;
}

function montarBotoesSala() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('sala_copiar_id').setLabel('Copiar ID').setEmoji(EMOJI_COPIAR).setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('sala_trocar_valor').setLabel('Trocar Valor').setEmoji(EMOJI_GIRO).setStyle(ButtonStyle.Secondary)
  );
}

// Valores disponíveis pra troca rápida — 💵 nos maiores (50/100), 💸 nos demais.
const VALORES_TROCA_RAPIDA = ['1,00', '2,00', '3,00', '5,00', '10,00', '20,00', '50,00', '100,00'];

function montarSelectTrocarValor() {
  const select = new StringSelectMenuBuilder()
    .setCustomId('sala_valor_escolhido')
    .setPlaceholder('Escolha o novo valor')
    .addOptions(
      VALORES_TROCA_RAPIDA.map((v) => ({
        label: `R$ ${v}`,
        value: v,
        emoji: v === '50,00' || v === '100,00' ? '💵' : '💸',
      }))
    );
  return new ActionRowBuilder().addComponents(select);
}

// Extrai (ID de 9 a 13 dígitos, senha de 2 a 4 dígitos) de uma mensagem de
// texto — funciona tanto pra "12345678 9 12" numa linha só quanto pra
// ID e senha em linhas separadas.
function extrairIdESenha(texto) {
  const match = texto.match(/(\d{9,13})\D+(\d{2,4})\b/);
  if (!match) return null;
  return { id: match[1], senha: match[2] };
}

// Pra quando o Mediador manda o ID e a senha em mensagens SEPARADAS
// (uma com só o ID, outra logo depois só com a senha), em vez de tudo
// na mesma mensagem.
function extrairApenasId(texto) {
  const match = texto.trim().match(/^\D*(\d{9,13})\D*$/);
  return match ? match[1] : null;
}
function extrairApenasSenha(texto) {
  const match = texto.trim().match(/^\D*(\d{2,4})\D*$/);
  return match ? match[1] : null;
}

// Ativa o card "ID e Senha" da sala: guarda id/senha na partida,
// renomeia o tópico pra "pagar-<valor>" e posta o embed com os botões.
async function ativarSala(canal, partida, id, senha) {
  partida.salaId = id;
  partida.salaSenha = senha;
  partida.aguardandoPagamento = true;
  delete partida.salaIdPendente;
  salvarPartidas();

  await canal.setName(nomeCanalPagar(partida.valor)).catch(() => {});

  partida.salaMessage = await canal.send({
    embeds: [montarEmbedSala(partida)],
    components: [montarBotoesSala()],
  });

}

function montarEmbedMudouTela() {
  return new EmbedBuilder()
    .setColor(COR_AMARELA)
    .setTitle('📢 MUDOU A FORMA DE MOSTRAR A TELA')
    .setDescription(
      '**O Discord suspendeu as transmissões ao vivo no Brasil. Agora é pelo app Google Meet.**\n\n' +
        '➡️📲 Baixe agora, antes de jogar:\n' +
        `Android: ${LINK_ANDROID}\n` +
        `IOS: ${LINK_IOS}\n` +
        `Windows: ${LINK_WINDOWS}`
    );
}

// Card de regras (traço amarelo) mandado logo depois que os dois
// confirmam — penúltima mensagem do fluxo (a última é o aviso de
// "Análises Funcionando" quando a sala é criada).
function montarEmbedRegrasPadrao() {
  return new EmbedBuilder()
    .setColor(COR_AMARELA)
    .setTitle('📢 REGRAS PADRÃO - LEIA ANTES DE JOGAR')
    .setDescription(
      'A partir de agora, todas as filas seguirão:\n\n' +
        '→ Armas: apenas FULL UMP e XM8\n' +
        '→ 1º round: apenas Desert\n' +
        '→ Proibido mobilador nas filas mobile\n' +
        '→ Proibido tela parada\n' +
        '→ Proibido bug de kit\n\n' +
        'Não será mais necessário fazer combinações ou enviar placas para essas regras.\n\n' +
        '🔍 Mais agilidade e menos discussões antes das filas.'
    );
}

// Card de "análises funcionando" (traço amarelo) — mandado quando a
// sala (ID e Senha) é criada. É a ÚLTIMA mensagem do fluxo da partida.
function montarEmbedAnalisesFuncionando() {
  return new EmbedBuilder()
    .setColor(COR_AMARELA)
    .setTitle('🔍 ANÁLISES FUNCIONANDO NORMALMENTE!')
    .setDescription(
      'Peça a **tela como de costume**. O bot irá gerar o link do **Google Meet** automaticamente.\n\n' +
        'Ao entrar no Meet, envie o link para o restante do seu time.'
    );
}

// ---------- FILA DE MEDIADORES (Entrar / Sair / pega o próximo) ----------

// Lista em memória, ordem = ordem de chegada (fila FIFO).
const filaMediadores = [];

// Referências das mensagens dos painéis, pra poder atualizar sozinhas
// quando alguém entra, sai, ou é chamado pra uma partida. Dá pra ter
// mais de um painel de fila de mediador aberto ao mesmo tempo (em
// canais diferentes, por exemplo) — todos mostram a MESMA fila
// (filaMediadores é uma só), só a numeração no título muda.
let paineisMediador = [];

// Onde estão as mensagens dos painéis de mediador (pra, depois de um
// reinício/deploy, atualizar elas pra "ninguém na fila").
const CAMINHO_PAINEIS_MEDIADOR = path.join(DATA_DIR, 'paineis-mediador.json');
function salvarPaineisMediador() {
  try {
    escreverJsonAtomico(
      CAMINHO_PAINEIS_MEDIADOR,
      paineisMediador.map((m) => ({ canalId: m.channelId, msgId: m.id }))
    );
  } catch (err) {
    console.error('⚠️ Não consegui salvar os painéis de mediador:', err.message);
  }
}
async function restaurarPaineisMediador() {
  let salvos = [];
  try {
    salvos = JSON.parse(fs.readFileSync(CAMINHO_PAINEIS_MEDIADOR, 'utf-8'));
  } catch (err) {
    return;
  }
  const lista = [];
  for (const item of salvos) {
    try {
      const canal = await client.channels.fetch(item.canalId);
      lista.push(await canal.messages.fetch(item.msgId));
    } catch (err) {
      // painel apagado: ignora
    }
  }
  paineisMediador = lista;
  salvarPaineisMediador();
  await atualizarPainelMediadorSeExistir();
}

function montarEmbedFilaMediador(numero, total) {
  const linhas = filaMediadores.map((id, i) => `${i + 1}. <@${id}>`);
  const titulo = total > 1 ? `🎮 Filas dos Mediadores (${numero})` : '🎮 Filas dos Mediadores';

  return new EmbedBuilder()
    .setColor(COR_DOURADA)
    .setTitle(titulo)
    .setDescription('Entre na fila para começar a mediar apostas')
    .addFields({
      name: '\u200b',
      value: linhas.length ? linhas.join('\n') : 'Nenhum mediador na fila.',
    });
}

function montarBotoesFilaMediador() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('fila_mediador_entrar').setLabel('Entrar').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('fila_mediador_sair').setLabel('Sair').setStyle(ButtonStyle.Danger)
  );
}

// Atualiza TODOS os painéis de fila de mediador abertos no momento —
// precisa ser todos de uma vez (e não só o que mudou) porque a
// numeração "(1)", "(2)" de cada um depende de quantos painéis
// existem no total.
async function atualizarPainelMediadorSeExistir() {
  if (!paineisMediador.length) return;
  const total = paineisMediador.length;

  await Promise.all(
    paineisMediador.map(async (msg, indice) => {
      try {
        await msg.edit({
          embeds: [montarEmbedFilaMediador(indice + 1, total)],
          components: [montarBotoesFilaMediador()],
        });
      } catch (err) {
        console.error('Erro ao atualizar painel de mediadores:', err);
      }
    })
  );
}

// ---------- FILA DE SUPORTE (Entrar / Sair) ----------
const filaSuporte = [];
let painelSuporteFilaMessage = null;

// Onde está a mensagem do painel da fila de suporte (pra atualizar depois
// de um reinício/deploy, já com a fila vazia).
const CAMINHO_PAINEL_SUPORTE_FILA = path.join(DATA_DIR, 'painel-suporte-fila.json');
function salvarPainelSuporteFila() {
  try {
    if (painelSuporteFilaMessage) {
      escreverJsonAtomico(CAMINHO_PAINEL_SUPORTE_FILA, {
        canalId: painelSuporteFilaMessage.channelId,
        msgId: painelSuporteFilaMessage.id,
      });
    }
  } catch (err) {
    console.error('⚠️ Não consegui salvar o painel da fila de suporte:', err.message);
  }
}
async function restaurarPainelSuporteFila() {
  try {
    const salvo = JSON.parse(fs.readFileSync(CAMINHO_PAINEL_SUPORTE_FILA, 'utf-8'));
    const canal = await client.channels.fetch(salvo.canalId);
    painelSuporteFilaMessage = await canal.messages.fetch(salvo.msgId);
    await atualizarPainelSuporteFilaSeExistir();
  } catch (err) {
    // sem painel salvo (ou apagado): ignora
  }
}

// Confere se quem está na fila de suporte ainda pode atender: continua com
// o cargo de suporte, continua no servidor e ainda tem Pix cadastrado.
async function suporteAindaPodeAtender(suporteId) {
  const dados = SUPORTE_PIX[suporteId];
  if (!dados || !dados.chave) return false;
  const guild = client.guilds.cache.first();
  if (!guild) return true;
  const membro = await guild.members.fetch(suporteId).catch(() => null);
  if (!membro) return false;
  return membroPodeSuportar(membro, guild);
}

// Próximo suporte da fila (revezamento): quem perdeu o cargo / saiu / ficou
// sem Pix é tirado da fila. Retorna null se não tiver ninguém disponível.
async function pegarProximoSuporte() {
  while (filaSuporte.length) {
    const suporteId = filaSuporte.shift();
    if (!(await suporteAindaPodeAtender(suporteId))) {
      encerrarSessaoSuporte(suporteId);
      continue;
    }
    filaSuporte.push(suporteId);
    await atualizarPainelSuporteFilaSeExistir();
    return suporteId;
  }
  await atualizarPainelSuporteFilaSeExistir();
  return null;
}

function montarEmbedFilaSuporte() {
  const linhas = filaSuporte.map((id, i) => `${i + 1}. <@${id}>`);
  return new EmbedBuilder()
    .setColor(COR_DOURADA)
    .setTitle('🎧 Fila de Suporte')
    .setDescription('Entre na fila para ficar disponível para atender tickets.')
    .addFields({
      name: '\u200b',
      value: linhas.length ? linhas.join('\n') : 'Nenhum suporte na fila.',
    });
}

function montarBotoesFilaSuporte() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('fila_suporte_entrar').setLabel('Entrar').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('fila_suporte_sair').setLabel('Sair').setStyle(ButtonStyle.Danger)
  );
}

async function atualizarPainelSuporteFilaSeExistir() {
  if (!painelSuporteFilaMessage) return;
  try {
    await painelSuporteFilaMessage.edit({
      embeds: [montarEmbedFilaSuporte()],
      components: [montarBotoesFilaSuporte()],
    });
  } catch (err) {
    console.error('Erro ao atualizar painel de fila de suporte:', err);
  }
}

// ---------- CADASTRO PIX DO SUPORTE (painel) ----------
function montarEmbedPainelPixSuporte() {
  return new EmbedBuilder()
    .setColor(COR_DOURADA)
    .setTitle('Painel de Cadastro PIX Suporte')
    .setDescription('Clique nos botões abaixo para verificar ou cadastrar sua chave PIX.');
}
function montarBotoesPainelPixSuporte() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('suporte_cadastrar_pix').setLabel('Cadastrar Pix').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('suporte_verificar_cadastro').setLabel('Verificar Cadastro').setStyle(ButtonStyle.Secondary)
  );
}
function montarModalCadastroSuporte() {
  const modal = new ModalBuilder().setCustomId('modal_cadastro_suporte').setTitle('Cadastro Pix Suporte');
  const inputPix = new TextInputBuilder()
    .setCustomId('input_pix')
    .setLabel('Informe a chave PIX.')
    .setPlaceholder('CPF, CNPJ, telefone, e-mail @gmail.com ou aleatória')
    .setMaxLength(100)
    .setStyle(TextInputStyle.Short)
    .setRequired(true);
  const inputNome = new TextInputBuilder()
    .setCustomId('input_nome')
    .setLabel('Informe seu nome. (Opcional)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);
  modal.addComponents(new ActionRowBuilder().addComponents(inputPix), new ActionRowBuilder().addComponents(inputNome));
  return modal;
}
function montarEmbedPixSuporte(suporteId) {
  const dados = SUPORTE_PIX[suporteId];
  if (!dados) {
    return new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle('⚠️ Sem Pix cadastrado')
      .setDescription('Essa pessoa ainda não se cadastrou no painel de cadastro Pix do suporte.');
  }
  return new EmbedBuilder()
    .setColor(COR_DOURADA)
    .setTitle('💳 Pix do Suporte')
    .addFields({ name: 'Nome:', value: dados.nome || 'Não informado' }, { name: 'Chave Pix:', value: dados.chave });
}

// ---------- RANKING DE SUPORTE ----------
function montarBotoesPainelRankingSuporte() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('rankingsuporte_ver').setLabel('Ranking').setEmoji(EMOJI_COROA_2).setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('rankingsuporte_meuperfil').setLabel('Meu Perfil').setEmoji(EMOJI_TROFEU).setStyle(ButtonStyle.Secondary)
  );
}
function montarEmbedMeuPerfilSuporte(usuario) {
  const dados = pegarDadosSuporte(usuario.id);
  const horas = segundosAcumulados(dados);
  const total = somarGanhosDesde(dados.ganhos, 0);
  const mediaHora = horas > 0 ? total / (horas / 3600) : 0;
  return new EmbedBuilder()
    .setColor(COR_DOURADA)
    .setAuthor({ name: `Perfil de ${usuario.username} (Suporte)`, iconURL: usuario.displayAvatarURL() })
    .setThumbnail(EMOJI_COLMEIA1_URL)
    .addFields(
      { name: `${EMOJI_DINDIN} Total:`, value: formatarValorBR(total) },
      { name: `${EMOJI_PROGRESSO} Horas trabalhando:`, value: formatarHoras(horas) },
      { name: `${EMOJI_MNRAMIO} Média/hora:`, value: formatarValorBR(mediaHora) },
      { name: 'Atendimentos feitos:', value: `${dados.atendimentos}` }
    );
}
async function montarEmbedRankingSuporte(guild, usuarioId) {
  const ordenado = Object.entries(DADOS_SUPORTE).sort((a, b) => (b[1].atendimentos || 0) - (a[1].atendimentos || 0));
  const top10 = ordenado.slice(0, 10);
  const linhas = await Promise.all(
    top10.map(async ([id, dados], i) => {
      const nome = await pegarNomeExibicao(guild, id);
      const marca = i === 0 ? `${EMOJI_COROA} ` : `${i + 1}. `;
      return `${marca}${nome} — ${dados.atendimentos || 0} atendimentos`;
    })
  );
  return new EmbedBuilder()
    .setColor(COR_DOURADA)
    .setTitle('🎧 Ranking de Suporte')
    .setThumbnail(EMOJI_COLMEIA1_URL)
    .setDescription(linhas.length ? linhas.join('\n') : 'Ninguém tem atendimentos registrados ainda.');
}

// ---------- SISTEMA DE TICKETS (Atendimento: Suporte / Reembolso) ----------

function montarEmbedPainelAtendimento() {
  return new EmbedBuilder()
    .setColor(COR_AMARELA)
    .setAuthor({ name: NOME_ORG })
    .setTitle(`👤 | Atendimento ${NOME_ORG}`)
    .setDescription(
      `🎧 **Suporte**: Tire dúvidas e fale com nossa equipe\n💰 **Reembolso**: Resolva questões de pagamentos\n\n` +
        'Selecione abaixo o tipo de atendimento. Certifique-se de já ter lido as **regras** do servidor.'
    );
}

function montarSelectAtendimento() {
  const select = new StringSelectMenuBuilder()
    .setCustomId('atendimento_menu')
    .setPlaceholder('Selecione o tipo de atendimento...')
    .addOptions(
      { label: 'Suporte', description: 'Dúvidas, problemas gerais ou ajuda', value: 'suporte', emoji: '📢' },
      { label: 'Reembolso', description: 'Solicite o reembolso de um pagamento', value: 'reembolso', emoji: '💰' }
    );
  return new ActionRowBuilder().addComponents(select);
}

function montarModalReembolso() {
  const modal = new ModalBuilder().setCustomId('modal_reembolso').setTitle('Informações de Pagamento');
  const inputPix = new TextInputBuilder()
    .setCustomId('input_chave_pix')
    .setLabel('Chave PIX')
    .setPlaceholder('Ex: email@exemplo.com ou CPF')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);
  const inputNome = new TextInputBuilder()
    .setCustomId('input_nome_completo')
    .setLabel('Nome Completo do Titular')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);
  const inputValor = new TextInputBuilder()
    .setCustomId('input_valor')
    .setLabel('Valor do Reembolso (R$)')
    .setPlaceholder('Ex: R$ 50,00')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);
  modal.addComponents(
    new ActionRowBuilder().addComponents(inputPix),
    new ActionRowBuilder().addComponents(inputNome),
    new ActionRowBuilder().addComponents(inputValor)
  );
  return modal;
}

function montarEmbedTicketReembolso(usuario, dados, suporteId) {
  return new EmbedBuilder()
    .setColor(COR_AMARELA)
    .setAuthor({ name: `| Ticket ${NOME_ORG}` })
    .setThumbnail(EMOJI_COLMEIA1_URL)
    .addFields(
      { name: 'Usuário:', value: `<@${usuario.id}>` },
      { name: 'Aberto em:', value: `<t:${Math.floor(Date.now() / 1000)}:R>` },
      { name: 'Assunto:', value: 'Reembolso' },
      { name: 'Atendimento:', value: suporteId ? `<@${suporteId}>` : 'Aguardando suporte' },
      {
        name: '\u200b',
        value: 'Olá! Descreva o que aconteceu com o máximo de detalhes (prints ajudam) e aguarde — só você, o suporte e a equipe veem este tópico.',
      },
      {
        name: '📄 Informações',
        value: `Chave PIX: ${dados.chave}\nNome Completo: ${dados.nome}\nValor do Reembolso: ${dados.valor}`,
      },
      {
        name: '💳 Pagamento',
        value: 'Toque em **Informar Mediador** pra indicar o nome do mediador e quanto ele deve.',
      }
    );
}

function montarBotoesTicketReembolso() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_informar_nome').setLabel('Informar Mediador').setEmoji('📌').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('ticket_resolvido').setLabel('Resolvido').setEmoji('✅').setStyle(ButtonStyle.Success)
  );
}

function montarModalInformarNome() {
  const modal = new ModalBuilder().setCustomId('modal_informar_nome').setTitle('Indicar Mediador');
  const inputNome = new TextInputBuilder()
    .setCustomId('input_nome_mediador')
    .setLabel('Nome do mediador (ou nome do Pix / @menção)')
    .setMaxLength(100)
    .setStyle(TextInputStyle.Short)
    .setRequired(true);
  const inputValor = new TextInputBuilder()
    .setCustomId('input_valor_devido')
    .setLabel('Quanto ele deve (R$)')
    .setPlaceholder('Ex: R$ 50,00')
    .setMaxLength(30)
    .setStyle(TextInputStyle.Short)
    .setRequired(true);
  modal.addComponents(new ActionRowBuilder().addComponents(inputNome), new ActionRowBuilder().addComponents(inputValor));
  return modal;
}

// As 4 opções mais comuns de suporte + "Outros".
function montarSelectProblemaSuporte() {
  const select = new StringSelectMenuBuilder()
    .setCustomId('suporte_menu_problema')
    .setPlaceholder('Qual é o seu problema?')
    .addOptions(
      { label: 'Dúvida sobre as regras', value: 'duvida_regras', emoji: '📚' },
      { label: 'Problema com pagamento', value: 'problema_pagamento', emoji: '💳' },
      { label: 'Erro ou bug no bot', value: 'erro_bot', emoji: '🐛' },
      { label: 'Denunciar um jogador', value: 'denunciar_jogador', emoji: '🚨' },
      { label: 'Outros', value: 'outros', emoji: '❓' }
    );
  return new ActionRowBuilder().addComponents(select);
}

function montarEmbedTicketSuporte(usuario, assunto, descricao, suporteId, ehPagamento) {
  const campos = [
    { name: 'Usuário:', value: `<@${usuario.id}>` },
    { name: 'Aberto em:', value: `<t:${Math.floor(Date.now() / 1000)}:R>` },
    { name: 'Assunto:', value: assunto },
    { name: 'Atendimento:', value: suporteId ? `<@${suporteId}>` : 'Aguardando suporte' },
    {
      name: '\u200b',
      value: 'Olá! Descreva seu problema com o máximo de detalhes (prints ajudam) e aguarde — só você, o suporte e a equipe veem este tópico.',
    },
  ];
  if (ehPagamento) {
    campos.push({
      name: '💳 Problema com pagamento',
      value: 'Toque em **Informar Mediador** pra indicar o nome do mediador e quanto ele deve.',
    });
  }
  if (descricao && descricao !== '.') campos.push({ name: '📄 Informações', value: `Descrição: ${descricao}` });

  return new EmbedBuilder()
    .setColor(COR_AMARELA)
    .setAuthor({ name: `| Ticket ${NOME_ORG}` })
    .setThumbnail(EMOJI_COLMEIA1_URL)
    .addFields(...campos);
}

function montarBotoesTicketSuporte(ehPagamento) {
  const botoes = [];
  if (ehPagamento) {
    botoes.push(new ButtonBuilder().setCustomId('ticket_informar_nome').setLabel('Informar Mediador').setEmoji('📌').setStyle(ButtonStyle.Primary));
  }
  botoes.push(new ButtonBuilder().setCustomId('ticket_resolvido').setLabel('Resolvido').setEmoji('✅').setStyle(ButtonStyle.Success));
  return new ActionRowBuilder().addComponents(...botoes);
}

// ---------- REGRAS DE USO DO TICKET ----------
// - Só dá pra abrir ticket se tiver suporte na fila de suporte.
// - Usar o ticket de novo enquanto já tem um aberto (2ª vez) faz o canal
//   do ticket SUMIR pra pessoa por 1 hora.
const TICKET_OCULTO_MS = 60 * 60 * 1000;
const CAMINHO_TICKETS_OCULTOS = path.join(DATA_DIR, 'tickets-ocultos.json');
function carregarTicketsOcultos() {
  try {
    return JSON.parse(fs.readFileSync(CAMINHO_TICKETS_OCULTOS, 'utf-8'));
  } catch (err) {
    return {};
  }
}
const ticketsOcultos = carregarTicketsOcultos(); // { userId: { canalId, expiraEm } }
const ticketsOcultosTimers = new Map();
function salvarTicketsOcultos() {
  escreverJsonAtomico(CAMINHO_TICKETS_OCULTOS, ticketsOcultos);
}

function agendarReexibirTicket(userId) {
  clearTimeout(ticketsOcultosTimers.get(userId));
  const registro = ticketsOcultos[userId];
  if (!registro) return;
  ticketsOcultosTimers.set(
    userId,
    setTimeout(async () => {
      delete ticketsOcultos[userId];
      ticketsOcultosTimers.delete(userId);
      salvarTicketsOcultos();
      const canal = await client.channels.fetch(registro.canalId).catch(() => null);
      if (canal) await canal.permissionOverwrites.delete(userId, 'Canal do ticket liberado de novo').catch(() => {});
    }, Math.max(0, registro.expiraEm - Date.now()))
  );
}

async function ocultarCanalTicket(canal, userId) {
  try {
    // type 1 = membro (permite usar só o ID da pessoa)
    await canal.permissionOverwrites.edit(userId, { ViewChannel: false }, { type: 1, reason: 'Usou o ticket duas vezes (oculto por 1 hora)' });
  } catch (err) {
    console.error('⚠️ Não consegui ocultar o canal do ticket (confira a permissão Gerenciar Canais):', err.message);
    return false;
  }
  ticketsOcultos[userId] = { canalId: canal.id, expiraEm: Date.now() + TICKET_OCULTO_MS };
  salvarTicketsOcultos();
  agendarReexibirTicket(userId);
  return true;
}

function retomarTicketsOcultos() {
  for (const userId of Object.keys(ticketsOcultos)) agendarReexibirTicket(userId);
}

async function acharTicketAberto(canal, usuario) {
  const ativos = await canal.threads.fetchActive().catch(() => null);
  if (!ativos) return null;
  return ativos.threads.find((t) => t.name === `suporte-${usuario.username}` || t.name === `reembolso-${usuario.username}`) || null;
}

// Retorna null se a pessoa pode abrir o ticket, ou { texto, textoOculto?, ocultar }.
async function bloquearAberturaDeTicket(interaction) {
  const aberto = await acharTicketAberto(interaction.channel, interaction.user);
  if (aberto) {
    return {
      texto: `🚫 Você já tem um ticket aberto: ${aberto}. Aguarde o atendimento nele.`,
      textoOculto: `🚫 Você já tem um ticket aberto: ${aberto}. Por usar o ticket de novo, esse canal ficou **oculto pra você por 1 hora**.`,
      ocultar: true,
    };
  }
  if (!filaSuporte.length) {
    return { texto: '⏳ Não há nenhum suporte disponível agora. Tente de novo mais tarde.', ocultar: false };
  }
  return null;
}

async function aplicarBloqueioTicket(interaction, bloqueio, usarUpdate) {
  let texto = bloqueio.texto;
  if (bloqueio.ocultar && (await ocultarCanalTicket(interaction.channel, interaction.user.id))) {
    texto = bloqueio.textoOculto;
  }
  if (usarUpdate) return interaction.update({ content: texto, components: [] });
  return interaction.reply({ content: texto, ephemeral: true });
}

// Pega (e remove) o primeiro mediador da fila. Retorna null se a fila
// estiver vazia -> nesse caso a ficha da partida mostra "Nenhum
// mediador disponível no momento."
// Confere se quem está na fila ainda pode mediar: continua com o cargo de
// mediador, continua no servidor e ainda tem Pix cadastrado.
async function mediadorAindaPodeMediar(mediadorId) {
  const dados = pegarDadosMediador(mediadorId);
  if (!dados || !dados.chave) return false;
  const guild = client.guilds.cache.first();
  if (!guild) return true;
  const membro = await guild.members.fetch(mediadorId).catch(() => null);
  if (!membro) return false;
  return membroPodeMediar(membro, guild);
}

async function pegarProximoMediador() {
  while (filaMediadores.length) {
    const mediadorId = filaMediadores.shift();

    if (!(await mediadorAindaPodeMediar(mediadorId))) {
      // perdeu o cargo / saiu / sem Pix: sai da fila, não pega partida
      encerrarSessaoAdm(mediadorId);
      continue;
    }

    // devolve pro fim da fila (revezamento) — assim, se só tiver 1
    // mediador, ele continua pegando toda partida; se tiver vários, cada
    // um pega na sua vez, de forma justa.
    filaMediadores.push(mediadorId);
    await atualizarPainelMediadorSeExistir();
    return mediadorId;
  }
  await atualizarPainelMediadorSeExistir();
  return null;
}

// ---------- PAINÉIS DE RANKING (jogador / ranking-adm) ----------

function montarBotoesPainelRanking() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ranking_ver').setLabel('Ranking').setEmoji(EMOJI_COROA_2).setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('ranking_meuperfil').setLabel('Meu Perfil').setEmoji(EMOJI_TROFEU).setStyle(ButtonStyle.Secondary)
  );
}

function montarBotoesPainelRankingAdm() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('rankingadm_ver').setLabel('Ranking').setEmoji(EMOJI_COROA_2).setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('rankingadm_meuperfil').setLabel('Meu Perfil').setEmoji(EMOJI_TROFEU).setStyle(ButtonStyle.Secondary)
  );
}

function montarEmbedPainelRankingGenerico(titulo, descricao) {
  return new EmbedBuilder().setColor(COR_DOURADA).setTitle(titulo).setThumbnail(EMOJI_ORG_URL).setDescription(descricao);
}

function montarEmbedMeuPerfilJogador(usuario) {
  const vitorias = RANKING_VITORIAS[usuario.id] || 0;
  return new EmbedBuilder()
    .setColor(COR_DOURADA)
    .setAuthor({ name: `Perfil de ${usuario.username}`, iconURL: usuario.displayAvatarURL() })
    .setThumbnail(usuario.displayAvatarURL())
    .addFields({ name: 'Vitórias:', value: `${vitorias}` });
}

async function montarEmbedRankingJogadores(guild, usuarioId) {
  const ordenado = Object.entries(RANKING_VITORIAS).sort((a, b) => b[1] - a[1]);
  const top10 = ordenado.slice(0, 10);

  const linhas = await Promise.all(
    top10.map(async ([id, vitorias], i) => {
      const nome = await pegarNomeExibicao(guild, id);
      const marca = i === 0 ? `${EMOJI_COROA} ` : `${i + 1}. `;
      return `${marca}${nome} — ${vitorias} vitórias`;
    })
  );

  const embed = new EmbedBuilder()
    .setColor(COR_DOURADA)
    .setTitle(`${EMOJI_TROFEU} Ranking de Vitórias`)
    .setThumbnail(EMOJI_COLMEIA1_URL)
    .setDescription(linhas.length ? linhas.join('\n') : 'Ninguém tem vitórias registradas ainda.');

  const posicao = ordenado.findIndex(([id]) => id === usuarioId);
  if (posicao >= 10) {
    embed.addFields({
      name: 'Sua posição:',
      value: `${posicao + 1}º lugar — ${RANKING_VITORIAS[usuarioId] || 0} vitórias`,
    });
  }

  return embed;
}

// Conta quantas entradas de uma lista [{ts, valor}] aconteceram a
// partir de uma data (ms) — usado pra "filas pegas" em cada período.
function contarDesde(lista, desdeTs) {
  return lista.filter((g) => g.ts >= desdeTs).length;
}

function inicioPeriodo(periodo) {
  const agora = Date.now();
  if (periodo === 'hoje') return new Date().setHours(0, 0, 0, 0);
  if (periodo === '3dias') return agora - 3 * 24 * 60 * 60 * 1000;
  if (periodo === '7dias') return agora - 7 * 24 * 60 * 60 * 1000;
  return 0; // total geral
}

const ROTULO_PERIODO = { hoje: 'Hoje', '3dias': 'Últimos 3 dias', '7dias': 'Últimos 7 dias', total: 'Total geral' };

function montarEmbedMeuPerfilAdm(usuario, periodo = 'total') {
  const dados = pegarDadosAdm(usuario.id);
  const desde = inicioPeriodo(periodo);
  const horas = segundosAcumulados(dados);
  const total = somarGanhosDesde(dados.ganhos, desde);
  const filas = contarDesde(dados.ganhos, desde);
  const mediaHora = horas > 0 ? total / (horas / 3600) : 0;

  return new EmbedBuilder()
    .setColor(COR_DOURADA)
    .setAuthor({ name: `Perfil de ${usuario.username} (Mediador)`, iconURL: usuario.displayAvatarURL() })
    .setThumbnail(EMOJI_COLMEIA1_URL)
    .setFooter({ text: ROTULO_PERIODO[periodo] })
    .addFields(
      { name: `${EMOJI_DINDIN} Total:`, value: formatarValorBR(total) },
      { name: `${EMOJI_PROGRESSO} Horas trabalhando:`, value: formatarHoras(horas) },
      { name: `${EMOJI_MNRAMIO} Média/hora:`, value: formatarValorBR(mediaHora) },
      { name: 'Filas pegas:', value: `${filas}` }
    );
}

function montarBotoesMeuPerfilAdm(periodo = 'total') {
  const estilo = (p) => (p === periodo ? ButtonStyle.Primary : ButtonStyle.Secondary);
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('perfiladm_hoje').setLabel('Hoje').setStyle(estilo('hoje')),
    new ButtonBuilder().setCustomId('perfiladm_3dias').setLabel('3 dias').setStyle(estilo('3dias')),
    new ButtonBuilder().setCustomId('perfiladm_7dias').setLabel('7 dias').setStyle(estilo('7dias'))
  );
}

async function montarEmbedRankingAdm(guild, usuarioId) {
  const agora = Date.now();
  const seteDias = agora - 7 * 24 * 60 * 60 * 1000;
  const trintaDias = agora - 30 * 24 * 60 * 60 * 1000;

  const entradas = Object.entries(DADOS_ADM).map(([id, dados]) => ({
    id,
    semanal: somarGanhosDesde(dados.ganhos, seteDias),
    mensal: somarGanhosDesde(dados.ganhos, trintaDias),
    total: somarGanhosDesde(dados.ganhos, 0),
  }));

  async function montarTop(chave) {
    const top = entradas.filter((e) => e[chave] > 0).sort((a, b) => b[chave] - a[chave]).slice(0, 10);
    if (!top.length) return 'Ninguém registrou ganhos ainda.';
    const linhas = await Promise.all(
      top.map(async (e, i) => {
        const nome = await pegarNomeExibicao(guild, e.id);
        const marca = i === 0 ? `${EMOJI_COROA} ` : `${i + 1}. `;
        return `${marca}${nome} — ${formatarValorBR(e[chave])}`;
      })
    );
    return linhas.join('\n');
  }

  const meusDados = pegarDadosAdm(usuarioId);

  return new EmbedBuilder()
    .setColor(COR_DOURADA)
    .setTitle(`${EMOJI_TROFEU} Ranking-ADM (Mediadores)`)
    .setThumbnail(EMOJI_COLMEIA1_URL)
    .addFields(
      { name: 'Top 10 da semana:', value: await montarTop('semanal') },
      { name: 'Top 10 do mês:', value: await montarTop('mensal') },
      { name: 'Top 10 total:', value: await montarTop('total') },
      {
        name: 'Minha posição (total):',
        value: `${formatarValorBR(somarGanhosDesde(meusDados.ganhos, 0))} arrecadados · ${formatarHoras(segundosAcumulados(meusDados))} trabalhados`,
      }
    );
}

// Cria o tópico da partida quando uma fila fecha (usado tanto quando a
// fila enche normalmente quanto quando alguém volta pra fila depois de
// um cancelamento rápido).
async function criarPartidaDaFila(instancia, filaAlvo, jogadores, canalFallback) {
  const nomeFila = instancia.filasDef.find((f) => f.key === filaAlvo).label;
  const numeroFila = gerarNumeroFilaAleatorio();

  try {
    const canalPainel = (await client.channels.fetch(CANAL_FILAS_ID).catch(() => null)) || canalFallback;

    const topico = await canalPainel.threads.create({
      name: `fila-${numeroFila}`,
      type: ChannelType.PrivateThread,
      autoArchiveDuration: 60,
      reason: `Partida ${instancia.rotuloFormato} ${nomeFila} entre ${jogadores.join(', ')}`,
    });

    for (const jogadorId of jogadores) {
      await topico.members.add(jogadorId);
    }

    const mediadorId = await pegarProximoMediador();
    if (mediadorId) await topico.members.add(mediadorId).catch(() => {});

    const partida = {
      jogadores,
      confirmados: new Set(),
      nomeFila,
      numeroFila,
      rotuloFormato: instancia.rotuloFormato,
      valor: instancia.valor,
      mediadorId,
      vencedorId: null,
      cancelando: false,
      aguardandoPagamento: false,
      // usados no cancelamento rápido (quem não cancelou volta pra mesma fila)
      painelId: instancia.id,
      filaKey: filaAlvo,
      criadaEm: Date.now(),
    };

    await topico.send({
      // "@👁" no lugar do mediador de propósito: quem vai mediar já
      // foi sorteado, mas só é revelado de verdade na ficha, depois
      // que os 2 confirmarem.
      content: `${jogadores.map((id) => `<@${id}>`).join(' ')}${mediadorId ? ' @👁' : ''}`,
      embeds: [montarEmbedConfirmacao(partida)],
      components: [montarBotoesConfirmacao()],
    });

    // card de "Regras Padrão" já na fase de aguardando confirmação,
    // logo embaixo do Confirmar/Cancelar — some sozinho quando todo
    // mundo confirmar (e é mandado de novo embaixo da ficha da sala)
    const mensagemRegrasAguardando = await topico.send({ embeds: [montarEmbedRegrasPadrao()] }).catch(() => null);
    if (mensagemRegrasAguardando) partida.mensagensConfirmacao = [mensagemRegrasAguardando];

    partidas.set(topico.id, partida);
    salvarPartidas();
  } catch (err) {
    console.error('Erro ao criar tópico da partida:', err);
    if (canalFallback) await canalFallback.send(
      `🎮 **Confronto encontrado (${instancia.rotuloFormato} - ${nomeFila})!** ${jogadores.map((id) => `<@${id}>`).join(' ')}\n⚠️ Não consegui criar o tópico automático — confira as permissões do bot (Criar Tópicos Privados / Gerenciar Tópicos).`
    );
  }
}

// Cancelamento rápido: se um jogador cancela a partida até
// CANCELAMENTO_RAPIDO_MS depois do tópico ser criado (antes de confirmar),
// quem NÃO cancelou volta pro começo da mesma fila e pega outro
// adversário — e, se já tiver alguém esperando, o tópico é criado de novo
// na hora. Repete até a partida ser confirmada.
const CANCELAMENTO_RAPIDO_MS = 10 * 1000;

async function atualizarPainelPorMensagem(instancia) {
  if (!instancia.msgCanalId || !instancia.msgId) return;
  try {
    const canal = await client.channels.fetch(instancia.msgCanalId);
    const mensagem = await canal.messages.fetch(instancia.msgId);
    const indice = mensagem.components.findIndex((linha) =>
      linha.components.some((botao) => botao.customId && botao.customId.endsWith(`:${instancia.id}`))
    );
    if (indice === -1) {
      await mensagem.edit({ embeds: [montarEmbedPainel(instancia)], components: [montarBotoesPainel(instancia)] });
      return;
    }
    const novosEmbeds = mensagem.embeds.map((e) => EmbedBuilder.from(e));
    const novosComponents = mensagem.components.map((linha) => ActionRowBuilder.from(linha));
    novosEmbeds[indice] = montarEmbedPainel(instancia);
    novosComponents[indice] = montarBotoesPainel(instancia);
    await mensagem.edit({ embeds: novosEmbeds, components: novosComponents });
  } catch (err) {
    console.error('⚠️ Não consegui atualizar o painel da fila:', err.message);
  }
}

async function recolocarNaFilaAposCancelamentoRapido(partida, jogadoresIds) {
  const instancia = painelInstancias.get(partida.painelId);
  if (!instancia || !instancia.filas[partida.filaKey]) return;

  const fila = instancia.filas[partida.filaKey];
  const voltaram = [];
  for (const id of jogadoresIds) {
    if (Object.keys(instancia.filas).some((k) => instancia.filas[k].includes(id))) continue; // já entrou de novo sozinho
    if (contarFilasDoUsuario(id) >= MAX_FILAS_SIMULTANEAS) continue;
    voltaram.push(id);
  }
  if (!voltaram.length) return;

  // quem estava esperando antes fica na frente da fila
  fila.unshift(...voltaram);

  let novosJogadores = null;
  if (fila.length >= instancia.capacidade) {
    novosJogadores = fila.splice(0, instancia.capacidade);
  }
  salvarPaineisFila();
  await atualizarPainelPorMensagem(instancia);

  if (novosJogadores) {
    const canalPainel = await client.channels.fetch(CANAL_FILAS_ID).catch(() => null);
    await criarPartidaDaFila(instancia, partida.filaKey, novosJogadores, canalPainel);
  }
}

// ---------- CANCELAMENTO (compartilhado entre as duas etapas) ----------

async function executarCancelamento(thread, partida) {
  partida.cancelando = true;
  salvarPartidas();

  await thread.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0xe74c3c)
        .setAuthor({ name: NOME_ORG })
        .setTitle('❌ Partida cancelada'),
    ],
  });

  // remove os jogadores do tópico -> Discord gera a mensagem nativa
  // "Colmeia Bot removeu @fulano do tópico" automaticamente.
  for (const jogadorId of partida.jogadores) {
    await thread.members.remove(jogadorId).catch(() => {});
  }

  partidas.delete(thread.id);
  salvarPartidas();

  await thread.delete().catch(() => {});
}

// ---------- PIX AUTOMÁTICO (confirmação de pagamento nas filas) ----------
// Cada MEDIADOR cadastra a própria API (Mercado Pago) no painel
// !painelapi. Só nas partidas cujo mediador tem API cadastrada o bot
// mostra o exemplo de pagamento e confirma o Pix; sem API, fica em
// silêncio. A API fica no arquivo pix-apis.json (use Volume no Railway).

const CAMINHO_PIX_APIS = path.join(DATA_DIR, 'pix-apis.json');
const JANELA_PIX_MINUTOS = parseInt(process.env.JANELA_PIX_MINUTOS || '30', 10);
const COR_PIX_VERDE = 0x2ecc71;
const COR_PIX_VERMELHA = 0xe74c3c;
// "pg Fulano", "pago Fulano Silva", "paguei ...", "att pago ..."
const REGEX_PAGO_PIX = /^\s*(?:att\s+)?(?:pg|pago|paguei)\b[\s:,-]*([\s\S]*)$/i;

function carregarPixApis() {
  try {
    const d = JSON.parse(fs.readFileSync(CAMINHO_PIX_APIS, 'utf-8'));
    return { apis: d.apis || {}, usados: d.usados || [] };
  } catch (err) {
    return { apis: {}, usados: [] };
  }
}
const pixDados = carregarPixApis();

function salvarPixApis() {
  if (pixDados.usados.length > 2000) pixDados.usados = pixDados.usados.slice(-2000);
  escreverJsonAtomico(CAMINHO_PIX_APIS, pixDados);
}

function apiDoMediador(mediadorId) {
  return (mediadorId && pixDados.apis[mediadorId]) || null;
}

const pixEsperar = (ms) => new Promise((r) => setTimeout(r, ms));

function pixTokensNome(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function pixTituloNome(nome) {
  return String(nome || '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

// Nome informado ("Daniel Campelo" ou "Daniel pelo") x nome do pagador:
// primeiro nome igual + final do sobrenome batendo.
function pixNomeConfere(informado, pagador) {
  const a = pixTokensNome(informado);
  const b = pixTokensNome(pagador);
  if (a.length < 2 || b.length < 2) return false;
  if (!b[0].startsWith(a[0]) && !a[0].startsWith(b[0])) return false;
  const ultInf = a[a.length - 1];
  if (ultInf.length < 2) return false;
  const ultPag = b[b.length - 1];
  return ultPag.endsWith(ultInf) || b.slice(1).some((t) => t.endsWith(ultInf));
}

// ----- provedor: Mercado Pago (pra outro provedor, troque só estas 2) -----
async function validarApiMercadoPago(token) {
  const r = await fetch('https://api.mercadopago.com/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) return null;
  return r.json();
}

// Retorna [{ id, valor, nome, quando }] dos Pix aprovados recentes.
async function buscarPagamentosRecentes(token, minutos) {
  const url =
    'https://api.mercadopago.com/v1/payments/search' +
    '?sort=date_created&criteria=desc&range=date_created' +
    `&begin_date=NOW-${minutos}MINUTES&end_date=NOW&status=approved&limit=50`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`Mercado Pago respondeu ${r.status}`);
  const json = await r.json();

  return (json.results || [])
    .filter((p) => p.payment_method_id === 'pix')
    .map((p) => {
      const banco = p.point_of_interaction?.transaction_data?.bank_info?.payer || {};
      const pagador = p.payer || {};
      const extra = p.additional_info?.payer || {};
      const nome =
        banco.long_name ||
        [pagador.first_name, pagador.last_name].filter(Boolean).join(' ') ||
        [extra.first_name, extra.last_name].filter(Boolean).join(' ') ||
        '';
      return {
        id: String(p.id),
        valor: Number(p.transaction_amount),
        nome,
        quando: new Date(p.date_approved || p.date_created).getTime(),
      };
    });
}

// ----- embeds do fluxo de pagamento -----
function montarEmbedExemploPix(partida) {
  const quem = partida.jogadores.length > 1 ? 'todos os jogadores' : 'o jogador';
  return new EmbedBuilder()
    .setColor(COR_AMARELA)
    .setDescription(
      '```diff\n+ PAGAMENTO VIA PIX! 🟢\n```\n' +
        `Assim que **${quem}** tiverem o pagamento confirmado, a sala será criada automaticamente.\n\n` +
        '**Após concluir o PIX, envie no chat uma das mensagens abaixo:**\n' +
        '```\n→ PAGO + NOME E SOBRENOME\n→ PG + NOME E SOBRENOME\n→ PAGUEI + NOME E SOBRENOME\n```\n' +
        '(pode ser o nome completo do Pix, ou o nome + o final do sobrenome)\n\n' +
        '⏳ **Aguarde alguns instantes enquanto o sistema valida sua transferência.**'
    );
}

function montarEmbedVerificandoPix(valor) {
  return new EmbedBuilder()
    .setColor(COR_AMARELA)
    .setTitle('🔎 Verificando Pix...')
    .setDescription(`Valor esperado: **${formatarValorBR(valor)}**`);
}

function montarEmbedPixConfirmado(partida, valor, nome) {
  const falta = partida.jogadores.length - partida.pixPagos.length;
  return new EmbedBuilder()
    .setColor(COR_PIX_VERDE)
    .setTitle('Pix confirmado 🟢')
    .setDescription(
      `**${nome}**\nValor: **${formatarValorBR(valor)}**\n\n` +
        `⏳ Esperando ${falta === 1 ? 'outro jogador' : `mais ${falta} jogadores`} fazer o pagamento ` +
        `(${partida.pixPagos.length}/${partida.jogadores.length}).`
    );
}

function montarEmbedPixNaoEncontrado(valor) {
  return new EmbedBuilder()
    .setColor(COR_PIX_VERMELHA)
    .setTitle('❌ Pix não encontrado')
    .setDescription(
      `Não achei um Pix de **${formatarValorBR(valor)}** com esse nome.\n` +
        'Confira o nome e o valor e mande de novo: `pg Nome Sobrenome`.'
    );
}

function montarEmbedCriandoSala() {
  return new EmbedBuilder()
    .setColor(COR_AMARELA)
    .setTitle('🛠️ Criando sala...')
    .setDescription('Todos os pagamentos foram confirmados 🟢');
}

// ----- estado do pagamento (guardado dentro da própria partida) -----
const pixTravas = new Map();
function comTravaPix(id, fn) {
  const anterior = pixTravas.get(id) || Promise.resolve();
  const proxima = anterior.then(fn, fn).catch((e) => console.error('⚠️ Erro no Pix do tópico', id, e));
  pixTravas.set(id, proxima);
  return proxima;
}

async function pixApagarMensagem(canal, msgId) {
  if (!msgId) return;
  await canal.messages.delete(msgId).catch(() => {});
}

// Manda a mensagem nova e apaga a anterior do fluxo de pagamento.
async function enviarStatusPix(thread, partida, payload) {
  const antiga = partida.pixStatusMsgId;
  const nova = await thread.send(payload).catch(() => null);
  partida.pixStatusMsgId = nova ? nova.id : null;
  await pixApagarMensagem(thread, antiga);
  salvarPartidas();
  return nova;
}

// Aviso de comprovante (texto puro, em vermelho via bloco ansi) — só aparece
// quando o mediador da partida NÃO cadastrou API.
const TEXTO_PEDIR_COMPROVANTE =
  '```ansi\n' +
  '\u001b[1;31m📩 ━━━━━━━━━━━━━━━━━━━━━━━\n' +
  '     MANDEM O COMPROVANTE\n' +
  '━━━━━━━━━━━━━━━━━━━━━━━\n' +
  '\n' +
  '📩 Mandem o comprovante do Pix\n' +
  'aqui no chat para confirmar\n' +
  'o pagamento!\n' +
  '\n' +
  '━━━━━━━━━━━━━━━━━━━━━━━\u001b[0m\n' +
  '```';

// Exemplo de "pg + nome" embaixo das regras — só se o mediador tem API.
async function enviarExemploPix(thread, partida) {
  if (!apiDoMediador(partida.mediadorId)) {
    // mediador SEM API: pede o comprovante do Pix no chat (texto, em vermelho)
    const antigoComprovante = partida.pixComprovanteMsgId;
    const msgComprovante = await thread.send({ content: TEXTO_PEDIR_COMPROVANTE }).catch(() => null);
    partida.pixComprovanteMsgId = msgComprovante ? msgComprovante.id : null;
    await pixApagarMensagem(thread, antigoComprovante);
    salvarPartidas();
    return;
  }
  const antigo = partida.pixExemploMsgId;
  const novo = await thread.send({ embeds: [montarEmbedExemploPix(partida)] }).catch(() => null);
  partida.pixExemploMsgId = novo ? novo.id : null;
  await pixApagarMensagem(thread, antigo);
  salvarPartidas();
}

// Nova rodada (revanche): zera os pagamentos e só aceita Pix a partir de agora.
async function reiniciarPixPartida(thread, partida) {
  await pixApagarMensagem(thread, partida.pixStatusMsgId);
  partida.pixPagos = [];
  partida.pixCompleto = false;
  partida.pixStatusMsgId = null;
  partida.pixDesde = Date.now();
  salvarPartidas();
}

async function avisoTemporario(canal, texto, ms = 8000) {
  const aviso = await canal.send(texto).catch(() => null);
  if (aviso) setTimeout(() => aviso.delete().catch(() => {}), ms);
}

async function processarPagamentoPix(message, partida, nomeInformado) {
  const thread = message.channel;
  const api = apiDoMediador(partida.mediadorId);
  if (!api) return;

  if (!partida.pixPagos) partida.pixPagos = [];

  if (partida.pixCompleto) {
    return avisoTemporario(thread, '✅ Os pagamentos desta partida já foram confirmados.');
  }
  if (partida.pixPagos.some((p) => p.userId === message.author.id)) {
    return avisoTemporario(thread, `<@${message.author.id}> seu Pix já está confirmado 🟢`);
  }
  if (pixTokensNome(nomeInformado).length < 2) {
    return avisoTemporario(thread, `<@${message.author.id}> mande o nome e sobrenome do Pix. Ex.: \`pg Daniel Campelo\``, 10000);
  }

  // valor que o jogador paga = valor da fila + taxa do mediador
  const valor = valorFilaMaisTaxa(partida.valor);
  const desde = (partida.pixDesde || thread.createdTimestamp) - 60000;

  await enviarStatusPix(thread, partida, { embeds: [montarEmbedVerificandoPix(valor)] });

  // o Pix pode demorar uns segundos pra aparecer: tenta algumas vezes
  let achado = null;
  for (let tentativa = 0; tentativa < 4 && !achado; tentativa++) {
    if (tentativa > 0) await pixEsperar(6000);
    let lista;
    try {
      lista = await buscarPagamentosRecentes(api.token, JANELA_PIX_MINUTOS);
    } catch (err) {
      console.error('⚠️ Erro ao consultar a API de pagamento:', err.message);
      continue;
    }
    achado = lista.find(
      (p) =>
        !pixDados.usados.includes(p.id) &&
        Math.abs(p.valor - valor) < 0.005 &&
        p.quando >= desde &&
        pixNomeConfere(nomeInformado, p.nome)
    );
  }

  if (!achado) {
    await enviarStatusPix(thread, partida, { embeds: [montarEmbedPixNaoEncontrado(valor)] });
    return;
  }

  pixDados.usados.push(achado.id);
  salvarPixApis();
  const nomeCompleto = pixTituloNome(achado.nome);
  partida.pixPagos.push({ userId: message.author.id, nome: nomeCompleto, paymentId: achado.id, em: Date.now() });
  salvarPartidas();

  if (partida.pixPagos.length >= partida.jogadores.length) {
    partida.pixCompleto = true;
    await enviarStatusPix(thread, partida, { embeds: [montarEmbedCriandoSala()] });
    // a criação da sala em si continua com o fluxo/bot de salas
    client.emit('salaPix', thread, partida);
  } else {
    await enviarStatusPix(thread, partida, { embeds: [montarEmbedPixConfirmado(partida, valor, nomeCompleto)] });
  }
}

// ---------- PIX POR COMPROVANTE (só quando o mediador NÃO tem API) ----------
// O jogador manda a FOTO do comprovante no tópico da partida. O bot lê a
// imagem (OCR com tesseract.js), confere o VALOR (valor da fila + taxa) e se
// o DESTINATÁRIO é o mediador (chave Pix ou nome cadastrado) e só então
// confirma. Nada é aprovado sem a leitura bater. Cada comprovante só vale
// uma vez (código da transação ou hash da imagem). Sem tesseract.js
// instalado, o bot não confirma nada (avisa e o mediador confere na mão).
// OBS: leitura de imagem NÃO detecta comprovante editado/falso — o mediador
// deve sempre conferir o dinheiro no app do banco dele.

const TEMPO_VERIFICANDO_COMPROVANTE_MS = 5000;
const TEMPO_MAX_OCR_MS = 30000;
const LIMITE_IMAGEM_COMPROVANTE = 8 * 1024 * 1024; // 8 MB

let pixOcrWorkerPromessa = null;
function pegarWorkerOcr() {
  if (!pixOcrWorkerPromessa) {
    pixOcrWorkerPromessa = (async () => {
      const { createWorker } = require('tesseract.js');
      return createWorker('por', 1, { cachePath: DATA_DIR });
    })().catch((err) => {
      pixOcrWorkerPromessa = null; // tenta de novo na próxima
      throw err;
    });
  }
  return pixOcrWorkerPromessa;
}

function comTimeout(promessa, ms, msg) {
  let t;
  const limite = new Promise((_, rej) => {
    t = setTimeout(() => rej(new Error(msg)), ms);
  });
  return Promise.race([promessa, limite]).finally(() => clearTimeout(t));
}

async function baixarImagemComprovante(anexo) {
  const r = await fetch(anexo.url);
  if (!r.ok) throw new Error(`Download da imagem falhou (${r.status})`);
  return Buffer.from(await r.arrayBuffer());
}

// Melhora a imagem pro OCR (cinza + contraste + amplia se pequena).
async function prepararImagemParaOcr(buffer) {
  try {
    const img = await Jimp.read(buffer);
    if (img.bitmap.width < 1200) img.scale(Math.min(3, 1500 / img.bitmap.width));
    img.grayscale().normalize().contrast(0.25);
    return await img.getBufferAsync(Jimp.MIME_PNG);
  } catch (err) {
    return buffer;
  }
}

async function lerTextoComprovante(buffer) {
  const worker = await pegarWorkerOcr();
  const preparada = await prepararImagemParaOcr(buffer);
  const resultado = await comTimeout(worker.recognize(preparada), TEMPO_MAX_OCR_MS, 'OCR demorou demais');
  return String((resultado && resultado.data && resultado.data.text) || '');
}

function textoSemAcento(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

// Todos os valores "0,00" que aparecem no comprovante.
function extrairValoresDoTexto(texto) {
  const valores = [];
  const re = /(\d{1,3}(?:\.\d{3})*|\d+),(\d{2})(?!\d)/g;
  let m;
  while ((m = re.exec(texto))) {
    valores.push(Number(m[1].replace(/\./g, '') + '.' + m[2]));
  }
  return valores;
}

// O destinatário do comprovante é o mediador? (chave Pix OU nome cadastrado)
function comprovanteEhDoMediador(texto, mediadorId) {
  const plano = textoSemAcento(texto);
  const digitos = plano.replace(/\D/g, '');
  const dados = pegarDadosMediador(mediadorId);
  const chave = normalizarChavePix(pegarChavePix(mediadorId) || '');

  if (chave) {
    if (chave.includes('@')) {
      if (plano.includes(chave.toLowerCase())) return true;
    } else if (/^[0-9a-f]{8}-/.test(chave)) {
      const blocos = chave.split('-');
      if (plano.includes(chave) || (plano.includes(blocos[0]) && plano.includes(blocos[4]))) return true;
    } else if (chave.startsWith('+')) {
      const num = chave.replace(/\D/g, '').replace(/^55/, '');
      if (num.length >= 10 && (digitos.includes(num) || digitos.includes(num.slice(2)))) return true;
    } else if (/^\d{11}$/.test(chave)) {
      // CPF: os bancos mostram mascarado (***.456.789-**) — confere o miolo
      if (digitos.includes(chave) || plano.includes(`${chave.slice(3, 6)}.${chave.slice(6, 9)}`)) return true;
    } else if (/^\d{14}$/.test(chave)) {
      if (digitos.includes(chave) || plano.includes(`${chave.slice(0, 2)}.${chave.slice(2, 5)}.${chave.slice(5, 8)}`)) return true;
    }
  }

  const tokensNome = pixTokensNome(dados && dados.nome).filter((t) => t.length > 2);
  if (tokensNome.length >= 2 && tokensNome.every((t) => plano.includes(t))) return true;

  return false;
}

// Código da transação (E2E) do comprovante, se aparecer.
function extrairCodigoTransacao(texto) {
  const m = String(texto).replace(/\s+/g, '').match(/E\d{8}[0-9A-Za-z]{23}/);
  return m ? m[0] : null;
}

// Tenta achar o nome de quem PAGOU (seção de origem do comprovante).
function extrairNomePagador(texto) {
  const linhas = String(texto)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const iOrigem = linhas.findIndex((l) => /^(origem|pagador|quem pagou|quem enviou|de\b|dados de quem pagou)/i.test(textoSemAcento(l)));
  const iDestino = linhas.findIndex((l) => /^(destino|para\b|recebedor|favorecido|quem recebeu|dados de quem recebeu)/i.test(textoSemAcento(l)));
  let trecho = linhas;
  if (iOrigem >= 0) {
    trecho = iDestino > iOrigem ? linhas.slice(iOrigem, iDestino) : linhas.slice(iOrigem);
  } else if (iDestino > 0) {
    trecho = linhas.slice(0, iDestino);
  }
  for (let i = 0; i < trecho.length; i++) {
    const l = trecho[i];
    const mesmo = l.match(/^nome[:\s]+(.{5,60})$/i);
    if (mesmo && pixTokensNome(mesmo[1]).length >= 2) return pixTituloNome(mesmo[1]);
    if (/^nome:?$/i.test(l) && trecho[i + 1] && pixTokensNome(trecho[i + 1]).length >= 2) return pixTituloNome(trecho[i + 1]);
  }
  return null;
}

// ----- embeds do fluxo por comprovante -----
function montarEmbedVerificandoComprovante(valor) {
  return new EmbedBuilder()
    .setColor(COR_AMARELA)
    .setTitle('🔎 Verificando comprovante...')
    .setDescription(`Valor esperado: **${formatarValorBR(valor)}**`);
}

function montarEmbedComprovanteConfirmado(partida, valor, nome, userId) {
  const falta = partida.jogadores.length - partida.pixPagos.length;
  return new EmbedBuilder()
    .setColor(COR_PIX_VERDE)
    .setTitle('Comprovante confirmado 🟢')
    .setDescription(
      `**${nome}** (<@${userId}>)\n` +
        `Valor: **${formatarValorBR(valor)}**\n` +
        `Chave Pix: **${pegarChavePix(partida.mediadorId)}**\n\n` +
        `⏳ Falta só ${falta === 1 ? 'mais 1 jogador' : `mais ${falta} jogadores`} mandar o comprovante ` +
        `(${partida.pixPagos.length}/${partida.jogadores.length}).`
    );
}

function montarEmbedComprovanteRecusado(motivo) {
  return new EmbedBuilder()
    .setColor(COR_PIX_VERMELHA)
    .setTitle('❌ Comprovante não validado')
    .setDescription(`${motivo}\n\nMande uma foto/print **nítido** do comprovante completo ou aguarde o mediador conferir.`);
}

function montarEmbedComprovantesCompletos(partida, valor) {
  return new EmbedBuilder()
    .setColor(COR_PIX_VERDE)
    .setTitle('Todos os comprovantes confirmados 🟢')
    .setDescription(
      `Pagamento de **${formatarValorBR(valor)}** conferido para ` +
        `${partida.jogadores.map((id) => `<@${id}>`).join(', ')}.\n\n` +
        '🛠️ **A sala está sendo criada...**\n' +
        'Fiquem no tópico e aguardem o mediador enviar o ID e a senha da sala. Boa partida e boa sorte no Free Fire! 🍀'
    );
}

async function processarComprovanteImagem(message, partida, anexo) {
  const thread = message.channel;
  if (!partida.pixPagos) partida.pixPagos = [];
  if (partida.pixCompleto) return;
  if (partida.pixPagos.some((p) => p.userId === message.author.id)) {
    return avisoTemporario(thread, `<@${message.author.id}> seu comprovante já está confirmado 🟢`);
  }

  const valor = valorFilaMaisTaxa(partida.valor);
  const inicio = Date.now();
  await enviarStatusPix(thread, partida, { embeds: [montarEmbedVerificandoComprovante(valor)] });

  let motivoRecusa = null;
  let textoOcr = '';
  let hash = null;
  try {
    const buffer = await baixarImagemComprovante(anexo);
    hash = require('crypto').createHash('sha256').update(buffer).digest('hex');
    textoOcr = await lerTextoComprovante(buffer);
  } catch (err) {
    console.error('⚠️ Erro ao ler o comprovante:', err.message);
    motivoRecusa = /Cannot find module/.test(err.message)
      ? 'A leitura de comprovantes não está ativada neste bot. Chame o mediador para conferir.'
      : 'Não consegui ler a imagem.';
  }

  if (!motivoRecusa) {
    const valores = extrairValoresDoTexto(textoOcr);
    const codigo = extrairCodigoTransacao(textoOcr);
    const idUnico = `comp:${codigo || hash}`;
    if (!valores.some((v) => Math.abs(v - valor) < 0.005)) {
      motivoRecusa = `Não encontrei o valor de **${formatarValorBR(valor)}** no comprovante.`;
    } else if (!comprovanteEhDoMediador(textoOcr, partida.mediadorId)) {
      motivoRecusa = 'O comprovante não parece ser um Pix para a chave do mediador desta partida.';
    } else if (pixDados.usados.includes(idUnico) || (hash && pixDados.usados.includes(`comp:${hash}`))) {
      motivoRecusa = 'Esse comprovante já foi usado antes.';
    } else {
      pixDados.usados.push(idUnico);
      if (hash && idUnico !== `comp:${hash}`) pixDados.usados.push(`comp:${hash}`);
      salvarPixApis();
    }
  }

  // fica "Verificando comprovante" por pelo menos 5 segundos
  const resto = TEMPO_VERIFICANDO_COMPROVANTE_MS - (Date.now() - inicio);
  if (resto > 0) await pixEsperar(resto);

  if (motivoRecusa) {
    await enviarStatusPix(thread, partida, { embeds: [montarEmbedComprovanteRecusado(motivoRecusa)] });
    return;
  }

  const nome = extrairNomePagador(textoOcr) || message.member?.displayName || message.author.username;
  partida.pixPagos.push({ userId: message.author.id, nome, comprovante: true, em: Date.now() });
  salvarPartidas();

  if (partida.pixPagos.length >= partida.jogadores.length) {
    partida.pixCompleto = true;
    await enviarStatusPix(thread, partida, { embeds: [montarEmbedComprovantesCompletos(partida, valor)] });
    // a criação da sala em si continua com o fluxo/bot de salas
    client.emit('salaPix', thread, partida);
  } else {
    await enviarStatusPix(thread, partida, {
      embeds: [montarEmbedComprovanteConfirmado(partida, valor, nome, message.author.id)],
    });
  }
}

// ----- painel !painelapi (cada mediador cuida da própria API) -----
function montarEmbedPainelApiPix() {
  return new EmbedBuilder()
    .setColor(COR_AMARELA)
    .setAuthor({ name: NOME_ORG })
    .setTitle('🔑 API de pagamento')
    .setDescription(
      'Mediador: cadastre a **API do seu banco** pra o bot confirmar os Pix das suas filas.\n' +
        'Sem API cadastrada, o bot não faz a verificação automática nas suas partidas.'
    );
}

function montarBotoesPainelApiPix() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('pixapi_cadastrar').setLabel('Cadastrar API').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('pixapi_nova').setLabel('Gerar nova').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('pixapi_excluir').setLabel('Excluir API').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('pixapi_ver').setLabel('Minha API').setStyle(ButtonStyle.Secondary)
  );
}

function montarModalApiPix(customId, titulo) {
  return new ModalBuilder()
    .setCustomId(customId)
    .setTitle(titulo)
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('token')
          .setLabel('API do seu banco')
          .setPlaceholder('Cole aqui o token de acesso (API) do seu banco')
          .setStyle(TextInputStyle.Short)
          .setMinLength(20)
          .setMaxLength(300)
          .setRequired(true)
      )
    );
}

async function salvarNovaApiPix(interaction, substituir) {
  const token = interaction.fields.getTextInputValue('token').trim();
  await interaction.deferReply({ ephemeral: true });

  const conta = await validarApiMercadoPago(token).catch(() => null);
  if (!conta) {
    return interaction.editReply('❌ Essa API não é válida (o banco recusou). Confira o token e tente de novo.');
  }

  // substituir = a antiga é apagada e a nova entra no lugar
  pixDados.apis[interaction.user.id] = {
    token,
    provider: 'mercadopago',
    conta: conta.nickname || conta.email || String(conta.id),
    em: Date.now(),
  };
  salvarPixApis();

  return interaction.editReply(
    substituir
      ? '✅ API nova salva. A antiga foi excluída do sistema.'
      : '✅ API cadastrada no sistema. Suas filas agora têm verificação de Pix.'
  );
}

// ---------- GOOGLE MEET (painel !painelmeet) ----------
// Cria a reunião como um EVENTO do Google Agenda com Meet (assim ela tem
// o nome "Colmeia Inspector" e dá pra apagar de verdade). O link aparece
// SÓ pra quem clicou (mensagem privada), com Abrir / Copiar / Deletar.
// - Deletar apaga só a reunião DAQUELE botão (cada pessoa só apaga as
//   que ela mesma criou).
// - Se ninguém apertar Deletar, a reunião é apagada sozinha depois de
//   MEET_DURACAO_MIN minutos (padrão 30), mesmo se o bot reiniciar.
// Variáveis: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
// (escopos: calendar.events e meetings.space.settings), e opcionais:
// MEET_NOME ("Colmeia Inspector"), MEET_DURACAO_MIN (30),
// MEET_MAX_POR_PESSOA (5), MEET_ACESSO (OPEN | TRUSTED | RESTRICTED).
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN || '';
const MEET_NOME = process.env.MEET_NOME || 'Colmeia Inspector';
const MEET_DURACAO_MIN = parseInt(process.env.MEET_DURACAO_MIN || '30', 10);
const MEET_MAX_POR_PESSOA = parseInt(process.env.MEET_MAX_POR_PESSOA || '5', 10);
const MEET_ACESSO = (process.env.MEET_ACESSO || 'OPEN').toUpperCase();
const meetConfigurado = () => Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_REFRESH_TOKEN);

// reuniões ativas, guardadas em arquivo pra o auto-delete sobreviver a reinício
// { [idCurto]: { eventId, codigo, uri, userId, expiraEm } }
const CAMINHO_MEET_REUNIOES = path.join(DATA_DIR, 'meet-reunioes.json');
function carregarMeetReunioes() {
  try {
    return JSON.parse(fs.readFileSync(CAMINHO_MEET_REUNIOES, 'utf-8'));
  } catch (err) {
    return {};
  }
}
const meetReunioes = carregarMeetReunioes();
function salvarMeetReunioes() {
  escreverJsonAtomico(CAMINHO_MEET_REUNIOES, meetReunioes);
}

let googleTokenCache = { token: null, expira: 0 };
const meetCooldown = new Map();
const meetTimers = new Map();

async function pegarAccessTokenGoogle() {
  if (googleTokenCache.token && Date.now() < googleTokenCache.expira - 60000) return googleTokenCache.token;
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: GOOGLE_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  if (!r.ok) throw new Error(`Google OAuth respondeu ${r.status}: ${await r.text()}`);
  const json = await r.json();
  googleTokenCache = { token: json.access_token, expira: Date.now() + (json.expires_in || 3600) * 1000 };
  return googleTokenCache.token;
}

// Cria o evento "Colmeia Inspector" com link do Meet.
async function criarReuniaoMeet() {
  const token = await pegarAccessTokenGoogle();
  const inicio = new Date();
  const fim = new Date(inicio.getTime() + MEET_DURACAO_MIN * 60000);
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const r = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      summary: MEET_NOME,
      start: { dateTime: inicio.toISOString() },
      end: { dateTime: fim.toISOString() },
      reminders: { useDefault: false, overrides: [] },
      conferenceData: {
        createRequest: {
          requestId: require('crypto').randomUUID(),
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    }),
  });
  if (!r.ok) throw new Error(`Google Agenda respondeu ${r.status}: ${await r.text()}`);
  let evento = await r.json();

  // o Google às vezes cria o link de forma assíncrona: espera aparecer
  for (let i = 0; i < 5 && !evento.hangoutLink; i++) {
    await pixEsperar(1000);
    const g = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(evento.id)}`,
      { headers }
    );
    if (g.ok) evento = await g.json();
  }
  if (!evento.hangoutLink) {
    await deletarEventoMeet(evento.id).catch(() => {});
    throw new Error('O Google não devolveu o link do Meet.');
  }

  const codigo = evento.hangoutLink.split('/').pop();

  // melhor esforço: deixa a sala aberta (sem precisar o dono aceitar cada
  // pessoa). Se o token não tiver o escopo meetings.space.settings, ignora.
  try {
    await fetch(`https://meet.googleapis.com/v2/spaces/${codigo}?updateMask=config.accessType`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ config: { accessType: MEET_ACESSO } }),
    });
  } catch (err) {
    console.error('⚠️ Não consegui ajustar o acesso da sala do Meet:', err.message);
  }

  return { eventId: evento.id, codigo, uri: evento.hangoutLink, expiraEm: fim.getTime() };
}

async function deletarEventoMeet(eventId) {
  const token = await pegarAccessTokenGoogle();
  const r = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}?sendUpdates=none`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
  );
  // 404/410 = já não existe mais, ok
  if (!r.ok && r.status !== 404 && r.status !== 410) throw new Error(`Google Agenda respondeu ${r.status}`);
}

// Apaga a reunião (Google + registro). Retorna true se apagou.
async function removerReuniaoMeet(idCurto) {
  const reg = meetReunioes[idCurto];
  if (!reg) return false;
  clearTimeout(meetTimers.get(idCurto));
  meetTimers.delete(idCurto);
  try {
    await deletarEventoMeet(reg.eventId);
  } catch (err) {
    console.error('⚠️ Erro ao deletar a reunião do Meet:', err.message);
    // tenta de novo em 5 minutos
    meetTimers.set(idCurto, setTimeout(() => removerReuniaoMeet(idCurto).catch(() => {}), 5 * 60000));
    return false;
  }
  delete meetReunioes[idCurto];
  salvarMeetReunioes();
  return true;
}

// Agenda o auto-delete (30 min depois da criação, por padrão).
function agendarExpiracaoMeet(idCurto) {
  const reg = meetReunioes[idCurto];
  if (!reg) return;
  clearTimeout(meetTimers.get(idCurto));
  const restante = Math.max(0, reg.expiraEm - Date.now());
  meetTimers.set(idCurto, setTimeout(() => removerReuniaoMeet(idCurto).catch(() => {}), restante));
}

// Chamado quando o bot liga: retoma o relógio das reuniões que ficaram abertas.
function retomarReunioesMeet() {
  for (const idCurto of Object.keys(meetReunioes)) agendarExpiracaoMeet(idCurto);
}

function contarReunioesMeetDoUsuario(userId) {
  return Object.values(meetReunioes).filter((r) => r.userId === userId).length;
}

function montarEmbedPainelMeet() {
  return new EmbedBuilder()
    .setColor(COR_AMARELA)
    .setAuthor({ name: NOME_ORG })
    .setTitle(`🎥 ${MEET_NOME}`)
    .setDescription(
      'Clique em **Criar link** pra abrir um tópico privado.\n' +
        'Lá dentro tem o passo a passo pra criar a reunião no Google Meet e copiar o link.\n' +
        'Quando terminar, aperte **Finalizar link** que o tópico é apagado.'
    );
}

function montarBotoesPainelMeet() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('meet_criar').setLabel('Criar link').setEmoji('🔗').setStyle(ButtonStyle.Success)
  );
}

// ---------- AUTO-EXCLUSÃO DE TÓPICOS (tela = 1 hora, salas automáticas = 5 horas) ----------
// Se ninguém apertar "Finalizar link", o tópico é apagado sozinho depois
// de TELA_TOPICO_DURACAO_MS (1 hora). Fica salvo em arquivo pra continuar
// valendo mesmo se o bot reiniciar.
const TELA_TOPICO_DURACAO_MS = 60 * 60 * 1000;
const CAMINHO_TELA_TOPICOS = path.join(DATA_DIR, 'tela-topicos.json');
function carregarTelaTopicos() {
  try {
    return JSON.parse(fs.readFileSync(CAMINHO_TELA_TOPICOS, 'utf-8'));
  } catch (err) {
    return {};
  }
}
const telaTopicos = carregarTelaTopicos(); // { threadId: expiraEm (ms) }
const telaTopicosTimers = new Map();
function salvarTelaTopicos() {
  escreverJsonAtomico(CAMINHO_TELA_TOPICOS, telaTopicos);
}
function esquecerTopicoTela(threadId) {
  clearTimeout(telaTopicosTimers.get(threadId));
  telaTopicosTimers.delete(threadId);
  if (telaTopicos[threadId]) {
    delete telaTopicos[threadId];
    salvarTelaTopicos();
  }
}
function agendarExclusaoTopicoTela(threadId, expiraEm) {
  clearTimeout(telaTopicosTimers.get(threadId));
  const restante = Math.max(0, expiraEm - Date.now());
  telaTopicosTimers.set(
    threadId,
    setTimeout(async () => {
      esquecerTopicoTela(threadId);
      const topico = await client.channels.fetch(threadId).catch(() => null);
      if (topico) await topico.delete('Tópico expirou (tempo esgotado)').catch(() => {});
    }, restante)
  );
}
function retomarTopicosTela() {
  for (const [threadId, expiraEm] of Object.entries(telaTopicos)) agendarExclusaoTopicoTela(threadId, expiraEm);
}

function montarEmbedInstrucoesGoogleMeet(usuario) {
  return new EmbedBuilder()
    .setColor(COR_AMARELA)
    .setAuthor({ name: NOME_ORG })
    .setTitle('🎥 Como criar a chamada no Google Meet')
    .setDescription(
      `Olá, <@${usuario.id}>! Siga os passos abaixo pra abrir a análise:\n\n` +
        '**1.** Acesse **meet.google.com** (ou abra o app do Google Meet).\n' +
        '**2.** Clique em **"Nova reunião"** → **"Iniciar uma reunião instantânea"**.\n' +
        '**3.** Copie o link da reunião (na barra de endereço ou no botão de compartilhar).\n' +
        '**4.** Cole o link aqui nesse tópico pra fazer a análise.\n\n' +
        'Quando terminar, é só clicar em **Finalizar link** abaixo pra apagar esse tópico. Se não clicar, ele é apagado sozinho em **1 hora**.'
    );
}

function montarBotoesFinalizarLinkMeet() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('meet_finalizar').setLabel('Finalizar link').setEmoji(EMOJI_FINALIZAR).setStyle(ButtonStyle.Danger)
  );
}

function montarMensagemLinkMeet(idCurto, reg) {
  // O link vai como texto da mensagem (URL solta = clicável e dá pra
  // segurar/copiar). Mensagem privada: só quem criou vê.
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setLabel('Abrir').setStyle(ButtonStyle.Link).setURL(reg.uri),
    new ButtonBuilder().setCustomId(`meet_copiar:${reg.codigo}`).setLabel('Copiar link').setEmoji('📋').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`meet_deletar:${idCurto}`).setLabel('Deletar').setEmoji('🗑️').setStyle(ButtonStyle.Danger)
  );
  return {
    content:
      `🔗 **${MEET_NOME}** — link criado!\n${reg.uri}\n\n` +
      `⏳ Some <t:${Math.floor(reg.expiraEm / 1000)}:R> (ou apague agora em **Deletar**).\n` +
      '_Só você está vendo esta mensagem._',
    components: [row],
    ephemeral: true,
  };
}

// ---------- ROTEADORES (comandos e botões do Pix/Meet) ----------
async function tratarComandoPixMeet(message) {
  const texto = message.content.trim();
  if (texto !== '!painelapi' && texto !== '!painelmeet') return false;

  if (message.member && !message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
    await message.reply('Você não tem permissão para criar o painel.');
    return true;
  }

  if (texto === '!painelapi') {
    await message.channel.send({ embeds: [montarEmbedPainelApiPix()], components: [montarBotoesPainelApiPix()] });
  } else {
    await message.channel.send({ embeds: [montarEmbedPainelMeet()], components: [montarBotoesPainelMeet()] });
  }
  await message.delete().catch(() => {});
  return true;
}

// Retorna true se a interação era do Pix/Meet (e já foi respondida).
async function tratarInteracaoPixMeet(interaction) {
  // --- Google Meet ---
  if (interaction.isButton() && interaction.customId === 'meet_criar') {
    // Modo manual: em vez de gerar o link pela API do Google, abre um
    // tópico privado com o passo a passo pra pessoa criar a reunião.
    await interaction.deferReply({ ephemeral: true });

    // Só 1 tópico de tela por vez por pessoa: se já existe um aberto,
    // reaproveita em vez de criar outro.
    const nomeTopicoTela = `tela-${interaction.user.username}`;
    const topicosExistentes = await interaction.channel.threads.fetchActive().catch(() => null);
    const topicoJaAberto = topicosExistentes?.threads.find((t) => t.name === nomeTopicoTela);

    if (topicoJaAberto) {
      await interaction.editReply({ content: `📸 Você já tem um tópico de tela aberto: ${topicoJaAberto}` });
      return true;
    }

    const topico = await interaction.channel.threads
      .create({
        name: nomeTopicoTela,
        type: ChannelType.PrivateThread,
        reason: 'Tela — análise por Google Meet',
      })
      .catch(() => null);

    if (!topico) {
      await interaction.editReply({ content: '⚠️ Não consegui criar o tópico. Confira as permissões do bot.' });
      return true;
    }

    await topico.members.add(interaction.user.id).catch(() => {});

    await topico.send({ embeds: [montarEmbedInstrucoesGoogleMeet(interaction.user)] });

    // mensagem separada, avisando sobre a troca pro Google Meet — o botão
    // "Finalizar link" fica embaixo dela (última mensagem do tópico)
    await topico.send({ embeds: [montarEmbedMudouTela()], components: [montarBotoesFinalizarLinkMeet()] });

    // se ninguém finalizar, o tópico é apagado sozinho em 1 hora
    telaTopicos[topico.id] = Date.now() + TELA_TOPICO_DURACAO_MS;
    salvarTelaTopicos();
    agendarExclusaoTopicoTela(topico.id, telaTopicos[topico.id]);

    await interaction.editReply({
      content: `📸 Seu tópico de tela está pronto: ${topico}\nEntre nele, crie a reunião no Google Meet e envie o link pra fazer a análise.`,
    });
    return true;
  }

  // --- Botão "Finalizar link" (apaga o tópico de tela) ---
  if (interaction.isButton() && interaction.customId === 'meet_finalizar') {
    await interaction.deferUpdate().catch(() => {});
    esquecerTopicoTela(interaction.channelId);
    await interaction.channel.delete('Tela finalizada').catch(() => {});
    return true;
  }

  if (interaction.isButton() && interaction.customId.startsWith('meet_deletar:')) {
    const idCurto = interaction.customId.split(':')[1] || '';
    const reg = meetReunioes[idCurto];

    if (!reg) {
      await interaction.update({ content: '⚠️ Essa reunião já foi deletada ou expirou.', components: [] });
      return true;
    }
    // só deleta a reunião que a própria pessoa criou
    if (reg.userId !== interaction.user.id) {
      await interaction.reply({ content: '🚫 Só quem criou essa reunião pode deletar.', ephemeral: true });
      return true;
    }

    await interaction.deferUpdate();
    const apagou = await removerReuniaoMeet(idCurto);
    await interaction.editReply({
      content: apagou
        ? `🗑️ Reunião **${MEET_NOME}** deletada.`
        : '⚠️ Não consegui deletar agora. O bot vai tentar de novo sozinho em alguns minutos.',
      components: apagou ? [] : interaction.message.components,
    });
    return true;
  }

  if (interaction.isButton() && interaction.customId.startsWith('meet_copiar:')) {
    const codigo = interaction.customId.split(':')[1] || '';
    if (!/^[a-z]{3}-[a-z]{4}-[a-z]{3}$/.test(codigo)) {
      await interaction.reply({ content: 'Link inválido.', ephemeral: true });
      return true;
    }
    // só o link, sem mais nada, pra copiar o texto da mensagem direto
    await interaction.reply({ content: `https://meet.google.com/${codigo}`, ephemeral: true });
    return true;
  }

  // --- API do Pix (por mediador) ---
  const ehBotaoApi = interaction.isButton() && interaction.customId.startsWith('pixapi_');
  const ehModalApi = interaction.isModalSubmit() && interaction.customId.startsWith('pixapi_modal_');
  if (!ehBotaoApi && !ehModalApi) return false;

  if (!(await usuarioPodeMediar(interaction))) {
    await interaction.reply({ content: '🚫 Só mediador pode cadastrar API.', ephemeral: true });
    return true;
  }
  const minha = pixDados.apis[interaction.user.id];

  if (ehModalApi) {
    await salvarNovaApiPix(interaction, interaction.customId === 'pixapi_modal_nova');
    return true;
  }

  switch (interaction.customId) {
    case 'pixapi_cadastrar':
      if (minha) {
        await interaction.reply({
          content: 'Você já tem uma API cadastrada. Use **Gerar nova** pra trocar ou **Excluir API**.',
          ephemeral: true,
        });
      } else {
        await interaction.showModal(montarModalApiPix('pixapi_modal_cadastrar', 'Cadastrar API'));
      }
      return true;

    case 'pixapi_nova':
      await interaction.showModal(montarModalApiPix('pixapi_modal_nova', 'Gerar nova API'));
      return true;

    case 'pixapi_ver':
      await interaction.reply({
        content: minha
          ? `🟢 API cadastrada (conta **${minha.conta}**, final **${minha.token.slice(-4)}**).`
          : '🔴 Você não tem API cadastrada.',
        ephemeral: true,
      });
      return true;

    case 'pixapi_excluir': {
      if (!minha) {
        await interaction.reply({ content: 'Você não tem API cadastrada.', ephemeral: true });
        return true;
      }
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('pixapi_excluir_ok').setLabel('Confirmar exclusão').setStyle(ButtonStyle.Danger)
      );
      await interaction.reply({
        content: 'Excluir a sua API do sistema? O bot para de confirmar Pix nas suas filas.',
        components: [row],
        ephemeral: true,
      });
      return true;
    }

    case 'pixapi_excluir_ok':
      delete pixDados.apis[interaction.user.id];
      salvarPixApis();
      await interaction.update({ content: '🗑️ API excluída do sistema.', components: [] });
      return true;

    default:
      return false;
  }
}

// ---------- COMANDO DE TEXTO: POSTAR PAINEL + COMANDOS DE ADMIN ----------

client.on('messageCreate', async (message) => {
 try {
  if (message.author.bot) return;

  // Comandos "!": se por algum motivo houver 2 cópias do bot ligadas, as
  // duas receberiam o mesmo comando e criariam o painel em dobro. Espera um
  // tempinho aleatório e confere se a mensagem do comando ainda existe — a
  // outra cópia apaga ela depois de responder, então esta não repete.
  if (message.content.startsWith('!')) {
    await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 1500)));
    const comandoAindaExiste = await message.channel.messages
      .fetch(message.id)
      .then(() => true)
      .catch((err) => !(err && err.code === 10008));
    if (!comandoAindaExiste) return;
  }

  // Dentro do tópico de uma partida, ativar o card "ID e Senha":
  // digite o ID (9 a 13 dígitos) sozinho numa mensagem, depois a senha
  // (2 a 4 dígitos) sozinha na mensagem seguinte. Cada um funciona
  // separado — não dá (nem precisa) mandar os dois juntos na mesma
  // mensagem, e ".cs" não ativa mais nada aqui (fica livre pra não
  // bater com o comando ".cs" de outro bot).
  //
  // Só Mediador/CEO pode usar, e só uma vez por partida.
  const partidaDoTopico = partidas.get(message.channelId);

  // "pg / pago / paguei / att pago" + nome do Pix (só jogadores da
  // partida, e só se o mediador dela tem API cadastrada — sem API o bot
  // ignora e segue o fluxo normal).
  // Comprovante em IMAGEM (só jogadores da partida confirmada, e só se o
  // mediador NÃO tem API cadastrada).
  if (partidaDoTopico && message.guild && !partidaDoTopico.cancelando && message.attachments.size > 0) {
    const anexoImagem = message.attachments.find(
      (a) => (a.contentType || '').startsWith('image/') && (!a.size || a.size <= LIMITE_IMAGEM_COMPROVANTE)
    );
    if (
      anexoImagem &&
      partidaDoTopico.mediadorId &&
      !apiDoMediador(partidaDoTopico.mediadorId) &&
      partidaDoTopico.jogadores.includes(message.author.id) &&
      partidaDoTopico.confirmados &&
      partidaDoTopico.confirmados.size >= partidaDoTopico.jogadores.length
    ) {
      await comTravaPix(message.channelId, () => processarComprovanteImagem(message, partidaDoTopico, anexoImagem));
      return;
    }
  }

  if (partidaDoTopico && message.guild && !partidaDoTopico.cancelando) {
    const matchPixPago = message.content.match(REGEX_PAGO_PIX);
    if (
      matchPixPago &&
      partidaDoTopico.jogadores.includes(message.author.id) &&
      apiDoMediador(partidaDoTopico.mediadorId)
    ) {
      await comTravaPix(message.channelId, () => processarPagamentoPix(message, partidaDoTopico, matchPixPago[1].trim()));
      return;
    }
  }

  // !painelapi (API do Pix por mediador) e !painelmeet (link do Google Meet)
  if (await tratarComandoPixMeet(message)) return;

  // Comandos de sala no tópico da partida: "/qualquer-coisa" ou comandos de
  // ponto (".cs", ".cs h", ".cs 3", ".s", ".painel"...). Não mostra nenhum card:
  // só renomeia o tópico pra "pagar-<valor>💰" (o resto — sala, id, senha —
  // quem cuida é outro bot) e depois apaga a mensagem do mediador. Só
  // Mediador/CEO, e só dentro do tópico de uma partida.
  if (
    partidaDoTopico &&
    !partidaDoTopico.cancelando &&
    REGEX_COMANDO_SALA.test(message.content.trim()) &&
    (message.author.id === partidaDoTopico.mediadorId || (await membroPodeMediar(message.member, message.guild)))
  ) {
    const nomePagar = nomeCanalPagar(partidaDoTopico.valor);
    if (message.channel.name !== nomePagar) {
      await message.channel.setName(nomePagar).catch(() => {});
    }
    agendarApagarComandoSala(message);
    return;
  }

  if (partidaDoTopico && !partidaDoTopico.salaId && (await membroPodeMediar(message.member, message.guild))) {
    const soId = extrairApenasId(message.content);
    if (soId) {
      partidaDoTopico.salaIdPendente = soId;
      salvarPartidas();
    } else if (partidaDoTopico.salaIdPendente) {
      const soSenha = extrairApenasSenha(message.content);
      if (soSenha) {
        await ativarSala(message.channel, partidaDoTopico, partidaDoTopico.salaIdPendente, soSenha);
      }
    }
  }

  const temPermissaoAdmin =
    message.member && message.member.permissions.has(PermissionsBitField.Flags.ManageGuild);

  // !painel1x1 / !painel2x2 / !painel3x3 / !painel4x4, com variante
  // opcional (misto|emu) e um valor opcional (pode ter ponto, vírgula,
  // "R$" etc — o texto inteiro depois da variante vira o valor).
  // Ex.: "!painel1x1", "!painel1x1 R$2,00", "!painel4x4 misto R$5,00".
  // Sempre cria um único painel por comando.
  const matchPainelFormato = message.content
    .trim()
    .match(/^!painel(1x1|2x2|3x3|4x4)(?:\s+(misto|emu))?(?:\s+([\s\S]+))?$/i);

  if (matchPainelFormato) {
    if (message.member && !message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return message.reply('Você não tem permissão para criar o painel.');
    }

    const formatoChave = matchPainelFormato[1].toLowerCase();
    const variante = matchPainelFormato[2] ? matchPainelFormato[2].toLowerCase() : null;
    const valorTexto = (matchPainelFormato[3] || '').trim();
    const valor = valorTexto || VALOR_APOSTA_PADRAO;

    const instancia = criarInstanciaPainel(formatoChave, variante, valor);
    const msgPainel = await message.channel.send({
      embeds: [montarEmbedPainel(instancia)],
      components: [montarBotoesPainel(instancia)],
    });
    instancia.msgCanalId = msgPainel.channelId;
    instancia.msgId = msgPainel.id;
    salvarPaineisFila();

    await message.delete().catch(() => {});
    return;
  }

  // !painelpix -> painel de autocadastro de mediadores
  if (message.content.trim() === '!painelpix') {
    if (message.member && !message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return message.reply('Você não tem permissão para criar o painel.');
    }

    await message.channel.send({
      embeds: [montarEmbedPainelPix()],
      components: [montarBotoesPainelPix()],
    });
    await message.delete().catch(() => {});
    return;
  }


  // !mudoutela -> manda o aviso "Mudou a forma de mostrar a tela" no
  // canal atual. Só quem tem o cargo de CEO pode usar, e funciona em
  // qualquer canal (o CEO escolhe onde postar).
  if (message.content.trim() === '!mudoutela') {
    if (!(await usuarioECeoMensagem(message))) {
      return message.reply('🚫 Só quem tem o cargo de CEO pode usar esse comando.');
    }

    await message.channel.send({ embeds: [montarEmbedMudouTela()] });
    await message.delete().catch(() => {});
    return;
  }

  // !painelblacklist -> painel com botão pra verificar um ID
  // !painelsalasbot -> painel de salas automáticas (criar / estoque)
  if (message.content.trim() === '!painelsalasbot') {
    if (message.member && !message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return message.reply('Você não tem permissão para criar o painel.');
    }

    await message.channel.send({
      embeds: [montarEmbedPainelSalasAutomaticas()],
      components: [montarBotoesPainelSalasAutomaticas()],
    });
    await message.delete().catch(() => {});
    return;
  }

  if (message.content.trim() === '!painelblacklist') {
    if (message.member && !message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return message.reply('Você não tem permissão para criar o painel.');
    }

    await message.channel.send({
      embeds: [montarEmbedPainelBlacklist()],
      components: [montarBotoesPainelBlacklist()],
    });
    await message.delete().catch(() => {});
    return;
  }

  // !addblacklist <id> [motivo] -> adiciona um ID na blacklist (Mediador/CEO)
  const matchAddBlacklist = message.content.trim().match(/^!addblacklist\s+(\d+)\s*(.*)$/i);
  if (matchAddBlacklist) {
    if (!(await membroPodeMediar(message.member, message.guild))) {
      return message.reply('🚫 Só quem tem o cargo de mediador pode mexer na blacklist.');
    }
    const [, id, motivo] = matchAddBlacklist;
    BLACKLIST[id] = { motivo: motivo || 'Não informado', ts: Date.now() };
    salvarBlacklist(BLACKLIST);
    await message.reply(`✅ ID \`${id}\` adicionado à blacklist.`);
    return;
  }

  // !removeblacklist <id> -> remove um ID da blacklist (Mediador/CEO)
  const matchRemoveBlacklist = message.content.trim().match(/^!removeblacklist\s+(\d+)/i);
  if (matchRemoveBlacklist) {
    if (!(await membroPodeMediar(message.member, message.guild))) {
      return message.reply('🚫 Só quem tem o cargo de mediador pode mexer na blacklist.');
    }
    const id = matchRemoveBlacklist[1];
    if (!(id in BLACKLIST)) return message.reply('Esse ID não está na blacklist.');
    delete BLACKLIST[id];
    salvarBlacklist(BLACKLIST);
    await message.reply(`✅ ID \`${id}\` removido da blacklist.`);
    return;
  }

  // !painelmediador -> painel de fila de mediadores (Entrar / Sair)
  // Pode ser postado mais de uma vez (em canais diferentes, por
  // exemplo) — todos os painéis abertos passam a mostrar a mesma fila,
  // numerados "(1)", "(2)"... quando tiver mais de um ao mesmo tempo.
  if (message.content.trim() === '!painelmediador') {
    if (message.member && !message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return message.reply('Você não tem permissão para criar o painel.');
    }

    const numeroDoNovo = paineisMediador.length + 1;
    const msg = await message.channel.send({
      embeds: [montarEmbedFilaMediador(numeroDoNovo, numeroDoNovo)],
      components: [montarBotoesFilaMediador()],
    });
    paineisMediador.push(msg);
    salvarPaineisMediador();

    // Se já existia outro painel aberto, ele também precisa passar a
    // mostrar o número agora que não é mais o único.
    await atualizarPainelMediadorSeExistir();

    await message.delete().catch(() => {});
    return;
  }

  // !painelticket -> painel de atendimento (Suporte / Reembolso)
  if (message.content.trim() === '!painelticket') {
    if (message.member && !message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return message.reply('Você não tem permissão para criar o painel.');
    }

    await message.channel.send({
      embeds: [montarEmbedPainelAtendimento()],
      components: [montarSelectAtendimento()],
    });
    await message.delete().catch(() => {});
    return;
  }

  // !painelfilasuporte -> fila de suporte (Entrar / Sair)
  if (message.content.trim() === '!painelfilasuporte') {
    if (message.member && !message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return message.reply('Você não tem permissão para criar o painel.');
    }

    const msg = await message.channel.send({
      embeds: [montarEmbedFilaSuporte()],
      components: [montarBotoesFilaSuporte()],
    });
    painelSuporteFilaMessage = msg;
    salvarPainelSuporteFila();

    await message.delete().catch(() => {});
    return;
  }

  // !painelpixsuporte -> autocadastro de pix do suporte
  if (message.content.trim() === '!painelpixsuporte') {
    if (message.member && !message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return message.reply('Você não tem permissão para criar o painel.');
    }

    await message.channel.send({
      embeds: [montarEmbedPainelPixSuporte()],
      components: [montarBotoesPainelPixSuporte()],
    });
    await message.delete().catch(() => {});
    return;
  }

  // !painelrankingsuporte -> ranking dos melhores suportes
  if (message.content.trim() === '!painelrankingsuporte') {
    if (message.member && !message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return message.reply('Você não tem permissão para criar o painel.');
    }

    await message.channel.send({
      embeds: [montarEmbedPainelRankingGenerico(`${EMOJI_TROFEU} Ranking-Suporte`, 'Veja seu perfil de suporte ou o ranking de atendimentos.')],
      components: [montarBotoesPainelRankingSuporte()],
    });
    await message.delete().catch(() => {});
    return;
  }

  // !painelranking -> ranking de vitórias dos jogadores
  if (message.content.trim() === '!painelranking') {
    if (message.member && !message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return message.reply('Você não tem permissão para criar o painel.');
    }

    await message.channel.send({
      embeds: [montarEmbedPainelRankingGenerico(`${EMOJI_TROFEU} Ranking Colmeia`, 'Veja seu perfil ou o ranking geral de vitórias.')],
      components: [montarBotoesPainelRanking()],
    });
    await message.delete().catch(() => {});
    return;
  }

  // !painelrankingadm -> ranking de horas/ganhos dos mediadores
  if (message.content.trim() === '!painelrankingadm') {
    if (!temPermissaoAdmin) {
      return message.reply('Você não tem permissão para criar esse painel.');
    }

    await message.channel.send({
      embeds: [montarEmbedPainelRankingGenerico(`${EMOJI_TROFEU} Ranking-ADM`, 'Veja seu perfil de mediador ou o ranking de arrecadação.')],
      components: [montarBotoesPainelRankingAdm()],
    });
    await message.delete().catch(() => {});
    return;
  }

// Posta uma lista de cards { titulo, texto } cada um como embed
// separado, cor amarela — usado por !regras, !termosadm, etc.
async function postarCards(channel, cards) {
  for (const card of cards) {
    await channel.send({
      embeds: [new EmbedBuilder().setColor(COR_AMARELA).setTitle(card.titulo).setDescription(card.texto)],
    });
  }
}

// Divide um texto grande em vários embeds (até ~3900 caracteres cada,
// respeitando o limite de descrição do Discord), quebrando de
// preferência entre parágrafos — usado pros textos enormes tipo
// !regrasblacklist.
async function postarTextoEmCards(channel, tituloPrincipal, texto) {
  const paragrafos = texto.split(/\n(?=\S)/); // quebra a cada linha que começa um novo bloco
  const LIMITE = 3900;
  const blocos = [];
  let atual = '';

  for (const paragrafo of paragrafos) {
    const candidato = atual ? `${atual}\n${paragrafo}` : paragrafo;
    if (candidato.length > LIMITE && atual) {
      blocos.push(atual);
      atual = paragrafo;
    } else {
      atual = candidato;
    }
  }
  if (atual) blocos.push(atual);

  for (let i = 0; i < blocos.length; i++) {
    const embed = new EmbedBuilder().setColor(COR_AMARELA).setDescription(blocos[i]);
    if (i === 0 && tituloPrincipal) embed.setTitle(tituloPrincipal);
    await channel.send({ embeds: [embed] });
  }
}

  // !regras -> posta as regras em vários cards separados, cor amarela
  if (message.content.trim() === '!regras') {
    if (!temPermissaoAdmin) {
      return message.reply('Você não tem permissão para postar as regras.');
    }

    const cards = [
      {
        titulo: '✅ REGRAS GERAIS:',
        texto:
          '▫️ Jogadores podem combinar regras adicionais entre si no canal da fila.\n' +
          '▫️ O level mínimo para jogar é 15.\n' +
          '▫️ Mensagens editadas serão desconsideradas.\n' +
          '▫️ Racismo, homofobia e desrespeito com a staff não serão tolerados.\n' +
          '▫️ Em caso de quebra de regra, o time infrator deverá entregar 1 round, mesmo que tenha perdido o round.\n' +
          '▫️ O pedido de round deve ser feito no mesmo round ou no seguinte, informando o motivo.\n' +
          '▫️ É permitido finalizar o oponente no soco.\n' +
          '▫️ Não é permitido realizar o bug do kit.',
      },
      {
        titulo: '💸 DESISTÊNCIA:',
        texto: '▫️ Taxa de 10% sobre o valor total da fila. Com a sala criada, também será cobrado o valor da sala (R$ 1,00) do jogador desistente.',
      },
      {
        titulo: '💰 TAXA EM FILAS ALTAS:',
        texto: '▫️ Filas acima de R$ 50 possuem taxa de 5%.',
      },
      {
        titulo: '💾 REPLAY:',
        texto:
          '▫️ É obrigatório salvar o replay.\n' +
          '▫️ Exceção: se o replay estiver cortado ou não existir por problemas de conexão, o acusador deverá enviar clipes suspeitos para análise.\n' +
          '▫️ Caso o replay esteja normal, a partida seguirá normalmente.',
      },
      {
        titulo: '📩 BLACKLIST NO JOGO OU CORREIO:',
        texto: '▫️ Não é considerado W.O. Isso ocorre por verificação automática da Garena e não confirma irregularidade do jogador.',
      },
      {
        titulo: '➡️ TELA PARADA OU MOBILADOR:',
        texto: '▫️ Não é permitido nas filas de mobile.',
      },
      {
        titulo: '🔄 TROCA DE JOGADOR:',
        texto:
          '▫️ Se não foi combinado manter o mesmo time, é permitido trocar jogador na revanche ou ao refazer a sala.\n' +
          '▫️ Em MD3 é proibido trocar jogador.',
      },
      {
        titulo: '⏳ TEMPO PARA INICIAR A PARTIDA:',
        texto: '▫️ Os jogadores têm até 5 minutos para iniciar a partida, podendo haver prorrogação mediante autorização do administrador.',
      },
      {
        titulo: '🔄 REFAZER SALA:',
        texto: '▫️ É permitido refazer a sala a qualquer momento durante a partida mediante pagamento de R$ 1,50.',
      },
      {
        titulo: '⚠️ ALEATÓRIOS NA SALA:',
        texto: '▫️ Caso a partida inicie com jogadores aleatórios na sala, ambos os adversários pagam a sala (R$ 0,75 de cada).',
      },
      {
        titulo: '🔄 ESCOLHA INCORRETA DE PERSONAGEM OU PET:',
        texto:
          '▫️ Deve ser corrigido até o final do 2º round. Caso contrário, será aplicado W.O e os rounds jogados serão entregues ao adversário.\n' +
          '▫️ O adversário tem até o 6x6 para avisar sobre erro de personagem.',
      },
      {
        titulo: 'MAPA E POSICIONAMENTO:',
        texto:
          '❌ Proibido:\n▫️ Subir em casas.\n▫️ Caso o jogador suba por engano ao pular pneu, deve descer imediatamente sem atirar ou obter vantagem.\n\n' +
          '✅ Permitido:\n▫️ Subir em containers, skips, caixotes, caminhões, kombis e telhado de Mars.\n▫️ Plataforma do observatório e containers do observatório.\n▫️ Permitido subir até o 7º degrau em qualquer escada.',
      },
      {
        titulo: '✅ PERSONAGENS PERMITIDOS:',
        texto: '▫️ Alok, Kelly, Maxim, Leon, Maro, Moco e Laura.',
      },
      {
        titulo: '✅ PETS PERMITIDOS:',
        texto: '▫️ Dom Pisante, Punkin, Mestre Trigo, Patopinho, Falcão, Babuíno, Iéti, Shiba e Pantera Noturna.',
      },
      {
        titulo: 'ARMAS:',
        texto:
          '✅ 1º ROUND:\n▫️ Desert\n\n✅ ARMAS PERMITIDAS EM TODOS OS ROUNDS:\n▫️ USP, UMP e XM8\n\n⚠️ Atenção:\n▫️ No 1º round só é permitido utilizar Desert.',
      },
      {
        titulo: '✅ SKINS E ARMAS:',
        texto: '▫️ Skins atribuídas são permitidas.\n▫️ Não é permitido utilizar níveis nas armas.',
      },
      {
        titulo: '⚠️ COMBINAÇÃO DE ARMAS:',
        texto:
          '▫️ O padrão das partidas é UMP e XM8, não sendo necessário combinar armas antes da partida.\n' +
          '▫️ No 1º round, será permitido utilizar apenas a Desert.\n' +
          '▫️ A partir do 2º round, serão permitidas apenas UMP e XM8.',
      },
      {
        titulo: '🪖 EQUIPAMENTOS:',
        texto: '▫️ Colete nível 4 é permitido.\n▫️ Capacete nível 3 é proibido.',
      },
      {
        titulo: '🧨 GRANADAS:',
        texto: '▫️ Granadas são proibidas, exceto gel.\n▫️ Jogar granadas na base sem interferir na partida é permitido.',
      },
      {
        titulo: '🧊 MODO GELO INFINITO',
        texto:
          '⚠️ Obrigatório:\n▫️ Bater soco, fazer gelo frente a frente ou gelo inclinado para iniciar e valer a partida.\n\n' +
          '❌ Proibido:\n▫️ Se trancar.\n▫️ Usar duas armas de rush.\n▫️ Trancar o adversário dentro do gás.\n\n' +
          '⚠️ Regra de tempo:\n▫️ Aos 00:30 segundos no jogo, será permitido eliminar o adversário sem realizar bate soco ou colocar gelo.\n' +
          '▫️ Caso seja confirmado abuso dessa regra para matar após esse tempo, será aplicado W.O por anti-jogo.',
      },
      {
        titulo: '❄️ MODO GELO NORMAL',
        texto:
          '✅ Permitido:\n▫️ Se trancar.\n▫️ Usar duas armas de rush.\n▫️ Trancar o adversário dentro do gás.\n\n' +
          '⚠️ Atenção:\n▫️ Combinados bate soco qualquer dano antes do bate soco e colocação de gelo resulta em entrega de round.',
      },
      {
        titulo: '❌ REGRAS ABUSIVAS (PROIBIDAS)',
        texto:
          'Os jogadores não podem criar regras abusivas ou sem sentido para impor a outros participantes. Para evitar injustiças e garantir partidas equilibradas, ficam proibidas as seguintes práticas:\n\n' +
          '▫️ Exigir sem tela.\n▫️ Obrigar o uso ou proibir skins específicas.\n▫️ Full UMP sem XM8.\n▫️ Sem x86.\n' +
          '▫️ Proibir determinadas armas sem justificativa, como UMP Roxa e XM8 Roxa.\n▫️ Mentir o nick.\n▫️ Se matar para o gás impedindo o adversário de entregar round.',
      },
      {
        titulo: '⚠️ COMBINADOS ENTRE JOGADORES:',
        texto:
          '▫️ Toda regra proposta pelo adversário será considerada aceita automaticamente caso não seja recusada. Caso o jogador não concorde, deve recusar antes do "GO".\n' +
          '▫️ Ao dizer "GO", o jogador confirma que aceita todas as regras combinadas.\n' +
          '▫️ Caso o jogador responda adicionando outra regra sem recusar a anterior, será considerado que aceitou todas as regras anteriores mais a nova.\n' +
          '▫️ Placas com conteúdo pornográfico não são permitidas. Caso sejam utilizadas, a regra será anulada automaticamente.',
      },
      {
        titulo: '🤖 DÚVIDAS:',
        texto:
          '▫️ Devem ser resolvidas no canal de tickets antes da partida.\n\n**LEIA TODAS AS REGRAS COM ATENÇÃO E RESPEITE A ORGANIZAÇÃO.**',
      },
    ];

    await postarCards(message.channel, cards);
    await message.delete().catch(() => {});
    return;
  }

  // !regrasadm -> diretrizes oficiais pro cargo de mediador/adm
  if (message.content.trim() === '!regrasadm') {
    if (!temPermissaoAdmin) return message.reply('Você não tem permissão para postar isso.');

    await postarCards(message.channel, [
      {
        titulo: '👑 DIRETRIZES DA COLMEIA — REGULAMENTO OFICIAL',
        texto: 'Regulamento oficial para quem exerce o cargo de ADM/Mediador na organização.',
      },
      {
        titulo: '⚖️ 1. POSTURA E NEUTRALIDADE',
        texto:
          '▫️ **Imparcialidade Total:** O ADM nunca tem lado. Mesmo que um amigo seu ou a sua própria guilda esteja jogando, as regras devem ser aplicadas com o mesmo rigor para todos.\n' +
          '▫️ **Mantenha a Calma:** O chat vai pegar fogo e haverá discussões. Nunca responda com xingamentos ou ironia. Seja frio, cite a regra violada e aplique a punição.\n' +
          '▫️ **Transparência Máxima:** Qualquer alteração de horário, troca de mapa ou punição deve ser postada no grupo principal de forma clara, explicando o motivo.',
      },
      {
        titulo: '💸 2. GERENCIAMENTO FINANCEIRO',
        texto:
          '▫️ **Tabela de Caixa:** Mantenha uma planilha (ou bloco de notas) com o nome de quem pagou, o comprovante de PIX salvo e o horário. Nunca confie apenas na memória.\n' +
          '▫️ **Separação de Dinheiro:** Jamais misture o dinheiro das inscrições com a sua conta bancária pessoal do dia a dia. Deixe o valor do prêmio intacto até o final do evento.\n' +
          '▫️ **Velocidade no Pagamento:** Pague o vencedor o mais rápido possível após a validação. ADM que demora para pagar ganha fama de "caloteiro" muito rápido.',
      },
      {
        titulo: '🎮 3. ORGANIZAÇÃO DA SALA E DO JOGO',
        texto:
          '▫️ **Pontualidade Britânica:** Se a sala está marcada para as 21:00, ela deve começar às 21:00. Não atrase o evento por causa de uma única Line que se atrasou; isso desrespeita quem chegou no horário.\n' +
          '▫️ **Conferência de Nicks:** Antes de iniciar a queda, passe o olho na sala do Free Fire e veja se os nicks batem com a tabela de inscrição. Se houver jogador "aleatório", remova da sala imediatamente.\n' +
          '▫️ **Criação de Provas:** O ADM também deve tirar prints ou gravar a tela do lobby e da tabela final do jogo para ter como contra-prova caso algum jogador tente fraudar o resultado.',
      },
      {
        titulo: '📋 4. RESOLUÇÃO DE CONFLITOS E AUDITORIA',
        texto:
          '▫️ **Análise de Vídeos (POV):** Se uma Line acusar outra de usar hack ou bug, exija a gravação da tela (POV) da equipe acusada. Defina um prazo de até 10 minutos para eles enviarem. Se recusarem ou não tiverem, a pontuação deles é zerada.\n' +
          '▫️ **Palavra Final:** Deixe claro que, após a análise das provas por você, a decisão do ADM é soberana e incontestável. Isso evita conversas intermináveis no grupo.',
      },
    ]);

    await message.delete().catch(() => {});
    return;
  }

  // !termosadm -> glossário de termos financeiros/organizacionais
  if (message.content.trim() === '!termosadm') {
    if (!temPermissaoAdmin) return message.reply('Você não tem permissão para postar isso.');

    await postarCards(message.channel, [
      {
        titulo: '📑 Termos de Organização e Financeiros',
        texto:
          '**Taxa de ADM:** A comissão em dinheiro ou diamantes cobrada pelo administrador para organizar o jogo e gerenciar a premiação.\n' +
          '**Tabela ou Grade:** O cronograma que mostra a divisão dos grupos, os horários de cada queda e quais times se enfrentarão.\n' +
          '**Vaga Garantida:** Confirmação de que o squad está inscrito na rodada após o envio do comprovante.\n' +
          '**Print do PIX / Comprovante:** Exigência obrigatória para confirmar a participação ou para receber a premiação.\n' +
          '**W.O. (Walkover):** Vitória automática concedida a uma equipe quando o time adversário não se apresenta no horário correto da sala.\n' +
          '**Reembolso:** Devolução do valor da inscrição caso o campeonato seja cancelado por culpa da organização.',
      },
      {
        titulo: '🎮 Termos de Partida (Regulamento de Jogo)',
        texto:
          '**ID e Senha:** As credenciais enviadas pelo ADM para que os jogadores entrem na sala personalizada do Free Fire.\n' +
          '**Print da Tela Final:** Captura de tela do resultado da partida (booyah ou pontuação), exigida pelo ADM para somar os pontos corretos na tabela.\n' +
          '**Regra do CR7 / Personagens:** Restrição de habilidades consideradas apelativas (como a bolha do Chrono ou o Alok), dependendo do combinado.\n' +
          '**Armas Banidas:** Lista de itens proibidos nas regras daquele AP específico (comum proibir Granada de Luz/Fragmentação, Lança-Granadas ou vetor dupla).\n' +
          '**Guarita ou Zé Carrinho:** Estratégias que podem ser banidas ou pontuadas negativamente (ficar camperando muito tempo em guaritas ou atropelando com veículos).',
      },
      {
        titulo: '🚫 Termos de Punição e Segurança',
        texto:
          '**Ban ou Banimento:** Expulsão permanente do jogador ou da line-up por trapaça, toxicidade ou desrespeito às regras.\n' +
          '**Blacklist (Lista Negra):** Lista compartilhada entre ADMs com nomes de jogadores tóxicos, caloteiros ou suspeitos de usar programas ilegais.\n' +
          '**Hack / Regedit / Auxílio de Mira:** Jogadores pegos usando trapaças que resultam em desclassificação imediata da equipe sem direito a reembolso.\n' +
          '**Remoção por Atraso:** Tolerância rígida (geralmente de 5 a 10 minutos). Se o time não entrar, o ADM inicia a sala sem eles.',
      },
    ]);

    await message.delete().catch(() => {});
    return;
  }

  // !termossuporte -> categorias de ticket e termos frequentes do suporte
  if (message.content.trim() === '!termossuporte') {
    if (!temPermissaoAdmin) return message.reply('Você não tem permissão para postar isso.');

    await postarCards(message.channel, [
      {
        titulo: '📂 Categorias Principais de Tickets (Canais mais Comuns)',
        texto:
          '▫️ **Suporte / Dúvidas Diárias:** Canal aberto para tirar dúvidas sobre horários, tabelas das salas ou regras específicas daquele apostado.\n' +
          '▫️ **Inscrições / Comprovantes:** Envio do comprovante de pagamento da taxa (Pix) e a ficha com os IDs dos jogadores para validar a vaga no campeonato.\n' +
          '▫️ **Denúncias / Reportar Jogador:** Usado para denunciar trapaças (uso de cheats/hacks) ou condutas tóxicas durante as salas premiadas.\n' +
          '▫️ **Resgate de Premiação / Reembolso:** Aberto exclusivamente pelos líderes das linhas/guildas vencedoras para enviar a chave Pix e coletar o dinheiro ganho na rodada.',
      },
      {
        titulo: '📋 Termos e Regras Frequentes nos Canais de Suporte',
        texto:
          '▫️ **Provas em Vídeo (Clip ou Gravação):** Quase todas as orgs exigem que, ao abrir um ticket de denúncia, o jogador anexe o "clip" da tela provando o ocorrido. Sem vídeo, o ticket costuma ser fechado sem análise.\n' +
          '▫️ **Dados Obrigatórios:** Geralmente a mensagem automática do bot exige que você envie o Nick exato e ID de quem está reportando e do acusado.\n' +
          '▫️ **Tempo de Resposta (SLA):** O tempo de resposta pode variar de alguns minutos a algumas horas em dias de grandes eventos. Evite marcar a Staff pra não atrasar a fila.\n' +
          '▫️ **Fechamento por Inatividade:** Se você abrir o ticket e não responder ou não mandar os dados solicitados dentro de um prazo específico (geralmente 24 horas), o bot fecha o ticket automaticamente por falta de comunicação.\n' +
          '▫️ **Punição por Ticket Falso:** Abrir chamados de brincadeira, xingar os moderadores ou tentar forjar comprovantes resulta em banimento imediato do servidor da org e desclassificação da guilda.',
      },
    ]);

    await message.delete().catch(() => {});
    return;
  }

  // !regrassuporte -> regras internas do time de suporte/reembolso
  if (message.content.trim() === '!regrassuporte') {
    if (!temPermissaoAdmin) return message.reply('Você não tem permissão para postar isso.');

    await postarCards(message.channel, [
      {
        titulo: '1️⃣ Regras Gerais de Atendimento (Suporte Técnico/Dúvidas)',
        texto:
          '▫️ **Cordialidade Obrigatória:** Tratar todo membro com respeito, usando saudações profissionais (ex: "Olá, [Nome], como posso te ajudar hoje?"), independentemente da grosseria do usuário.\n' +
          '▫️ **Tempo Limite de Resposta (SLA):** Todo ticket aberto deve ter uma resposta inicial em até X horas (geralmente de 2 a 12 horas, dependendo do tamanho da org).\n' +
          '▫️ **Coleta de Provas:** O suporte nunca deve fechar um ticket de erro sem pedir prints, gravações de tela ou IDs que comprovem o problema técnico alegado.\n' +
          '▫️ **Sigilo de Dados:** Proibido expor informações privadas do usuário (como e-mail, telefone ou comprovantes) em canais públicos do Discord ou redes sociais.',
      },
      {
        titulo: '2️⃣ Regras Rígidas para Tickets de Reembolso',
        texto:
          'Os tickets de reembolso são os mais sensíveis e exigem regras estritas para evitar que a organização tome prejuízo ou sofra golpes:\n\n' +
          '▫️ **Prazo de Solicitação:** O reembolso só pode ser solicitado dentro de um prazo máximo (ex: 7 dias após a compra ou até 48h antes do início do campeonato).\n' +
          '▫️ **Comprovante de Pagamento Válido:** O reembolso só pode ser processado se o usuário anexar o comprovante original do Pix ou cartão. O nome no comprovante deve bater com os dados do ticket.\n' +
          '▫️ **Motivos Elegíveis:** Válidos — instabilidade na plataforma, cancelamento do evento pela guilda, ou cobrança duplicada. Inválidos — arrependimento, ban por trapaça, ou falta no dia por descuido próprio.\n' +
          '▫️ **Estorno na Mesma Moeda/Conta:** O dinheiro deve ser devolvido estritamente para a mesma conta PIX ou cartão que realizou o pagamento original. Isso evita lavagem de dinheiro ou fraude.',
      },
      {
        titulo: '3️⃣ Procedimento Operacional (Fluxo do Ticket)',
        texto:
          '▫️ **Status do Ticket:** O analista deve categorizar o ticket corretamente (Em Aberto, Em Análise, Aguardando o Usuário ou Resolvido).\n' +
          '▫️ **Aprovação de Alçada:** O atendente de suporte analisa o caso, mas o estorno financeiro geralmente precisa da aprovação de um Diretor ou Administrador Líder antes de ser enviado.\n' +
          '▫️ **Fechamento por Inatividade:** Se o usuário abrir o ticket, o suporte responder e o usuário sumir, o ticket deve ser fechado automaticamente após 48 horas sem resposta.',
      },
    ]);

    await message.delete().catch(() => {});
    return;
  }

  // !regrasblacklist -> regulamento de análise/blacklist (texto grande)
  if (message.content.trim() === '!regrasblacklist') {
    if (!temPermissaoAdmin) return message.reply('Você não tem permissão para postar isso.');

    const texto = `⏳ **Solicitação de Tela:**
O jogador tem até 2 minutos para solicitar a tela com o [nick] do suspeito e informar o canal de voz da análise em aberto.

⏳ **Tempo de transmissão:**
O suspeito deve acessar no canal de voz dentro de 5 minutos.

╺╸ **Replay e Tempo**
É W.O automático se passar 5 minutos sem mostrar o replay? Não é W.O imediato! É tolerante se: o jogador informar o motivo da demora, ou se comunicar sobre a situação. Não aplicamos W.O precipitadamente.

🔎 **Verificação do Replay:**
O acusador deve analisar o replay e verificar se há algo suspeito.

📣 **Ação do Mediador:**
Se o replay parecer suspeito para o mediador, ele vai acionar um ScreenShare [Analista] da organização. Caso contrário, se estiver normal, o pagamento será feito para o vencedor da partida.

🚨 **Passando Pano:**
Caso você perceba que o [ADM] não está sendo imparcial ou justo nas análises, e esteja favorecendo outros jogadores, por favor, abra um ticket para nos informar sobre o ocorrido.

📶 **Problemas de Conexão no Replay:**
Se o replay estiver cortado por problemas de conexão, o acusador deve enviar clipes suspeitos para análise. Se o replay estiver normal, a partida segue normalmente.

🚨 **Proibição de Relogar:**
Caso o replay do acusado seja suspeito, é proibido relogar no jogo, seja em dispositivos Android, iOS ou emuladores.

🛡️ **Suspeita de WallHack:**
Se houver suspeita de WallHack, envie clipes suspeitos. Se confirmado, indique o [nick] do jogador suspeito para revisão do replay.

🚨 **Investigação com SCREENSHARE:**
Em casos de suspeita de hack, nossa equipe pode solicitar uma sessão de SCREENSHARE para uma investigação detalhada. Durante esta sessão, verificamos:

🔍 Atividades Suspeitas — software não autorizado ou comportamentos incomuns que possam indicar o uso de cheats.
⚙️ Configurações do Sistema — modificações suspeitas que possam comprometer a integridade do jogo.
📁 Registro de Atividades — logs apagados ou alterados, serviços desativados ou indício de ocultação de ações maliciosas.

🎯 Nosso objetivo é garantir um ambiente justo e seguro para todos os jogadores. Agradecemos sua cooperação durante este processo!

📱 **IOS**
✅ VPN é W.O (exceto VPN Escolar).
✅ iPhone é proibido de reiniciar durante/após a partida.
✅ iPhone obrigatório jogar com tempo de uso e relatório de privacidade ativado.
✅ iPhone versão 15.x a 16.x em apostas acima de R$50 (MD3): deve abrir tela reinstalando o jogo e entrando na sala.
✅ iPhones 15.x–16.x com App Store na bateria após a partida são passíveis de W.O.
✅ iPhones 15.x–16.x com replay suspeito são passíveis de W.O.
✅ iPhones com modo Developer ativado resultam em W.O.
✅ iOS jogando com conta em blacklist sem gravação do início ao fim = W.O imediato.
✅ É proibido relogar com replay suspeito.

📱 **ANDROID**
✅ Proibido Root.
✅ Proibido MT Manager.
✅ Play Store pós-partida pode resultar em W.O caso o analista ache necessário.
✅ Proibido jogar qualquer modo que salve replay pós-partida.
✅ Proibido qualquer tipo de arquivo ou programa que dê vantagem sobre outros jogadores.
✅ Proibido acessar Google Drive ou ZArchiver pós-partida.
✅ Navegador só será W.O caso o histórico esteja limpo.
✅ Qualquer tipo de arquivo, programa ou rastro suspeito, de janeiro de 2026 em diante, será aplicado W.O.
✅ Shader modificada é W.O.
✅ Qualquer tipo de VPN que não seja do governo ou apostas esportivas será aplicado W.O.
✅ Obrigatório ter o App Usage instalado com todas as permissões concedidas.

💻 **EMULADOR**
✅ Proibido uso de injeções ou modificações de DLL durante/após a partida (ex: ProcessHacker, CMD, Cheat Engine, etc).
✅ Proibido remover pendrive pós boot.
✅ Todos os discos devem ser NTFS com USNJournal ativo. Em caso de replay estranho, é passível de W.O.
✅ Proibido reiniciar o emulador após a partida (relogar apenas o jogo é permitido).
✅ Temp, Prefetch e Recent limpas pós boot do PC = W.O.
✅ BAM pausada/limpa = W.O.
✅ Windows modificado que impossibilite telagem = W.O.
✅ Negar acesso via AnyDesk/TeamViewer = W.O.
✅ Sysmon ativada após boot (sem reiniciar o PC) = W.O.
✅ Rastro de serviço pausado, mesmo que temporariamente = W.O.
✅ Sempre confira atualizações da Sysmon (desatualizada/modificada/replace = W.O).
✅ Placas-mãe X99: avisar o SS caso não tenha Secure Boot/TPM.
✅ Caso algum destes serviços esteja desabilitado, será W.O em replays suspeitos: PcaSvc, PlugPlay, DPS, DiagTrack, SysMain, Sysmon (By Keller), EventLog, Data Usage, TPM e Secure Boot.

🎮 **1x1**
✅ Solicitar a tela de apenas 1 jogador.

👥 **2x2**
✅ Solicitar a tela de todos os jogadores. Após assistir aos replays, o solicitante poderá encaminhar no máximo 2 jogadores suspeitos para análise do mediador.

👥 **3x3**
✅ Solicitar a tela de todos os jogadores. Após assistir aos replays, o solicitante poderá encaminhar no máximo 2 jogadores suspeitos para análise do mediador.

👥 **4x4**
✅ Solicitar a tela de todos os jogadores. Após assistir aos replays, o solicitante poderá encaminhar no máximo 2 jogadores suspeitos para análise do mediador.

📝 **Exemplo**
Em uma partida 4x4, foram solicitadas as telas dos jogadores 1, 2, 3 e 4. Após assistir aos replays de todos, o jogador que realizou a solicitação identificou suspeitas apenas nos jogadores 1 e 3. Nesse caso, somente os replays desses dois jogadores deverão ser encaminhados para análise do mediador.

⏰ **Tempo para Abrir Tela**
✅ Em caso de várias telas, todos os jogadores deverão estar com a tela aberta em até 8 minutos quando houver replay suspeito. O não cumprimento desse prazo não resulta em W.O automático.

👨‍⚖️ **Decisão do Mediador**
✅ O mediador poderá estender o prazo, quando necessário, para até 16 minutos em casos de replay normal.

🚫 **Restrições**
✅ Não é permitido solicitar tela após solicitar RV.`;

    await postarTextoEmCards(message.channel, '🛡️ Regulamento de Análise / Blacklist', texto);
    await message.delete().catch(() => {});
    return;
  }

  // !setcargoceo @cargo / !setcargomediador @cargo / !setcargosuporte
  // @cargo / !setcargosuporte @cargo — configura, direto pelo Discord,
  // qual cargo do servidor conta pra cada função. Fica salvo em arquivo
  // e já vale na hora, sem editar .env nem reiniciar o bot. Dá pra usar
  // marcando o cargo (@Cargo) ou colando o ID dele.
  // Gate: permissão "Gerenciar Servidor" do próprio Discord — assim dá
  // pra configurar isso mesmo antes de qualquer cargo/CEO existir.
  // Embed verde de "cargo configurado com sucesso" — a menção do cargo
// (<@&id>) já sai automaticamente com a cor do próprio cargo no
// Discord, sem precisar de nada especial pra isso.
function montarEmbedCargoConfigurado(nomeTipo, idCargo, extra) {
  return new EmbedBuilder()
    .setColor(0x2ecc71)
    .setDescription(`✅ Cargo **${nomeTipo}** configurado: <@&${idCargo}> com sucesso!${extra ? `\n\n${extra}` : ''}`);
}

// Manda a resposta só na DM de quem usou o comando (assim ninguém mais
// no canal vê) e apaga a mensagem do comando. Se a DM falhar (usuário
// com DM fechada), manda no canal mesmo só que se autodestrói rapidinho.
async function responderPrivadamente(message, payload) {
  try {
    await message.author.send(payload);
  } catch (err) {
    const msg = await message.channel.send(payload).catch(() => null);
    if (msg) setTimeout(() => msg.delete().catch(() => {}), 8000);
  }
  await message.delete().catch(() => {});
}

if (message.content.trim().startsWith('!setcargoceo')) {
    if (!temPermissaoAdmin) return message.reply('Você não tem permissão para usar esse comando.');
    const idCargo = extrairIdDeCargo(message);
    if (!idCargo) return message.reply('Uso correto: `!setcargoceo @cargo` (marque o cargo, ou cole o ID dele).');
    CEO_ROLE_ID = idCargo;
    salvarConfigCargo('ceoRoleId', idCargo);
    return responderPrivadamente(message, { embeds: [montarEmbedCargoConfigurado('CEO', idCargo, 'Já vale na hora, não precisa reiniciar o bot.')] });
  }

  if (message.content.trim().startsWith('!setcargomediador')) {
    if (!temPermissaoAdmin) return message.reply('Você não tem permissão para usar esse comando.');
    const idCargo = extrairIdDeCargo(message);
    if (!idCargo) return message.reply('Uso correto: `!setcargomediador @cargo` (marque o cargo, ou cole o ID dele).');
    MEDIADOR_ROLE_ID = idCargo;
    salvarConfigCargo('mediadorRoleId', idCargo);
    return responderPrivadamente(message, {
      embeds: [
        montarEmbedCargoConfigurado(
          'Mediador',
          idCargo,
          'Já vale na hora: quem tiver esse cargo já pode usar Finalizar Aposta, Escolher Vencedor, W.O./Vitória e Cancelar. Se você tirar o cargo de alguém, ela perde o acesso na hora também — não precisa reiniciar o bot em nenhum dos dois casos.'
        ),
      ],
    });
  }

  if (message.content.trim().startsWith('!setcargosuporte')) {
    if (!temPermissaoAdmin) return message.reply('Você não tem permissão para usar esse comando.');
    const idCargo = extrairIdDeCargo(message);
    if (!idCargo) return message.reply('Uso correto: `!setcargosuporte @cargo` (marque o cargo, ou cole o ID dele).');
    SUPORTE_ROLE_ID = idCargo;
    salvarConfigCargo('suporteRoleId', idCargo);
    return responderPrivadamente(message, { embeds: [montarEmbedCargoConfigurado('Suporte', idCargo, 'Já vale na hora, não precisa reiniciar o bot.')] });
  }

  // !vercargos — mostra os 4 cargos configurados agora (útil pra
  // conferir se está tudo certo, sem precisar abrir o .env).
  if (message.content.trim() === '!vercargos') {
    if (!temPermissaoAdmin) return message.reply('Você não tem permissão para usar esse comando.');
    return responderPrivadamente(message, {
      content:
        `**Cargos configurados agora:**\n` +
        `CEO: ${CEO_ROLE_ID ? `<@&${CEO_ROLE_ID}>` : '(não configurado)'}\n` +
        `Mediador: ${MEDIADOR_ROLE_ID ? `<@&${MEDIADOR_ROLE_ID}>` : '(não configurado)'}\n` +
        `Suporte: ${SUPORTE_ROLE_ID ? `<@&${SUPORTE_ROLE_ID}>` : '(não configurado)'}`,
    });
  }

  // !addmediadoracesso / !removermediadoracesso / !listamediadoresacesso:
  // desativados — o acesso de mediador agora é SÓ pelo cargo configurado
  // com !setcargomediador (ou CEO, de !setcargoceo).
  if (/^!(addmediadoracesso|removermediadoracesso|listamediadoresacesso)/.test(message.content.trim())) {
    return message.reply('Esse comando foi desativado: o acesso de mediador agora é só pelo cargo configurado com `!setcargomediador`. Dê ou tire o cargo da pessoa no Discord.');
  }

  // !addmediador @pessoa chavepix  (cadastro manual, feito por um admin)
  if (message.content.trim().startsWith('!addmediador')) {
    if (!temPermissaoAdmin) {
      return message.reply('Você não tem permissão para gerenciar mediadores.');
    }

    const mencionado = message.mentions.users.first();
    if (!mencionado) {
      return message.reply('Uso correto: `!addmediador @pessoa chavepix`');
    }

    // remove "!addmediador", a menção, e junta o resto como chave pix
    const partes = message.content.trim().split(/\s+/).slice(1);
    const chavePix = partes.filter((p) => !p.startsWith('<@')).join(' ').trim();

    if (!chavePix) {
      return message.reply('Uso correto: `!addmediador @pessoa chavepix`');
    }

    const erroValidacao = validarCadastroMediador(chavePix, null);
    if (erroValidacao) {
      return message.reply(`❌ Algo deu errado: ${erroValidacao}`);
    }

    const membroAlvo = await message.guild.members.fetch(mencionado.id).catch(() => null);
    if (!membroAlvo || !(await membroPodeMediar(membroAlvo, message.guild))) {
      return message.reply(
        `🚫 <@${mencionado.id}> não tem o cargo de mediador. Dê o cargo configurado com \`!setcargomediador\` primeiro e depois cadastre o Pix.`
      );
    }

    const chaveAnalisada = analisarChavePix(chavePix);
    MEDIADOR_PIX[mencionado.id] = { chave: chaveAnalisada.chave, tipo: chaveAnalisada.tipo, nome: null, qrcodeUrl: null };
    salvarMediadorPix(MEDIADOR_PIX);

    await message.reply(`✅ Mediador <@${mencionado.id}> cadastrado com a chave Pix (${chaveAnalisada.tipo}): \`${chaveAnalisada.chave}\``);
    return;
  }

  // !removermediador @pessoa
  if (message.content.trim().startsWith('!removermediador')) {
    if (!temPermissaoAdmin) {
      return message.reply('Você não tem permissão para gerenciar mediadores.');
    }

    const mencionado = message.mentions.users.first();
    if (!mencionado) {
      return message.reply('Uso correto: `!removermediador @pessoa`');
    }

    if (!(mencionado.id in MEDIADOR_PIX)) {
      return message.reply('Esse mediador não está cadastrado.');
    }

    delete MEDIADOR_PIX[mencionado.id];
    salvarMediadorPix(MEDIADOR_PIX);

    await message.reply(`🗑️ Mediador <@${mencionado.id}> removido.`);
    return;
  }

  // !listamediadores
  if (message.content.trim() === '!listamediadores') {
    if (!temPermissaoAdmin) {
      return message.reply('Você não tem permissão para ver essa lista.');
    }

    const ids = Object.keys(MEDIADOR_PIX);
    if (!ids.length) {
      return message.reply('Nenhum mediador cadastrado ainda. Use `!addmediador @pessoa chavepix`.');
    }

    const linhas = ids.map((id) => {
      const d = MEDIADOR_PIX[id];
      const chave = typeof d === 'string' ? d : d.chave;
      const nome = typeof d === 'object' && d.nome ? ` (${d.nome})` : '';
      return `• <@${id}>${nome} — \`${chave}\``;
    });
    return message.reply(`**Mediadores cadastrados:**\n${linhas.join('\n')}`);
  }
 } catch (err) {
  console.error('⚠️ Erro não tratado numa mensagem:', err);
 }
});

// ---------- COMANDOS DE SALA NO TÓPICO (renomeia + apaga a mensagem) ----------
// "/qualquer-coisa" ou comando de ponto (".cs", ".cs h", ".s", ".painel"...).
const REGEX_COMANDO_SALA = /^(\/|\.[a-z]{1,12}(\s|$))/i;

// A mensagem do mediador só é apagada DEPOIS que o painel do comando carrega
// (a resposta do outro bot a essa mensagem) — se apagasse antes, o outro bot
// não conseguiria responder. Sem resposta nenhuma, apaga em 12 segundos.
const comandosSalaPendentes = new Map(); // idDaMensagem -> { timer }
function agendarApagarComandoSala(message) {
  const apagar = () => {
    const pendente = comandosSalaPendentes.get(message.id);
    if (pendente) clearTimeout(pendente.timer);
    comandosSalaPendentes.delete(message.id);
    message.delete().catch(() => {});
  };
  comandosSalaPendentes.set(message.id, { timer: setTimeout(apagar, 12000), apagar });
}

client.on('messageCreate', (m) => {
  try {
    if (!m.author.bot || (client.user && m.author.id === client.user.id)) return;
    const idOriginal = m.reference && m.reference.messageId;
    const pendente = idOriginal && comandosSalaPendentes.get(idOriginal);
    if (!pendente) return;
    clearTimeout(pendente.timer);
    pendente.timer = setTimeout(pendente.apagar, 2500); // deixa o painel terminar de carregar
  } catch (err) {
    // nunca derruba o bot
  }
});

// ---------- COMEÇA LIMPO A CADA LIGADA (deploy/reinício) ----------
// Ao ligar, ninguém está em nenhuma fila: nem jogadores (que ficavam salvos
// no arquivo dos painéis), nem mediadores/suporte com "sessão aberta" de
// antes. Cada pessoa só entra no sistema quando apertar o botão de entrar.
// (Partidas já abertas continuam normais — só as FILAS são zeradas.)
async function zerarEstadoNoInicio() {
  try {
    let mudouFilas = false;
    for (const instancia of painelInstancias.values()) {
      for (const chave of Object.keys(instancia.filas)) {
        if (instancia.filas[chave].length) {
          instancia.filas[chave].length = 0;
          mudouFilas = true;
        }
      }
    }
    if (mudouFilas) salvarPaineisFila();

    let mudouAdm = false;
    for (const dados of Object.values(DADOS_ADM)) {
      if (dados && dados.entradaTs) {
        delete dados.entradaTs;
        mudouAdm = true;
      }
    }
    if (mudouAdm) salvarRankingAdm(DADOS_ADM);

    let mudouSuporte = false;
    for (const dados of Object.values(DADOS_SUPORTE)) {
      if (dados && dados.entradaTs) {
        delete dados.entradaTs;
        mudouSuporte = true;
      }
    }
    if (mudouSuporte) salvarRankingSuporte(DADOS_SUPORTE);

    // painéis que já estão na tela passam a mostrar "ninguém na fila"
    await restaurarPaineisMediador();
    await restaurarPainelSuporteFila();
    for (const instancia of painelInstancias.values()) {
      await atualizarPainelPorMensagem(instancia);
    }
  } catch (err) {
    console.error('⚠️ Erro ao zerar as filas na inicialização:', err);
  }
}

// ---------- AVISO DE CÓPIA DUPLICADA DO BOT ----------
// Se o bot vê dois painéis iguais, dele mesmo, postados quase juntos no
// mesmo canal, é porque existem 2 cópias ligadas com o mesmo token.
const ultimosPaineisDoBot = new Map(); // "canal|título" -> { id, ts }
let ultimoAvisoCopiaDupla = 0;
client.on('messageCreate', async (m) => {
  try {
    if (!client.user || m.author.id !== client.user.id) return;
    const tituloBruto = m.embeds && m.embeds[0] && m.embeds[0].title;
    if (!tituloBruto || !m.components || !m.components.length) return; // só painéis
    const titulo = tituloBruto.replace(/\s*\(\d+\)\s*$/, '');
    const chave = `${m.channelId}|${titulo}`;
    const anterior = ultimosPaineisDoBot.get(chave);
    ultimosPaineisDoBot.set(chave, { id: m.id, ts: Date.now() });

    if (anterior && anterior.id !== m.id && Date.now() - anterior.ts < 6000 && Date.now() - ultimoAvisoCopiaDupla > 60000) {
      ultimoAvisoCopiaDupla = Date.now();
      console.error('⚠️ Painel duplicado: existe OUTRA cópia do bot ligada com o mesmo token.');
      const aviso = await m.channel.send(
        '⚠️ **Tem outra cópia do bot ligada** (por isso o painel saiu em dobro). No Discord Developer Portal → seu app → **Bot** → **Reset Token**, ' +
          'coloque o token novo só no Railway e reinicie. Isso derruba qualquer cópia esquecida.'
      );
      setTimeout(() => aviso.delete().catch(() => {}), 60000);
    }
  } catch (err) {
    // aviso é só um extra, nunca pode derrubar o bot
  }
});

// ---------- INTERAÇÕES (BOTÕES) ----------

client.on('interactionCreate', async (interaction) => {
 try {
  // Pix automático (painel de API) e Google Meet (criar/copiar link)
  if (await tratarInteracaoPixMeet(interaction)) return;

  // --- Botão "Verificar ID" da Blacklist -> abre o formulário ---
  // --- Botões do painel de Salas Automáticas ---
  if (interaction.isButton() && ['salasbot_criar', 'salasbot_estoque'].includes(interaction.customId)) {
    if (!(await usuarioECeo(interaction))) {
      return interaction.reply({ content: '🚫 Só quem tem o cargo de CEO pode usar essa opção.', ephemeral: true });
    }

    const comando = interaction.customId === 'salasbot_criar' ? '.painel' : '.s';
    const acao = interaction.customId === 'salasbot_criar' ? 'criar uma sala' : 'ver o estoque de salas';
    const sufixo = interaction.customId === 'salasbot_criar' ? 'criar' : 'estoque';
    const nomeTopico = `salas-${sufixo}-${interaction.user.username}`;

    // Só 1 tópico por opção por vez: se já existe um aberto, reaproveita.
    const topicosExistentes = await interaction.channel.threads.fetchActive().catch(() => null);
    const topicoJaAberto = topicosExistentes?.threads.find((t) => t.name === nomeTopico);

    if (topicoJaAberto) {
      return interaction.reply({ content: `Você já tem um tópico aberto: ${topicoJaAberto}`, ephemeral: true });
    }

    const topico = await interaction.channel.threads
      .create({
        name: nomeTopico,
        type: ChannelType.PrivateThread,
        reason: 'Salas automáticas',
      })
      .catch(() => null);

    if (!topico) {
      return interaction.reply({ content: '⚠️ Não consegui criar o tópico. Confira as permissões do bot.', ephemeral: true });
    }

    await topico.members.add(interaction.user.id).catch(() => {});

    await topico.send({
      embeds: [
        new EmbedBuilder()
          .setColor(COR_AMARELA)
          .setAuthor({ name: NOME_ORG })
          .setTitle('🤖 Como continuar')
          .setDescription(
            `Pra ${acao}, digite aqui neste tópico:\n\n\`${comando}\`\n\n` +
              'Quando terminar, aperte **Finalizar** pra apagar este tópico. Se ninguém apertar, ele é apagado sozinho em **5 horas**.'
          ),
      ],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('salasbot_finalizar').setLabel('Finalizar').setEmoji(EMOJI_FINALIZAR).setStyle(ButtonStyle.Danger)
        ),
      ],
    });

    // se ninguém finalizar, o tópico é apagado sozinho em 5 horas (fica salvo
    // em arquivo, então vale mesmo se o bot reiniciar)
    telaTopicos[topico.id] = Date.now() + TOPICO_SALAS_DURACAO_MS;
    salvarTelaTopicos();
    agendarExclusaoTopicoTela(topico.id, telaTopicos[topico.id]);

    return interaction.reply({ content: `✅ Tópico criado: ${topico}`, ephemeral: true });
  }

  // --- Botão "Finalizar" (apaga o tópico da sala automática) ---
  if (interaction.isButton() && interaction.customId === 'salasbot_finalizar') {
    await interaction.deferUpdate().catch(() => {});
    esquecerTopicoTela(interaction.channelId);
    await interaction.channel.delete('Sala automática finalizada').catch(() => {});
    return;
  }

  if (interaction.isButton() && interaction.customId === 'blacklist_verificar') {
    return interaction.showModal(montarModalBlacklist());
  }

  // --- Envio do formulário da Blacklist ---
  if (interaction.isModalSubmit() && interaction.customId === 'modal_blacklist') {
    const id = interaction.fields.getTextInputValue('input_id_blacklist').trim();
    const registro = BLACKLIST[id] || null;
    return interaction.reply({ embeds: [montarEmbedResultadoBlacklist(id, registro)], ephemeral: true });
  }

  // --- Botão "Cadastrar Pix" -> abre o formulário ---
  if (interaction.isButton() && interaction.customId === 'mediador_cadastrar_pix') {
    if (!(await membroPodeMediar(interaction.member, interaction.guild))) {
      return interaction.reply({
        content: '🚫 Só CEO ou Mediador pode cadastrar Pix aqui. Peça pra um admin configurar o cargo com `!setcargoceo` ou `!setcargomediador` primeiro.',
        ephemeral: true,
      });
    }
    return interaction.showModal(montarModalCadastroMediador());
  }

  // --- Envio do formulário de cadastro ---
  if (interaction.isModalSubmit() && interaction.customId === 'modal_cadastro_mediador') {
    if (!(await membroPodeMediar(interaction.member, interaction.guild))) {
      return interaction.reply({
        content: '🚫 Só CEO ou Mediador pode cadastrar Pix aqui. Peça pra um admin configurar o cargo com `!setcargoceo` ou `!setcargomediador` primeiro.',
        ephemeral: true,
      });
    }

    const chave = interaction.fields.getTextInputValue('input_pix').trim();
    const nome = interaction.fields.getTextInputValue('input_nome').trim();
    const qrcodeUrl = interaction.fields.getTextInputValue('input_qrcode').trim();

    const erroValidacao = validarCadastroMediador(chave, nome, qrcodeUrl);
    if (erroValidacao) {
      return interaction.reply({ content: `❌ Algo deu errado: ${erroValidacao}`, ephemeral: true });
    }
    const chaveAnalisada = analisarChavePix(chave);

    // sempre substitui o cadastro antigo (pode cadastrar de novo quantas
    // vezes quiser, sem precisar de admin remover antes)
    const dados = { chave: chaveAnalisada.chave, tipo: chaveAnalisada.tipo, nome: nome || null, qrcodeUrl: qrcodeUrl || null };
    MEDIADOR_PIX[interaction.user.id] = dados;
    salvarMediadorPix(MEDIADOR_PIX);

    return interaction.reply({
      content: '✅ Cadastro salvo com sucesso!',
      embeds: [montarEmbedCadastroMediador(interaction.user, dados)],
      components: [montarBotoesCadastroMediador()].filter(Boolean),
      ephemeral: true,
    });
  }

  // --- Botão "Gerar Novo Pix" -> apaga o antigo e cadastra um novo ---
  if (interaction.isButton() && interaction.customId === 'mediador_gerar_novo_pix') {
    if (!(await membroPodeMediar(interaction.member, interaction.guild))) {
      return interaction.reply({
        content: '🚫 Só CEO ou Mediador pode usar isso aqui. Peça pra um admin configurar o cargo com `!setcargoceo` ou `!setcargomediador` primeiro.',
        ephemeral: true,
      });
    }
    return interaction.showModal(montarModalGerarNovoPix());
  }

  // --- Envio do formulário de "Gerar Novo Pix" ---
  if (interaction.isModalSubmit() && interaction.customId === 'modal_gerar_novo_pix') {
    if (!(await membroPodeMediar(interaction.member, interaction.guild))) {
      return interaction.reply({
        content: '🚫 Só CEO ou Mediador pode usar isso aqui. Peça pra um admin configurar o cargo com `!setcargoceo` ou `!setcargomediador` primeiro.',
        ephemeral: true,
      });
    }

    const chave = interaction.fields.getTextInputValue('input_pix').trim();
    const nome = interaction.fields.getTextInputValue('input_nome').trim();
    const qrcodeUrl = interaction.fields.getTextInputValue('input_qrcode').trim();

    const erroValidacao = validarCadastroMediador(chave, nome, qrcodeUrl);
    if (erroValidacao) {
      return interaction.reply({ content: `❌ Algo deu errado: ${erroValidacao}`, ephemeral: true });
    }
    const chaveAnalisada = analisarChavePix(chave);

    // substitui o cadastro antigo pelo novo (apaga o de antes)
    const dados = { chave: chaveAnalisada.chave, tipo: chaveAnalisada.tipo, nome: nome || null, qrcodeUrl: qrcodeUrl || null };
    MEDIADOR_PIX[interaction.user.id] = dados;
    salvarMediadorPix(MEDIADOR_PIX);

    return interaction.reply({
      content: '✅ Pix atualizado! Sua chave antiga foi substituída por essa nova.',
      embeds: [montarEmbedCadastroMediador(interaction.user, dados)],
      components: [montarBotoesCadastroMediador()].filter(Boolean),
      ephemeral: true,
    });
  }

  // --- Botão "Excluir Pix" -> apaga o cadastro do sistema ---
  if (interaction.isButton() && interaction.customId === 'mediador_excluir_pix') {
    if (!(await membroPodeMediar(interaction.member, interaction.guild))) {
      return interaction.reply({
        content: '🚫 Só CEO ou Mediador pode usar isso aqui. Peça pra um admin configurar o cargo com `!setcargoceo` ou `!setcargomediador` primeiro.',
        ephemeral: true,
      });
    }
    if (!MEDIADOR_PIX[interaction.user.id]) {
      return interaction.reply({ content: 'Você não tem nenhuma chave Pix cadastrada.', ephemeral: true });
    }

    delete MEDIADOR_PIX[interaction.user.id];
    salvarMediadorPix(MEDIADOR_PIX);

    // sem Pix cadastrado não pode continuar na fila de mediadores
    const posicaoNaFila = filaMediadores.indexOf(interaction.user.id);
    if (posicaoNaFila !== -1) {
      filaMediadores.splice(posicaoNaFila, 1);
      encerrarSessaoAdm(interaction.user.id);
      await atualizarPainelMediadorSeExistir();
    }

    return interaction.reply({
      content: '🗑️ Sua chave Pix foi excluída do sistema. Você precisa cadastrar uma nova antes de entrar na fila de novo.',
      ephemeral: true,
    });
  }

  // --- Botão "Verificar Cadastro" ---
  if (interaction.isButton() && interaction.customId === 'mediador_verificar_cadastro') {
    if (!(await membroPodeMediar(interaction.member, interaction.guild))) {
      return interaction.reply({
        content: '🚫 Só CEO ou Mediador pode usar isso aqui. Peça pra um admin configurar o cargo com `!setcargoceo` ou `!setcargomediador` primeiro.',
        ephemeral: true,
      });
    }
    const dados = pegarDadosMediador(interaction.user.id);

    if (!dados) {
      return interaction.reply({
        content: 'Você ainda não cadastrou sua chave PIX. Clique em **Cadastrar Pix** primeiro.',
        ephemeral: true,
      });
    }

    return interaction.reply({
      embeds: [montarEmbedCadastroMediador(interaction.user, dados)],
      components: [montarBotoesCadastroMediador()].filter(Boolean),
      ephemeral: true,
    });
  }

  // --- Botões da fila de mediadores (Entrar / Sair / ⚙️) ---
  if (
    interaction.isButton() &&
    ['fila_mediador_entrar', 'fila_mediador_sair'].includes(interaction.customId)
  ) {
    const idMediador = interaction.user.id;

    if (interaction.customId === 'fila_mediador_entrar') {
      if (!(await membroPodeMediar(interaction.member, interaction.guild))) {
        return interaction.reply({
          content: '🚫 Só quem tem o cargo de mediador pode entrar nessa fila. Peça pra um admin configurar com `!setcargomediador`.',
          ephemeral: true,
        });
      }

      if (filaMediadores.includes(idMediador)) {
        return interaction.reply({ content: 'Você já está na fila de mediadores.', ephemeral: true });
      }

      // só entra quem já cadastrou a chave Pix (o nome é opcional: se não
      // informar, usamos o ID/@ do Discord como identificação)
      const dadosCadastro = pegarDadosMediador(idMediador);
      if (!dadosCadastro || !dadosCadastro.chave) {
        return interaction.reply({
          content: 'Você precisa cadastrar sua chave Pix.',
          ephemeral: true,
        });
      }

      filaMediadores.push(idMediador);
      iniciarSessaoAdm(idMediador);
      return interaction.update({
        embeds: [montarEmbedFilaMediador()],
        components: [montarBotoesFilaMediador()],
      });
    }

    if (interaction.customId === 'fila_mediador_sair') {
      const indice = filaMediadores.indexOf(idMediador);
      if (indice === -1) {
        return interaction.reply({ content: 'Você não está na fila de mediadores.', ephemeral: true });
      }

      filaMediadores.splice(indice, 1);
      encerrarSessaoAdm(idMediador);
      return interaction.update({
        embeds: [montarEmbedFilaMediador()],
        components: [montarBotoesFilaMediador()],
      });
    }
  }

  // --- Botões da fila de suporte (Entrar / Sair) ---
  if (interaction.isButton() && ['fila_suporte_entrar', 'fila_suporte_sair'].includes(interaction.customId)) {
    const idSuporte = interaction.user.id;

    if (interaction.customId === 'fila_suporte_entrar') {
      if (filaSuporte.includes(idSuporte)) {
        return interaction.reply({ content: 'Você já está na fila de suporte.', ephemeral: true });
      }
      if (!(await usuarioPodeSuportar(interaction))) {
        return interaction.reply({ content: 'Você não tem o cargo necessário para entrar nessa fila.', ephemeral: true });
      }
      if (!SUPORTE_PIX[idSuporte]) {
        return interaction.reply({ content: 'Você precisa cadastrar sua chave Pix.', ephemeral: true });
      }

      filaSuporte.push(idSuporte);
      iniciarSessaoSuporte(idSuporte);
      await atualizarPainelSuporteFilaSeExistir();
      return interaction.update({
        embeds: [montarEmbedFilaSuporte()],
        components: [montarBotoesFilaSuporte()],
      });
    }

    if (interaction.customId === 'fila_suporte_sair') {
      const indice = filaSuporte.indexOf(idSuporte);
      if (indice === -1) {
        return interaction.reply({ content: 'Você não está na fila de suporte.', ephemeral: true });
      }

      filaSuporte.splice(indice, 1);
      encerrarSessaoSuporte(idSuporte);
      return interaction.update({
        embeds: [montarEmbedFilaSuporte()],
        components: [montarBotoesFilaSuporte()],
      });
    }
  }

  // --- Botão "Cadastrar Pix" (suporte) ---
  if (interaction.isButton() && interaction.customId === 'suporte_cadastrar_pix') {
    if (!(await usuarioPodeSuportar(interaction))) {
      return interaction.reply({
        content: '🚫 Só quem tem o cargo de suporte pode usar isso aqui. Peça pra um admin configurar o cargo com `!setcargosuporte` primeiro.',
        ephemeral: true,
      });
    }
    if (SUPORTE_PIX[interaction.user.id]) {
      return interaction.reply({
        content: '⚠️ Você já tem uma chave Pix cadastrada. Use **Verificar Cadastro** pra conferir.',
        ephemeral: true,
      });
    }
    return interaction.showModal(montarModalCadastroSuporte());
  }

  // --- Envio do formulário de cadastro Pix do suporte ---
  if (interaction.isModalSubmit() && interaction.customId === 'modal_cadastro_suporte') {
    if (!(await usuarioPodeSuportar(interaction))) {
      return interaction.reply({
        content: '🚫 Só quem tem o cargo de suporte pode usar isso aqui. Peça pra um admin configurar o cargo com `!setcargosuporte` primeiro.',
        ephemeral: true,
      });
    }
    const chave = interaction.fields.getTextInputValue('input_pix').trim();
    const nome = interaction.fields.getTextInputValue('input_nome').trim();

    const erroValidacao = validarCadastroMediador(chave, nome);
    if (erroValidacao) {
      return interaction.reply({ content: `❌ Algo deu errado: ${erroValidacao}`, ephemeral: true });
    }
    const chaveAnalisada = analisarChavePix(chave);

    SUPORTE_PIX[interaction.user.id] = { chave: chaveAnalisada.chave, tipo: chaveAnalisada.tipo, nome: nome || null };
    salvarSuportePix(SUPORTE_PIX);

    return interaction.reply({
      content: '✅ Cadastro salvo com sucesso!',
      embeds: [montarEmbedPixSuporte(interaction.user.id)],
      ephemeral: true,
    });
  }

  // --- Botão "Verificar Cadastro" (suporte) ---
  if (interaction.isButton() && interaction.customId === 'suporte_verificar_cadastro') {
    if (!(await usuarioPodeSuportar(interaction))) {
      return interaction.reply({
        content: '🚫 Só quem tem o cargo de suporte pode usar isso aqui. Peça pra um admin configurar o cargo com `!setcargosuporte` primeiro.',
        ephemeral: true,
      });
    }
    if (!SUPORTE_PIX[interaction.user.id]) {
      return interaction.reply({
        content: 'Você ainda não cadastrou sua chave PIX. Clique em **Cadastrar Pix** primeiro.',
        ephemeral: true,
      });
    }
    return interaction.reply({ embeds: [montarEmbedPixSuporte(interaction.user.id)], ephemeral: true });
  }

  // --- Botões de ranking de suporte: Meu Perfil / Ranking ---
  if (interaction.isButton() && ['rankingsuporte_meuperfil', 'rankingsuporte_ver'].includes(interaction.customId)) {
    if (interaction.customId === 'rankingsuporte_meuperfil') {
      return interaction.reply({ embeds: [montarEmbedMeuPerfilSuporte(interaction.user)], ephemeral: true });
    }
    return interaction.reply({
      embeds: [await montarEmbedRankingSuporte(interaction.guild, interaction.user.id)],
      ephemeral: true,
    });
  }

  // --- Select: "Selecione o tipo de atendimento..." (Suporte / Reembolso) ---
  if (interaction.isStringSelectMenu() && interaction.customId === 'atendimento_menu') {
    // só abre ticket se tiver suporte na fila; 2ª vez com ticket aberto = canal oculto por 1h
    const bloqueio = await bloquearAberturaDeTicket(interaction);
    if (bloqueio) return aplicarBloqueioTicket(interaction, bloqueio, false);

    const opcao = interaction.values[0];

    if (opcao === 'reembolso') {
      return interaction.showModal(montarModalReembolso());
    }

    if (opcao === 'suporte') {
      return interaction.reply({
        content: 'Qual é o seu problema?',
        components: [montarSelectProblemaSuporte()],
        ephemeral: true,
      });
    }
  }

  // --- Envio do formulário de Reembolso -> cria o tópico (só suporte + você) ---
  if (interaction.isModalSubmit() && interaction.customId === 'modal_reembolso') {
    const chave = interaction.fields.getTextInputValue('input_chave_pix').trim();
    const nome = interaction.fields.getTextInputValue('input_nome_completo').trim();
    const valor = interaction.fields.getTextInputValue('input_valor').trim();

    const bloqueio = await bloquearAberturaDeTicket(interaction);
    if (bloqueio) return aplicarBloqueioTicket(interaction, bloqueio, false);

    const suporteId = await pegarProximoSuporte();
    if (!suporteId) {
      return interaction.reply({ content: '⏳ Não há nenhum suporte disponível agora. Tente de novo mais tarde.', ephemeral: true });
    }

    const topico = await interaction.channel.threads
      .create({
        name: `reembolso-${interaction.user.username}`,
        type: ChannelType.PrivateThread,
        reason: 'Ticket de reembolso',
      })
      .catch(() => null);

    if (!topico) {
      return interaction.reply({ content: '⚠️ Não consegui criar o tópico. Confira as permissões do bot.', ephemeral: true });
    }

    await topico.members.add(interaction.user.id).catch(() => {});
    await topico.members.add(suporteId).catch(() => {});

    await topico.send({
      content: `<@${suporteId}> <@${interaction.user.id}>`,
      embeds: [montarEmbedTicketReembolso(interaction.user, { chave, nome, valor }, suporteId)],
      components: [montarBotoesTicketReembolso()],
    });

    return interaction.reply({
      content: `✅ Ticket criado: ${topico}\n🎧 <@${suporteId}> vai te atender em breve!`,
      ephemeral: true,
    });
  }

  // --- Select: escolher o problema do suporte -> cria o tópico (só suporte + você) ---
  if (interaction.isStringSelectMenu() && interaction.customId === 'suporte_menu_problema') {
    const rotulos = {
      duvida_regras: 'Dúvida sobre as regras',
      problema_pagamento: 'Problema com pagamento',
      erro_bot: 'Erro ou bug no bot',
      denunciar_jogador: 'Denunciar um jogador',
      outros: 'Outros',
    };
    const assunto = rotulos[interaction.values[0]] || 'Outros';
    const ehPagamento = interaction.values[0] === 'problema_pagamento';

    const bloqueio = await bloquearAberturaDeTicket(interaction);
    if (bloqueio) return aplicarBloqueioTicket(interaction, bloqueio, true);

    const suporteId = await pegarProximoSuporte();
    if (!suporteId) {
      return interaction.update({ content: '⏳ Não há nenhum suporte disponível agora. Tente de novo mais tarde.', components: [] });
    }

    const topico = await interaction.channel.threads
      .create({
        name: `suporte-${interaction.user.username}`,
        type: ChannelType.PrivateThread,
        reason: 'Ticket de suporte',
      })
      .catch(() => null);

    if (!topico) {
      return interaction.update({ content: '⚠️ Não consegui criar o tópico. Confira as permissões do bot.', components: [] });
    }

    await topico.members.add(interaction.user.id).catch(() => {});
    await topico.members.add(suporteId).catch(() => {});

    await topico.send({
      content: `<@${suporteId}> <@${interaction.user.id}>`,
      embeds: [montarEmbedTicketSuporte(interaction.user, assunto, '.', suporteId, ehPagamento)],
      components: [montarBotoesTicketSuporte(ehPagamento)],
    });

    return interaction.update({
      content: `✅ Ticket criado: ${topico}\n🎧 <@${suporteId}> vai te atender em breve!`,
      components: [],
    });
  }

  // --- Botão "Informar Mediador" (nome do mediador + quanto ele deve) ---
  // Fica dentro do tópico privado do ticket (só você, o suporte e a equipe veem).
  if (interaction.isButton() && interaction.customId === 'ticket_informar_nome') {
    return interaction.showModal(montarModalInformarNome());
  }

  // --- Envio do formulário "Informar Mediador" ---
  if (interaction.isModalSubmit() && interaction.customId === 'modal_informar_nome') {
    const nomeDigitado = interaction.fields.getTextInputValue('input_nome_mediador').trim();
    let valorDevido = '';
    try {
      valorDevido = interaction.fields.getTextInputValue('input_valor_devido').trim();
    } catch (err) {
      valorDevido = ''; // formulário antigo, sem o campo do valor
    }
    if (valorDevido && !/\d/.test(valorDevido)) {
      return interaction.reply({ content: '❌ Informe o valor com números (ex: R$ 50,00).', ephemeral: true });
    }
    const valorFormatado = valorDevido ? (/^r\$/i.test(valorDevido) ? valorDevido : `R$ ${valorDevido}`) : null;

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COR_AMARELA)
          .setTitle('📌 Mediador indicado')
          .addFields(
            { name: 'Mediador:', value: nomeDigitado },
            ...(valorFormatado ? [{ name: 'Quanto ele deve:', value: valorFormatado }] : []),
            { name: 'Indicado por:', value: `<@${interaction.user.id}>` }
          ),
      ],
    });
  }

  // --- Botão "Resolvido" (fecha ticket de reembolso ou suporte) ---
  if (interaction.isButton() && interaction.customId === 'ticket_resolvido') {
    if (!(await usuarioPodeSuportar(interaction))) {
      return interaction.reply({ content: 'Só quem tem o cargo de suporte pode usar essa opção.', ephemeral: true });
    }

    registrarAtendimentoSuporte(interaction.user.id);

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle('✅ Atendimento finalizado')
          .setDescription('Esse ticket está sendo finalizado.'),
      ],
    });

    await interaction.channel.delete('Ticket resolvido').catch(() => {});
    return;
  }

  // --- Botões de ranking (jogador / adm): Meu Perfil / Ranking ---
  if (
    interaction.isButton() &&
    [
      'ranking_meuperfil',
      'ranking_ver',
      'rankingadm_meuperfil',
      'rankingadm_ver',
    ].includes(interaction.customId)
  ) {
    switch (interaction.customId) {
      case 'ranking_meuperfil':
        return interaction.reply({ embeds: [montarEmbedMeuPerfilJogador(interaction.user)], ephemeral: true });
      case 'ranking_ver':
        return interaction.reply({
          embeds: [await montarEmbedRankingJogadores(interaction.guild, interaction.user.id)],
          ephemeral: true,
        });
      case 'rankingadm_meuperfil':
        return interaction.reply({
          embeds: [montarEmbedMeuPerfilAdm(interaction.user, 'total')],
          components: [montarBotoesMeuPerfilAdm('total')],
          ephemeral: true,
        });
      case 'rankingadm_ver':
        return interaction.reply({
          embeds: [await montarEmbedRankingAdm(interaction.guild, interaction.user.id)],
          ephemeral: true,
        });
    }
  }

  // --- Botões Hoje/3 dias/7 dias do Meu Perfil Adm (edita a mesma msg) ---
  if (interaction.isButton() && ['perfiladm_hoje', 'perfiladm_3dias', 'perfiladm_7dias'].includes(interaction.customId)) {
    const periodo = interaction.customId.replace('perfiladm_', '');
    return interaction.update({
      embeds: [montarEmbedMeuPerfilAdm(interaction.user, periodo)],
      components: [montarBotoesMeuPerfilAdm(periodo)],
    });
  }

  // --- Select: "Finalizar Aposta" (menu abaixo da ficha) ---
  if (interaction.isStringSelectMenu() && interaction.customId === 'ficha_menu_opcoes') {
    const partida = partidas.get(interaction.channelId);
    if (!partida) return interaction.reply({ content: 'Essa partida não está mais ativa.', ephemeral: true });

    if (!(interaction.user.id === partida.mediadorId || (await usuarioPodeMediar(interaction)))) {
      return negarAcessoMediador(interaction);
    }

    if (interaction.values[0] === 'finalizar_aposta') {
      // some com as mensagens antigas (de finalizar ou de revanche) e mostra só as novas
      await apagarMensagemDeFluxo(interaction.channel, partida, 'msgRevancheId');
      await apagarMensagemDeFluxo(interaction.channel, partida, 'msgFinalizarId');

      const selectVencedor = await montarSelectEscolherVencedor(interaction.guild, partida);
      // Mensagem pública: todo mundo no tópico vê os passos de
      // finalizar (só o mediador consegue usar os menus).
      await interaction.reply({
        embeds: [montarEmbedEscolherVencedor()],
        components: [selectVencedor],
      });
      const resposta = await interaction.fetchReply().catch(() => null);
      if (resposta) partida.msgFinalizarId = resposta.id;
      salvarPartidas();
    }

    if (interaction.values[0] === 'revanche') {
      // as mensagens antigas de finalizar (e de revanche) somem e aparece a de revanche
      await apagarMensagemDeFluxo(interaction.channel, partida, 'msgFinalizarId');
      await apagarMensagemDeFluxo(interaction.channel, partida, 'msgRevancheId');

      // se o vencedor da revanche já tinha sido escolhido antes, vai direto pro valor
      if (partida.revancheVencedorId) {
        await interaction.reply({
          embeds: [montarEmbedRevancheEscolherValor(partida)],
          components: [montarSelectValorRevanche()],
        });
      } else {
        const selectVencedor = await montarSelectEscolherVencedor(interaction.guild, partida, 'revanche_escolher_vencedor');
        await interaction.reply({
          embeds: [montarEmbedRevancheEscolherVencedor()],
          components: [selectVencedor],
        });
      }
      const resposta = await interaction.fetchReply().catch(() => null);
      if (resposta) partida.msgRevancheId = resposta.id;
      salvarPartidas();
    }
    return;
  }

  // --- Select: escolher o vencedor da partida ---
  if (interaction.isStringSelectMenu() && interaction.customId === 'ficha_escolher_vencedor') {
    const partida = partidas.get(interaction.channelId);
    if (!partida) return interaction.reply({ content: 'Essa partida não está mais ativa.', ephemeral: true });

    if (!(interaction.user.id === partida.mediadorId || (await usuarioPodeMediar(interaction)))) {
      return negarAcessoMediador(interaction);
    }

    await interaction.deferUpdate().catch(() => {});

    partida.vencedorId = interaction.values[0];

    // já registra a vitória no sistema de ranking assim que o vencedor
    // é escolhido (não precisa esperar o passo de W.O./Vitória normal).
    // Não conta duas vezes se o mediador trocar de ideia.
    definirVitoriaDaPartida(partida, partida.vencedorId);
    salvarPartidas();

    // logo em seguida: escolher o mediador (edita a própria mensagem,
    // pública, todo mundo no tópico vê)
    const selectMediador = await montarSelectEscolherMediador(interaction.guild, partida, interaction.user.id);
    if (!selectMediador) {
      partida.mediadorFinalId = partida.mediadorId;
      salvarPartidas();
      return interaction.editReply({
        embeds: [montarEmbedVencedorDefinido(partida)],
        components: [montarSelectTipoVitoria()],
      });
    }
    return interaction.editReply({
      embeds: [montarEmbedEscolherMediador(partida)],
      components: [selectMediador],
    });
  }

  // --- Select: escolher o mediador que mediou a partida ---
  if (interaction.isStringSelectMenu() && interaction.customId === 'ficha_escolher_mediador') {
    const partida = partidas.get(interaction.channelId);
    if (!partida || !partida.vencedorId) {
      return interaction.reply({ content: 'Essa partida não está mais ativa.', ephemeral: true });
    }

    if (!(interaction.user.id === partida.mediadorId || (await usuarioPodeMediar(interaction)))) {
      return negarAcessoMediador(interaction);
    }

    partida.mediadorFinalId = interaction.values[0];
    salvarPartidas();

    return interaction.update({
      embeds: [montarEmbedVencedorDefinido(partida)],
      components: [montarSelectTipoVitoria()],
    });
  }

  // --- Select: vencedor por W.O. ou por Vitória -> encerra a partida ---
  if (interaction.isStringSelectMenu() && interaction.customId === 'ficha_tipo_vitoria') {
    const partida = partidas.get(interaction.channelId);
    if (!partida || !partida.vencedorId) {
      return interaction.reply({ content: 'Essa partida não está mais ativa.', ephemeral: true });
    }

    if (!(interaction.user.id === partida.mediadorId || (await usuarioPodeMediar(interaction)))) {
      return negarAcessoMediador(interaction);
    }

    const porWO = interaction.values[0] === 'wo';

    // a taxa vai pro mediador escolhido (ou o da partida) — e só uma vez
    // por rodada (se já foi creditada num passo de revanche, não repete)
    const mediadorDaTaxa = partida.mediadorFinalId || partida.mediadorId;
    if (mediadorDaTaxa && !partida.taxaCreditadaRodada) {
      registrarGanhoAdm(mediadorDaTaxa, ACRESCIMO_MEDIADOR);
      partida.taxaCreditadaRodada = true;
    }

    // tira os menus da mensagem de passo e manda a última mensagem,
    // sem nenhuma opção — o canal já é excluído em seguida.
    await interaction.update({ components: [] }).catch(() => {});
    await interaction.channel.send({ embeds: [montarEmbedPartidaEncerrada(porWO)] });

    // fecha a fila (tópico) na hora, sem esperar
    partidas.delete(interaction.channelId);
    salvarPartidas();
    await interaction.channel.delete('Aposta finalizada').catch((err) => {
      console.error('Erro ao excluir tópico após encerrar partida:', err);
    });

    return;
  }

  // --- Select (Revanche): escolher o vencedor da partida que acabou ---
  if (interaction.isStringSelectMenu() && interaction.customId === 'revanche_escolher_vencedor') {
    const partida = partidas.get(interaction.channelId);
    if (!partida) return interaction.reply({ content: 'Essa partida não está mais ativa.', ephemeral: true });

    if (!(interaction.user.id === partida.mediadorId || (await usuarioPodeMediar(interaction)))) {
      return negarAcessoMediador(interaction);
    }

    if (partida.revancheVencedorId) {
      return interaction.reply({ content: 'O vencedor dessa revanche já foi escolhido.', ephemeral: true });
    }

    partida.revancheVencedorId = interaction.values[0];
    salvarPartidas();

    // a partida que acabou conta: +1 vitória pro vencedor e a taxa do
    // mediador por essa rodada (a fila NÃO é finalizada)
    definirVitoriaDaPartida(partida, partida.revancheVencedorId);
    const mediadorDaTaxaRevanche = partida.mediadorFinalId || partida.mediadorId;
    if (mediadorDaTaxaRevanche && !partida.taxaCreditadaRodada) {
      registrarGanhoAdm(mediadorDaTaxaRevanche, ACRESCIMO_MEDIADOR);
      partida.taxaCreditadaRodada = true;
    }
    salvarPartidas();

    return interaction.update({
      embeds: [montarEmbedRevancheEscolherValor(partida)],
      components: [montarSelectValorRevanche()],
    });
  }

  // --- Select (Revanche): escolher o valor da nova fila ---
  if (interaction.isStringSelectMenu() && interaction.customId === 'revanche_valor_escolhido') {
    const partida = partidas.get(interaction.channelId);
    if (!partida) return interaction.reply({ content: 'Essa partida não está mais ativa.', ephemeral: true });

    if (!(interaction.user.id === partida.mediadorId || (await usuarioPodeMediar(interaction)))) {
      return negarAcessoMediador(interaction);
    }

    if (!partida.revancheVencedorId) {
      return interaction.reply({ content: 'Escolha o vencedor primeiro.', ephemeral: true });
    }

    const vencedorAnteriorId = partida.revancheVencedorId;
    partida.valor = `R$${interaction.values[0]}`;
    partida.revanches = (partida.revanches || 0) + 1;

    // zera a sala pra nova rodada (o mediador manda ID e senha de novo)
    delete partida.revancheVencedorId;
    delete partida.salaId;
    delete partida.salaSenha;
    delete partida.salaIdPendente;
    delete partida.salaMessage;
    partida.vencedorId = null;
    partida.aguardandoPagamento = false;
    // nova rodada: zera tudo dos passos de finalizar/revanche da rodada anterior
    delete partida.vitoriaRegistradaDe;
    delete partida.taxaCreditadaRodada;
    delete partida.mediadorFinalId;
    delete partida.msgFinalizarId;
    delete partida.msgRevancheId;
    salvarPartidas();

    // fecha o passo (tira o menu) e avisa todo mundo
    // "Revanche definida" já com Valor + Chave Pix, e os botões QR e Copiar
    await interaction.update({
      embeds: [montarEmbedRevancheDefinida(partida, vencedorAnteriorId)],
      components: [montarBotoesQrPix()],
    });

    // nome do tópico: pagar-R$<valor>💰 (igual ao de pagamento)
    if (interaction.channel.name !== nomeCanalPagar(partida.valor)) {
      await interaction.channel.setName(nomeCanalPagar(partida.valor)).catch(() => {});
    }

    // nova rodada: zera os pagamentos e mostra o exemplo de novo (se tiver API)
    await reiniciarPixPartida(interaction.channel, partida);
    await enviarExemploPix(interaction.channel, partida);

    return;
  }

  // --- Select: escolher o novo valor da partida (botão "Trocar Valor") ---
  if (interaction.isStringSelectMenu() && interaction.customId === 'sala_valor_escolhido') {
    const partida = partidas.get(interaction.channelId);
    if (!partida) return interaction.reply({ content: 'Essa partida não está mais ativa.', ephemeral: true });

    if (!(await usuarioPodeMediar(interaction))) {
      return interaction.update({ content: '🚫 Só admin pode mudar o valor da partida.', embeds: [], components: [] });
    }

    const novoValor = `R$${interaction.values[0]}`;

    if (novoValor === partida.valor) {
      return interaction.update({ content: `Esse já é o valor atual (${novoValor}).`, embeds: [], components: [] });
    }

    partida.valor = novoValor;

    if (partida.salaMessage) {
      await partida.salaMessage.edit({ embeds: [montarEmbedSala(partida)], components: [montarBotoesSala()] }).catch(() => {});
    }

    return interaction.update({ content: `✅ Valor da partida atualizado para **${novoValor}**.`, embeds: [], components: [] });
  }

  if (!interaction.isButton()) return;

  const userId = interaction.user.id;

  // --- Botões do painel principal (customId: "fila_<chave>:<painelId>",
  // ex.: "fila_normal:p1", "fila_inf:p1", "fila_emu1:p1", "fila_sair:p1") ---
  const [acaoFila, painelId] = interaction.customId.split(':');
  if (acaoFila && acaoFila.startsWith('fila_') && painelId) {
    const instancia = painelInstancias.get(painelId) || restaurarInstanciaPainel(painelId, interaction.message);
    if (!instancia) {
      return interaction.reply({ content: 'Esse painel não existe mais. Peça pra um admin postar de novo.', ephemeral: true });
    }

    // guarda onde está a mensagem do painel (pra atualizá-la sem interação
    // quando alguém volta pra fila depois de um cancelamento rápido)
    if (interaction.message) {
      instancia.msgCanalId = interaction.channelId;
      instancia.msgId = interaction.message.id;
    }

    const chaveFila = acaoFila.slice('fila_'.length);

    const removerDeTodasFilas = () => {
      for (const chave of Object.keys(instancia.filas)) {
        instancia.filas[chave] = instancia.filas[chave].filter((id) => id !== userId);
      }
    };

    if (chaveFila === 'sair') {
      removerDeTodasFilas();
      salvarPaineisFila();
      return atualizarPainel(interaction, instancia);
    }

    const filaAlvo = chaveFila;
    if (!instancia.filas[filaAlvo]) return; // customId de uma fila que não existe mais nesse painel

    if (instancia.filas[filaAlvo].includes(userId)) {
      return interaction.reply({ embeds: [embedAvisoBot('Você já está nessa fila.')], ephemeral: true });
    }

    const chaveOposta = Object.keys(instancia.filas).find((k) => k !== filaAlvo && instancia.filas[k].includes(userId));
    if (chaveOposta) {
      const labelOposta = instancia.filasDef.find((f) => f.key === chaveOposta).label;
      return interaction.reply({
        embeds: [embedAvisoBot(`Você já está na fila **${labelOposta}**. Toque em **Sair** primeiro para poder escolher outra opção.`)],
        ephemeral: true,
      });
    }

    if (contarFilasDoUsuario(userId) >= MAX_FILAS_SIMULTANEAS) {
      return interaction.reply({
        embeds: [embedAvisoBot(`Você já está em ${MAX_FILAS_SIMULTANEAS} filas simultâneamente.`)],
        ephemeral: true,
      });
    }

    if (filaMediadores.length === 0) {
      return interaction.reply({
        content: '🚫 Não há mediadores disponíveis no momento. Tente novamente daqui a pouco.',
        ephemeral: true,
      });
    }

    instancia.filas[filaAlvo].push(userId);
    salvarPaineisFila();

    if (instancia.filas[filaAlvo].length >= instancia.capacidade) {
      const jogadores = instancia.filas[filaAlvo].splice(0, instancia.capacidade);
      salvarPaineisFila();

      await interaction.update({
        embeds: [montarEmbedPainel(instancia)],
        components: [montarBotoesPainel(instancia)],
      });

      await criarPartidaDaFila(instancia, filaAlvo, jogadores, interaction.channel);

      return;
    }

    return atualizarPainel(interaction, instancia);
  }

  // --- Botões de confirmação (etapa 1, dentro do tópico) ---
  if (interaction.customId === 'partida_confirmar' || interaction.customId === 'partida_cancelar') {
    const threadId = interaction.channelId;
    const partida = partidas.get(threadId);

    if (!partida) return interaction.reply({ content: 'Essa partida não está mais ativa.', ephemeral: true });
    if (!partida.jogadores.includes(userId))
      return interaction.reply({ content: 'Você não faz parte dessa partida.', ephemeral: true });
    if (partida.cancelando) return interaction.reply({ content: 'Essa partida já está sendo cancelada.', ephemeral: true });

    if (interaction.customId === 'partida_confirmar') {
      // Cada pessoa só pode confirmar uma vez — depois de confirmar,
      // clicar de novo não faz nada além de avisar que já confirmou.
      if (partida.confirmados.has(userId)) {
        return interaction.reply({ content: '⚠️ Você já confirmou essa partida. Não dá pra confirmar de novo.', ephemeral: true });
      }

      partida.confirmados.add(userId);
      salvarPartidas();

      if (partida.confirmados.size < partida.jogadores.length) {
        // responde o clique primeiro (atualiza o card na hora, sem
        // esperar a mensagem de aviso ser mandada) — fica mais rápido
        await interaction.update({
          embeds: [montarEmbedConfirmacao(partida)],
          components: [montarBotoesConfirmacao()],
        });

        // avisa todo mundo no tópico quem confirmou e quem ainda falta,
        // no estilo "✅ | Partida Confirmada"
        const faltantes = partida.jogadores.filter((id) => !partida.confirmados.has(id));
        const textoFaltantes =
          faltantes.length > 1
            ? `Os outros jogadores (${faltantes.map((id) => `<@${id}>`).join(', ')}) precisam confirmar para continuar.`
            : `${faltantes.map((id) => `<@${id}>`).join(', ')} precisa confirmar para continuar.`;
        const mensagemAviso = await interaction.channel
          .send({
            embeds: [
              new EmbedBuilder()
                .setColor(0x57f287) // verde claro
                .setAuthor({ name: NOME_ORG })
                .setTitle('✅ | Partida Confirmada')
                .setDescription(`<@${userId}> confirmou a aposta!\n↳ ${textoFaltantes}`),
            ],
          })
          .catch(() => null);

        // guarda a referência (em memória, não salva em arquivo) pra
        // apagar essa mensagem automaticamente quando todos confirmarem
        if (mensagemAviso) {
          if (!partida.mensagensConfirmacao) partida.mensagensConfirmacao = [];
          partida.mensagensConfirmacao.push(mensagemAviso);
        }

        return;
      }

      // todos confirmaram -> apaga as mensagens de aviso de confirmação
      // (já cumpriram o papel delas)
      if (partida.mensagensConfirmacao) {
        for (const msg of partida.mensagensConfirmacao) {
          await msg.delete().catch(() => {});
        }
      }

      // os 2 confirmaram -> apaga a mensagem de confirmação (ela já
      // cumpriu o papel dela; as próximas mensagens — ficha, pix etc —
      // já contam a história sozinhas)
      await interaction.deferUpdate();
      await interaction.message.delete().catch(() => {});

      // busca o tópico direto da API em vez de confiar só no cache —
      // se "interaction.channel" vier nulo/desatualizado, tudo que vem
      // depois falhava em silêncio sem essa garantia.
      const thread = interaction.channel || (await interaction.client.channels.fetch(interaction.channelId));

      // notificação bonita que se autodestrói em 2 segundos
      const notificacao = await thread.send({ embeds: [montarEmbedNotificacaoBonita(partida)] }).catch((err) => {
        console.error('⚠️ Erro ao mandar a notificação de "Partida Confirmada":', err);
        return null;
      });
      if (notificacao) setTimeout(() => notificacao.delete().catch(() => {}), 2000);

      // o mediador já foi sorteado lá na criação do tópico (partida.mediadorId)

      // ficha da partida com jogadores/mediador/formato/taxa + botões
      await thread
        .send({
          content: partida.mediadorId ? `<@${partida.mediadorId}>` : undefined,
          embeds: [montarEmbedFicha(partida)],
          components: [montarBotoesFicha(), montarSelectFinalizarAposta()],
        })
        .catch((err) => console.error('⚠️ Erro ao mandar a ficha da partida:', err));

      // valor + chave pix
      await thread
        .send({ embeds: [montarEmbedValorPix(partida)] })
        .catch((err) => console.error('⚠️ Erro ao mandar valor/chave Pix:', err));

      // card de regras padrão, embaixo da ficha e do Pix (penúltima
      // mensagem do fluxo — a última é o aviso de "Análises
      // Funcionando", mandado quando a sala é criada)
      await thread
        .send({ embeds: [montarEmbedRegrasPadrao()] })
        .catch((err) => console.error('⚠️ Erro ao mandar card de regras padrão:', err));

      // exemplo "PAGAMENTO VIA PIX" embaixo das regras (só se o mediador
      // desta partida cadastrou a API do Pix)
      await enviarExemploPix(thread, partida);

      return;
    }

    if (interaction.customId === 'partida_cancelar') {
      await interaction.update({
        embeds: [montarEmbedConfirmacao(partida)],
        components: [],
      });

      // cancelou rápido (antes de confirmar)? quem não cancelou volta pra fila
      const cancelouRapido = partida.painelId && partida.criadaEm && Date.now() - partida.criadaEm <= CANCELAMENTO_RAPIDO_MS;
      const voltamPraFila = cancelouRapido ? partida.jogadores.filter((id) => id !== userId) : [];

      await executarCancelamento(interaction.channel, partida);

      if (voltamPraFila.length) {
        await recolocarNaFilaAposCancelamentoRapido(partida, voltamPraFila).catch((err) =>
          console.error('⚠️ Erro ao recolocar jogadores na fila após cancelamento rápido:', err)
        );
      }
      return;
    }
  }

  // --- Botões da sala (ID/Senha) ---
  if (interaction.customId === 'sala_copiar_id' || interaction.customId === 'sala_trocar_valor') {
    const partida = partidas.get(interaction.channelId);
    if (!partida) return interaction.reply({ content: 'Essa partida não está mais ativa.', ephemeral: true });

    if (interaction.customId === 'sala_copiar_id') {
      return interaction.reply({ content: `${partida.salaId}`, ephemeral: true });
    }

    if (interaction.customId === 'sala_trocar_valor') {
      if (!(await usuarioPodeMediar(interaction))) {
        return interaction.reply({ content: '🚫 Só admin pode mudar o valor da partida.', ephemeral: true });
      }
      return interaction.reply({ content: 'Escolha o novo valor:', components: [montarSelectTrocarValor()], ephemeral: true });
    }
  }

  // --- Botões da ficha da partida (etapa 2) ---
  if (['ficha_qr', 'ficha_cancelar', 'ficha_copiar_pix'].includes(interaction.customId)) {
    const threadId = interaction.channelId;
    const partida = partidas.get(threadId);

    if (!partida) return interaction.reply({ content: 'Essa partida não está mais ativa.', ephemeral: true });

    // Copiar: manda só a chave Pix do mediador (só pra quem clicou), pra copiar
    if (interaction.customId === 'ficha_copiar_pix') {
      return interaction.reply({ content: `${pegarChavePix(partida.mediadorId)}`, ephemeral: true });
    }

    if (interaction.customId === 'ficha_qr') {
      const dados = pegarDadosMediador(partida.mediadorId);
      const chave = pegarChavePix(partida.mediadorId);
      const tipo = detectarTipoChavePix(chave);
      const valorQr = valorFilaMaisTaxa(partida.valor);
      const valorQrTexto = formatarValorBR(valorQr);

      try {
        // QR code do Pix já com o valor preenchido (fila + taxa do
        // mediador), com o emoji das abelhas no meio
        const payload = gerarPayloadPix({ chave, valor: valorQr });
        const bufferQr = await gerarQrComLogo(payload);
        const anexo = new AttachmentBuilder(bufferQr, { name: 'pix-qrcode.png' });
        const embedQr = new EmbedBuilder()
          .setColor(COR_AMARELA)
          .setTitle('Chave PIX')
          .addFields(
            { name: 'Valor do QR:', value: `${valorQrTexto} (fila ${partida.valor} + taxa ${formatarValorBR(ACRESCIMO_MEDIADOR)})` },
            { name: 'Chave:', value: `\`${chave}\`` },
            { name: 'Tipo:', value: tipo },
            { name: 'Pix copia e cola:', value: `\`\`\`${payload}\`\`\`` }
          )
          .setImage('attachment://pix-qrcode.png');

        return interaction.reply({ embeds: [embedQr], files: [anexo], ephemeral: true });
      } catch (err) {
        console.error('Erro ao gerar QR code:', err);
        return interaction.reply({ content: 'Não consegui gerar o QR code agora, tente de novo.', ephemeral: true });
      }
    }

    if (interaction.customId === 'ficha_cancelar') {
      if (!(interaction.user.id === partida.mediadorId || (await usuarioPodeMediar(interaction)))) {
        return negarAcessoMediador(interaction);
      }
      if (partida.cancelando) return interaction.reply({ content: 'Essa partida já está sendo cancelada.', ephemeral: true });

      // o aviso público "Partida cancelada" já é mandado em seguida
      await interaction.deferUpdate().catch(() => {});
      return executarCancelamento(interaction.channel, partida);
    }
  }
 } catch (err) {
  // Sem isso, qualquer erro em qualquer botão/formulário fazia o
  // Discord mostrar só "Algo deu errado, tente novamente" sem
  // ninguém saber o motivo. Agora sempre loga o erro real e sempre
  // avisa a pessoa, em vez de deixar a interação sem resposta.
  console.error('⚠️ Erro não tratado numa interação (botão/select/modal):', err);
  try {
    const mensagemErro = { content: '⚠️ Deu um erro inesperado. Tenta de novo, e se continuar, avisa um admin.', ephemeral: true };
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(mensagemErro);
    } else {
      await interaction.reply(mensagemErro);
    }
  } catch (err2) {
    console.error('⚠️ Nem consegui avisar a pessoa sobre o erro:', err2);
  }
 }
});

// Tira a pessoa de todas as filas de staff (mediador/suporte)
// que ela estiver, exatamente como se tivesse clicado em "Sair" —
// usado tanto quando fica offline quanto quando sai do servidor.
async function removerDeTodasFilasDeStaff(userId) {
  const indiceMediador = filaMediadores.indexOf(userId);
  if (indiceMediador !== -1) {
    filaMediadores.splice(indiceMediador, 1);
    encerrarSessaoAdm(userId);
    await atualizarPainelMediadorSeExistir();
  }

  const indiceSuporte = filaSuporte.indexOf(userId);
  if (indiceSuporte !== -1) {
    filaSuporte.splice(indiceSuporte, 1);
    encerrarSessaoSuporte(userId);
    await atualizarPainelSuporteFilaSeExistir();
  }
}

// Se alguém que está em alguma fila de staff fica offline (fecha o
// Discord), sai da fila automaticamente — só volta quando entrar de
// novo pelo painel. Só reage à transição PRA offline (não mexe em
// away/ocupado).
client.on('presenceUpdate', async (oldPresence, newPresence) => {
  if (!newPresence || !newPresence.userId) return;
  if (newPresence.status !== 'offline') return;

  await removerDeTodasFilasDeStaff(newPresence.userId);
});

// Se alguém que está em alguma fila de staff sai do servidor, sai da
// fila automaticamente também (mesmo efeito de clicar em "Sair").
client.on('guildMemberRemove', async (member) => {
  await removerDeTodasFilasDeStaff(member.id);
});

// Perdeu o cargo de mediador/suporte? Sai da fila correspondente na hora.
client.on('guildMemberUpdate', async (antes, depois) => {
  try {
    if (filaMediadores.includes(depois.id) && !(await membroPodeMediar(depois, depois.guild))) {
      const posicao = filaMediadores.indexOf(depois.id);
      if (posicao !== -1) {
        filaMediadores.splice(posicao, 1);
        encerrarSessaoAdm(depois.id);
        await atualizarPainelMediadorSeExistir();
      }
    }

    if (filaSuporte.includes(depois.id) && !(await membroPodeSuportar(depois, depois.guild))) {
      const posicao = filaSuporte.indexOf(depois.id);
      if (posicao !== -1) {
        filaSuporte.splice(posicao, 1);
        encerrarSessaoSuporte(depois.id);
        await atualizarPainelSuporteFilaSeExistir();
      }
    }
  } catch (err) {
    console.error('⚠️ Erro ao conferir cargo de mediador/suporte:', err);
  }
});

// Dá o cargo "Membro" automaticamente pra quem entra no servidor.
client.on('guildMemberAdd', async (member) => {
  if (!MEMBRO_ROLE_ID) return;
  await member.roles.add(MEMBRO_ROLE_ID).catch((err) => {
    console.error('⚠️ Não consegui dar o cargo de Membro automático:', err.message);
  });
});

client.once('ready', async () => {
  console.log(`✅ Bot online como ${client.user.tag}`);
  await zerarEstadoNoInicio(); // começa sem ninguém em nenhuma fila
  await carregarEmojiSala(); // emoji ":c:" grande no card ID e Senha
  retomarReunioesMeet(); // retoma o auto-delete das reuniões do Meet
  retomarTopicosTela(); // retoma o auto-delete (1h) dos tópicos de tela
  retomarTicketsOcultos(); // devolve o canal do ticket a quem já cumpriu a 1 hora
  await garantirEmojisPersonalizados();
});

// Sem isso, um erro pequeno em qualquer parte do código (uma chamada
// à API do Discord que falha, por exemplo) podia derrubar o processo
// inteiro sem aviso — a hospedagem reinicia sozinha, e o que estava
// só na memória (como painéis recém-criados) se perde antes de salvar
// em disco. Com isso, o bot só registra o erro no console e continua
// rodando normalmente.
process.on('unhandledRejection', (err) => {
  console.error('⚠️ Erro não tratado (unhandledRejection):', err);
});
process.on('uncaughtException', (err) => {
  console.error('⚠️ Erro não tratado (uncaughtException):', err);
});

client.login(TOKEN);
