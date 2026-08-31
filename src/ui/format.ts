import { isVisibleCard } from '../engine';
import type { Phase, Suit, ViewCard, VisibleCard } from '../engine';
import { t } from '../i18n';

export const SUIT_SYMBOL: Record<Suit, string> = {
  diamonds: '♦',
  spades: '♠',
  hearts: '♥',
  clubs: '♣',
};

export function suitName(suit: Suit): string {
  if (suit === 'diamonds') {
    return t('suitDiamonds');
  }
  if (suit === 'spades') {
    return t('suitSpades');
  }
  if (suit === 'hearts') {
    return t('suitHearts');
  }
  return t('suitClubs');
}

export function suitClass(suit: Suit): string {
  return suit === 'diamonds' || suit === 'hearts' ? 'red' : 'black';
}

export function formatVisibleCard(card: VisibleCard): string {
  return `${card.rank}${SUIT_SYMBOL[card.suit]}`;
}

export function formatViewCard(card: ViewCard): string {
  if (!isVisibleCard(card)) {
    return '🂠';
  }
  return formatVisibleCard(card);
}

export function cardLabel(card: ViewCard): string {
  if (!isVisibleCard(card)) {
    return t('faceDownCard');
  }
  return t('cardOf', { rank: card.rank, suit: suitName(card.suit) });
}

export function phaseLabel(phase: Phase): string {
  if (phase === 'PREDICTION') {
    return t('phasePrediction');
  }
  if (phase === 'PLAYING') {
    return t('phasePlaying');
  }
  if (phase === 'SCORING') {
    return t('phaseScoring');
  }
  if (phase === 'FINISHED') {
    return t('phaseFinished');
  }
  return t('phaseDealing');
}

export function queryRoomCode(): string {
  const params = new URLSearchParams(window.location.search);
  return (params.get('room') || params.get('join') || '').trim().toUpperCase();
}
