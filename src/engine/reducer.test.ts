import { describe, expect, it } from 'vitest';
import { createDeck, pullToFront } from './deck';
import {
  apply,
  cardOf,
  finishDeal,
  playCurrent,
  playOutRound,
  player,
  predictAll,
  threePlayers,
  twoPlayers,
} from './test-helpers';
import { applyAction, createMatch } from './reducer';
import { projectView } from './view';
import type { Game } from './types';

function deal(players: Array<{ id: string; displayName: string }>, top: Array<ReturnType<typeof cardOf>>, extra?: Partial<Parameters<typeof createMatch>[0]>): Game {
  return finishDeal(
    createMatch({
      players,
      deck: pullToFront(createDeck(), top),
      ...extra,
    }),
  );
}

describe('createMatch', () => {
  it('holds the table in DEALING until the deal is finished', () => {
    const raw = createMatch({
      players: twoPlayers,
      deck: pullToFront(createDeck(), [
        cardOf('A', 'spades'),
        cardOf('3', 'hearts'),
        cardOf('4', 'clubs'),
      ]),
    });

    expect(raw.phase).toBe('DEALING');
    expect(raw.currentPlayerId).toBeNull();
    expect(applyAction(raw, { type: 'PREDICT', playerId: 'b', value: 0 })).toMatchObject({
      ok: false,
      error: { code: 'WRONG_PHASE' },
    });

    const game = finishDeal(raw);
    expect(game.phase).toBe('PREDICTION');
    expect(game.currentPlayerId).toBe('b');
  });

  it('starts on round 1 with one card each, vira, and manilha', () => {
    const game = deal(twoPlayers, [
      cardOf('A', 'spades'),
      cardOf('3', 'hearts'),
      cardOf('4', 'clubs'),
    ]);

    expect(game.phase).toBe('PREDICTION');
    expect(game.roundNumber).toBe(1);
    expect(game.cardsPerPlayer).toBe(1);
    expect(game.firstRoundSpecialVisibility).toBe(true);
    expect(player(game, 'b').hand).toHaveLength(1);
    expect(player(game, 'a').hand).toHaveLength(1);
    expect(game.vira).toMatchObject({ rank: '4', suit: 'clubs' });
    expect(game.manilhaRank).toBe('5');
    expect(game.currentPlayerId).toBe('b');
    expect(game.deck).toHaveLength(37);
  });

  it('deals starting after the dealer and ignores vira suit for manilha', () => {
    const game = deal(threePlayers, [
      cardOf('2', 'diamonds'),
      cardOf('K', 'spades'),
      cardOf('7', 'hearts'),
      cardOf('A', 'diamonds'),
    ]);

    expect(player(game, 'b').hand[0]).toMatchObject({ rank: '2', suit: 'diamonds' });
    expect(player(game, 'c').hand[0]).toMatchObject({ rank: 'K', suit: 'spades' });
    expect(player(game, 'a').hand[0]).toMatchObject({ rank: '7', suit: 'hearts' });
    expect(game.manilhaRank).toBe('2');
  });

  it('rejects a table that is too small', () => {
    expect(() => createMatch({ players: [{ id: 'a', displayName: 'Ana' }] })).toThrow(
      /at least 2 players/,
    );
  });

  it('rejects a table with more than 6 players', () => {
    const players = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((id) => ({
      id,
      displayName: id,
    }));
    expect(() => createMatch({ players })).toThrow(/more than 6 players/);
  });
});

