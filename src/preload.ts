import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('fodinha', {
  openGuestWindow: (roomCode?: string) => ipcRenderer.invoke('window:open-guest', roomCode),
});
