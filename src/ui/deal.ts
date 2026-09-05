import {
  dealSequence,
  dealStaggerMs,
  FLIGHT_MS,
  SHUFFLE_MS,
  VIRA_GAP_MS,
  type DealStep,
} from '../engine';
import type { GameView } from '../engine';
import { playingCard } from './card';

export {
  dealDurationMs,
  dealSequence,
  dealStaggerMs,
  FLIGHT_MS,
  SHUFFLE_MS,
  VIRA_GAP_MS,
  VIRA_MS,
} from '../engine';
export type { DealStep } from '../engine';

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function centerOf(node: Element, rootRect: DOMRect): { x: number; y: number } {
  const rect = node.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2 - rootRect.left,
    y: rect.top + rect.height / 2 - rootRect.top,
  };
}

function targetFor(root: HTMLElement, playerId: string): Element | null {
  return (
    root.querySelector(`[data-deal-target="${playerId}"]`) ||
    root.querySelector(`[data-player-id="${playerId}"]`)
  );
}

function later(delay: number, elapsed: number, fn: () => void): void {
  const wait = delay - elapsed;
  if (wait <= 0) {
    fn();
    return;
  }
  window.setTimeout(fn, wait);
}

function landCard(
  fly: HTMLElement,
  dest: { x: number; y: number },
  stackIndex: number,
): void {
  const offset = stackIndex * 7;
  fly.classList.remove('deal-fly');
  fly.classList.add('deal-landed');
  fly.style.left = `${dest.x + offset}px`;
  fly.style.top = `${dest.y + offset * 0.4}px`;
  fly.style.transform = 'translate(-50%, -50%)';
  fly.style.animation = 'none';
  fly.style.removeProperty('--deal-dx');
  fly.style.removeProperty('--deal-dy');
  fly.style.removeProperty('--deal-rot');
}

export function playDealAnimation(
  root: HTMLElement,
  view: GameView,
  elapsedMs = 0,
): void {
  root.querySelector('.deal-layer')?.remove();
  if (prefersReducedMotion()) {
    return;
  }

  const stage = root.querySelector('.table-stage');
  const originNode = root.querySelector('.deal-deck') || root.querySelector('.felt');
  if (!(stage instanceof HTMLElement) || !(originNode instanceof HTMLElement)) {
    return;
  }

  const layer = document.createElement('div');
  layer.className = 'deal-layer';
  layer.setAttribute('aria-hidden', 'true');
  stage.appendChild(layer);

  const origin = centerOf(originNode, stage.getBoundingClientRect());
  const steps = dealSequence(view);
  const cards = steps.filter((step): step is Extract<DealStep, { kind: 'card' }> => step.kind === 'card');
  const stagger = dealStaggerMs(cards.length);
  const landed: Record<string, number> = {};

  cards.forEach((step, index) => {
    const target = targetFor(root, step.playerId);
    if (!target) {
      return;
    }
    const startAt = SHUFFLE_MS + index * stagger;
    const shouldFly = elapsedMs < startAt + FLIGHT_MS;

    later(startAt, elapsedMs, () => {
      const dest = centerOf(target, stage.getBoundingClientRect());
      const stackIndex = landed[step.playerId] || 0;
      landed[step.playerId] = stackIndex + 1;
      const fly = playingCard({ id: `deal-${index}` }, { size: 'md' });
      const tilt = ((index * 17) % 21) - 10;
      fly.style.left = `${origin.x}px`;
      fly.style.top = `${origin.y}px`;
      layer.appendChild(fly);

      if (!shouldFly || elapsedMs >= startAt + FLIGHT_MS * 0.85) {
        landCard(fly, dest, stackIndex);
        return;
      }

      fly.classList.add('deal-fly');
      fly.style.setProperty('--deal-dx', `${dest.x + stackIndex * 7 - origin.x}px`);
      fly.style.setProperty('--deal-dy', `${dest.y + stackIndex * 3 - origin.y}px`);
      fly.style.setProperty('--deal-rot', `${tilt}deg`);
      window.setTimeout(() => {
        landCard(fly, dest, stackIndex);
      }, FLIGHT_MS);
    });
  });

  later(
    SHUFFLE_MS + cards.length * stagger + FLIGHT_MS + VIRA_GAP_MS,
    elapsedMs,
    () => {
      const vira = root.querySelector('.deal-vira');
      if (vira) {
        vira.classList.add('deal-vira-in');
      }
    },
  );
}
