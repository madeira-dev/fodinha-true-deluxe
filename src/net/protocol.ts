import type { ClientMessage, HostError, HostEvent } from '../host';

export const PROTOCOL_VERSION = 1;
export const DEFAULT_PORT = 4737;

export type WireClientMessage =
  | { type: 'CREATE'; displayName: string; protocol: typeof PROTOCOL_VERSION }
  | { type: 'JOIN'; displayName: string; roomCode: string; protocol: typeof PROTOCOL_VERSION }
  | { type: 'COMMAND'; message: ClientMessage };

export type WireError = {
  code:
    | HostError['code']
    | 'PROTOCOL_ERROR'
    | 'NOT_JOINED'
    | 'ALREADY_JOINED'
    | 'ROOM_NOT_FOUND';
  message: string;
};

export type WireServerMessage =
  | { type: 'JOINED'; playerId: string; roomId: string; roomCode: string }
  | { type: 'EVENT'; event: HostEvent }
  | { type: 'REJECTED'; error: WireError };

export function normalizeWsUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('Address is required');
  }
  if (trimmed.startsWith('ws://') || trimmed.startsWith('wss://')) {
    return trimmed;
  }
  return `ws://${trimmed}`;
}

export function parseClientCommand(raw: unknown): ClientMessage | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const message = raw as { type?: unknown; value?: unknown; cardId?: unknown };
  if (message.type === 'START' || message.type === 'ADVANCE' || message.type === 'LEAVE') {
    return { type: message.type };
  }
  if (message.type === 'PREDICT' && typeof message.value === 'number') {
    return { type: 'PREDICT', value: message.value };
  }
  if (message.type === 'PLAY_CARD' && typeof message.cardId === 'string') {
    return { type: 'PLAY_CARD', cardId: message.cardId };
  }
  return null;
}

export function parseWireClientMessage(raw: unknown): WireClientMessage | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const message = raw as {
    type?: unknown;
    displayName?: unknown;
    roomCode?: unknown;
    protocol?: unknown;
    message?: unknown;
  };

  if (message.type === 'CREATE' || message.type === 'JOIN') {
    if (typeof message.displayName !== 'string') {
      return null;
    }
    if (message.protocol !== PROTOCOL_VERSION) {
      return null;
    }
    if (message.type === 'CREATE') {
      return {
        type: 'CREATE',
        displayName: message.displayName,
        protocol: PROTOCOL_VERSION,
      };
    }
    if (typeof message.roomCode !== 'string') {
      return null;
    }
    return {
      type: 'JOIN',
      displayName: message.displayName,
      roomCode: message.roomCode,
      protocol: PROTOCOL_VERSION,
    };
  }

  if (message.type === 'COMMAND') {
    const command = parseClientCommand(message.message);
    if (!command) {
      return null;
    }
    return { type: 'COMMAND', message: command };
  }

  return null;
}

export function decodeJson(raw: string): unknown | undefined {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}
