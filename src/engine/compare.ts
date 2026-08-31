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

  let bestRank = plays[0].card.rank;
  let bestStrength = RANK_STRENGTH[bestRank];
  for (let i = 1; i < plays.length; i += 1) {
    const strength = RANK_STRENGTH[plays[i].card.rank];
    if (strength > bestStrength) {
      bestRank = plays[i].card.rank;
      bestStrength = strength;
    }
  }

  const top = plays.filter((play) => play.card.rank === bestRank);
  if (top.length > 1) {
    return { winnerId: null, tied: true };
  }

  return { winnerId: top[0].playerId, tied: false };
}
