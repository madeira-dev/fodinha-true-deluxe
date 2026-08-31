import { describe, expect, it } from 'vitest';
import { generateRoomCode, normalizeRoomCode, RoomRegistry } from './rooms';

describe('room codes', () => {
  it('normalizes spacing and case', () => {
    expect(normalizeRoomCode(' ab-3k ')).toBe('AB3K');
  });

  it('uses an unambiguous alphabet', () => {
    const code = generateRoomCode(() => 0);
    expect(code).toHaveLength(4);
    expect(code).toBe('AAAA');
  });
});

describe('RoomRegistry', () => {
  it('creates isolated tables', () => {
    const registry = new RoomRegistry();
    const first = registry.create();
    const second = registry.create();
    expect(first.code).not.toBe(second.code);
    expect(registry.get(first.code)?.host).toBe(first.host);
    expect(registry.size).toBe(2);
  });
});
