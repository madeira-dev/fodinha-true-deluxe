import type { ClientMessage, HostEvent } from '../host';
import {
  decodeJson,
  normalizeWsUrl,
  PROTOCOL_VERSION,
  type WireClientMessage,
  type WireError,
  type WireServerMessage,
} from './protocol';

export interface JoinResult {
  playerId: string;
  roomId: string;
  roomCode: string;
}

export class GameClient {
  readonly url: string;
  playerId: string | null = null;
  roomId: string | null = null;
  roomCode: string | null = null;

  private readonly socket: WebSocket;
  private readonly eventListeners = new Set<(event: HostEvent) => void>();
  private readonly rejectListeners = new Set<(error: WireError) => void>();
  private readonly closeListeners = new Set<() => void>();
  private pendingJoin:
    | { resolve: (value: JoinResult) => void; reject: (error: Error) => void }
    | null = null;
  private closed = false;

  private constructor(socket: WebSocket, url: string) {
    this.socket = socket;
    this.url = url;
    socket.addEventListener('message', (event) => {
      this.receive(String((event as MessageEvent).data));
    });
    socket.addEventListener('close', () => {
      this.closed = true;
      if (this.pendingJoin) {
        this.pendingJoin.reject(new Error('Disconnected before joining'));
        this.pendingJoin = null;
      }
      this.closeListeners.forEach((listener) => listener());
    });
  }

  static connect(url: string): Promise<GameClient> {
    const normalized = normalizeWsUrl(url);
    const socket = new WebSocket(normalized);

    return new Promise((resolve, reject) => {
      const onOpen = () => {
        cleanup();
        resolve(new GameClient(socket, normalized));
      };
      const onError = () => {
        cleanup();
        reject(new Error(`Could not connect to ${normalized}`));
      };
      const cleanup = () => {
        socket.removeEventListener('open', onOpen);
        socket.removeEventListener('error', onError);
      };
      socket.addEventListener('open', onOpen);
      socket.addEventListener('error', onError);
    });
  }

  create(displayName: string): Promise<JoinResult> {
    return this.begin({
      type: 'CREATE',
      displayName,
      protocol: PROTOCOL_VERSION,
    });
  }

  join(displayName: string, roomCode: string): Promise<JoinResult> {
    return this.begin({
      type: 'JOIN',
      displayName,
      roomCode,
      protocol: PROTOCOL_VERSION,
    });
  }

  private begin(message: WireClientMessage): Promise<JoinResult> {
    if (this.playerId && this.roomCode && this.roomId) {
      return Promise.resolve({
        playerId: this.playerId,
        roomId: this.roomId,
        roomCode: this.roomCode,
      });
    }

    return new Promise((resolve, reject) => {
      this.pendingJoin = { resolve, reject };
      this.sendRaw(message);
    });
  }

  send(message: ClientMessage): void {
    this.sendRaw({ type: 'COMMAND', message });
  }

  subscribe(listener: (event: HostEvent) => void): () => void {
    this.eventListeners.add(listener);
    return () => {
      this.eventListeners.delete(listener);
    };
  }

  onReject(listener: (error: WireError) => void): () => void {
    this.rejectListeners.add(listener);
    return () => {
      this.rejectListeners.delete(listener);
    };
  }

  onClose(listener: () => void): () => void {
    this.closeListeners.add(listener);
    return () => {
      this.closeListeners.delete(listener);
    };
  }

  close(): void {
    if (!this.closed) {
      this.socket.close();
    }
  }

  private sendRaw(message: WireClientMessage): void {
    this.socket.send(JSON.stringify(message));
  }

  private receive(raw: string): void {
    const parsed = decodeJson(raw);
    if (!parsed || typeof parsed !== 'object') {
      return;
    }

    const message = parsed as WireServerMessage;
    if (message.type === 'JOINED') {
      this.playerId = message.playerId;
      this.roomId = message.roomId;
      this.roomCode = message.roomCode;
      if (this.pendingJoin) {
        this.pendingJoin.resolve({
          playerId: message.playerId,
          roomId: message.roomId,
          roomCode: message.roomCode,
        });
        this.pendingJoin = null;
      }
      return;
    }

    if (message.type === 'REJECTED') {
      if (this.pendingJoin) {
        this.pendingJoin.reject(new Error(message.error.message));
        this.pendingJoin = null;
        return;
      }
      this.rejectListeners.forEach((listener) => listener(message.error));
      return;
    }

    if (message.type === 'EVENT') {
      this.eventListeners.forEach((listener) => listener(message.event));
    }
  }
}
