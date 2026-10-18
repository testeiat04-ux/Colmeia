# Colmeia Bot — Filas 1x1 / 2x2 / 3x3 / 4x4

Bot de filas de apostas para Discord: filas de jogadores (1x1 a 4x4),
fila de mediadores, cadastro de Pix, Pix automático, rankings, tickets de
suporte, blacklist e análise de tela por Google Meet.

## O que o bot faz

- **Filas de jogadores** nos formatos 1x1, 2x2, 3x3 e 4x4 (Gel Normal /
  Gel Inf), com variante opcional **misto** ou **emu**.
- **Confirmação por tópico privado**: quando a fila fecha, o bot cria um
  tópico `fila-<número>`, adiciona os jogadores e pede para todos
  confirmarem.
- **Fila de mediadores** em revezamento. Só entra quem tem o cargo de
  mediador (veja "Cargos") e já cadastrou o Pix.
- **Ficha da partida** (Regras / QR / Cancelar), chave Pix do mediador e
  QR code gerado automaticamente.
- **Finalizar Aposta** (só mediador): escolhe o vencedor, por W.O. ou por
  vitória, e registra no ranking.
- **Rankings**: vitórias dos jogadores, horas e ganhos dos mediadores,
  ranking do suporte.
- **Suporte**: painel de tickets (Suporte / Reembolso) com tópico privado,
  fila de suporte e cadastro de Pix do suporte. Tudo do suporte funciona
  só com o cargo do `!setcargosuporte`.
- **Pix automático** por mediador (Mercado Pago), opcional.
- **Blacklist** de IDs e **análise de tela por Google Meet** (modo manual).
- **Emojis personalizados automáticos** subidos pelo bot na primeira vez
  que ele liga.
- **Cargo de Membro automático** para quem entra no servidor (opcional).
- **Começa limpo a cada deploy**: ao ligar, ninguém está em nenhuma fila.

## Fluxo da fila (`!painel1x1`, `!painel2x2`, `!painel3x3`, `!painel4x4`)

1. Digite o comando no canal. Exemplos:
   ```
   !painel1x1
   !painel1x1 R$2,00
   !painel4x4 misto R$5,00
   !painel2x2 emu
   ```
   - Formato: `1x1` (2 jogadores), `2x2` (4), `3x3` (6) ou `4x4` (8).
   - Variante opcional: `misto` ou `emu` (só muda o rótulo).
   - Valor opcional: tudo que vier depois vira o valor da fila. Se não
     digitar nada, usa o `VALOR_APOSTA` configurado.
   - Cada comando cria **um** painel, com a sua própria fila.
2. Cada pessoa pode ficar em no máximo **2 filas ao mesmo tempo**, somando
   todos os painéis. O botão de entrar só funciona se houver **mediador
   disponível** na fila de mediadores. Senão responde "Não há mediadores
   disponíveis no momento."
3. Quando a fila fecha, o bot cria um **tópico privado** `fila-<número>`,
   adiciona os jogadores e manda o embed com **Confirmar / Cancelar** e,
   logo embaixo, o card **Regras Padrão** (traço amarelo).
4. **Cancelamento rápido:** se um jogador cancelar até **10 segundos**
   depois do tópico ser criado (antes de todos confirmarem), quem **não**
   cancelou volta para o começo da mesma fila. Se já houver alguém
   esperando, o tópico é criado de novo na hora. Repete até a partida ser
   confirmada. Depois de 10 segundos, o cancelamento é normal.
5. Quando **todos confirmam**:
   - os botões somem e aparece "Partida Confirmada!" (some em 3 segundos);
   - o bot escolhe o mediador da vez: o primeiro da fila vai para o **fim
     da fila** (revezamento). Não há limite de partidas por mediador, e a
     mesma fila serve qualquer formato. Quem perdeu o cargo, saiu do
     servidor ou sem Pix cadastrado é pulado e removido da fila;
   - aparece a **ficha da partida** (Jogadores, Mediador, Formato, Taxa de
     Inscrição) com botões **Regras**, **QR** e **Cancelar**;
   - aparece o **Valor** e a **Chave Pix** do mediador. O valor é o valor
     da fila + `ACRESCIMO_MEDIADOR` (padrão R$0,50);
   - o card **Regras Padrão** aparece de novo embaixo da ficha e do Pix.
6. Enquanto falta gente confirmar, o bot avisa no tópico quem já
   confirmou e quem falta, num card com o traço **verde claro**.
