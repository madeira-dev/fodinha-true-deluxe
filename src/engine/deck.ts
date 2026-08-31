import type { Card, PlayDirection, Rank, Suit } from './types';

export const RANKS: Rank[] = ['4', '5', '6', '7', 'Q', 'J', 'K', 'A', '2', '3'];

export const SUITS: Suit[] = ['diamonds', 'spades', 'hearts', 'clubs'];

export const RANK_STRENGTH: Record<Rank, number> = {
  '4': 0,
  '5': 1,
  '6': 2,
  '7': 3,
  Q: 4,
  J: 5,
  K: 6,
  A: 7,
  '2': 8,
  '3': 9,
};

export const SUIT_STRENGTH: Record<Suit, number> = {
  diamonds: 0,
  spades: 1,
  hearts: 2,
  clubs: 3,
};

export function makeCard(rank: Rank, suit: Suit, id = ''): Card {
  return { id, rank, suit };
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (let r = 0; r < RANKS.length; r += 1) {
    for (let s = 0; s < SUITS.length; s += 1) {
      deck.push(makeCard(RANKS[r], SUITS[s]));
    }
  }
  return deck;
}

export function manilhaRankAfter(viraRank: Rank): Rank {
  const index = RANKS.indexOf(viraRank);
  return RANKS[(index + 1) % RANKS.length];
}

export function maxCardsPerPlayer(activeCount: number): number {
  if (activeCount < 1) {
    return 0;
  }
  return Math.floor((40 - 1) / activeCount);
}

export function nextRoundDeal(
  cardsPerPlayer: number,
  direction: PlayDirection,
  activeCount: number,
): { cardsPerPlayer: number; direction: PlayDirection } {
  const max = maxCardsPerPlayer(activeCount);
  if (max <= 1) {
    return { cardsPerPlayer: 1, direction: 1 };
  }

  if (cardsPerPlayer > max) {
    return { cardsPerPlayer: max, direction: -1 };
  }

  let dir: PlayDirection = direction;
  let cards = cardsPerPlayer + dir;

  if (cards > max) {
    dir = -1;
    cards = max - 1;
  } else if (cards < 1) {
    dir = 1;
    cards = 2;
  }

  if (cards < 1) {
    cards = 1;
  }

  return { cardsPerPlayer: cards, direction: dir };
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

export function pullToFront(deck: Card[], ordered: Array<Pick<Card, 'rank' | 'suit'>>): Card[] {
  const remaining = deck.slice();
  const front: Card[] = [];

  for (let i = 0; i < ordered.length; i += 1) {
    const wanted = ordered[i];
    const index = remaining.findIndex(
      (card) => card.rank === wanted.rank && card.suit === wanted.suit,
    );
    if (index === -1) {
      throw new Error(`Card not in deck: ${wanted.rank} of ${wanted.suit}`);
    }
    front.push(remaining.splice(index, 1)[0]);
  }

  return front.concat(remaining);
}
