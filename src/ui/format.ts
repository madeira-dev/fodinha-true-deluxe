import { isVisibleCard } from '../engine';
import type { Phase, Suit, ViewCard, VisibleCard } from '../engine';

export const SUIT_SYMBOL: Record<Suit, string> = {
  diamonds: '♦',
  spades: '♠',
  hearts: '♥',
  clubs: '♣',
};

export const SUIT_NAME: Record<Suit, string> = {
  diamonds: 'diamonds',
  spades: 'spades',
  hearts: 'hearts',
  clubs: 'clubs',
};

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
    return 'Face-down card';
  }
  return `${card.rank} of ${SUIT_NAME[card.suit]}`;
}

export function phaseLabel(phase: Phase): string {
  if (phase === 'PREDICTION') {
    return 'Bidding';
  }
  if (phase === 'PLAYING') {
    return 'Playing';
  }
  if (phase === 'SCORING') {
    return 'Round over';
  }
  if (phase === 'FINISHED') {
    return 'Match over';
  }
  return 'Dealing';
}

export function queryRoomCode(): string {
  const params = new URLSearchParams(window.location.search);
  return (params.get('room') || params.get('join') || '').trim().toUpperCase();
}