describe('predictions', () => {
  it('locks predictions in seat order and then starts the first trick', () => {
    let game = deal(threePlayers, [
      cardOf('4', 'diamonds'),
      cardOf('5', 'diamonds'),
      cardOf('6', 'diamonds'),
      cardOf('7', 'clubs'),
    ]);

    game = apply(game, { type: 'PREDICT', playerId: 'b', value: 1 });
    expect(game.currentPlayerId).toBe('c');
    game = apply(game, { type: 'PREDICT', playerId: 'c', value: 0 });
    game = apply(game, { type: 'PREDICT', playerId: 'a', value: 0 });

    expect(game.phase).toBe('PLAYING');
    expect(game.currentPlayerId).toBe('b');
    expect(game.currentTrick?.leaderId).toBe('b');
    expect(player(game, 'b').prediction).toBe(1);
  });

  it('rejects out-of-range, out-of-turn, and non-integer predictions', () => {
    const game = deal(twoPlayers, [
      cardOf('4', 'diamonds'),
      cardOf('5', 'diamonds'),
      cardOf('6', 'clubs'),
    ]);

    expect(applyAction(game, { type: 'PREDICT', playerId: 'a', value: 0 })).toMatchObject({
      ok: false,
      error: { code: 'NOT_YOUR_TURN' },
    });
    expect(applyAction(game, { type: 'PREDICT', playerId: 'b', value: 2 })).toMatchObject({
      ok: false,
      error: { code: 'INVALID_PREDICTION' },
    });
    expect(applyAction(game, { type: 'PREDICT', playerId: 'b', value: 0.5 })).toMatchObject({
      ok: false,
      error: { code: 'INVALID_PREDICTION' },
    });
    expect(applyAction(game, { type: 'PREDICT', playerId: 'nobody', value: 0 })).toMatchObject({
      ok: false,
      error: { code: 'UNKNOWN_PLAYER' },
    });
  });
});

describe('playing tricks', () => {
  it('removes the played card, scores at most one winner, and uses the winner as next leader', () => {
    let game = deal(twoPlayers, [
      cardOf('3', 'spades'),
      cardOf('K', 'hearts'),
      cardOf('4', 'clubs'),
    ]);
    game = predictAll(game, { a: 0, b: 1 });

    const betoCard = player(game, 'b').hand[0];
    game = playCurrent(game, betoCard.id);
    expect(player(game, 'b').hand).toHaveLength(0);
    expect(game.currentTrick?.plays).toHaveLength(1);

    game = playCurrent(game);
    expect(game.completedTricks).toHaveLength(1);
    expect(game.completedTricks[0].winnerId).toBe('b');
    expect(player(game, 'b').tricksWon).toBe(1);
    expect(player(game, 'a').tricksWon).toBe(0);
    expect(game.phase).toBe('SCORING');
  });

  it('gives a tied trick to nobody and keeps the same leader', () => {
    let game = deal(
      threePlayers,
      [
        cardOf('A', 'diamonds'),
        cardOf('A', 'clubs'),
        cardOf('A', 'hearts'),
        cardOf('4', 'spades'),
      ],
    );
    game = predictAll(game, { a: 0, b: 0, c: 0 });
    game = playOutRound(game);

    expect(game.completedTricks[0].tied).toBe(true);
    expect(game.completedTricks[0].winnerId).toBeNull();
    expect(player(game, 'a').tricksWon).toBe(0);
    expect(player(game, 'b').tricksWon).toBe(0);
    expect(player(game, 'c').tricksWon).toBe(0);
  });

  it('lets a manilha beat a stronger normal rank', () => {
    let game = deal(twoPlayers, [
      cardOf('5', 'diamonds'),
      cardOf('3', 'clubs'),
      cardOf('4', 'hearts'),
    ]);
    game = predictAll(game, { a: 0, b: 1 });
    game = playOutRound(game);

    expect(game.manilhaRank).toBe('5');
    expect(game.completedTricks[0].winnerId).toBe('b');
  });

  it('rejects a card that is not in hand or played out of turn', () => {
    let game = deal(twoPlayers, [
      cardOf('5', 'diamonds'),
      cardOf('3', 'clubs'),
      cardOf('4', 'hearts'),
    ]);
    game = predictAll(game, { a: 0, b: 1 });

    const anaCard = player(game, 'a').hand[0];
    expect(applyAction(game, { type: 'PLAY_CARD', playerId: 'a', cardId: anaCard.id })).toMatchObject({
      ok: false,
      error: { code: 'NOT_YOUR_TURN' },
    });
    expect(applyAction(game, { type: 'PLAY_CARD', playerId: 'b', cardId: anaCard.id })).toMatchObject({
      ok: false,
      error: { code: 'CARD_NOT_IN_HAND' },
    });
  });

  it('does not mutate the previous state object', () => {
    const game = deal(twoPlayers, [
      cardOf('5', 'diamonds'),
      cardOf('3', 'clubs'),
      cardOf('4', 'hearts'),
    ]);
    const snapshot = JSON.stringify(game);
    apply(game, { type: 'PREDICT', playerId: 'b', value: 0 });
    expect(JSON.stringify(game)).toBe(snapshot);
  });
});

