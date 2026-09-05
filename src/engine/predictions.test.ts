import { describe, expect, it } from 'vitest';
import { createDeck, pullToFront } from './deck';
import { apply, cardOf, finishDeal, playOutRound, predictAll, threePlayers, twoPlayers } from './test-helpers';
import { forbiddenClosingPrediction, legalPredictionValues } from './predictions';
import { applyAction, createMatch } from './reducer';
import type { Game } from './types';

function deal(
  players: Array<{ id: string; displayName: string }>,
  top: Array<ReturnType<typeof cardOf>>,
): Game {
  return finishDeal(
    createMatch({
      players,
      deck: pullToFront(createDeck(), top),
    }),
  );
}

function advanceToRound2(game: Game): Game {
  return finishDeal(
    apply(game, {
      type: 'ADVANCE',
      deck: pullToFront(createDeck(), [
        cardOf('4', 'diamonds'),
        cardOf('5', 'diamonds'),
        cardOf('6', 'diamonds'),
        cardOf('7', 'diamonds'),
        cardOf('Q', 'diamonds'),
        cardOf('J', 'diamonds'),
        cardOf('K', 'clubs'),
      ]),
    }),
  );
}

describe('closing prediction rule', () => {
  it('lets the last player close the total on round 1', () => {
    let game = deal(twoPlayers, [
      cardOf('4', 'diamonds'),
      cardOf('5', 'diamonds'),
      cardOf('6', 'clubs'),
    ]);

    expect(legalPredictionValues(game)).toEqual([0, 1]);
    game = apply(game, { type: 'PREDICT', playerId: 'b', value: 1 });
    expect(forbiddenClosingPrediction(game)).toBeNull();
    expect(legalPredictionValues(game)).toEqual([0, 1]);
    expect(applyAction(game, { type: 'PREDICT', playerId: 'a', value: 0 }).ok).toBe(true);
  });

  it('forbids the last player from making the round-2 total equal 2', () => {
    let game = deal(twoPlayers, [
      cardOf('4', 'diamonds'),
      cardOf('5', 'diamonds'),
      cardOf('6', 'clubs'),
    ]);
    game = predictAll(game, { a: 0, b: 1 });
    game = playOutRound(game);
    game = advanceToRound2(game);

    expect(game.roundNumber).toBe(2);
    expect(game.cardsPerPlayer).toBe(2);
    expect(game.currentPlayerId).toBe('a');
    expect(legalPredictionValues(game)).toEqual([0, 1, 2]);

    game = apply(game, { type: 'PREDICT', playerId: 'a', value: 1 });
    expect(forbiddenClosingPrediction(game)).toBe(1);
    expect(legalPredictionValues(game)).toEqual([0, 2]);
    expect(applyAction(game, { type: 'PREDICT', playerId: 'b', value: 1 })).toMatchObject({
      ok: false,
      error: { code: 'INVALID_PREDICTION' },
    });
    expect(applyAction(game, { type: 'PREDICT', playerId: 'b', value: 0 }).ok).toBe(true);
  });

  it('still lets earlier players bid the value that would later close', () => {
    let game = deal(threePlayers, [
      cardOf('4', 'diamonds'),
      cardOf('5', 'diamonds'),
      cardOf('6', 'diamonds'),
      cardOf('7', 'clubs'),
    ]);
    game = predictAll(game, { a: 0, b: 0, c: 1 });
    game = playOutRound(game);
    game = advanceToRound2(game);

    expect(game.currentPlayerId).toBe('c');
    expect(legalPredictionValues(game)).toEqual([0, 1, 2]);
    game = apply(game, { type: 'PREDICT', playerId: 'c', value: 2 });
    expect(legalPredictionValues(game)).toEqual([0, 1, 2]);
    game = apply(game, { type: 'PREDICT', playerId: 'a', value: 0 });
    expect(forbiddenClosingPrediction(game)).toBe(0);
    expect(legalPredictionValues(game)).toEqual([1, 2]);
  });
});