7. **ID e senha da sala:** o mediador manda o **ID** (9 a 13 dígitos)
   sozinho numa mensagem e, na seguinte, a **senha** (2 a 4 dígitos). O
   bot renomeia o tópico para `pagar-<valor>` e mostra o card **ID e
   Senha** (com Copiar ID / Trocar Valor) e o emoji `:c:` do servidor bem
   grande, do lado direito. O bot procura o emoji de nome `c` quando liga;
   para usar outra imagem, defina `EMOJI_SALA_URL`. Nenhum aviso de
   "análises" é mostrado depois disso.
8. **Menu do mediador** ("Selecione uma opção", embaixo da ficha). As
   mensagens aparecem **para todo mundo no tópico**, mas só o mediador
   consegue usar:
   - **Finalizar Aposta**: aparecem as mensagens e as opções em
     sequência: **1)** escolher o **jogador** vencedor, **2)** escolher o
     **mediador** (o da partida vem primeiro; dá para escolher outro
     mediador que tenha o cargo) e **3)** **Vencedor por W.O.** ou
     **Vencedor por Vitória**. O vencedor ganha +1 vitória no ranking, o
     mediador escolhido ganha a taxa no ranking-adm, e o tópico é
     encerrado.
   - **Revanche**: escolhe o vencedor da partida (ele ganha +1 vitória e
     o mediador ganha a taxa dessa rodada) e **a fila não é finalizada**.
     Em seguida o mediador escolhe o valor da revanche (R$ 1, 2, 3, 5,
     10, 20, 50 ou 100). O tópico passa a se chamar `R$ <valor> 💰`, o
     bot mostra o Pix do mediador de novo com o botão **QR**, e o
     mediador manda o novo ID e senha da sala.
   - **Trocar de ideia:** se o mediador começar a finalizar e depois
     escolher **Revanche** (ou o contrário), as mensagens antigas do
     outro passo **somem** e só aparece a nova. A vitória e a taxa do
     mediador não são contadas duas vezes na mesma rodada.
9. **Cancelar** (em qualquer etapa): contagem regressiva, remove os
   jogadores e exclui o tópico.
10. **QR**: o bot gera o QR code do Pix do mediador já com o **valor
   preenchido** = valor da fila + taxa do mediador (`ACRESCIMO_MEDIADOR`).
   Ex.: fila de R$2,00 e taxa de R$0,50 -> QR de R$2,50. Vale para toda
   fila e para toda revanche. Junto vem o **Pix copia e cola**, com o
   **valor já predefinido** dentro do código e **só a chave do mediador**:
   sem nome e sem cidade (o padrão do Pix exige esses dois campos, então
   vão com uma letra neutra só para o código continuar válido em qualquer
   banco; quem paga vê o nome do dono da chave no próprio app do banco).

## Lista de comandos

Quem pode usar:
- **Permissão de painel** = "Gerenciar Canais".
- **Admin** = "Gerenciar Servidor".
- **CEO** = quem tem o cargo configurado com `!setcargoceo` (ou o dono
  configurado em `DONO_USER_ID`, nas funções exclusivas de CEO).
- **Mediador** = quem tem o cargo configurado com `!setcargomediador`
  (ou o cargo de CEO).

### Painéis de fila e pagamento
| Comando | O que faz | Quem |
|---|---|---|
| `!painel1x1` / `2x2` / `3x3` / `4x4` | Painel de fila de jogadores | Gerenciar Canais |
| `!painelmediador` | Fila de mediadores (Entrar / Sair) | Gerenciar Canais |
| `!painelpix` | Cadastro de Pix dos mediadores | Gerenciar Canais |
| `!painelapi` | Pix automático: cada mediador cadastra a própria API (Mercado Pago) | Gerenciar Canais |

### Rankings
| Comando | O que faz | Quem |
|---|---|---|
| `!painelranking` | Ranking de vitórias dos jogadores | Gerenciar Canais |
| `!painelrankingadm` | Ranking de horas e ganhos dos mediadores | Admin |
| `!painelrankingsuporte` | Ranking do suporte | Gerenciar Canais |

### Suporte
| Comando | O que faz | Quem |
|---|---|---|
| `!painelticket` | Painel de atendimento (Suporte / Reembolso); o ticket só abre se houver suporte na fila | Gerenciar Canais |
| `!painelfilasuporte` | Fila de suporte (Entrar / Sair); só entra quem tem o cargo de suporte e Pix cadastrado | Gerenciar Canais |
| `!painelpixsuporte` | Cadastro de Pix do suporte (só com o cargo de suporte) | Gerenciar Canais |

