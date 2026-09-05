import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { WebSocket, WebSocketServer } from 'ws';
import { lanAddresses } from './addresses';
import {
  decodeJson,
  DEFAULT_PORT,
  parseWireClientMessage,
  type WireError,
  type WireServerMessage,
} from './protocol';
import { RoomRegistry } from './rooms';

export interface GameServerOptions {
  port?: number;
  defaultSeed?: number;
  staticDir?: string;
  skipDealAnimation?: boolean;
}

export interface GameServer {
  port: number;
  addresses: string[];
  rooms: RoomRegistry;
  close: () => Promise<void>;
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

function send(socket: WebSocket, message: WireServerMessage): void {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

function rejected(code: WireError['code'], message: string): WireServerMessage {
  return { type: 'REJECTED', error: { code, message } };
}

function mapJoinError(error: unknown): WireError {
  const message = error instanceof Error ? error.message : 'Join failed';
  if (message.indexOf('display name') !== -1) {
    return { code: 'INVALID_NAME', message };
  }
  if (message.indexOf('already started') !== -1) {
    return { code: 'GAME_ALREADY_STARTED', message };
  }
  if (message.indexOf('full') !== -1) {
    return { code: 'LOBBY_FULL', message };
  }
  if (message.indexOf('Duplicate') !== -1) {
    return { code: 'DUPLICATE_PLAYER', message };
  }
  return { code: 'PROTOCOL_ERROR', message };
}

function bindSocket(socket: WebSocket, rooms: RoomRegistry): void {
  let playerId: string | null = null;
  let roomCode: string | null = null;
  let unsubscribe: (() => void) | null = null;

  const sitDown = (code: string, displayName: string) => {
    const room = rooms.get(code);
    if (!room) {
      send(socket, rejected('ROOM_NOT_FOUND', 'No table uses that code'));
      return;
    }

    try {
      const joined = room.host.join({ displayName });
      playerId = joined.playerId;
      roomCode = room.code;
      send(socket, {
        type: 'JOINED',
        playerId: joined.playerId,
        roomId: room.host.roomId,
        roomCode: room.code,
      });
      unsubscribe = room.host.subscribe(playerId, (event) => {
        send(socket, { type: 'EVENT', event });
      });
    } catch (error) {
      send(socket, { type: 'REJECTED', error: mapJoinError(error) });
    }
  };

  socket.on('message', (data) => {
    const parsed = decodeJson(String(data));
    if (parsed === undefined) {
      send(socket, rejected('PROTOCOL_ERROR', 'Invalid JSON'));
      return;
    }

    const message = parseWireClientMessage(parsed);
    if (!message) {
      send(socket, rejected('PROTOCOL_ERROR', 'Unrecognized message'));
      return;
    }

    if (message.type === 'CREATE') {
      if (playerId) {
        send(socket, rejected('ALREADY_JOINED', 'This connection already joined'));
        return;
      }
      const room = rooms.create();
      sitDown(room.code, message.displayName);
      rooms.dropIfVacant(room.code);
      return;
    }

    if (message.type === 'JOIN') {
      if (playerId) {
        send(socket, rejected('ALREADY_JOINED', 'This connection already joined'));
        return;
      }
      sitDown(message.roomCode, message.displayName);
      return;
    }

    if (!playerId || !roomCode) {
      send(socket, rejected('NOT_JOINED', 'Join the table before sending commands'));
      return;
    }

    const room = rooms.get(roomCode);
    if (!room) {
      send(socket, rejected('ROOM_NOT_FOUND', 'That table is gone'));
      return;
    }

    room.host.handle(playerId, message.message);
    if (message.message.type === 'LEAVE') {
      rooms.dropIfVacant(roomCode);
    }
  });

  socket.on('close', () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    if (playerId && roomCode) {
      const room = rooms.get(roomCode);
      if (room) {
        room.host.handle(playerId, { type: 'LEAVE' });
        rooms.dropIfVacant(roomCode);
      }
    }
    playerId = null;
    roomCode = null;
  });
}

function listen(server: http.Server, port: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const onError = (error: Error) => {
      server.off('listening', onListening);
      reject(error);
    };
    const onListening = () => {
      server.off('error', onError);
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Server has no TCP address'));
        return;
      }
      resolve(address.port);
    };
    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port, '0.0.0.0');
  });
}

function safeFilePath(root: string, requestUrl: string): string | null {
  const parsed = new URL(requestUrl, 'http://127.0.0.1');
  let relative = decodeURIComponent(parsed.pathname);
  if (relative === '/') {
    relative = '/index.html';
  }
  const resolved = path.normalize(path.join(root, relative));
  if (resolved !== root && resolved.indexOf(root + path.sep) !== 0) {
    return null;
  }
  return resolved;
}

function serveStatic(root: string, req: http.IncomingMessage, res: http.ServerResponse): void {
  const target = safeFilePath(root, req.url || '/');
  if (!target) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(target, (error, stats) => {
    const file = !error && stats.isFile() ? target : path.join(root, 'index.html');
    fs.readFile(file, (readError, body) => {
      if (readError) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const type = MIME[path.extname(file)] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': type });
      res.end(body);
    });
  });
}

export async function startGameServer(
  options: GameServerOptions = {},
): Promise<GameServer> {
  const rooms = new RoomRegistry({
    defaultSeed: options.defaultSeed,
    skipDealAnimation: options.skipDealAnimation,
  });
  const staticDir = options.staticDir
    ? path.resolve(options.staticDir)
    : undefined;

  const httpServer = http.createServer((req, res) => {
    const url = req.url || '/';
    if (url === '/health' || url === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true, rooms: rooms.size }));
      return;
    }

    if (staticDir) {
      serveStatic(staticDir, req, res);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Fodinha server');
  });

  const sockets = new WebSocketServer({ server: httpServer });
  sockets.on('connection', (socket) => {
    bindSocket(socket, rooms);
  });

  const port = await listen(httpServer, options.port ?? DEFAULT_PORT);

  return {
    port,
    addresses: lanAddresses(),
    rooms,
    close: () =>
      new Promise((resolve, reject) => {
        sockets.clients.forEach((client) => {
          client.close();
        });
        sockets.close((wsError) => {
          httpServer.close((httpError) => {
            const error = wsError || httpError;
            if (error) {
              reject(error);
              return;
            }
            resolve();
          });
        });
      }),
  };
}
