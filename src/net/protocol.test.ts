import { describe, expect, it } from 'vitest';
import {
  normalizeWsUrl,
  parseClientCommand,
  parseWireClientMessage,
  PROTOCOL_VERSION,
} from './protocol';

describe('normalizeWsUrl', () => {
  it('adds the ws scheme when missing', () => {
    expect(normalizeWsUrl('127.0.0.1:4737')).toBe('ws://127.0.0.1:4737');
    expect(normalizeWsUrl('ws://192.168.0.10:4737')).toBe('ws://192.168.0.10:4737');
  });
});

describe('parseClientCommand', () => {
  it('accepts only the allowed player commands and strips extra fields', () => {
    expect(parseClientCommand({ type: 'START', deck: ['nope'] })).toEqual({ type: 'START' });
    expect(parseClientCommand({ type: 'ADVANCE', deck: [{ rank: 'A', suit: 'clubs' }] })).toEqual({
      type: 'ADVANCE',
    });
    expect(parseClientCommand({ type: 'PREDICT', value: 2, playerId: 'someone-else' })).toEqual({
      type: 'PREDICT',
      value: 2,
    });
    expect(parseClientCommand({ type: 'PLAY_CARD', cardId: 'c1' })).toEqual({
      type: 'PLAY_CARD',
      cardId: 'c1',
    });
    expect(parseClientCommand({ type: 'PREDICT', value: '1' })).toBeNull();
    expect(parseClientCommand({ type: 'CHEAT' })).toBeNull();
  });
});

describe('parseWireClientMessage', () => {
  it('requires the current protocol version on join', () => {
    expect(
      parseWireClientMessage({
        type: 'CREATE',
        displayName: 'Ana',
        protocol: PROTOCOL_VERSION,
      }),
    ).toEqual({
      type: 'CREATE',
      displayName: 'Ana',
      protocol: PROTOCOL_VERSION,
    });
    expect(
      parseWireClientMessage({
        type: 'JOIN',
        displayName: 'Beto',
        roomCode: 'AB3K',
        protocol: PROTOCOL_VERSION,
      }),
    ).toEqual({
      type: 'JOIN',
      displayName: 'Beto',
      roomCode: 'AB3K',
      protocol: PROTOCOL_VERSION,
    });
    expect(
      parseWireClientMessage({ type: 'JOIN', displayName: 'Ana', protocol: PROTOCOL_VERSION }),
    ).toBeNull();
    expect(
      parseWireClientMessage({ type: 'JOIN', displayName: 'Ana', roomCode: 'AB3K', protocol: 99 }),
    ).toBeNull();
  });
});
