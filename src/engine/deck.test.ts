import { describe, expect, it } from 'vitest';
import {
  createDeck,
  makeCard,
  manilhaRankAfter,
  maxCardsPerPlayer,
  nextRoundDeal,
  pullToFront,
  RANKS,
  SUITS,
} from './deck';

describe('createDeck', () => {
  it('builds a 40-card deck without 8, 9, 10, or jokers', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(40);

    const keys = deck.map((card) => `${card.rank}:${card.suit}`);
    expect(new Set(keys).size).toBe(40);

    for (const rank of RANKS) {
      for (const suit of SUITS) {
        expect(keys).toContain(`${rank}:${suit}`);
      }
    }

    expect(keys.some((key) => key.startsWith('8:') || key.startsWith('9:') || key.startsWith('10:'))).toBe(
      false,
    );
  });
});

describe('manilhaRankAfter', () => {
  it('follows the circular rank sequence', () => {
    expect(manilhaRankAfter('4')).toBe('5');
    expect(manilhaRankAfter('7')).toBe('Q');
    expect(manilhaRankAfter('Q')).toBe('J');
    expect(manilhaRankAfter('A')).toBe('2');
    expect(manilhaRankAfter('2')).toBe('3');
    expect(manilhaRankAfter('3')).toBe('4');
  });
});

describe('maxCardsPerPlayer', () => {
  it('leaves one card for the vira', () => {
    expect(maxCardsPerPlayer(2)).toBe(19);
    expect(maxCardsPerPlayer(4)).toBe(9);
    expect(maxCardsPerPlayer(5)).toBe(7);
    expect(maxCardsPerPlayer(39)).toBe(1);
  });
});

describe('nextRoundDeal', () => {
  it('increases from 1 until the legal maximum, then decreases back to 1', () => {
    let cards = 1;
    let direction: 1 | -1 = 1;
    const seen: number[] = [1];

    for (let i = 0; i < 18; i += 1) {
      const next = nextRoundDeal(cards, direction, 4);
      cards = next.cardsPerPlayer;
      direction = next.direction;
      seen.push(cards);
    }

    expect(seen).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 8, 7, 6, 5, 4, 3, 2, 1, 2, 3]);
  });

  it('stays at 1 when the table cannot deal more than one card', () => {
    expect(nextRoundDeal(1, 1, 39)).toEqual({ cardsPerPlayer: 1, direction: 1 });
  });

  it('recomputes the turnaround from the current active-player maximum', () => {
    expect(nextRoundDeal(6, 1, 4)).toEqual({ cardsPerPlayer: 7, direction: 1 });
    expect(nextRoundDeal(9, 1, 4)).toEqual({ cardsPerPlayer: 8, direction: -1 });
    expect(nextRoundDeal(9, 1, 3)).toEqual({ cardsPerPlayer: 10, direction: 1 });
  });
});

describe('pullToFront', () => {
  it('moves selected cards to the front without losing the rest', () => {
    const deck = pullToFront(createDeck(), [
      makeCard('A', 'spades'),
      makeCard('3', 'clubs'),
    ]);
    expect(deck[0]).toMatchObject({ rank: 'A', suit: 'spades' });
    expect(deck[1]).toMatchObject({ rank: '3', suit: 'clubs' });
    expect(deck).toHaveLength(40);
  });
});
