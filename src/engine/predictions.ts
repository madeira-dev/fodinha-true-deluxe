import type { Game } from './types';

function activePlayers(game: Game) {
  return game.players.filter((player) => !player.eliminated);
}

/**
 * From round 2 on, the last player to predict cannot make the sum of
 * all palpites equal the number of cards (tricks) in the round.
 */
export function forbiddenClosingPrediction(game: Game): number | null {
  if (game.roundNumber < 2) {
    return null;
  }

  const active = activePlayers(game);
  const stillOpen = active.filter((player) => player.prediction === null);
  if (stillOpen.length !== 1) {
    return null;
  }

  const currentSum = active.reduce((sum, player) => sum + (player.prediction ?? 0), 0);
  const forbidden = game.cardsPerPlayer - currentSum;
  if (forbidden < 0 || forbidden > game.cardsPerPlayer) {
    return null;
  }
  return forbidden;
}

export function legalPredictionValues(game: Game): number[] {
  const values: number[] = [];
  for (let value = 0; value <= game.cardsPerPlayer; value += 1) {
    values.push(value);
  }

  const forbidden = forbiddenClosingPrediction(game);
  if (forbidden === null) {
    return values;
  }
  return values.filter((value) => value !== forbidden);
}
