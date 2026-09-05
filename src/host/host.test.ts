import { describe, expect, it, vi } from 'vitest';
import { createDeck, isVisibleCard, pullToFront } from '../engine';
import { cardOf } from '../engine/test-helpers';
import { createHost } from './host';
import type { ClientSnapshot, HostEvent, InGameSnapshot, LobbySnapshot } from './types';

function latestSnapshot(events: HostEvent[]): ClientSnapshot {
  const snapshots = events.filter((event) => event.type === 'SNAPSHOT');
  if (snapshots.length === 0) {
    throw new Error('No snapshot received');
  }
  return snapshots[snapshots.length - 1].snapshot;
}

function latestGame(events: HostEvent[]): InGameSnapshot {
  const snapshot = latestSnapshot(events);
  if (snapshot.kind !== 'in_game') {
    throw new Error(`Expected in-game snapshot, got ${snapshot.kind}`);
  }
  return snapshot;
}

function latestLobby(events: HostEvent[]): LobbySnapshot {
  const snapshot = latestSnapshot(events);
  if (snapshot.kind !== 'lobby') {
    throw new Error(`Expected lobby snapshot, got ${snapshot.kind}`);
  }
  return snapshot;
}

function errorsOf(events: HostEvent[]) {
  return events.filter((event) => event.type === 'ERROR').map((event) => event.error);
}

function sitTwo(options: { skipDealAnimation?: boolean } = {}) {
  const host = createHost({
    roomId: 'table-1',
    skipDealAnimation: options.skipDealAnimation !== false,
  });
  const ana = host.join({ id: 'a', displayName: 'Ana' });
  const beto = host.join({ id: 'b', displayName: 'Beto' });
  const anaEvents: HostEvent[] = [];
  const betoEvents: HostEvent[] = [];
  host.subscribe(ana.playerId, (event) => anaEvents.push(event));
  host.subscribe(beto.playerId, (event) => betoEvents.push(event));
  return { host, ana: ana.playerId, beto: beto.playerId, anaEvents, betoEvents };
}

function startKnownRound1(host: ReturnType<typeof createHost>, ownerId: string) {
  return host.start(ownerId, {
    deck: pullToFront(createDeck(), [
      cardOf('A', 'spades'),
      cardOf('7', 'diamonds'),
      cardOf('4', 'clubs'),
    ]),
  });
}

describe('lobby', () => {
  it('sends each joined player a lobby snapshot and makes the first player owner', () => {
    const { ana, beto, anaEvents, betoEvents } = sitTwo();
    const anaLobby = latestLobby(anaEvents);
    const betoLobby = latestLobby(betoEvents);

    expect(anaLobby.roomId).toBe('table-1');
    expect(anaLobby.ownerId).toBe(ana);
    expect(anaLobby.youId).toBe(ana);
    expect(anaLobby.players.map((player) => player.id)).toEqual([ana, beto]);
    expect(betoLobby.youId).toBe(beto);
    expect(betoLobby.ownerId).toBe(ana);
  });

  it('does not let a guest start, and does not start with one player', () => {
    const host = createHost();
    const ana = host.join({ id: 'a', displayName: 'Ana' }).playerId;
    const anaEvents: HostEvent[] = [];
    host.subscribe(ana, (event) => anaEvents.push(event));

    expect(host.handle(ana, { type: 'START' })).toMatchObject({
      ok: false,
      error: { code: 'NOT_ENOUGH_PLAYERS' },
    });

    const beto = host.join({ id: 'b', displayName: 'Beto' }).playerId;
    expect(host.handle(beto, { type: 'START' })).toMatchObject({
      ok: false,
      error: { code: 'NOT_OWNER' },
    });
    expect(latestSnapshot(anaEvents).kind).toBe('lobby');
  });

  it('rejects a seventh player', () => {
    const host = createHost();
    ['a', 'b', 'c', 'd', 'e', 'f'].forEach((id) => {
      host.join({ id, displayName: id });
    });
    expect(() => host.join({ id: 'g', displayName: 'Gabi' })).toThrow(/lobby is full/);
  });

  it('removes a guest from the lobby and transfers ownership if the owner leaves', () => {
    const { host, ana, beto, betoEvents } = sitTwo();
    expect(host.handle(ana, { type: 'LEAVE' }).ok).toBe(true);
    expect(latestLobby(betoEvents).ownerId).toBe(beto);
    expect(latestLobby(betoEvents).players.map((player) => player.id)).toEqual([beto]);
  });
});

