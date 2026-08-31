export interface FodinhaDesktop {
  openGuestWindow: (roomCode?: string) => Promise<void>;
}

declare global {
  interface Window {
    fodinha?: FodinhaDesktop;
  }
}

export {};
