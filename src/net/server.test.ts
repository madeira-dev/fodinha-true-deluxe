import { afterEach, describe, expect, it } from 'vitest';
import { isVisibleCard } from '../engine';
import type { ClientSnapshot, HostEvent } from '../host';
import { GameClient } from './client';
import { startGameServer, type GameServer } from './server';

const servers: GameServer[] = [];

afterEach(async () => {
  while (servers.length > 0) {
    const server = servers.pop();
    if (server) {
      await server.close();
    }
  }
});

async function listen() {
  const server = await startGameServer({
    port: 0,
    defaultSeed: 42,
  });
  servers.push(server);
  return server;
}

function urlFor(server: GameServer): string {
  return `ws://127.0.0.1:${server.port}`;
}

function waitForSnapshot(
  client: GameClient,
  predicate: (snapshot: ClientSnapshot) => boolean,
  timeoutMs = 1500,
): Promise<ClientSnapshot> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      off();
      reject(new Error('Timed out waiting for snapshot'));
    }, timeoutMs);
    const off = client.subscribe((event: HostEvent) => {
      if (event.type === 'SNAPSHOT' && predicate(event.snapshot)) {
        clearTimeout(timer);
        off();
        resolve(event.snapshot);
      }
    });
  });
}

function waitForError(client: GameClient, code: string, timeoutMs = 1500): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      off();
      reject(new Error(`Timed out waiting for error ${code}`));
    }, timeoutMs);
    const off = client.subscribe((event: HostEvent) => {
      if (event.type === 'ERROR' && event.error.code === code) {
        clearTimeout(timer);
        off();
        resolve();
      }
    });
  });
}

function waitForReject(client: GameClient, code: string, timeoutMs = 1500): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      off();
      reject(new Error(`Timed out waiting for reject ${code}`));
    }, timeoutMs);
    const off = client.onReject((error) => {
      if (error.code === code) {
        clearTimeout(timer);
        off();
        resolve();
      }
    });
  });
}

async function sitTwo(server: GameServer) {
  const ana = await GameClient.connect(urlFor(server));
  const beto = await GameClient.connect(urlFor(server));
  const anaReady = waitForSnapshot(ana, (snapshot) => snapshot.kind === 'lobby');
  const betoReady = waitForSnapshot(
    beto,
    (snapshot) => snapshot.kind === 'lobby' && snapshot.players.length === 2,
  );
  const anaTwo = waitForSnapshot(
    ana,
    (snapshot) => snapshot.kind === 'lobby' && snapshot.players.length === 2,
  );
  const created = await ana.create('Ana');
  await beto.join('Beto', created.roomCode);
  await anaReady;
  const lobby = await betoReady;
  await anaTwo;
  return { ana, beto, lobby, roomCode: created.roomCode };
}