describe('round 2 multi-trick flow', () => {
  it('starts the next trick from the winner, or from the same leader when tied', () => {
    let game = deal(twoPlayers, [
      cardOf('3', 'spades'),
      cardOf('4', 'hearts'),
      cardOf('5', 'clubs'),
    ]);
    game = predictAll(game, { a: 0, b: 1 });
    game = playOutRound(game);
    expect(player(game, 'a').penaltyCount).toBe(0);
    expect(player(game, 'b').penaltyCount).toBe(0);
    game = finishDeal(
      apply(game, {
        type: 'ADVANCE',
        deck: pullToFront(createDeck(), [
          cardOf('A', 'diamonds'),
          cardOf('A', 'clubs'),
          cardOf('3', 'diamonds'),
          cardOf('K', 'clubs'),
          cardOf('4', 'hearts'),
        ]),
      }),
    );

    expect(game.dealerIndex).toBe(1);
    expect(game.currentPlayerId).toBe('a');
    expect(game.cardsPerPlayer).toBe(2);
    expect(player(game, 'a').hand).toHaveLength(2);
    expect(player(game, 'b').hand).toHaveLength(2);

    game = predictAll(game, { a: 1, b: 0 });

    const firstA = player(game, 'a').hand.find((card) => card.rank === 'A');
    const firstB = player(game, 'b').hand.find((card) => card.rank === 'A');
    if (!firstA || !firstB) {
      throw new Error('Expected aces to be dealt');
    }

    game = playCurrent(game, firstA.id);
    game = playCurrent(game, firstB.id);
    expect(game.completedTricks[0].tied).toBe(true);
    expect(game.currentPlayerId).toBe('a');
    expect(game.currentTrick?.leaderId).toBe('a');

    const three = player(game, 'a').hand.find((card) => card.rank === '3');
    if (!three) {
      throw new Error('Expected 3 for player a');
    }
    game = playCurrent(game, three.id);
    game = playCurrent(game);
    expect(game.completedTricks[1].winnerId).toBe('a');
    expect(player(game, 'a').tricksWon).toBe(1);
    expect(player(game, 'b').tricksWon).toBe(0);
    expect(game.phase).toBe('SCORING');
    expect(player(game, 'a').penaltyCount).toBe(0);
    expect(player(game, 'b').penaltyCount).toBe(0);
  });
});

