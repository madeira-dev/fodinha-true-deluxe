/** @vitest-environment happy-dom */

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GameView, PlayerView } from '../engine';
import { dealDurationMs, dealSequence, dealStaggerMs } from '../engine';
import { FLIGHT_MS, playDealAnimation, SHUFFLE_MS } from './deal';
import { renderGameTable } from './table';

function player(partial: Partial<PlayerView> & Pick<PlayerView, 'id' | 'displayName'>): PlayerView {
  return {
    hand: [],
    handCount: 0,
    prediction: null,
    tricksWon: 0,
    penaltyCount: 0,
    penaltyWord: '',
    eliminated: false,
    connected: true,
    ...partial,
  };
}

function view(overrides: Partial<GameView> = {}): GameView {
  const you = player({
    id: 'a',
    displayName: 'Ana',
    hand: [{ id: 'c-ana' }],
    handCount: 1,
  });
  const beto = player({
    id: 'b',
    displayName: 'Beto',
    hand: [{ id: 'c-beto', rank: 'A', suit: 'spades' }],
    handCount: 1,
  });
  return {
    id: 'game-1',
    you,
    players: [you, beto],
    dealerId: 'a',
    currentPlayerId: null,
    roundNumber: 1,
    cardsPerPlayer: 1,
    direction: 1,
    phase: 'DEALING',
    vira: { id: 'c-vira', rank: '4', suit: 'clubs' },
    manilhaRank: '5',
    currentTrick: { leaderId: 'b', plays: [], winnerId: null, tied: false },
    completedTricks: [],
    firstRoundSpecialVisibility: true,
    winnerId: null,
    tied: false,
    letterStake: 1,
    legalPredictions: [0, 1],
    playableCardIds: [],
    ...overrides,
  };
}

describe('dealSequence', () => {
  it('deals after the dealer, then reveals the vira', () => {
    expect(dealSequence(view())).toEqual([
      { kind: 'card', playerId: 'b' },
      { kind: 'card', playerId: 'a' },
      { kind: 'vira' },
    ]);
  });

  it('walks the table once per card and skips eliminated players', () => {
    const ana = player({ id: 'a', displayName: 'Ana', handCount: 2 });
    const beto = player({ id: 'b', displayName: 'Beto', handCount: 2, eliminated: true });
    const carla = player({ id: 'c', displayName: 'Carla', handCount: 2 });
    const game = view({
      you: ana,
      players: [ana, beto, carla],
      dealerId: 'a',
      cardsPerPlayer: 2,
    });

    expect(dealSequence(game)).toEqual([
      { kind: 'card', playerId: 'c' },
      { kind: 'card', playerId: 'a' },
      { kind: 'card', playerId: 'c' },
      { kind: 'card', playerId: 'a' },
      { kind: 'vira' },
    ]);
  });

  it('speeds up the stagger when many cards are dealt', () => {
    expect(dealStaggerMs(20)).toBeLessThan(dealStaggerMs(4));
    expect(dealDurationMs(view({ cardsPerPlayer: 4 }))).toBeGreaterThan(
      dealDurationMs(view({ cardsPerPlayer: 1 })),
    );
  });
});

describe('playDealAnimation', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('flies a card to every seat and leaves the piles on the table', () => {
    vi.useFakeTimers();
    const game = view();
    const root = document.createElement('div');
    root.appendChild(
      renderGameTable(game, 'a', {}, {
        onPredict: () => undefined,
        onPlay: () => undefined,
        onAdvance: () => undefined,
      }, { dealing: true }),
    );

    expect(root.querySelector('[data-deal-target="a"]')).not.toBeNull();
    expect(root.querySelector('[data-deal-target="b"]')).not.toBeNull();

    playDealAnimation(root, game);
    expect(root.querySelector('.deal-layer')).not.toBeNull();
    expect(root.querySelectorAll('.deal-fly')).toHaveLength(0);

    vi.advanceTimersByTime(SHUFFLE_MS);
    expect(root.querySelectorAll('.deal-fly')).toHaveLength(1);

    vi.advanceTimersByTime(dealStaggerMs(2));
    expect(root.querySelectorAll('.deal-fly')).toHaveLength(2);

    vi.advanceTimersByTime(FLIGHT_MS + 50);
    expect(root.querySelectorAll('.deal-fly')).toHaveLength(0);
    expect(root.querySelectorAll('.deal-landed')).toHaveLength(2);
    expect(root.querySelector('.deal-vira')?.classList.contains('deal-vira-in')).toBe(false);

    vi.advanceTimersByTime(dealDurationMs(game));
    expect(root.querySelector('.deal-vira')?.classList.contains('deal-vira-in')).toBe(true);
  });
});
