import { describe, expect, it } from 'vitest';
import { isLocalServerUrl } from './config';

describe('isLocalServerUrl', () => {
  it('treats loopback websocket addresses as local', () => {
    expect(isLocalServerUrl('ws://127.0.0.1:4737')).toBe(true);
    expect(isLocalServerUrl('ws://localhost:4737')).toBe(true);
    expect(isLocalServerUrl('wss://fodinha-wtdk.onrender.com')).toBe(false);
  });
});