### Análise de tela e blacklist
| Comando | O que faz | Quem |
|---|---|---|
| `!painelmeet` | Painel "Colmeia Inspector": o botão **Criar link** abre um tópico com o passo a passo do Google Meet | Gerenciar Canais |
| `!painelsalasbot` | Painel de salas automáticas (criar / estoque) | Gerenciar Canais |
| `!painelblacklist` | Painel para verificar um ID na blacklist | Gerenciar Canais |
| `!addblacklist <id> [motivo]` | Adiciona um ID na blacklist | Mediador / CEO |
| `!removeblacklist <id>` | Remove um ID da blacklist | Mediador / CEO |
| `!mudoutela` | Posta o aviso "Mudou a forma de mostrar a tela" | CEO |

### Textos de regras (cada um posta vários cards no canal)
| Comando | Conteúdo | Quem |
|---|---|---|
| `!regras` | Regras gerais | Admin |
| `!regrasadm` | Diretrizes para ADM / Mediador | Admin |
| `!termosadm` | Termos financeiros e de organização | Admin |
| `!regrassuporte` | Regras do time de suporte / reembolso | Admin |
| `!termossuporte` | Categorias de ticket e termos do suporte | Admin |
| `!regrasblacklist` | Regulamento de análise / blacklist | Admin |

### Cargos (valem na hora, sem reiniciar o bot)
| Comando | O que faz | Quem |
|---|---|---|
| `!setcargoceo @cargo` | Define o cargo de CEO | Admin |
| `!setcargomediador @cargo` | Define o cargo de Mediador | Admin |
| `!setcargosuporte @cargo` | Define o cargo de Suporte (fila, cadastro de Pix e atendimento dos tickets) | Admin |
| `!vercargos` | Mostra os cargos configurados agora | Admin |

> Os comandos `!addmediadoracesso`, `!removermediadoracesso` e
> `!listamediadoresacesso` foram **desativados**. O acesso de mediador
> agora é só pelo cargo: dê ou tire o cargo da pessoa no Discord.

### Cadastro manual de mediador (Pix)
| Comando | O que faz | Quem |
|---|---|---|
| `!addmediador @pessoa chavepix` | Cadastra a chave Pix de alguém (a pessoa precisa ter o cargo de mediador) | Admin |
| `!removermediador @pessoa` | Remove o cadastro | Admin |
| `!listamediadores` | Lista os mediadores cadastrados | Admin |

### Dentro do tópico da partida
| Comando | O que faz | Quem |
|---|---|---|
| `.cs` | Volta o nome do tópico para o padrão de pagamento | Mediador |

## Cargos: tudo de mediador e de suporte só pelo `!setcargo`

Entrar na fila de mediadores, cadastrar Pix, Finalizar Aposta, Cancelar,
Escolher Vencedor e os demais botões de mediador funcionam **só** para
quem tem o cargo definido em `!setcargomediador` (ou o cargo de CEO, de
`!setcargoceo`). Não existe mais lista de pessoas avulsas, nem cargo de
mediador por variável de ambiente.

- Rode `!setcargomediador @cargo` e `!setcargoceo @cargo` uma vez e
  confira com `!vercargos`. Se esses cargos só estavam no `.env`, os
  mediadores ficam sem acesso até você rodar os comandos.
- Quem perde o cargo sai da fila de mediadores na hora.
- **Suporte** funciona igual: entrar na fila de suporte, cadastrar e
  verificar o Pix do suporte e atender/resolver tickets só valem para quem
  tem o cargo do `!setcargosuporte` (ou o cargo CEO). Quem perde o cargo
  sai da fila de suporte na hora. O cargo de suporte não vem mais de
  variável de ambiente.

## Fila de mediadores (`!painelmediador`)

Mostra a lista numerada de quem está na fila e os botões **Entrar** e
**Sair**. Pode ser postado em mais de um canal: todos os painéis mostram a
mesma fila e ganham numeração (1), (2)...

- **Entrar** exige o cargo de mediador e a chave Pix cadastrada.
- Quem **exclui o Pix**, perde o cargo ou sai do servidor sai da fila
  sozinho. Quem fica offline também sai das filas de staff.
- Se a fila estiver vazia quando a partida confirmar, a ficha mostra
  "Nenhum mediador disponível no momento."
- **Ao ligar o bot, a fila começa vazia.** Cada mediador entra apertando
  **Entrar**.

