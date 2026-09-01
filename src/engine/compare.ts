import { RANK_STRENGTH, SUIT_STRENGTH } from './deck';
import type { Rank, TrickPlay } from './types';

export interface TrickResult {
  winnerId: string | null;
  tied: boolean;
}

export function resolveTrick(plays: TrickPlay[], manilhaRank: Rank): TrickResult {
  if (plays.length === 0) {
    throw new Error('Cannot resolve an empty trick');
  }

  const manilhas = plays.filter((play) => play.card.rank === manilhaRank);
  if (manilhas.length === 1) {
    return { winnerId: manilhas[0].playerId, tied: false };
  }

  if (manilhas.length > 1) {
    let best = manilhas[0];
    for (let i = 1; i < manilhas.length; i += 1) {
      if (SUIT_STRENGTH[manilhas[i].card.suit] > SUIT_STRENGTH[best.card.suit]) {
        best = manilhas[i];
      }
    }
    return { winnerId: best.playerId, tied: false };
  }

  const countByRank: Partial<Record<Rank, number>> = {};
  for (let i = 0; i < plays.length; i += 1) {
    const rank = plays[i].card.rank;
    countByRank[rank] = (countByRank[rank] || 0) + 1;
  }

  // Matching non-manilha ranks amarram: the whole rank drops out.
  const remaining = plays.filter((play) => (countByRank[play.card.rank] || 0) === 1);
  if (remaining.length === 0) {
    return { winnerId: null, tied: true };
  }

  let best = remaining[0];
  for (let i = 1; i < remaining.length; i += 1) {
    if (RANK_STRENGTH[remaining[i].card.rank] > RANK_STRENGTH[best.card.rank]) {
      best = remaining[i];
    }
  }

  return { winnerId: best.playerId, tied: false };
}
