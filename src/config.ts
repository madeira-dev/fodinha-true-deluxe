import { PRODUCTION_SITE, PRODUCTION_WS } from './site';

export function serverWsUrl(): string {
  const fromEnv = import.meta.env.VITE_SERVER_URL;
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.trim();
  }
  if (typeof location !== 'undefined' && location.protocol !== 'file:') {
    const scheme = location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${scheme}//${location.host}`;
  }
  return PRODUCTION_WS;
}

export function isLocalServerUrl(url: string): boolean {
  try {
    const parsed = new URL(url.includes('://') ? url : `ws://${url}`);
    return (
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === '::1'
    );
  } catch {
    return false;
  }
}

export function publicSiteUrl(): string | null {
  const fromEnv = import.meta.env.VITE_PUBLIC_URL;
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.trim().replace(/\/$/, '');
  }
  if (typeof location !== 'undefined' && location.protocol.indexOf('http') === 0) {
    return location.origin;
  }
  return PRODUCTION_SITE;
}

const GITHUB_LATEST =
  'https://github.com/madeira-dev/fodinha-true-deluxe/releases/latest/download';

export function downloadLinks(): { mac: string; win: string; linux: string } {
  return {
    mac: envString('VITE_DOWNLOAD_MAC') || `${GITHUB_LATEST}/Fodinha-mac.zip`,
    win: envString('VITE_DOWNLOAD_WIN') || `${GITHUB_LATEST}/Fodinha-windows.zip`,
    linux: envString('VITE_DOWNLOAD_LINUX') || `${GITHUB_LATEST}/Fodinha-linux.zip`,
  };
}

export function inviteUrl(roomCode: string): string | null {
  const site = publicSiteUrl();
  if (!site) {
    return null;
  }
  return `${site}/?room=${encodeURIComponent(roomCode)}`;
}

function envString(name: 'VITE_DOWNLOAD_MAC' | 'VITE_DOWNLOAD_WIN' | 'VITE_DOWNLOAD_LINUX'): string | undefined {
  const value = import.meta.env[name];
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return undefined;
}