## Painel de cadastro de Pix (`!painelpix`)

Botões: **Cadastrar Pix**, **Verificar Cadastro**, **Gerar Novo Pix** e
**Excluir Pix**. Só quem tem o cargo de mediador usa, e cada pessoa vê e
edita apenas o próprio cadastro.

- **Cadastrar Pix**: formulário com a chave (obrigatória), o nome
  (opcional, até 60 caracteres) e o link da imagem do QR Code (opcional,
  precisa começar com `http://` ou `https://`).
- O bot **descobre o tipo da chave, confere se é válida e salva
  padronizada**:
  - **CPF** e **CNPJ**: confere os dígitos verificadores; salva só números.
  - **Telefone** (com DDD): aceita com ou sem `+55`, parênteses e traço;
    salva como `+55DDNÚMERO`.
  - **E-mail**: só Gmail completo (`nome@gmail.com`).
  - **Chave aleatória**: formato UUID.
  - Qualquer outra coisa é recusada com o motivo.
- **Verificar Cadastro**: mostra só para quem clicou o cartão com os
  dados, incluindo o tipo da chave.
- **Gerar Novo Pix**: troca o cadastro antigo por um novo.
- **Excluir Pix**: apaga o cadastro e tira a pessoa da fila de mediadores.

## Pix automático (`!painelapi`)

Opcional. Cada mediador cadastra a **própria API do Mercado Pago**. Nas
partidas de mediador **com** API, o bot mostra o exemplo "PAGAMENTO VIA
PIX" embaixo das regras e, quando um jogador manda "pg / pago / paguei /
att pago + nome", confere o Pix (valor da fila + taxa, nome do pagador) e
mostra: Verificando -> Pix confirmado -> Criando sala. Sem API cadastrada,
o bot não faz nada disso. A janela de busca de pagamentos é
`JANELA_PIX_MINUTOS` (padrão 30).

## Tickets de suporte (`!painelticket`)

1. A pessoa escolhe **Suporte** ou **Reembolso** no painel.
2. **Só abre atendimento se houver suporte na fila de suporte**
   (`!painelfilasuporte`). Sem ninguém na fila, o bot responde "Não há
   nenhum suporte disponível agora".
3. O ticket vira um **tópico privado** `suporte-<usuário>` ou
   `reembolso-<usuário>`, visto **só pela pessoa, pelo suporte da vez**
   (escolhido em revezamento entre os da fila) **e pela equipe**. Vale
   para todos os assuntos, inclusive "Outros".
4. Na mensagem do tópico:
   - **Resolvido**: o suporte finaliza e o tópico é apagado (conta no
     ranking do suporte).
   - **Problema com pagamento** e **Reembolso**: o botão **Informar
     Mediador** abre um formulário com o **nome do mediador** e **quanto
     ele deve**, e o bot posta o resumo no tópico.
5. **Usar o ticket duas vezes:** se a pessoa tentar abrir outro ticket
   enquanto já tem um aberto, o **canal do ticket some para ela por 1
   hora** (o bot esconde o canal só para essa pessoa e devolve sozinho
   depois, mesmo que o bot reinicie). O canal escondido é o canal onde o
   painel de tickets foi usado.

> O bot precisa da permissão **Gerenciar Cargos / Permissões** (ou
> Administrador) para esconder o canal.

## Análise de tela por Google Meet (`!painelmeet`)

Modo **manual**, sem API do Google:

1. A pessoa toca em **Criar link**. O bot cria um tópico privado
   `tela-<usuário>` (só 1 por pessoa) e responde só para ela com o link do
   tópico.
2. No tópico tem o passo a passo para criar a reunião no Google Meet e
   copiar o link, e embaixo o aviso **MUDOU A FORMA DE MOSTRAR A TELA**
   com os links do app (Android, iOS e Windows).
3. Embaixo do aviso fica o botão **Finalizar link**, que apaga o tópico.
4. Se ninguém finalizar, o tópico é **apagado sozinho em 1 hora**, mesmo
   que o bot reinicie no meio.

Quando um tópico é excluído, o próprio Discord mostra "Sem canais de
texto" para quem estava dentro dele.

## Requisitos

- **Node.js 18 ou mais novo** (o bot usa `fetch` nativo).

```bash
npm install
```
O `package.json` já inclui `discord.js`, `qrcode` e `jimp`.

> ⚠️ O `jimp` precisa ficar na série `0.22.x`. As versões 1.x mudaram a
> forma de usar e o código não funciona com elas.

