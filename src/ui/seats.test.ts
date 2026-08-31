import { describe, expect, it } from 'vitest';
import { occupySeats, regionOf, seatSlots } from './seats';

describe('seatSlots', () => {
  it('puts the local player at the bottom and the next player to the left', () => {
    const two = seatSlots(2);
    expect(two[0].region).toBe('bottom');
    expect(two[1].region).toBe('top');

    const four = seatSlots(4);
    expect(four[0].region).toBe('bottom');
    expect(four[1].region).toBe('left');
    expect(four[2].region).toBe('top');
    expect(four[3].region).toBe('right');
  });

  it('keeps you as offset 0 after rotating the roster', () => {
    const seats = occupySeats(
      [
        { id: 'a', displayName: 'Ana' },
        { id: 'b', displayName: 'Beto' },
        { id: 'c', displayName: 'Carla' },
      ],
      'b',
    );
    expect(seats.map((seat) => seat.occupant.id)).toEqual(['b', 'c', 'a']);
    expect(seats[0].isYou).toBe(true);
    expect(seats[0].slot.region).toBe('bottom');
  });
});

describe('regionOf', () => {
  it('classifies the oval into four table sides', () => {
    expect(regionOf(50, 90)).toBe('bottom');
    expect(regionOf(50, 10)).toBe('top');
    expect(regionOf(10, 50)).toBe('left');
    expect(regionOf(90, 50)).toBe('right');
  });
});
