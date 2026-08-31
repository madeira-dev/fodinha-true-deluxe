import { isVisibleCard } from '../engine';
import type { Rank, ViewCard } from '../engine';
import { el } from './dom';
import { cardLabel, suitClass, SUIT_SYMBOL } from './format';

export type CardSize = 'sm' | 'md' | 'lg';

export interface CardOptions {
  size?: CardSize;
  interactive?: boolean;
  disabled?: boolean;
  manilha?: boolean;
  onPlay?: () => void;
}

export function playingCard(card: ViewCard, options: CardOptions = {}): HTMLElement {
  const size = options.size || 'md';
  const visible = isVisibleCard(card);
  const classes = [
    'playing-card',
    size,
    visible ? suitClass(card.suit) : 'back',
    options.manilha ? 'manilha' : '',
    options.interactive ? 'interactive' : '',
  ]
    .filter((item) => item)
    .join(' ');

  const attrs: Record<string, string | boolean | ((event: Event) => void)> = {
    class: classes,
    title: cardLabel(card),
    'aria-label': cardLabel(card),
  };

  if (options.interactive) {
    attrs.disabled = Boolean(options.disabled);
    if (options.onPlay && !options.disabled) {
      attrs.click = () => {
        if (options.onPlay) {
          options.onPlay();
        }
      };
    }
  }

  const node = options.interactive ? el('button', attrs) : el('div', attrs);

  if (!visible) {
    node.appendChild(el('span', { class: 'back-mark' }, '♦'));
    return node;
  }

  const rank = rankMark(card.rank);
  const suit = SUIT_SYMBOL[card.suit];
  node.appendChild(el('span', { class: 'corner nw' }, el('span', { class: 'rank' }, rank), el('span', null, suit)));
  node.appendChild(el('span', { class: 'pip' }, suit));
  node.appendChild(el('span', { class: 'corner se' }, el('span', { class: 'rank' }, rank), el('span', null, suit)));
  return node;
}

export function facedownStack(count: number, size: CardSize = 'sm'): HTMLElement {
  const stack = el('div', { class: 'card-stack' });
  const shown = Math.max(0, Math.min(count, 8));
  for (let i = 0; i < shown; i += 1) {
    stack.appendChild(
      playingCard(
        { id: `stack-${i}` },
        { size },
      ),
    );
  }
  if (count > shown) {
    stack.appendChild(el('span', { class: 'stack-count' }, `+${count - shown}`));
  }
  return stack;
}

function rankMark(rank: Rank): string {
  return rank;
}
