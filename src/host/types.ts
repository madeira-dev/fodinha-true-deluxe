import type { Card, EngineError, GameView } from '../engine';

export interface Seat {
  id: string;
  displayName: string;
}

export interface CreateHostOptions {
  roomId?: string;
  seed?: number;
}

export interface JoinOptions {
  displayName: string;
  id?: string;
}

export type ClientMessage =
  | { type: 'PREDICT'; value: number }
  | { type: 'PLAY_CARD'; cardId: string }
  | { type: 'START' }
  | { type: 'ADVANCE' }
  | { type: 'LEAVE' };

export interface HostError {
  code:
    | EngineError['code']
    | 'NOT_IN_ROOM'
    | 'LOBBY_FULL'
    | 'GAME_ALREADY_STARTED'
    | 'GAME_NOT_STARTED'
    | 'NOT_ENOUGH_PLAYERS'
    | 'NOT_OWNER'
    | 'INVALID_NAME'
    | 'DUPLICATE_PLAYER'
    | 'UNKNOWN_MESSAGE';
  message: string;
}

export type HandleResult =
  | { ok: true }
  | { ok: false; error: HostError };

export interface LobbyPlayer {
  id: string;
  displayName: string;
  connected: boolean;
}

export interface LobbySnapshot {
  kind: 'lobby';
  roomId: string;
  ownerId: string;
  youId: string;
  players: LobbyPlayer[];
}

export interface InGameSnapshot {
  kind: 'in_game';
  roomId: string;
  ownerId: string;
  youId: string;
  view: GameView;
}

export type ClientSnapshot = LobbySnapshot | InGameSnapshot;

export type HostEvent =
  | { type: 'SNAPSHOT'; snapshot: ClientSnapshot }
  | { type: 'ERROR'; error: HostError };

export type HostListener = (event: HostEvent) => void;

export interface StartOptions {
  seed?: number;
  deck?: Card[];
}

export interface AdvanceOptions {
  deck?: Card[];
}
