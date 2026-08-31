import { applyAction } from './reducer';
import type { Action, Card, Game, Rank, Suit } from './types';

export const twoPlayers = [
  { id: 'a', displayName: 'Ana' },
  { id: 'b', displayName: 'Beto' },
];

export const threePlayers = [
  { id: 'a', displayName: 'Ana' },
  { id: 'b', displayName: 'Beto' },
  { id: 'c', displayName: 'Carla' },
];

export function apply(state: Game, action: Action): Game {
  const result = applyAction(state, action);
  if (!result.ok) {
    throw new Error(`${result.error.code}: ${result.error.message}`);
  }
  return result.state;
}

export function predictAll(state: Game, values: Record<string, number>): Game {
  let next = state;
  while (next.phase === 'PREDICTION' && next.currentPlayerId) {
    const value = values[next.currentPlayerId];
    if (value === undefined) {
      throw new Error(`Missing prediction for ${next.currentPlayerId}`);
    }
    next = apply(next, {
      type: 'PREDICT',
      playerId: next.currentPlayerId,
      value,
    });
  }
  return next;
}

export function playCurrent(state: Game, cardId?: string): Game {
  if (!state.currentPlayerId) {
    throw new Error('No current player');
  }
  const player = state.players.find((item) => item.id === state.currentPlayerId);
  if (!player) {
    throw new Error('Current player missing');
  }
  const id = cardId ?? player.hand[0].id;
  return apply(state, {
    type: 'PLAY_CARD',
    playerId: state.currentPlayerId,
    cardId: id,
  });
}

export function playOutRound(state: Game): Game {
  let next = state;
  while (next.phase === 'PLAYING' && next.currentPlayerId) {
    next = playCurrent(next);
  }
  return next;
}

export function player(state: Game, id: string) {
  const found = state.players.find((item) => item.id === id);
  if (!found) {
    throw new Error(`Missing player ${id}`);
  }
  return found;
}

export function cardOf(rank: Rank, suit: Suit): Pick<Card, 'rank' | 'suit'> {
  return { rank, suit };
}