describe('in-process clients', () => {
  it('starts a match and gives each client only their projected view', () => {
    const { host, ana, beto, anaEvents, betoEvents } = sitTwo();
    expect(startKnownRound1(host, ana).ok).toBe(true);

    const anaGame = latestGame(anaEvents);
    const betoGame = latestGame(betoEvents);

    expect(anaGame.view.you.id).toBe(ana);
    expect(betoGame.view.you.id).toBe(beto);
    expect(anaGame.view.phase).toBe('PREDICTION');
    expect(anaGame.view.vira).toMatchObject({ rank: '4', suit: 'clubs' });
    expect(anaGame.view.manilhaRank).toBe('5');

    expect(isVisibleCard(anaGame.view.you.hand[0])).toBe(false);
    expect(isVisibleCard(betoGame.view.you.hand[0])).toBe(false);

    const betoFromAna = anaGame.view.players.find((player) => player.id === beto);
    const anaFromBeto = betoGame.view.players.find((player) => player.id === ana);
    expect(betoFromAna && isVisibleCard(betoFromAna.hand[0]) && betoFromAna.hand[0]).toMatchObject({
      rank: 'A',
      suit: 'spades',
    });
    expect(anaFromBeto && isVisibleCard(anaFromBeto.hand[0]) && anaFromBeto.hand[0]).toMatchObject({
      rank: '7',
      suit: 'diamonds',
    });

    expect(JSON.stringify(anaGame)).not.toContain('"deck"');
    expect(JSON.stringify(betoGame)).not.toContain('"deck"');
  });

  it('stamps the connected player on every action so a client cannot act as someone else', () => {
    const { host, ana, beto, anaEvents, betoEvents } = sitTwo();
    startKnownRound1(host, ana);

    const forged = {
      type: 'PREDICT' as const,
      value: 1,
      playerId: ana,
    };
    expect(host.handle(beto, forged).ok).toBe(true);

    const anaView = latestGame(anaEvents).view;
    const betoView = latestGame(betoEvents).view;
    expect(betoView.you.prediction).toBe(1);
    expect(anaView.you.prediction).toBeNull();
    expect(anaView.currentPlayerId).toBe(ana);
  });

  it('sends an error only to the actor and leaves other clients on the previous view', () => {
    const { host, ana, beto, anaEvents, betoEvents } = sitTwo();
    startKnownRound1(host, ana);
    const anaBefore = latestGame(anaEvents);
    const betoBeforeCount = betoEvents.length;

    expect(host.handle(ana, { type: 'PREDICT', value: 0 })).toMatchObject({
      ok: false,
      error: { code: 'NOT_YOUR_TURN' },
    });

    expect(errorsOf(anaEvents)).toEqual([
      expect.objectContaining({ code: 'NOT_YOUR_TURN' }),
    ]);
    expect(errorsOf(betoEvents)).toEqual([]);
    expect(betoEvents).toHaveLength(betoBeforeCount);
    expect(latestGame(anaEvents)).toEqual(anaBefore);
  });

  it('plays a round through two local clients using only ids from their own views', () => {
    const { host, ana, beto, anaEvents, betoEvents } = sitTwo();
    startKnownRound1(host, ana);

    expect(host.handle(beto, { type: 'PREDICT', value: 1 }).ok).toBe(true);
    expect(host.handle(ana, { type: 'PREDICT', value: 0 }).ok).toBe(true);
    expect(latestGame(anaEvents).view.phase).toBe('PLAYING');
    expect(latestGame(anaEvents).view.currentPlayerId).toBe(beto);

    const betoCardId = latestGame(betoEvents).view.you.hand[0].id;
    const anaCardId = latestGame(anaEvents).view.you.hand[0].id;
    expect(host.handle(beto, { type: 'PLAY_CARD', cardId: betoCardId }).ok).toBe(true);
    expect(host.handle(ana, { type: 'PLAY_CARD', cardId: anaCardId }).ok).toBe(true);

    const ended = latestGame(anaEvents).view;
    expect(ended.phase).toBe('SCORING');
    expect(ended.players.find((player) => player.id === beto)?.tricksWon).toBe(1);
    expect(ended.you.tricksWon).toBe(0);
    expect(ended.you.penaltyCount).toBe(0);
  });

  it('advances from scoring without giving either client the next undealt stack', () => {
    const { host, ana, beto, anaEvents, betoEvents } = sitTwo();
    startKnownRound1(host, ana);
    host.handle(beto, { type: 'PREDICT', value: 1 });
    host.handle(ana, { type: 'PREDICT', value: 0 });
    host.handle(beto, { type: 'PLAY_CARD', cardId: latestGame(betoEvents).view.you.hand[0].id });
    host.handle(ana, { type: 'PLAY_CARD', cardId: latestGame(anaEvents).view.you.hand[0].id });

    expect(
      host.advance(ana, {
        deck: pullToFront(createDeck(), [
          cardOf('2', 'clubs'),
          cardOf('3', 'clubs'),
          cardOf('4', 'diamonds'),
          cardOf('5', 'diamonds'),
          cardOf('6', 'hearts'),
        ]),
      }).ok,
    ).toBe(true);

    const next = latestGame(anaEvents);
    expect(next.view.roundNumber).toBe(2);
    expect(next.view.cardsPerPlayer).toBe(2);
    expect(next.view.firstRoundSpecialVisibility).toBe(false);
    expect(next.view.you.hand).toHaveLength(2);
    expect(next.view.you.hand.every(isVisibleCard)).toBe(true);
    expect(next.view.players.find((player) => player.id === beto)?.hand).toEqual([]);
    expect(next.view.players.find((player) => player.id === beto)?.handCount).toBe(2);
    expect(JSON.stringify(next)).not.toContain('"deck"');
  });

  it('marks a player disconnected during a match without removing their seat', () => {
    const { host, ana, beto, anaEvents } = sitTwo();
    startKnownRound1(host, ana);
    expect(host.handle(beto, { type: 'LEAVE' }).ok).toBe(true);

    const view = latestGame(anaEvents).view;
    expect(view.players.find((player) => player.id === beto)?.connected).toBe(false);
    expect(view.players).toHaveLength(2);
    expect(host.handle(beto, { type: 'PREDICT', value: 0 })).toMatchObject({
      ok: false,
      error: { code: 'NOT_IN_ROOM' },
    });
  });

  it('rejects joining after the match has started', () => {
    const { host, ana } = sitTwo();
    startKnownRound1(host, ana);
    expect(() => host.join({ displayName: 'Carla' })).toThrow(/already started/);
  });

  it('keeps every client in DEALING until the host finishes the shared deal', () => {
    vi.useFakeTimers();
    const { host, ana, beto, anaEvents, betoEvents } = sitTwo({ skipDealAnimation: false });
    expect(startKnownRound1(host, ana).ok).toBe(true);

    expect(latestGame(anaEvents).view.phase).toBe('DEALING');
    expect(latestGame(betoEvents).view.phase).toBe('DEALING');
    expect(host.handle(beto, { type: 'PREDICT', value: 0 })).toMatchObject({
      ok: false,
      error: { code: 'WRONG_PHASE' },
    });

    vi.advanceTimersByTime(10_000);
    expect(latestGame(anaEvents).view.phase).toBe('PREDICTION');
    expect(latestGame(betoEvents).view.phase).toBe('PREDICTION');
    expect(latestGame(anaEvents).view.currentPlayerId).toBe(beto);
    vi.useRealTimers();
  });
});
