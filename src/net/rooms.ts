import { createHost, MatchHost } from '../host';

export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const ROOM_CODE_LENGTH = 4;

export interface Room {
  code: string;
  host: MatchHost;
}

export interface RoomRegistryOptions {
  defaultSeed?: number;
}

export function normalizeRoomCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

export function generateRoomCode(random: () => number = Math.random): string {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i += 1) {
    code += ROOM_CODE_ALPHABET[Math.floor(random() * ROOM_CODE_ALPHABET.length)];
  }
  return code;
}

export class RoomRegistry {
  private readonly rooms = new Map<string, Room>();
  private readonly defaultSeed: number | null;

  constructor(options: RoomRegistryOptions = {}) {
    this.defaultSeed = options.defaultSeed ?? null;
  }

  create(preferredCode?: string): Room {
    let code = preferredCode ? normalizeRoomCode(preferredCode) : generateRoomCode();
    let attempts = 0;
    while (this.rooms.has(code)) {
      attempts += 1;
      if (attempts > 50) {
        throw new Error('Could not allocate a room code');
      }
      code = generateRoomCode();
    }

    const host = createHost({
      roomId: code,
      seed: this.defaultSeed === null ? undefined : this.defaultSeed,
    });
    const room: Room = { code, host };
    this.rooms.set(code, room);
    return room;
  }

  get(code: string): Room | undefined {
    return this.rooms.get(normalizeRoomCode(code));
  }

  remove(code: string): void {
    this.rooms.delete(normalizeRoomCode(code));
  }

  dropIfVacant(code: string): void {
    const room = this.get(code);
    if (room && room.host.isVacant()) {
      this.remove(code);
    }
  }

  get size(): number {
    return this.rooms.size;
  }
}
