export const PENALTY_WORD = 'FODINHA';
export const MAX_PENALTY = 7;

export function penaltyWord(count: number): string {
  const clamped = Math.max(0, Math.min(MAX_PENALTY, count));
  return PENALTY_WORD.slice(0, clamped);
}

export function applyRoundPenalty(
  current: number,
  predicted: number,
  tricksWon: number,
  letterStake = 1,
): number {
  const stake = letterStake < 1 ? 1 : letterStake;
  return Math.min(MAX_PENALTY, current + Math.abs(predicted - tricksWon) * stake);
}
