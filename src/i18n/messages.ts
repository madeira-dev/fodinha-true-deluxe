export type Locale = 'pt-BR' | 'en';

export const LOCALES: Locale[] = ['pt-BR', 'en'];

export interface Messages {
  languageName: string;
  sitDown: string;
  sitDownSub: string;
  onlineTable: string;
  menuTitle: string;
  yourName: string;
  roomCode: string;
  createTable: string;
  joinWithCode: string;
  menuHint: string;
  orDownload: string;
  macOpenHint: string;
  macOpenCommand: string;
  leave: string;
  connecting: string;
  wakingTable: string;
  startingLocalTable: string;
  needNameCreate: string;
  needNameJoin: string;
  needRoomCode: string;
  createFailed: string;
  joinFailed: string;
  disconnected: string;
  copyPrompt: string;
  roundTitle: string;
  roomTitle: string;
  yourTable: string;
  atTheTable: string;
  tagYou: string;
  tagHost: string;
  tagDealer: string;
  tagTurn: string;
  tagAway: string;
  tagOut: string;
  bidStat: string;
  tricksStat: string;
  penaltyLabel: string;
  noPenalty: string;
  hiddenBidPrompt: string;
  bidPrompt: string;
  bidCannotClose: string;
  dealPrompt: string;
  isBidding: string;
  isPlaying: string;
  playACard: string;
  tiedTrick: string;
  takesTrick: string;
  roundResults: string;
  exact: string;
  letterOne: string;
  letterMany: string;
  bidWord: string;
  wonWord: string;
  nextRound: string;
  everybodyOut: string;
  playerWins: string;
  yourCardHidden: string;
  yourHand: string;
  chooseCard: string;
  cardOne: string;
  cardMany: string;
  noCards: string;
  tableCode: string;
  lobbyHint: string;
  copyCode: string;
  copyLink: string;
  startMatch: string;
  waitingHost: string;
  openGuest: string;
  someone: string;
  phaseDealing: string;
  phasePrediction: string;
  phasePlaying: string;
  phaseScoring: string;
  phaseFinished: string;
  hudLine: string;
  roundStakeOne: string;
  roundStakeMany: string;
  faceDownCard: string;
  cardOf: string;
  suitDiamonds: string;
  suitSpades: string;
  suitHearts: string;
  suitClubs: string;
  errorConnect: string;
  errorLocalServer: string;
  errorGeneric: string;
  errorWrongPhase: string;
  errorNotYourTurn: string;
  errorInvalidPrediction: string;
  errorCardNotInHand: string;
  errorPlayerEliminated: string;
  errorGameFinished: string;
  errorUnknownPlayer: string;
  errorNotInRoom: string;
  errorLobbyFull: string;
  errorGameAlreadyStarted: string;
  errorGameNotStarted: string;
  errorNotEnoughPlayers: string;
  errorNotOwner: string;
  errorInvalidName: string;
  errorDuplicatePlayer: string;
  errorUnknownMessage: string;
  errorProtocol: string;
  errorNotJoined: string;
  errorAlreadyJoined: string;
  errorRoomNotFound: string;
}