describe('scoring and elimination', () => {
  it('adds no letters when the prediction is exact', () => {
    let game = deal(twoPlayers, [
      cardOf('3', 'spades'),
      cardOf('4', 'hearts'),
      cardOf('5', 'clubs'),
    ]);
    game = predictAll(game, { a: 0, b: 1 });
    game = playOutRound(game);

    expect(player(game, 'a').penaltyCount).toBe(0);
    expect(player(game, 'b').penaltyCount).toBe(0);
    expect(game.letterStake).toBe(2);
  });

  it('makes the next round worth one extra letter after a fully exact round', () => {
    let game = deal(twoPlayers, [
      cardOf('3', 'spades'),
      cardOf('4', 'hearts'),
      cardOf('5', 'clubs'),
    ]);
    game = predictAll(game, { a: 0, b: 1 });
    game = playOutRound(game);
    expect(game.letterStake).toBe(2);

    game = apply(game, {
      type: 'ADVANCE',
      deck: pullToFront(createDeck(), [
        cardOf('4', 'diamonds'),
        cardOf('3', 'spades'),
        cardOf('5', 'hearts'),
        cardOf('2', 'clubs'),
        cardOf('7', 'clubs'),
      ]),
    });
    expect(game.letterStake).toBe(2);
    game = predictAll(game, { a: 0, b: 1 });
    game = playOutRound(game);

    expect(player(game, 'b').tricksWon).toBe(2);
    expect(player(game, 'a').tricksWon).toBe(0);
    expect(player(game, 'a').penaltyCount).toBe(0);
    expect(player(game, 'b').penaltyCount).toBe(2);
    expect(game.letterStake).toBe(1);
  });

  it('penalizes both over- and under-performing', () => {
    let game = deal(twoPlayers, [
      cardOf('3', 'spades'),
      cardOf('4', 'hearts'),
      cardOf('5', 'clubs'),
    ]);
    game = predictAll(game, { a: 1, b: 0 });
    game = playOutRound(game);

    expect(player(game, 'b').tricksWon).toBe(1);
    expect(player(game, 'a').tricksWon).toBe(0);
    expect(player(game, 'b').penaltyCount).toBe(1);
    expect(player(game, 'a').penaltyCount).toBe(1);
  });

  it('eliminates a player at FODINHA and awards the match to the last player left', () => {
    let game = deal(twoPlayers, [
      cardOf('3', 'spades'),
      cardOf('4', 'hearts'),
      cardOf('5', 'clubs'),
    ]);
    player(game, 'a').penaltyCount = 6;
    game = predictAll(game, { a: 1, b: 1 });
    game = playOutRound(game);

    expect(player(game, 'a').eliminated).toBe(true);
    expect(player(game, 'a').penaltyCount).toBe(7);
    expect(game.phase).toBe('FINISHED');
    expect(game.winnerId).toBe('b');
    expect(game.tied).toBe(false);
  });

  it('ties the match when every remaining player is eliminated in the same scoring phase', () => {
    let game = deal(twoPlayers, [
      cardOf('3', 'spades'),
      cardOf('4', 'hearts'),
      cardOf('5', 'clubs'),
    ]);
    player(game, 'a').penaltyCount = 6;
    player(game, 'b').penaltyCount = 6;
    game = predictAll(game, { a: 1, b: 0 });
    game = playOutRound(game);

    expect(player(game, 'a').eliminated).toBe(true);
    expect(player(game, 'b').eliminated).toBe(true);
    expect(game.phase).toBe('FINISHED');
    expect(game.tied).toBe(true);
    expect(game.winnerId).toBeNull();
  });

  it('does not keep applying letters past FODINHA', () => {
    let game = deal(twoPlayers, [
      cardOf('3', 'spades'),
      cardOf('4', 'hearts'),
      cardOf('5', 'clubs'),
    ]);
    player(game, 'a').penaltyCount = 6;
    game = predictAll(game, { a: 1, b: 0 });
    game = playOutRound(game);
    expect(player(game, 'a').penaltyCount).toBe(7);
  });

  it('rejects actions after the match is finished', () => {
    let game = deal(twoPlayers, [
      cardOf('3', 'spades'),
      cardOf('4', 'hearts'),
      cardOf('5', 'clubs'),
    ]);
    player(game, 'a').penaltyCount = 6;
    game = predictAll(game, { a: 1, b: 1 });
    game = playOutRound(game);

    expect(applyAction(game, { type: 'ADVANCE' })).toMatchObject({
      ok: false,
      error: { code: 'GAME_FINISHED' },
    });
    expect(applyAction(game, { type: 'PREDICT', playerId: 'b', value: 0 })).toMatchObject({
      ok: false,
      error: { code: 'GAME_FINISHED' },
    });
  });
});

describe('round progression', () => {
  it('rotates the dealer and leaves first-round visibility behind', () => {
    let game = deal(threePlayers, [
      cardOf('4', 'diamonds'),
      cardOf('5', 'spades'),
      cardOf('6', 'hearts'),
      cardOf('7', 'clubs'),
    ]);
    game = predictAll(game, { a: 0, b: 0, c: 1 });
    game = playOutRound(game);
    game = finishDeal(apply(game, { type: 'ADVANCE' }));

    expect(game.roundNumber).toBe(2);
    expect(game.cardsPerPlayer).toBe(2);
    expect(game.dealerIndex).toBe(1);
    expect(game.currentPlayerId).toBe('c');
    expect(game.firstRoundSpecialVisibility).toBe(false);
    expect(game.phase).toBe('PREDICTION');
    expect(projectView(game, 'c').firstRoundSpecialVisibility).toBe(false);
  });
});
