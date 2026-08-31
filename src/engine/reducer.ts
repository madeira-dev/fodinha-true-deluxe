import { resolveTrick } from './compare';
import {
  createDeck,
  manilhaRankAfter,
  maxCardsPerPlayer,
  mulberry32,
  nextRoundDeal,
  shuffle,
} from './deck';
import { applyRoundPenalty } from './scoring';
import type {
  Action,
  ApplyResult,
  Card,
  CreateMatchOptions,
  ErrorCode,
  Game,
  Player,
} from './types';

function fail(code: ErrorCode, message: string): ApplyResult {
  return { ok: false, error: { code, message } };
}

function ok(state: Game): ApplyResult {
  return { ok: true, state };
}

function cloneGame(game: Game): Game {
  return JSON.parse(JSON.stringify(game)) as Game;
}

function generateId(): string {
  return `game_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function findPlayer(game: Game, playerId: string): Player | undefined {
  return game.players.find((player) => player.id === playerId);
}

function nextActiveIndex(game: Game, fromIndex: number): number {
  const count = game.players.length;
  let index = fromIndex;
  for (let step = 0; step < count; step += 1) {
    index = (index + game.direction + count) % count;
    if (!game.players[index].eliminated) {
      return index;
    }
  }
  throw new Error('No active players remain');
}

function stampIds(game: Game, cards: Card[]): Card[] {
  return cards.map((card) => {
    const stamped: Card = {
      id: `c${game.nextCardSeq}`,
      rank: card.rank,
      suit: card.suit,
    };
    game.nextCardSeq += 1;
    return stamped;
  });
}

function buildShuffledDeck(game: Game, overrideDeck?: Card[]): Card[] {
  if (overrideDeck) {
    return stampIds(game, overrideDeck);
  }

  const source = createDeck();
  if (game.rngSeed === null) {
    return stampIds(game, shuffle(source, Math.random));
  }

  const random = mulberry32(game.rngSeed + game.roundNumber * 0x9e3779b9);
  return stampIds(game, shuffle(source, random));
}

function dealRound(game: Game, overrideDeck?: Card[]): Game {
  const active = game.players.filter((player) => !player.eliminated);
  if (active.length < 2) {
    throw new Error('Cannot deal a round with fewer than 2 active players');
  }

  const max = maxCardsPerPlayer(active.length);
  if (game.cardsPerPlayer < 1 || game.cardsPerPlayer > max) {
    throw new Error(
      `Illegal cardsPerPlayer ${game.cardsPerPlayer} for ${active.length} players`,
    );
  }

  const deck = buildShuffledDeck(game, overrideDeck);
  const needed = game.cardsPerPlayer * active.length + 1;
  if (deck.length < needed) {
    throw new Error('Not enough cards to deal this round');
  }

  for (let i = 0; i < game.players.length; i += 1) {
    const player = game.players[i];
    if (!player.eliminated) {
      player.hand = [];
      player.prediction = null;
      player.tricksWon = 0;
    }
  }

  let seat = game.dealerIndex;
  for (let n = 0; n < game.cardsPerPlayer; n += 1) {
    for (let dealt = 0; dealt < active.length; dealt += 1) {
      seat = nextActiveIndex(game, seat);
      const card = deck.shift();
      if (!card) {
        throw new Error('Deck exhausted while dealing');
      }
      game.players[seat].hand.push(card);
    }
  }

  const vira = deck.shift();
  if (!vira) {
    throw new Error('No card left for the vira');
  }

  game.vira = vira;
  game.manilhaRank = manilhaRankAfter(vira.rank);
  game.deck = deck;
  game.completedTricks = [];
  game.currentTrick = null;
  game.firstRoundSpecialVisibility = game.roundNumber === 1;
  game.phase = 'PREDICTION';
  game.currentPlayerId = game.players[nextActiveIndex(game, game.dealerIndex)].id;
  game.winnerId = null;
  game.tied = false;
  return game;
}

export function createMatch(options: CreateMatchOptions): Game {
  if (!options.players || options.players.length < 2) {
    throw new Error('A match needs at least 2 players');
  }
  if (options.players.length > 39) {
    throw new Error('A match cannot have more than 39 players');
  }

  const seen = new Set<string>();
  for (let i = 0; i < options.players.length; i += 1) {
    const player = options.players[i];
    if (!player.id) {
      throw new Error('Each player needs an id');
    }
    if (seen.has(player.id)) {
      throw new Error(`Duplicate player id: ${player.id}`);
    }
    seen.add(player.id);
  }

  const dealerIndex = options.dealerIndex ?? 0;
  if (dealerIndex < 0 || dealerIndex >= options.players.length) {
    throw new Error('dealerIndex is out of range');
  }

  const game: Game = {
    id: options.id ?? generateId(),
    players: options.players.map((player) => ({
      id: player.id,
      displayName: player.displayName,
      hand: [],
      prediction: null,
      tricksWon: 0,
      penaltyCount: 0,
      eliminated: false,
      connected: true,
    })),
    dealerIndex,
    currentPlayerId: null,
    roundNumber: 1,
    cardsPerPlayer: 1,
    direction: 1,
    cardsPerPlayerDirection: 1,
    phase: 'DEALING',
    deck: [],
    vira: null,
    manilhaRank: null,
    currentTrick: null,
    completedTricks: [],
    firstRoundSpecialVisibility: true,
    winnerId: null,
    tied: false,
    rngSeed: options.seed ?? null,
    nextCardSeq: 1,
  };

  return dealRound(game, options.deck);
}

function applyPredict(game: Game, playerId: string, value: number): ApplyResult {
  if (game.phase !== 'PREDICTION') {
    return fail('WRONG_PHASE', 'Predictions are not being accepted');
  }

  const player = findPlayer(game, playerId);
  if (!player) {
    return fail('UNKNOWN_PLAYER', `Unknown player: ${playerId}`);
  }
  if (player.eliminated) {
    return fail('PLAYER_ELIMINATED', 'Eliminated players cannot predict');
  }
  if (game.currentPlayerId !== playerId) {
    return fail('NOT_YOUR_TURN', 'It is not this player\'s turn to predict');
  }
  if (!Number.isInteger(value) || value < 0 || value > game.cardsPerPlayer) {
    return fail(
      'INVALID_PREDICTION',
      `Prediction must be an integer from 0 to ${game.cardsPerPlayer}`,
    );
  }

  player.prediction = value;

  const currentIndex = game.players.findIndex((item) => item.id === playerId);
  let nextIndex = currentIndex;
  let found = false;
  for (let step = 0; step < game.players.length; step += 1) {
    nextIndex = nextActiveIndex(game, nextIndex);
    if (game.players[nextIndex].prediction === null) {
      game.currentPlayerId = game.players[nextIndex].id;
      found = true;
      break;
    }
  }

  if (!found) {
    const leaderIndex = nextActiveIndex(game, game.dealerIndex);
    const leaderId = game.players[leaderIndex].id;
    game.phase = 'PLAYING';
    game.currentPlayerId = leaderId;
    game.currentTrick = {
      leaderId,
      plays: [],
      winnerId: null,
      tied: false,
    };
  }

  return ok(game);
}

function scoreRound(game: Game): Game {
  game.phase = 'SCORING';
  game.currentTrick = null;
  game.currentPlayerId = null;

  for (let i = 0; i < game.players.length; i += 1) {
    const player = game.players[i];
    if (player.eliminated) {
      continue;
    }
    if (player.prediction === null) {
      throw new Error(`Missing prediction for ${player.id}`);
    }
    player.penaltyCount = applyRoundPenalty(
      player.penaltyCount,
      player.prediction,
      player.tricksWon,
    );
    if (player.penaltyCount >= 7) {
      player.eliminated = true;
      player.hand = [];
    }
  }

  const remaining = game.players.filter((player) => !player.eliminated);
  if (remaining.length === 1) {
    game.phase = 'FINISHED';
    game.winnerId = remaining[0].id;
    game.tied = false;
  } else if (remaining.length === 0) {
    game.phase = 'FINISHED';
    game.winnerId = null;
    game.tied = true;
  }

  return game;
}

function applyPlayCard(game: Game, playerId: string, cardId: string): ApplyResult {
  if (game.phase !== 'PLAYING' || !game.currentTrick || !game.manilhaRank) {
    return fail('WRONG_PHASE', 'Cards cannot be played right now');
  }

  const player = findPlayer(game, playerId);
  if (!player) {
    return fail('UNKNOWN_PLAYER', `Unknown player: ${playerId}`);
  }
  if (player.eliminated) {
    return fail('PLAYER_ELIMINATED', 'Eliminated players cannot play');
  }
  if (game.currentPlayerId !== playerId) {
    return fail('NOT_YOUR_TURN', 'It is not this player\'s turn');
  }

  const cardIndex = player.hand.findIndex((card) => card.id === cardId);
  if (cardIndex === -1) {
    return fail('CARD_NOT_IN_HAND', 'That card is not in the player\'s hand');
  }

  const card = player.hand.splice(cardIndex, 1)[0];
  game.currentTrick.plays.push({ playerId, card });

  const activeCount = game.players.filter((item) => !item.eliminated).length;
  if (game.currentTrick.plays.length < activeCount) {
    const currentIndex = game.players.findIndex((item) => item.id === playerId);
    game.currentPlayerId = game.players[nextActiveIndex(game, currentIndex)].id;
    return ok(game);
  }

  const result = resolveTrick(game.currentTrick.plays, game.manilhaRank);
  game.currentTrick.winnerId = result.winnerId;
  game.currentTrick.tied = result.tied;
  if (result.winnerId) {
    const winner = findPlayer(game, result.winnerId);
    if (winner) {
      winner.tricksWon += 1;
    }
  }

  const finishedTrick = game.currentTrick;
  game.completedTricks.push(finishedTrick);

  const cardsLeft = game.players.some(
    (item) => !item.eliminated && item.hand.length > 0,
  );
  if (cardsLeft) {
    const leaderId = result.tied ? finishedTrick.leaderId : (result.winnerId as string);
    game.currentPlayerId = leaderId;
    game.currentTrick = {
      leaderId,
      plays: [],
      winnerId: null,
      tied: false,
    };
    return ok(game);
  }

  return ok(scoreRound(game));
}

function applyAdvance(game: Game, overrideDeck?: Card[]): ApplyResult {
  if (game.phase === 'FINISHED') {
    return fail('GAME_FINISHED', 'The match is over');
  }
  if (game.phase !== 'SCORING') {
    return fail('WRONG_PHASE', 'The next round cannot be dealt yet');
  }

  const remaining = game.players.filter((player) => !player.eliminated);
  const nextDeal = nextRoundDeal(
    game.cardsPerPlayer,
    game.cardsPerPlayerDirection,
    remaining.length,
  );
  game.cardsPerPlayer = nextDeal.cardsPerPlayer;
  game.cardsPerPlayerDirection = nextDeal.direction;
  game.roundNumber += 1;
  game.dealerIndex = nextActiveIndex(game, game.dealerIndex);
  return ok(dealRound(game, overrideDeck));
}

export function applyAction(state: Game, action: Action): ApplyResult {
  if (state.phase === 'FINISHED') {
    return fail('GAME_FINISHED', 'The match is over');
  }

  const game = cloneGame(state);

  switch (action.type) {
    case 'PREDICT':
      return applyPredict(game, action.playerId, action.value);
    case 'PLAY_CARD':
      return applyPlayCard(game, action.playerId, action.cardId);
    case 'ADVANCE':
      return applyAdvance(game, action.deck);
    default: {
      const neverAction: never = action;
      return fail('WRONG_PHASE', `Unsupported action: ${JSON.stringify(neverAction)}`);
    }
  }
}