Para conferir se o arquivo está sem erro de sintaxe antes de subir:
```bash
npm run check
```

## Configuração

### 1) Criar o bot
- https://discord.com/developers/applications
- Em **Bot**, ative as **3 Intents** e toque em Save Changes:
  - **Presence Intent**
  - **Server Members Intent**
  - **Message Content Intent**

Se alguma estiver desligada, o bot cai com o erro
"Used disallowed intents".

### 2) Permissões (OAuth2 → URL Generator, scope `bot`)
- Ver Canais
- Enviar Mensagens
- Gerenciar Canais
- Gerenciar Mensagens
- Inserir Links
- Ver Histórico de Mensagens
- **Criar Tópicos Privados**
- **Gerenciar Tópicos**
- **Gerenciar Emojis e Figurinhas** (para subir os emojis automáticos)
- **Gerenciar Cargos / Permissões** (para esconder o canal do ticket por
  1 hora e, se usar `MEMBRO_ROLE_ID`, dar o cargo de Membro; nesse caso o
  cargo do bot precisa ficar **acima** do cargo de Membro)

### 3) Variáveis de ambiente (no Railway: aba Variables)

**Obrigatória:**
```bash
DISCORD_TOKEN="seu_token_aqui"      # também aceita o nome TOKEN
```

**Dados (recomendada no Railway):**
```bash
DATA_DIR="/data"       # pasta dos arquivos .json (aponte para um Volume)
EMOJI_SALA_URL=""      # (opcional) imagem grande do card ID e Senha; sem isso usa o emoji :c:
```

**Principais (opcionais):**
```bash
VALOR_APOSTA="R$1,00"               # Taxa de Inscrição padrão
ACRESCIMO_MEDIADOR="0.50"           # somado ao valor da fila (use ponto)
REGRAS_URL="https://..."            # link do botão Regras
TUTORIAL_URL="https://..."          # link do tutorial de Pix
CHAVE_PIX_PADRAO="email@exemplo.com"  # usada se não houver Pix do mediador
JANELA_PIX_MINUTOS="30"             # janela do Pix automático
```

**Cargos e donos (opcionais):**
```bash
MEMBRO_ROLE_ID=""      # cargo dado automaticamente a quem entra
DONO_USER_ID=""        # ID de USUÁRIO com acesso de emergência (só funções de CEO)
CEO_USER_ID=""         # ID de usuário do CEO
```
Os cargos de **Mediador**, **Suporte** e **CEO** (para mediar/atender)
são definidos **só** pelos comandos `!setcargomediador`,
`!setcargosuporte` e `!setcargoceo`.

> `MEDIADOR_ROLE_ID` e `SUPORTE_ROLE_ID` não são mais usados. As variáveis `GOOGLE_*` e `MEET_*`
> também não são mais necessárias, porque o Google Meet agora é manual.

**Canais (opcionais, mas veja o aviso abaixo):**
```bash
CANAL_FILAS_ID=""             # canal onde os tópicos das partidas são criados
```

> ⚠️ Se você não definir `REGRAS_URL` e `CANAL_FILAS_ID`, o código usa
> valores padrão de **outro servidor**. Para o seu servidor, defina os
> dois com o ID/link do seu próprio Discord.

**Emojis (opcionais):** todos os `EMOJI_*` e `EMOJI_*_IMAGEM_URL` abaixo
são opcionais. Se você definir o emoji (formato `<:nome:ID>`), o bot não
tenta criar o automático. Se definir só a imagem, o bot usa ela para
criar o emoji.
```bash
EMOJI_GEL, EMOJI_SAIR, EMOJI_FINALIZAR, EMOJI_COROA, EMOJI_COROA_2,
EMOJI_TROFEU, EMOJI_RANKING, EMOJI_PC, EMOJI_ORG, EMOJI_COLMEIA1,
EMOJI_QR, EMOJI_DINDIN, EMOJI_PROGRESSO, EMOJI_MNRAMIO, EMOJI_GIRO,
EMOJI_GIRO_OURO, EMOJI_ENTRA, EMOJI_COPIAR, EMOJI_INFO

EMOJI_GEL_IMAGEM_URL, EMOJI_SAIR_IMAGEM_URL, EMOJI_FINALIZAR_IMAGEM_URL,
EMOJI_COROA_IMAGEM_URL, EMOJI_TROFEU_IMAGEM_URL,
EMOJI_RANKING_IMAGEM_URL, EMOJI_ORG_URL, EMOJI_COLMEIA1_URL,
EMOJI_ABELHAS_URL
```