describe('game server', () => {
  it('serves a health check', async () => {
    const server = await listen();
    const response = await fetch(`http://127.0.0.1:${server.port}/health`);
    expect(response.ok).toBe(true);
    expect(await response.json()).toMatchObject({ ok: true, rooms: 0 });
  });

  it('lets two sockets join a lobby and makes the first player the owner', async () => {
    const server = await listen();
    const { ana, beto, lobby } = await sitTwo(server);

    if (lobby.kind !== 'lobby') {
      throw new Error('expected lobby');
    }
    expect(lobby.ownerId).toBe(ana.playerId);
    expect(ana.roomCode).toHaveLength(4);
    expect(lobby.players.map((player) => player.displayName)).toEqual(['Ana', 'Beto']);
    expect(beto.playerId).not.toBe(ana.playerId);
    ana.close();
    beto.close();
  });

  it('starts the match over the wire and keeps hidden cards off the wrong socket', async () => {
    const server = await listen();
    const { ana, beto } = await sitTwo(server);
    const anaGame = waitForSnapshot(ana, (snapshot) => snapshot.kind === 'in_game');
    const betoGame = waitForSnapshot(beto, (snapshot) => snapshot.kind === 'in_game');
    ana.send({ type: 'START' });

    const anaSnap = await anaGame;
    const betoSnap = await betoGame;
    if (anaSnap.kind !== 'in_game' || betoSnap.kind !== 'in_game') {
      throw new Error('expected in-game snapshots');
    }

    expect(anaSnap.view.you.id).toBe(ana.playerId);
    expect(betoSnap.view.you.id).toBe(beto.playerId);
    expect(anaSnap.view.firstRoundSpecialVisibility).toBe(true);
    expect(isVisibleCard(anaSnap.view.you.hand[0])).toBe(false);
    expect(isVisibleCard(betoSnap.view.you.hand[0])).toBe(false);

    const betoFromAna = anaSnap.view.players.find((player) => player.id === beto.playerId);
    const anaFromBeto = betoSnap.view.players.find((player) => player.id === ana.playerId);
    expect(betoFromAna && betoFromAna.hand.length === 1 && isVisibleCard(betoFromAna.hand[0])).toBe(
      true,
    );
    expect(anaFromBeto && anaFromBeto.hand.length === 1 && isVisibleCard(anaFromBeto.hand[0])).toBe(
      true,
    );
    expect(JSON.stringify(anaSnap)).not.toContain('"deck"');
    expect(JSON.stringify(betoSnap)).not.toContain('"deck"');
    ana.close();
    beto.close();
  });

  it('rejects start from the guest and ignores a forged player identity', async () => {
    const server = await listen();
    const { ana, beto } = await sitTwo(server);

    const guestDenied = waitForError(beto, 'NOT_OWNER');
    beto.send({ type: 'START' });
    await guestDenied;

    ana.send({ type: 'START' });
    const started = await waitForSnapshot(beto, (snapshot) => snapshot.kind === 'in_game');
    if (started.kind !== 'in_game') {
      throw new Error('expected in-game');
    }

    const firstId = started.view.currentPlayerId;
    expect(firstId).toBe(beto.playerId);
    beto.send({ type: 'PREDICT', value: 1 });
    const afterBeto = await waitForSnapshot(
      ana,
      (snapshot) =>
        snapshot.kind === 'in_game' &&
        snapshot.view.players.some(
          (player) => player.id === beto.playerId && player.prediction === 1,
        ),
    );
    if (afterBeto.kind !== 'in_game') {
      throw new Error('expected in-game');
    }
    expect(afterBeto.view.you.prediction).toBeNull();
    ana.close();
    beto.close();
  });

  it('plays a round using only card ids from each client view', async () => {
    const server = await listen();
    const { ana, beto } = await sitTwo(server);
    ana.send({ type: 'START' });
    let anaView = await waitForSnapshot(ana, (snapshot) => snapshot.kind === 'in_game');
    let betoView = await waitForSnapshot(beto, (snapshot) => snapshot.kind === 'in_game');
    if (anaView.kind !== 'in_game' || betoView.kind !== 'in_game') {
      throw new Error('expected in-game');
    }

    const first = anaView.view.currentPlayerId === beto.playerId ? beto : ana;
    const second = first === beto ? ana : beto;
    first.send({ type: 'PREDICT', value: 0 });
    await waitForSnapshot(
      second,
      (snapshot) => snapshot.kind === 'in_game' && snapshot.view.currentPlayerId === second.playerId,
    );
    second.send({ type: 'PREDICT', value: 0 });

    anaView = await waitForSnapshot(
      ana,
      (snapshot) => snapshot.kind === 'in_game' && snapshot.view.phase === 'PLAYING',
    );
    betoView = await waitForSnapshot(
      beto,
      (snapshot) => snapshot.kind === 'in_game' && snapshot.view.phase === 'PLAYING',
    );
    if (anaView.kind !== 'in_game' || betoView.kind !== 'in_game') {
      throw new Error('expected playing');
    }

    const currentId = anaView.view.currentPlayerId;
    const current = currentId === ana.playerId ? ana : beto;
    const other = current === ana ? beto : ana;
    const currentCard =
      current === ana ? anaView.view.you.hand[0].id : betoView.view.you.hand[0].id;
    current.send({ type: 'PLAY_CARD', cardId: currentCard });

    const afterFirst = await waitForSnapshot(
      other,
      (snapshot) =>
        snapshot.kind === 'in_game' &&
        snapshot.view.currentTrick !== null &&
        snapshot.view.currentTrick.plays.length === 1,
    );
    if (afterFirst.kind !== 'in_game') {
      throw new Error('expected trick');
    }
    const otherCard = afterFirst.view.you.hand[0].id;
    other.send({ type: 'PLAY_CARD', cardId: otherCard });

    const scored = await waitForSnapshot(
      ana,
      (snapshot) => snapshot.kind === 'in_game' && snapshot.view.phase === 'SCORING',
    );
    expect(scored.kind).toBe('in_game');
    ana.send({ type: 'ADVANCE' });
    const round2 = await waitForSnapshot(
      beto,
      (snapshot) => snapshot.kind === 'in_game' && snapshot.view.roundNumber === 2,
    );
    if (round2.kind !== 'in_game') {
      throw new Error('expected round 2');
    }
    expect(round2.view.cardsPerPlayer).toBe(2);
    expect(round2.view.firstRoundSpecialVisibility).toBe(false);
    expect(round2.view.you.hand.every(isVisibleCard)).toBe(true);
    expect(
      round2.view.players.find((player) => player.id !== beto.playerId)?.hand,
    ).toEqual([]);
    ana.close();
    beto.close();
  });

  it('rejects a command before join and invalid JSON', async () => {
    const server = await listen();
    const client = await GameClient.connect(urlFor(server));
    const rejected = waitForReject(client, 'NOT_JOINED');
    client.send({ type: 'START' });
    await rejected;

    const raw = new WebSocket(urlFor(server));
    await new Promise<void>((resolve, reject) => {
      raw.addEventListener('open', () => resolve());
      raw.addEventListener('error', () => reject(new Error('raw socket failed')));
    });
    const rawRejected = new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('raw reject timeout')), 1500);
      raw.addEventListener('message', (event) => {
        const parsed = JSON.parse(String((event as MessageEvent).data)) as {
          type?: string;
          error?: { code?: string };
        };
        if (parsed.type === 'REJECTED' && parsed.error && parsed.error.code) {
          clearTimeout(timer);
          resolve(parsed.error.code);
        }
      });
    });
    raw.send('not-json');
    expect(await rawRejected).toBe('PROTOCOL_ERROR');
    raw.close();
    client.close();
  });

  it('marks a disconnected player after their socket closes', async () => {
    const server = await listen();
    const { ana, beto } = await sitTwo(server);
    const dropped = waitForSnapshot(
      ana,
      (snapshot) =>
        snapshot.kind === 'lobby' &&
        snapshot.players.some((player) => player.displayName === 'Beto' && !player.connected) ===
          false &&
        snapshot.players.length === 1,
    );
    beto.close();
    const lobby = await dropped;
    if (lobby.kind !== 'lobby') {
      throw new Error('expected lobby');
    }
    expect(lobby.players.map((player) => player.displayName)).toEqual(['Ana']);
    ana.close();
  });

  it('keeps two tables isolated and rejects an unknown code', async () => {
    const server = await listen();
    const ana = await GameClient.connect(urlFor(server));
    const carla = await GameClient.connect(urlFor(server));
    const stranger = await GameClient.connect(urlFor(server));

    const first = await ana.create('Ana');
    const second = await carla.create('Carla');
    expect(first.roomCode).not.toBe(second.roomCode);
    expect(server.rooms.size).toBe(2);

    await expect(stranger.join('Duda', 'ZZZZ')).rejects.toThrow(/No table uses that code/);
    ana.close();
    carla.close();
    stranger.close();
  });
});