export const ptBR: Messages = {
  languageName: 'Português',
  sitDown: 'Chegue na mesa',
  sitDownSub: 'Jogue no navegador ou no aplicativo',
  onlineTable: 'Mesa online',
  menuTitle: 'Crie uma mesa, envie o código e jogue no navegador ou no app.',
  yourName: 'Seu nome',
  roomCode: 'Código da mesa',
  createTable: 'Criar mesa',
  joinWithCode: 'Entrar com o código',
  menuHint: 'Funciona neste navegador e no aplicativo. Mesmo servidor, mesmas mesas.',
  orDownload: 'Ou baixe o aplicativo:',
  macOpenHint:
    'No Mac o sistema pode dizer que o app está danificado. Não está. É o bloqueio da Apple em apps sem certificado. No Terminal, rode isto e abra de novo:',
  macOpenCommand: 'xattr -cr ~/Downloads/Fodinha.app',
  leave: 'Sair',
  connecting: 'Conectando…',
  wakingTable: 'Acordando a mesa…',
  startingLocalTable: 'Subindo a mesa local…',
  needNameCreate: 'Digite um nome antes de criar a mesa.',
  needNameJoin: 'Digite um nome antes de entrar.',
  needRoomCode: 'Digite o código da mesa.',
  createFailed: 'Não foi possível criar a mesa.',
  joinFailed: 'Não foi possível entrar na mesa.',
  disconnected: 'Você foi desconectado da mesa.',
  copyPrompt: 'Copie isto',
  roundTitle: 'Rodada {n}',
  roomTitle: 'Mesa {code}',
  yourTable: 'Sua mesa',
  atTheTable: 'Na mesa',
  tagYou: 'você',
  tagHost: 'anfitrião',
  tagDealer: 'carteador',
  tagTurn: 'vez',
  tagAway: 'ausente',
  tagOut: 'fora',
  bidStat: 'Palpite {value}',
  tricksStat: 'Vazas {value}',
  penaltyLabel: 'Penalidade {word}',
  noPenalty: 'Nenhuma letra de penalidade',
  hiddenBidPrompt: 'Você não vê a sua carta. Dê o palpite olhando a mesa.',
  bidPrompt: 'Quantas vazas você vai fazer?',
  bidCannotClose: 'A soma dos palpites não pode ser {n}.',
  dealPrompt: 'Embaralhando e distribuindo…',
  isBidding: '{name} está dando o palpite…',
  isPlaying: '{name} está jogando…',
  playACard: 'Jogue uma carta',
  tiedTrick: 'As cartas amarraram — ninguém pontua',
  takesTrick: '{name} leva a vaza',
  roundResults: 'Resultado da rodada',
  exact: 'exato',
  letterOne: '{n} letra',
  letterMany: '{n} letras',
  bidWord: 'palpite {value}',
  wonWord: 'fez {value}',
  nextRound: 'Próxima rodada',
  everybodyOut: 'Todo mundo saiu — empate',
  playerWins: '{name} venceu',
  yourCardHidden: 'Sua carta está escondida',
  yourHand: 'Sua mão',
  chooseCard: 'Escolha uma carta',
  cardOne: '{count} carta',
  cardMany: '{count} cartas',
  noCards: 'Nenhuma carta na mão',
  tableCode: 'Código da mesa',
  lobbyHint: 'Amigos entram pelo navegador ou pelo app com este código.',
  copyCode: 'Copiar código',
  copyLink: 'Copiar link',
  startMatch: 'Começar partida',
  waitingHost: 'Esperando o anfitrião começar.',
  openGuest: 'Abrir janela de convidado',
  someone: 'Alguém',
  phaseDealing: 'Distribuindo',
  phasePrediction: 'Palpites',
  phasePlaying: 'Jogando',
  phaseScoring: 'Fim da rodada',
  phaseFinished: 'Fim da partida',
  hudLine: 'Rodada {n} · {cards} · {phase} · Vira {vira} · {stake}',
  roundStakeOne: 'Vale 1 letra',
  roundStakeMany: 'Vale {n} letras',
  faceDownCard: 'Carta virada',
  cardOf: '{rank} de {suit}',
  suitDiamonds: 'ouros',
  suitSpades: 'espadas',
  suitHearts: 'copas',
  suitClubs: 'paus',
  errorConnect: 'Não foi possível conectar ao servidor.',
  errorLocalServer:
    'Não achei o servidor local na porta 4737. Rode npm run dev, ou npm run server numa outra janela.',
  errorGeneric: 'Algo deu errado.',
  errorWrongPhase: 'Essa ação não vale neste momento.',
  errorNotYourTurn: 'Não é a sua vez.',
  errorInvalidPrediction: 'Palpite inválido.',
  errorCardNotInHand: 'Essa carta não está na sua mão.',
  errorPlayerEliminated: 'Jogadores eliminados não jogam.',
  errorGameFinished: 'A partida já acabou.',
  errorUnknownPlayer: 'Jogador desconhecido.',
  errorNotInRoom: 'Você não está nesta mesa.',
  errorLobbyFull: 'A mesa está cheia.',
  errorGameAlreadyStarted: 'A partida já começou.',
  errorGameNotStarted: 'A partida ainda não começou.',
  errorNotEnoughPlayers: 'É preciso pelo menos 2 jogadores.',
  errorNotOwner: 'Só o anfitrião pode começar a partida.',
  errorInvalidName: 'O nome não pode ficar em branco.',
  errorDuplicatePlayer: 'Esse jogador já está na mesa.',
  errorUnknownMessage: 'Mensagem não reconhecida.',
  errorProtocol: 'Erro de protocolo.',
  errorNotJoined: 'Entre na mesa antes de enviar ações.',
  errorAlreadyJoined: 'Esta conexão já entrou na mesa.',
  errorRoomNotFound: 'Nenhuma mesa usa esse código.',
};