> ⚠️ Links de imagem do Google Drive precisam estar no formato direto
> `https://drive.google.com/uc?export=view&id=ID_DO_ARQUIVO` e o arquivo
> precisa estar compartilhado como **"Qualquer pessoa com o link"**.

Para pegar um ID: ative o **Modo Desenvolvedor** no Discord
(Configurações → Avançado), depois toque e segure o cargo, canal ou
perfil e escolha **Copiar ID**.

### 4) Rodar
```bash
npm start
```
No Railway isso é automático depois de cada commit no GitHub.

## Personalizações fáceis (topo do `index.js`)

- `VALOR_APOSTA`, `ACRESCIMO_MEDIADOR`, `NOME_MODALIDADE`, `NOME_ORG`
- `COR_AMARELA`: cor da barra lateral dos embeds da fila
- `COR_DOURADA`: cor da barra do painel/cartão de cadastro Pix
- `REGRAS_URL`, `TUTORIAL_URL`, `PIX_PADRAO`
- `LINK_ANDROID`, `LINK_IOS`, `LINK_WINDOWS`
- `MAX_FILAS_SIMULTANEAS` (padrão 2) e `CANCELAMENTO_RAPIDO_MS` (padrão
  10 segundos)

> O Discord só permite uma cor sólida por embed.

## Arquivos de dados

O bot salva os dados em arquivos `.json` na pasta definida em `DATA_DIR`
(ou na pasta do bot, se `DATA_DIR` não existir), entre eles:
`mediadores.json`, `config-cargos.json`, `paineis-fila.json`,
`paineis-mediador.json`, `painel-suporte-fila.json`, `partidas.json`, `ranking.json`,
`ranking-adm.json`, `blacklist.json`, `pix-apis.json` e
`tela-topicos.json` e `tickets-ocultos.json`. Não precisa editar código
para isso.

- A gravação é feita em arquivo temporário e trocada no fim, para uma
  queda no meio não corromper o arquivo.
- Se o `mediadores.json` estiver ilegível, o bot guarda uma cópia
  (`mediadores.json.corrompido-...`) antes de qualquer cadastro novo.

> ⚠️ No Railway **sem Volume**, esses arquivos são apagados a cada novo
> deploy (cadastros de Pix, rankings, blacklist, cargos e painéis). Crie um
> **Volume** no Railway (por exemplo montado em `/data`) e defina
> `DATA_DIR=/data`.

Se o bot não reconhecer um painel antigo, ele reconstrói a partir da
própria mensagem do painel, sem mostrar erro. A fila desse painel volta
vazia.

## Solução de problemas

**Painel saiu em dobro, ou aparece "Esse painel não existe mais"**
Quase sempre há **duas cópias do bot ligadas** com o mesmo token (um
deploy antigo, o bot rodando no celular ou no PC, uma réplica no Railway).
Cada cópia posta um painel e só reconhece o próprio, e as filas ficam
separadas. O bot também avisa no canal quando percebe isso.

Para derrubar qualquer cópia esquecida:
1. Discord Developer Portal → seu app → **Bot** → **Reset Token**.
2. Cole o token novo **só** no Railway e reinicie.

**Apareço na fila sem ter entrado**
É a cópia antiga do bot (veja acima) com a fila na memória dela. A fila
de mediadores não fica salva em arquivo, e as filas dos jogadores são
zeradas toda vez que o bot liga.

**Mediador sem acesso aos botões**
Rode `!vercargos` e confira se o cargo de mediador está configurado. Se
não estiver, use `!setcargomediador @cargo`.

**Suporte sem acesso à fila / ticket não abre**
Confira com `!vercargos` se o cargo de suporte está configurado
(`!setcargosuporte @cargo`). O ticket só abre se houver alguém na fila de
suporte, e quem entra precisa ter o Pix cadastrado.

**O canal do ticket sumiu para alguém**
É a regra do ticket usado duas vezes: o canal volta sozinho depois de 1
hora. Para devolver antes, apague a permissão da pessoa nesse canal
(Editar canal → Permissões).

**Chave Pix recusada**
O bot explica o motivo (CPF/CNPJ com dígitos errados, telefone sem DDD,
e-mail que não seja `@gmail.com`, link de QR sem `http`).

## Segurança

Nunca compartilhe o seu `DISCORD_TOKEN` (nem em prints, nem no GitHub).
Se ele vazar, gere outro na hora: **Bot → Reset Token**, e atualize a
variável no Railway.
