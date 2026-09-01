import { describe, expect, it } from 'vitest';
import { applyRoundPenalty, penaltyWord } from './scoring';

describe('penaltyWord', () => {
  it('spells FODINHA one letter at a time', () => {
    expect(penaltyWord(0)).toBe('');
    expect(penaltyWord(1)).toBe('F');
    expect(penaltyWord(2)).toBe('FO');
    expect(penaltyWord(3)).toBe('FOD');
    expect(penaltyWord(4)).toBe('FODI');
    expect(penaltyWord(5)).toBe('FODIN');
    expect(penaltyWord(6)).toBe('FODINH');
    expect(penaltyWord(7)).toBe('FODINHA');
  });
});

describe('applyRoundPenalty', () => {
  it('adds the absolute difference between prediction and tricks won', () => {
    expect(applyRoundPenalty(0, 2, 2)).toBe(0);
    expect(applyRoundPenalty(2, 1, 3)).toBe(4);
    expect(applyRoundPenalty(4, 3, 1)).toBe(6);
  });

  it('never exceeds 7 letters', () => {
    expect(applyRoundPenalty(6, 2, 0)).toBe(7);
    expect(applyRoundPenalty(5, 0, 4)).toBe(7);
  });

  it('multiplies a miss by the letter stake from tied rounds', () => {
    expect(applyRoundPenalty(0, 1, 0, 2)).toBe(2);
    expect(applyRoundPenalty(1, 2, 0, 3)).toBe(7);
  });
});
