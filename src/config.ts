import { DEFAULT_PORT } from './net/protocol';

export function serverWsUrl(): string {
  const fromEnv = readEnv('VITE_SERVER_URL');
  if (fromEnv) {
    return fromEnv;
  }
  if (typeof location !== 'undefined' && location.protocol !== 'file:') {
    const scheme = location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${scheme}//${location.host}`;
  }
  return `ws://127.0.0.1:${DEFAULT_PORT}`;
}

export function publicSiteUrl(): string | null {
  const fromEnv = readEnv('VITE_PUBLIC_URL');
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }
  if (typeof location !== 'undefined' && location.protocol.indexOf('http') === 0) {
    return location.origin;
  }
  return null;
}

export function downloadLinks(): { mac?: string; win?: string; linux?: string } {
  return {
    mac: readEnv('VITE_DOWNLOAD_MAC'),
    win: readEnv('VITE_DOWNLOAD_WIN'),
    linux: readEnv('VITE_DOWNLOAD_LINUX'),
  };
}

export function inviteUrl(roomCode: string): string | null {
  const site = publicSiteUrl();
  if (!site) {
    return null;
  }
  return `${site}/?room=${encodeURIComponent(roomCode)}`;
}

function readEnv(name: string): string | undefined {
  const meta = import.meta as { env?: Record<string, string | undefined> };
  const value = meta.env ? meta.env[name] : undefined;
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return undefined;
}
