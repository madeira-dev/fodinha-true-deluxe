import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { PRODUCTION_SITE } from './site';

if (started) {
  app.quit();
}

function packagedSiteUrl(query?: Record<string, string>): string {
  const raw =
    typeof import.meta.env.VITE_PUBLIC_URL === 'string' && import.meta.env.VITE_PUBLIC_URL.trim()
      ? import.meta.env.VITE_PUBLIC_URL.trim()
      : PRODUCTION_SITE;
  const url = new URL(raw);
  if (query) {
    Object.keys(query).forEach((key) => {
      url.searchParams.set(key, query[key]);
    });
  }
  return url.toString();
}

function loadRenderer(window: BrowserWindow, query?: Record<string, string>): void {
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    const url = new URL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    if (query) {
      Object.keys(query).forEach((key) => {
        url.searchParams.set(key, query[key]);
      });
    }
    window.loadURL(url.toString());
    return;
  }

  if (app.isPackaged) {
    window.loadURL(packagedSiteUrl(query));
    return;
  }

  window.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`), {
    query,
  });
}

function createWindow(options: { query?: Record<string, string> } = {}): BrowserWindow {
  const window = new BrowserWindow({
    width: 1180,
    height: 860,
    minWidth: 900,
    minHeight: 680,
    title: 'Fodinha',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  loadRenderer(window, options.query);
  return window;
}

function openGuestWindow(_event: Electron.IpcMainInvokeEvent, roomCode?: string): void {
  createWindow({
    query: roomCode ? { room: roomCode } : undefined,
  });
}

ipcMain.handle('window:open-guest', openGuestWindow);

app.on('ready', () => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
