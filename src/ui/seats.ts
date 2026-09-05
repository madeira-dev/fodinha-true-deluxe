import type { PlayerView } from '../engine';

export type SeatRegion = 'bottom' | 'top' | 'left' | 'right';

export interface SeatSlot {
  offset: number;
  x: number;
  y: number;
  innerX: number;
  innerY: number;
  region: SeatRegion;
}

export interface OccupiedSeat<T> {
  occupant: T;
  slot: SeatSlot;
  isYou: boolean;
}

export function regionOf(x: number, y: number): SeatRegion {
  if (y >= 68) {
    return 'bottom';
  }
  if (y <= 32) {
    return 'top';
  }
  return x < 50 ? 'left' : 'right';
}

export function seatSlots(count: number): SeatSlot[] {
  if (count < 1) {
    return [];
  }

  const slots: SeatSlot[] = [];
  for (let i = 0; i < count; i += 1) {
    const theta = (i / count) * Math.PI * 2;
    const x = 50 + -Math.sin(theta) * 46;
    const y = 50 + Math.cos(theta) * 38;
    const innerX = 50 + -Math.sin(theta) * 18;
    const innerY = 50 + Math.cos(theta) * 16;
    slots.push({
      offset: i,
      x,
      y,
      innerX,
      innerY,
      region: regionOf(x, y),
    });
  }
  return slots;
}

export function playersFromYou<T extends { id: string }>(players: T[], youId: string): T[] {
  const start = players.findIndex((player) => player.id === youId);
  if (start === -1) {
    return players.slice();
  }

  const ordered: T[] = [];
  for (let i = 0; i < players.length; i += 1) {
    ordered.push(players[(start + i) % players.length]);
  }
  return ordered;
}

export function occupySeats<T extends { id: string }>(
  players: T[],
  youId: string,
): Array<OccupiedSeat<T>> {
  const ordered = playersFromYou(players, youId);
  const slots = seatSlots(ordered.length);
  return ordered.map((occupant, index) => ({
    occupant,
    slot: slots[index],
    isYou: occupant.id === youId,
  }));
}

export function seatForPlayer(
  seats: Array<OccupiedSeat<PlayerView>>,
  playerId: string,
): OccupiedSeat<PlayerView> | undefined {
  return seats.find((seat) => seat.occupant.id === playerId);
}
