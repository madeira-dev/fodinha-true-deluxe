/** @vitest-environment happy-dom */

import { describe, expect, it } from 'vitest';
import type { GameView, PlayerView } from '../engine';
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
    currentPlayerId: 'a',
    roundNumber: 1,
    cardsPerPlayer: 1,
    direction: 1,
    phase: 'PREDICTION',
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

describe('renderGameTable', () => {
  it('hides the local first-round card and shows the opponent card', () => {
    const root = renderGameTable(view(), 'a', {}, {
      onPredict: () => undefined,
      onPlay: () => undefined,
      onAdvance: () => undefined,
    });

    const own = root.querySelector('.hand-fan .playing-card');
    const opponent = root.querySelector('.seat:not(.you) .playing-card');
    expect(own?.classList.contains('back')).toBe(true);
    expect(own?.querySelector('.rank')).toBeNull();
    expect(opponent?.classList.contains('back')).toBe(false);
    expect(opponent?.textContent).toContain('A');
    expect(opponent?.textContent).toContain('♠');
    expect(root.innerHTML).not.toContain('"deck"');
    expect(root.querySelectorAll('.bid-btn')).toHaveLength(2);
    expect(root.querySelector('.bid-rule')).toBeNull();
  });

  it('shows the last-player closing rule and disables the forbidden bid', () => {
    const you = player({
      id: 'a',
      displayName: 'Ana',
      hand: [
        { id: 'c1', rank: '7', suit: 'hearts' },
        { id: 'c2', rank: 'Q', suit: 'clubs' },
      ],
      handCount: 2,
    });
    const chosen: number[] = [];
    const root = renderGameTable(
      view({
        you,
        players: [you, player({ id: 'b', displayName: 'Beto', handCount: 2, prediction: 1 })],
        roundNumber: 2,
        cardsPerPlayer: 2,
        firstRoundSpecialVisibility: false,
        phase: 'PREDICTION',
        currentPlayerId: 'a',
        legalPredictions: [0, 2],
      }),
      'a',
      {},
      {
        onPredict: (value) => {
          chosen.push(value);
        },
        onPlay: () => undefined,
        onAdvance: () => undefined,
      },
    );

    const buttons = Array.from(root.querySelectorAll('.bid-btn')) as HTMLButtonElement[];
    expect(buttons.map((button) => button.textContent)).toEqual(['0', '1', '2']);
    expect(buttons[1].disabled).toBe(true);
    expect(root.querySelector('.bid-rule')?.textContent).toContain('1');
    buttons[1].click();
    buttons[0].click();
    expect(chosen).toEqual([0]);
  });

  it('does not reveal later-round opponent cards', () => {
    const you = player({
      id: 'a',
      displayName: 'Ana',
      hand: [
        { id: 'c1', rank: '7', suit: 'hearts' },
        { id: 'c2', rank: 'Q', suit: 'clubs' },
      ],
      handCount: 2,
    });
    const beto = player({
      id: 'b',
      displayName: 'Beto',
      hand: [],
      handCount: 2,
    });
    const root = renderGameTable(
      view({
        you,
        players: [you, beto],
        roundNumber: 2,
        cardsPerPlayer: 2,
        firstRoundSpecialVisibility: false,
        phase: 'PLAYING',
        currentPlayerId: 'a',
        playableCardIds: ['c1', 'c2'],
        legalPredictions: null,
      }),
      'a',
      {},
      {
        onPredict: () => undefined,
        onPlay: () => undefined,
        onAdvance: () => undefined,
      },
    );

    const opponentCards = Array.from(root.querySelectorAll('.seat:not(.you) .playing-card'));
    expect(opponentCards.length).toBeGreaterThan(0);
    opponentCards.forEach((card) => {
      expect(card.classList.contains('back')).toBe(true);
      expect(card.querySelector('.rank')).toBeNull();
    });
    expect(root.querySelector('.hand-fan .playing-card.red')?.textContent).toContain('7');
  });

  it('plays from the visible hand using the card id in the snapshot', () => {
    const you = player({
      id: 'a',
      displayName: 'Ana',
      hand: [{ id: 'c-play', rank: '3', suit: 'clubs' }],
      handCount: 1,
    });
    const played: string[] = [];
    const root = renderGameTable(
      view({
        you,
        players: [you, player({ id: 'b', displayName: 'Beto', handCount: 1 })],
        firstRoundSpecialVisibility: false,
        phase: 'PLAYING',
        playableCardIds: ['c-play'],
        legalPredictions: null,
      }),
      'a',
      {},
      {
        onPredict: () => undefined,
        onPlay: (cardId) => {
          played.push(cardId);
        },
        onAdvance: () => undefined,
      },
    );

    const button = root.querySelector('.hand-fan .playing-card') as HTMLButtonElement;
    button.click();
    expect(played).toEqual(['c-play']);
  });
});
