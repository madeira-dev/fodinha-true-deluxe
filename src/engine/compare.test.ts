import { describe, expect, it } from 'vitest';
import { resolveTrick } from './compare';
import { makeCard } from './deck';
import type { TrickPlay } from './types';

function play(playerId: string, rank: Parameters<typeof makeCard>[0], suit: Parameters<typeof makeCard>[1]): TrickPlay {
  return { playerId, card: makeCard(rank, suit, `${playerId}-${rank}-${suit}`) };
}

describe('resolveTrick', () => {
  it('lets any manilha beat any non-manilha', () => {
    expect(
      resolveTrick([play('a', '3', 'clubs'), play('b', '5', 'diamonds')], '5'),
    ).toEqual({ winnerId: 'b', tied: false });
  });

  it('ranks manilhas by suit: diamonds < spades < hearts < clubs', () => {
    expect(
      resolveTrick(
        [
          play('a', '5', 'diamonds'),
          play('b', '5', 'spades'),
          play('c', '5', 'hearts'),
          play('d', '5', 'clubs'),
        ],
        '5',
      ),
    ).toEqual({ winnerId: 'd', tied: false });

    expect(
      resolveTrick([play('a', '5', 'spades'), play('b', '5', 'hearts')], '5'),
    ).toEqual({ winnerId: 'b', tied: false });
  });

  it('makes the clubs manilha unbeatable in the round', () => {
    expect(
      resolveTrick(
        [play('a', '5', 'clubs'), play('b', '3', 'clubs'), play('c', '5', 'hearts')],
        '5',
      ),
    ).toEqual({ winnerId: 'a', tied: false });
  });

  it('compares non-manilha cards by rank only', () => {
    expect(
      resolveTrick([play('a', 'K', 'diamonds'), play('b', 'A', 'clubs')], '5'),
    ).toEqual({ winnerId: 'b', tied: false });
  });

  it('ties when two non-manilha cards share the highest rank', () => {
    expect(
      resolveTrick(
        [play('a', 'A', 'diamonds'), play('b', 'A', 'clubs'), play('c', 'K', 'hearts')],
        '5',
      ),
    ).toEqual({ winnerId: null, tied: true });
  });

  it('does not use suit to break a non-manilha tie', () => {
    expect(
      resolveTrick([play('a', '2', 'clubs'), play('b', '2', 'diamonds')], '5'),
    ).toEqual({ winnerId: null, tied: true });
  });

  it('wraps manilha from 3 to 4', () => {
    expect(
      resolveTrick([play('a', '3', 'clubs'), play('b', '4', 'diamonds')], '4'),
    ).toEqual({ winnerId: 'b', tied: false });
  });
});