export const en: Messages = {
  languageName: 'English',
  sitDown: 'Sit down',
  sitDownSub: 'Play in the browser or the desktop app',
  onlineTable: 'Online table',
  menuTitle: 'Create a table, send the code, play from the browser or the app.',
  yourName: 'Your name',
  roomCode: 'Room code',
  createTable: 'Create a table',
  joinWithCode: 'Join with code',
  menuHint: 'Works in this browser and in the desktop app. Same server, same tables.',
  orDownload: 'Or download the app:',
  macOpenHint:
    'On a Mac, the system may say the app is damaged. It is not. That is Apple blocking unsigned apps. In Terminal, run this and open it again:',
  macOpenCommand: 'xattr -cr ~/Downloads/Fodinha.app',
  leave: 'Leave',
  connecting: 'Connecting…',
  wakingTable: 'Waking the table…',
  startingLocalTable: 'Starting the local table…',
  needNameCreate: 'Enter a name before creating a table.',
  needNameJoin: 'Enter a name before joining.',
  needRoomCode: 'Enter the table code.',
  createFailed: 'Could not create the table.',
  joinFailed: 'Could not join the table.',
  disconnected: 'Disconnected from the table.',
  copyPrompt: 'Copy this',
  roundTitle: 'Round {n}',
  roomTitle: 'Room {code}',
  yourTable: 'Your table',
  atTheTable: 'At the table',
  tagYou: 'you',
  tagHost: 'host',
  tagDealer: 'dealer',
  tagTurn: 'turn',
  tagAway: 'away',
  tagOut: 'out',
  bidStat: 'Bid {value}',
  tricksStat: 'Tricks {value}',
  penaltyLabel: 'Penalty {word}',
  noPenalty: 'No penalty letters',
  hiddenBidPrompt: 'You cannot see your card. Bid from the table.',
  bidPrompt: 'How many tricks will you take?',
  bidCannotClose: 'Bids cannot add up to {n}.',
  dealPrompt: 'Shuffling and dealing…',
  isBidding: '{name} is bidding…',
  isPlaying: '{name} is playing…',
  playACard: 'Play a card',
  tiedTrick: 'The cards cancelled each other — nobody scores',
  takesTrick: '{name} takes the trick',
  roundResults: 'Round results',
  exact: 'exact',
  letterOne: '{n} letter',
  letterMany: '{n} letters',
  bidWord: 'bid {value}',
  wonWord: 'won {value}',
  nextRound: 'Next round',
  everybodyOut: 'Everybody is out — tie',
  playerWins: '{name} wins',
  yourCardHidden: 'Your card is hidden',
  yourHand: 'Your hand',
  chooseCard: 'Choose a card',
  cardOne: '{count} card',
  cardMany: '{count} cards',
  noCards: 'No cards in hand',
  tableCode: 'Table code',
  lobbyHint: 'Friends can join from the browser or the desktop app with this code.',
  copyCode: 'Copy code',
  copyLink: 'Copy link',
  startMatch: 'Start match',
  waitingHost: 'Waiting for the host to start.',
  openGuest: 'Open guest window',
  someone: 'Someone',
  phaseDealing: 'Dealing',
  phasePrediction: 'Bidding',
  phasePlaying: 'Playing',
  phaseScoring: 'Round over',
  phaseFinished: 'Match over',
  hudLine: 'Round {n} · {cards} · {phase} · Vira {vira} · {stake}',
  roundStakeOne: 'Worth 1 letter',
  roundStakeMany: 'Worth {n} letters',
  faceDownCard: 'Face-down card',
  cardOf: '{rank} of {suit}',
  suitDiamonds: 'diamonds',
  suitSpades: 'spades',
  suitHearts: 'hearts',
  suitClubs: 'clubs',
  errorConnect: 'Could not connect to the server.',
  errorLocalServer:
    'Could not reach the local server on port 4737. Run npm run dev, or npm run server in another terminal.',
  errorGeneric: 'Something went wrong.',
  errorWrongPhase: 'That action is not allowed right now.',
  errorNotYourTurn: 'It is not your turn.',
  errorInvalidPrediction: 'Invalid prediction.',
  errorCardNotInHand: 'That card is not in your hand.',
  errorPlayerEliminated: 'Eliminated players cannot play.',
  errorGameFinished: 'The match is over.',
  errorUnknownPlayer: 'Unknown player.',
  errorNotInRoom: 'You are not at this table.',
  errorLobbyFull: 'The table is full.',
  errorGameAlreadyStarted: 'The match has already started.',
  errorGameNotStarted: 'The match has not started.',
  errorNotEnoughPlayers: 'A match needs at least 2 players.',
  errorNotOwner: 'Only the host can start the match.',
  errorInvalidName: 'The name cannot be empty.',
  errorDuplicatePlayer: 'That player is already at the table.',
  errorUnknownMessage: 'Unrecognized message.',
  errorProtocol: 'Protocol error.',
  errorNotJoined: 'Join the table before sending actions.',
  errorAlreadyJoined: 'This connection already joined.',
  errorRoomNotFound: 'No table uses that code.',
};
