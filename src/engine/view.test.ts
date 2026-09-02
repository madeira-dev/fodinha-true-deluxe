import { describe, expect, it } from 'vitest';
import { createDeck, pullToFront } from './deck';
import { apply, cardOf, playCurrent, predictAll, threePlayers } from './test-helpers';
import { createMatch } from './reducer';
import { isVisibleCard, projectView } from './view';

function round1Match() {
  return createMatch({
    players: threePlayers,
    deck: pullToFront(createDeck(), [
      cardOf('A', 'spades'),
      cardOf('3', 'hearts'),
      cardOf('7', 'diamonds'),
      cardOf('4', 'clubs'),
    ]),
  });
}

describe('projectView', () => {
  it('hides a player\'s own first-round card and shows every opponent card', () => {
    const game = round1Match();
    const viewA = projectView(game, 'a');
    const viewB = projectView(game, 'b');

    expect(game.firstRoundSpecialVisibility).toBe(true);
    expect(viewA.you.hand).toEqual([{ id: viewA.you.hand[0].id }]);
    expect(isVisibleCard(viewA.you.hand[0])).toBe(false);

    const betoFromA = viewA.players.find((player) => player.id === 'b');
    const carlaFromA = viewA.players.find((player) => player.id === 'c');
    expect(betoFromA && isVisibleCard(betoFromA.hand[0]) && betoFromA.hand[0]).toMatchObject({
      rank: 'A',
      suit: 'spades',
    });
    expect(carlaFromA && isVisibleCard(carlaFromA.hand[0]) && carlaFromA.hand[0]).toMatchObject({
      rank: '3',
      suit: 'hearts',
    });

    const anaFromB = viewB.players.find((player) => player.id === 'a');
    expect(anaFromB && isVisibleCard(anaFromB.hand[0]) && anaFromB.hand[0]).toMatchObject({
      rank: '7',
      suit: 'diamonds',
    });
    expect(isVisibleCard(viewB.you.hand[0])).toBe(false);
  });

  it('does not include the remaining deck in any player view', () => {
    const game = round1Match();
    const view = projectView(game, 'a');
    expect(view).not.toHaveProperty('deck');
    expect(JSON.stringify(view)).not.toContain('"deck"');
  });

  it('shows the vira and manilha to every player', () => {
    const game = round1Match();
    const view = projectView(game, 'a');
    expect(view.vira).toMatchObject({ rank: '4', suit: 'clubs' });
    expect(view.manilhaRank).toBe('5');
  });

  it('hides opponent hands from round 2 onward', () => {
    let game = round1Match();
    game = predictAll(game, { a: 0, b: 0, c: 0 });
    game = playCurrent(game);
    game = playCurrent(game);
    game = playCurrent(game);
    game = apply(game, {
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
    });

    expect(game.roundNumber).toBe(2);
    expect(game.cardsPerPlayer).toBe(2);
    expect(game.firstRoundSpecialVisibility).toBe(false);

    const viewA = projectView(game, 'a');
    expect(viewA.you.hand).toHaveLength(2);
    expect(viewA.you.hand.every(isVisibleCard)).toBe(true);

    const beto = viewA.players.find((item) => item.id === 'b');
    const carla = viewA.players.find((item) => item.id === 'c');
    expect(beto?.hand).toEqual([]);
    expect(beto?.handCount).toBe(2);
    expect(carla?.hand).toEqual([]);
    expect(carla?.handCount).toBe(2);
    expect(viewA.you.hand.map((card) => (isVisibleCard(card) ? card.rank : null))).toEqual([
      '5',
      'Q',
    ]);
  });

  it('only offers legal predictions on the current player\'s view', () => {
    const game = round1Match();
    const viewB = projectView(game, 'b');
    const viewA = projectView(game, 'a');
    expect(viewB.legalPredictions).toEqual([0, 1]);
    expect(viewA.legalPredictions).toBeNull();
  });

  it('hides the last bid that would close the round-2 total', () => {
    let game = round1Match();
    game = predictAll(game, { a: 0, b: 0, c: 0 });
    game = playCurrent(game);
    game = playCurrent(game);
    game = playCurrent(game);
    game = apply(game, {
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
    });

    expect(game.currentPlayerId).toBe('c');
    game = apply(game, { type: 'PREDICT', playerId: 'c', value: 0 });
    game = apply(game, { type: 'PREDICT', playerId: 'a', value: 1 });

    const last = projectView(game, 'b');
    const waiting = projectView(game, 'a');
    expect(last.legalPredictions).toEqual([0, 2]);
    expect(waiting.legalPredictions).toBeNull();
  });
});
