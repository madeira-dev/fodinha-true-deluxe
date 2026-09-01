import { applyAction, createMatch, MAX_PLAYERS, projectView } from '../engine';
import type { Game, GameView } from '../engine';
import type {
  AdvanceOptions,
  ClientMessage,
  ClientSnapshot,
  CreateHostOptions,
  HandleResult,
  HostError,
  HostListener,
  JoinOptions,
  LobbyPlayer,
  Seat,
  StartOptions,
} from './types';

function fail(code: HostError['code'], message: string): HandleResult {
  return { ok: false, error: { code, message } };
}

function ok(): HandleResult {
  return { ok: true };
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export class MatchHost {
  readonly roomId: string;

  private ownerId: string | null = null;
  private seats: Seat[] = [];
  private connected = new Set<string>();
  private listeners = new Map<string, Set<HostListener>>();
  private game: Game | null = null;
  private readonly defaultSeed: number | null;

  constructor(options: CreateHostOptions = {}) {
    this.roomId = options.roomId ?? generateId('room');
    this.defaultSeed = options.seed ?? null;
  }

  join(options: JoinOptions): { playerId: string } {
    const displayName = options.displayName.trim();
    if (!displayName) {
      throw new Error('Each player needs a display name');
    }
    if (this.game) {
      throw new Error('The match has already started');
    }
    if (this.seats.length >= MAX_PLAYERS) {
      throw new Error('The lobby is full');
    }

    const playerId = options.id ?? generateId('p');
    if (this.seats.some((seat) => seat.id === playerId)) {
      throw new Error(`Duplicate player id: ${playerId}`);
    }

    this.seats.push({ id: playerId, displayName });
    this.connected.add(playerId);
    if (!this.ownerId) {
      this.ownerId = playerId;
    }
    this.publish();
    return { playerId };
  }

  isVacant(): boolean {
    return this.seats.length === 0;
  }

  subscribe(playerId: string, listener: HostListener): () => void {
    if (!this.seats.some((seat) => seat.id === playerId)) {
      throw new Error(`Unknown player: ${playerId}`);
    }

    let bucket = this.listeners.get(playerId);
    if (!bucket) {
      bucket = new Set();
      this.listeners.set(playerId, bucket);
    }
    bucket.add(listener);
    listener({ type: 'SNAPSHOT', snapshot: this.snapshotFor(playerId) });

    return () => {
      const current = this.listeners.get(playerId);
      if (!current) {
        return;
      }
      current.delete(listener);
      if (current.size === 0) {
        this.listeners.delete(playerId);
      }
    };
  }

  handle(playerId: string, message: ClientMessage): HandleResult {
    if (!this.seats.some((seat) => seat.id === playerId)) {
      return fail('NOT_IN_ROOM', 'Player is not in this room');
    }

    switch (message.type) {
      case 'START':
        return this.start(playerId);
      case 'ADVANCE':
        return this.advance(playerId);
      case 'LEAVE':
        return this.leave(playerId);
      case 'PREDICT':
        return this.applyPlayerAction(playerId, {
          type: 'PREDICT',
          playerId,
          value: message.value,
        });
      case 'PLAY_CARD':
        return this.applyPlayerAction(playerId, {
          type: 'PLAY_CARD',
          playerId,
          cardId: message.cardId,
        });
      default: {
        const neverMessage: never = message;
        return this.reject(playerId, 'UNKNOWN_MESSAGE', `Unsupported message: ${JSON.stringify(neverMessage)}`);
      }
    }
  }

  start(playerId: string, options: StartOptions = {}): HandleResult {
    if (!this.seats.some((seat) => seat.id === playerId)) {
      return fail('NOT_IN_ROOM', 'Player is not in this room');
    }
    if (this.game) {
      return this.reject(playerId, 'GAME_ALREADY_STARTED', 'The match has already started');
    }
    if (this.ownerId !== playerId) {
      return this.reject(playerId, 'NOT_OWNER', 'Only the room owner can start the match');
    }
    if (this.seats.length < 2) {
      return this.reject(playerId, 'NOT_ENOUGH_PLAYERS', 'A match needs at least 2 players');
    }

    const seed = options.seed ?? this.defaultSeed;
    this.game = createMatch({
      players: this.seats.map((seat) => ({
        id: seat.id,
        displayName: seat.displayName,
      })),
      seed: seed === null ? undefined : seed,
      deck: options.deck,
    });
    this.publish();
    return ok();
  }

  advance(playerId: string, options: AdvanceOptions = {}): HandleResult {
    if (!this.seats.some((seat) => seat.id === playerId)) {
      return fail('NOT_IN_ROOM', 'Player is not in this room');
    }
    if (!this.game) {
      return this.reject(playerId, 'GAME_NOT_STARTED', 'The match has not started');
    }
    return this.commit(
      playerId,
      applyAction(this.game, { type: 'ADVANCE', deck: options.deck }),
    );
  }

  private leave(playerId: string): HandleResult {
    if (this.game) {
      this.connected.delete(playerId);
      this.publish();
      return ok();
    }

    this.seats = this.seats.filter((seat) => seat.id !== playerId);
    this.connected.delete(playerId);
    this.listeners.delete(playerId);
    if (this.ownerId === playerId) {
      this.ownerId = this.seats.length > 0 ? this.seats[0].id : null;
    }
    this.publish();
    return ok();
  }

  private applyPlayerAction(
    playerId: string,
    action: { type: 'PREDICT'; playerId: string; value: number } | { type: 'PLAY_CARD'; playerId: string; cardId: string },
  ): HandleResult {
    if (!this.game) {
      return this.reject(playerId, 'GAME_NOT_STARTED', 'The match has not started');
    }
    if (!this.connected.has(playerId)) {
      return this.reject(playerId, 'NOT_IN_ROOM', 'Player is disconnected');
    }
    return this.commit(playerId, applyAction(this.game, action));
  }

  private reject(playerId: string, code: HostError['code'], message: string): HandleResult {
    const error: HostError = { code, message };
    this.emit(playerId, { type: 'ERROR', error });
    return { ok: false, error };
  }

  private commit(
    playerId: string,
    result: { ok: true; state: Game } | { ok: false; error: { code: HostError['code']; message: string } },
  ): HandleResult {
    if (!result.ok) {
      return this.reject(playerId, result.error.code, result.error.message);
    }
    this.game = result.state;
    this.publish();
    return ok();
  }

  private emit(playerId: string, event: { type: 'ERROR'; error: HostError }): void {
    const bucket = this.listeners.get(playerId);
    if (!bucket) {
      return;
    }
    bucket.forEach((listener) => {
      listener(event);
    });
  }

  private publish(): void {
    this.listeners.forEach((bucket, playerId) => {
      if (!this.seats.some((seat) => seat.id === playerId)) {
        return;
      }
      const snapshot = this.snapshotFor(playerId);
      bucket.forEach((listener) => {
        listener({ type: 'SNAPSHOT', snapshot });
      });
    });
  }

  private snapshotFor(playerId: string): ClientSnapshot {
    if (!this.ownerId) {
      throw new Error('Cannot build a snapshot without an owner');
    }

    if (!this.game) {
      return {
        kind: 'lobby',
        roomId: this.roomId,
        ownerId: this.ownerId,
        youId: playerId,
        players: this.lobbyPlayers(),
      };
    }

    return {
      kind: 'in_game',
      roomId: this.roomId,
      ownerId: this.ownerId,
      youId: playerId,
      view: this.decorateView(projectView(this.game, playerId)),
    };
  }

  private lobbyPlayers(): LobbyPlayer[] {
    return this.seats.map((seat) => ({
      id: seat.id,
      displayName: seat.displayName,
      connected: this.connected.has(seat.id),
    }));
  }

  private decorateView(view: GameView): GameView {
    return {
      ...view,
      you: {
        ...view.you,
        connected: this.connected.has(view.you.id),
      },
      players: view.players.map((player) => ({
        ...player,
        connected: this.connected.has(player.id),
      })),
    };
  }
}

export function createHost(options: CreateHostOptions = {}): MatchHost {
  return new MatchHost(options);
}
