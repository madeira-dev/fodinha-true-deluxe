import { downloadLinks, inviteUrl, isLocalServerUrl, serverWsUrl } from '../config';
import type { ClientSnapshot } from '../host';
import { getLocale, initLocale, LOCALES, setLocale, t, translateError } from '../i18n';
import { GameClient } from '../net/client';
import { el } from './dom';
import { queryRoomCode } from './format';
import { playDealAnimation } from './deal';
import { hudSubtitle, renderGameTable, renderHud, renderLobbyTable, visibleTrick } from './table';

interface AppState {
  displayName: string;
  roomCode: string;
  busy: boolean;
  error: string | null;
  role: 'menu' | 'host' | 'guest';
  joinedRoomCode: string | null;
  client: GameClient | null;
  snapshot: ClientSnapshot | null;
  livePenalties: Record<string, number>;
  letterDeltas: Record<string, number>;
  dealKey: string | null;
  dealStartedAt: number | null;
  justDealt: boolean;
  seenPlayIds: string[];
  arrivingCardIds: string[];
  showSettledTrick: boolean;
  trickClearTimer: number | null;
}

const state: AppState = {
  displayName: '',
  roomCode: queryRoomCode(),
  busy: false,
  error: null,
  role: 'menu',
  joinedRoomCode: null,
  client: null,
  snapshot: null,
  livePenalties: {},
  letterDeltas: {},
  dealKey: null,
  dealStartedAt: null,
  justDealt: false,
  seenPlayIds: [],
  arrivingCardIds: [],
  showSettledTrick: false,
  trickClearTimer: null,
};

let root: HTMLElement;

export function startApp(mount: HTMLElement): void {
  root = mount;
  initLocale();
  render();
}

function render(): void {
  const next = el('div', { class: 'app' }, renderTop(), renderError(), renderBody());
  root.replaceChildren(next);
  if (state.snapshot && state.snapshot.kind === 'in_game' && state.snapshot.view.phase === 'DEALING') {
    const elapsed = state.dealStartedAt ? Date.now() - state.dealStartedAt : 0;
    playDealAnimation(next, state.snapshot.view, Math.max(0, elapsed));
  }
  state.arrivingCardIds = [];
}

function renderTop(): HTMLElement {
  const switcher = renderLocaleSwitch();
  if (state.snapshot && state.snapshot.kind === 'in_game') {
    return renderHud(
      t('roundTitle', { n: state.snapshot.view.roundNumber }),
      hudSubtitle(state.snapshot.view, state.snapshot.view.phase === 'DEALING'),
      () => {
        void leaveTable();
      },
      switcher,
    );
  }
  if (state.role !== 'menu') {
    const code = state.joinedRoomCode
      ? t('roomTitle', { code: state.joinedRoomCode })
      : t('onlineTable');
    return renderHud(
      state.role === 'host' ? t('yourTable') : t('atTheTable'),
      code,
      () => {
        void leaveTable();
      },
      switcher,
    );
  }
  return renderHud(t('sitDown'), t('sitDownSub'), null, switcher);
}

function renderLocaleSwitch(): HTMLElement {
  return el(
    'div',
    { class: 'locale-switch', 'aria-label': 'Language' },
    ...LOCALES.map((locale) =>
      el(
        'button',
        {
          class: getLocale() === locale ? 'tiny locale-active' : 'ghost tiny',
          click: () => {
            setLocale(locale);
            render();
          },
        },
        locale === 'pt-BR' ? 'PT' : 'EN',
      ),
    ),
  );
}

function renderError(): HTMLElement | null {
  if (!state.error) {
    return null;
  }
  return el('p', { class: 'banner' }, state.error);
}

function renderBody(): HTMLElement {
  if (state.snapshot && state.snapshot.kind === 'in_game') {
    return renderGameTable(
      state.snapshot.view,
      state.snapshot.ownerId,
      state.letterDeltas,
      {
        onPredict: (value) => sendCommand({ type: 'PREDICT', value }),
        onPlay: (cardId) => sendCommand({ type: 'PLAY_CARD', cardId }),
        onAdvance: () => sendCommand({ type: 'ADVANCE' }),
      },
      {
        dealing: state.snapshot.view.phase === 'DEALING',
        justDealt: state.justDealt,
        arrivingCardIds: state.arrivingCardIds,
        showSettledTrick: state.showSettledTrick,
      },
    );
  }
  if (state.snapshot && state.snapshot.kind === 'lobby') {
    const code = state.joinedRoomCode;
    return renderLobbyTable(
      state.snapshot,
      code
        ? { roomCode: code, shareUrl: inviteUrl(code) }
        : null,
      {
        onStart: () => sendCommand({ type: 'START' }),
        onOpenGuest: window.fodinha && code ? () => void openGuest(code) : undefined,
        onCopy: (value) => {
          void copyText(value);
        },
      },
    );
  }
  if (state.role !== 'menu') {
    return el('p', { class: 'muted connecting' }, t('connecting'));
  }
  return renderMenu();
}

function renderMenu(): HTMLElement {
  const downloads = downloadLinks();
  return el(
    'div',
    { class: 'welcome' },
    el(
      'div',
      { class: 'plaque' },
      el('p', { class: 'kicker' }, t('onlineTable')),
      el('h2', null, t('menuTitle')),
      field(t('yourName'), state.displayName, (value) => {
        state.displayName = value;
      }),
      field(t('roomCode'), state.roomCode, (value) => {
        state.roomCode = value.toUpperCase();
      }),
      el(
        'div',
        { class: 'actions' },
        el(
          'button',
          { class: 'primary', disabled: state.busy, click: () => void createTable() },
          t('createTable'),
        ),
        el('button', { disabled: state.busy, click: () => void joinTable() }, t('joinWithCode')),
      ),
      el('p', { class: 'muted' }, t('menuHint')),
      renderDownloads(downloads),
    ),
  );
}

function renderDownloads(links: { mac: string; win: string; linux: string }): HTMLElement {
  return el(
    'div',
    { class: 'downloads' },
    el('p', { class: 'muted' }, t('orDownload')),
    el(
      'div',
      { class: 'actions' },
      el('a', { class: 'button-link', href: links.mac, target: '_blank', rel: 'noreferrer' }, 'macOS'),
      el('a', { class: 'button-link', href: links.win, target: '_blank', rel: 'noreferrer' }, 'Windows'),
      el('a', { class: 'button-link', href: links.linux, target: '_blank', rel: 'noreferrer' }, 'Linux'),
    ),
    el('p', { class: 'muted mac-hint' }, t('macOpenHint')),
    el('code', { class: 'mac-command' }, t('macOpenCommand')),
  );
}

function field(
  label: string,
  value: string,
  onChange: (value: string) => void,
): HTMLElement {
  return el(
    'label',
    { class: 'field' },
    el('span', null, label),
    el('input', {
      type: 'text',
      value,
      input: (event: Event) => {
        const target = event.target as HTMLInputElement;
        onChange(target.value);
      },
    }),
  );
}

function rememberPenalties(snapshot: ClientSnapshot): void {
  if (snapshot.kind !== 'in_game') {
    state.livePenalties = {};
    state.letterDeltas = {};
    return;
  }

  const live =
    snapshot.view.phase === 'DEALING' ||
    snapshot.view.phase === 'PREDICTION' ||
    snapshot.view.phase === 'PLAYING';
  if (live) {
    const next: Record<string, number> = {};
    snapshot.view.players.forEach((player) => {
      next[player.id] = player.penaltyCount;
    });
    state.livePenalties = next;
    state.letterDeltas = {};
    return;
  }

  const deltas: Record<string, number> = {};
  snapshot.view.players.forEach((player) => {
    const previous =
      state.livePenalties[player.id] === undefined
        ? player.penaltyCount
        : state.livePenalties[player.id];
    deltas[player.id] = player.penaltyCount - previous;
  });
  state.letterDeltas = deltas;
}

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      state.error = null;
      return;
    } catch {
      // Fall through to the prompt below.
    }
  }
  window.prompt(t('copyPrompt'), value);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function connectToServer(): Promise<GameClient> {
  const url = serverWsUrl();
  const local = isLocalServerUrl(url);
  const attempts = local ? 4 : 8;
  let lastError: Error = new Error(local ? t('errorLocalServer') : t('errorConnect'));
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await GameClient.connect(url);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < attempts) {
        state.error = local ? t('startingLocalTable') : t('wakingTable');
        render();
        await wait(local ? 400 : 2000);
      }
    }
  }
  if (local) {
    const failure = new Error(t('errorLocalServer')) as Error & { code: string };
    failure.code = 'LOCAL_SERVER_DOWN';
    throw failure;
  }
  throw lastError;
}

function sendCommand(message: Parameters<GameClient['send']>[0]): void {
  if (!state.client) {
    return;
  }
  state.error = null;
  state.client.send(message);
}

async function createTable(): Promise<void> {
  const name = state.displayName.trim();
  if (!name) {
    state.error = t('needNameCreate');
    render();
    return;
  }
  state.busy = true;
  state.error = null;
  state.role = 'host';
  render();
  try {
    await attachClient(name, 'create');
  } catch (error) {
    state.error = error instanceof Error ? translateError(error) : t('createFailed');
    state.role = 'menu';
    detachClient();
  } finally {
    state.busy = false;
    render();
  }
}

async function joinTable(): Promise<void> {
  const name = state.displayName.trim();
  const code = state.roomCode.trim();
  if (!name) {
    state.error = t('needNameJoin');
    render();
    return;
  }
  if (!code) {
    state.error = t('needRoomCode');
    render();
    return;
  }
  state.busy = true;
  state.error = null;
  state.role = 'guest';
  render();
  try {
    await attachClient(name, 'join', code);
  } catch (error) {
    state.error = error instanceof Error ? translateError(error) : t('joinFailed');
    state.role = 'menu';
    detachClient();
  } finally {
    state.busy = false;
    render();
  }
}

async function attachClient(
  displayName: string,
  mode: 'create' | 'join',
  roomCode?: string,
): Promise<void> {
  detachClient();
  const client = await connectToServer();
  state.client = client;
  client.subscribe((event) => {
    if (event.type === 'SNAPSHOT') {
      rememberDeal(event.snapshot);
      rememberPlays(event.snapshot);
      state.snapshot = event.snapshot;
      rememberPenalties(event.snapshot);
      state.error = null;
      render();
      return;
    }
    state.error = translateError(event.error);
    render();
  });
  client.onReject((error) => {
    state.error = translateError(error);
    render();
  });
  client.onClose(() => {
    if (state.role === 'menu') {
      return;
    }
    state.error = t('disconnected');
    state.snapshot = null;
    state.client = null;
    state.joinedRoomCode = null;
    clearDeal();
    clearPlays();
    if (state.role === 'guest') {
      state.role = 'menu';
    }
    render();
  });
  try {
    const joined =
      mode === 'create' ? await client.create(displayName) : await client.join(displayName, roomCode || '');
    state.joinedRoomCode = joined.roomCode;
    state.roomCode = joined.roomCode;
  } catch (error) {
    client.close();
    state.client = null;
    throw error;
  }
}

function detachClient(): void {
  if (state.client) {
    state.client.close();
    state.client = null;
  }
  state.snapshot = null;
  state.joinedRoomCode = null;
  state.livePenalties = {};
  state.letterDeltas = {};
  clearDeal();
  clearPlays();
}

function rememberDeal(snapshot: ClientSnapshot): void {
  if (snapshot.kind !== 'in_game' || snapshot.view.phase !== 'DEALING') {
    const wasDealing = state.snapshot && state.snapshot.kind === 'in_game' && state.snapshot.view.phase === 'DEALING';
    state.justDealt = Boolean(wasDealing && snapshot.kind === 'in_game' && snapshot.view.phase === 'PREDICTION');
    if (snapshot.kind !== 'in_game' || snapshot.view.phase !== 'PREDICTION') {
      state.dealKey = null;
      state.dealStartedAt = null;
    }
    return;
  }

  const key = `${snapshot.view.id}:${snapshot.view.roundNumber}`;
  if (state.dealKey !== key) {
    state.dealKey = key;
    state.dealStartedAt = Date.now();
    state.justDealt = false;
  }
}

function clearDeal(): void {
  state.justDealt = false;
  state.dealKey = null;
  state.dealStartedAt = null;
}

const TRICK_CLEAR_MS = 750;

function clearPlays(): void {
  if (state.trickClearTimer !== null) {
    window.clearTimeout(state.trickClearTimer);
    state.trickClearTimer = null;
  }
  state.seenPlayIds = [];
  state.arrivingCardIds = [];
  state.showSettledTrick = false;
}

function rememberPlays(snapshot: ClientSnapshot): void {
  if (snapshot.kind !== 'in_game') {
    clearPlays();
    return;
  }

  const previous = state.snapshot;
  if (
    !previous ||
    previous.kind !== 'in_game' ||
    previous.view.id !== snapshot.view.id ||
    previous.view.roundNumber !== snapshot.view.roundNumber
  ) {
    state.seenPlayIds = [];
    state.showSettledTrick = false;
  }

  const seen = new Set(state.seenPlayIds);
  const trick = visibleTrick(snapshot.view, { showSettledTrick: true });
  const ids = trick ? trick.plays.map((play) => play.card.id) : [];
  state.arrivingCardIds = ids.filter((id) => !seen.has(id));
  state.seenPlayIds = Array.from(new Set(state.seenPlayIds.concat(ids)));

  const prevCompleted =
    previous && previous.kind === 'in_game' ? previous.view.completedTricks.length : 0;
  const justSettled =
    snapshot.view.phase === 'PLAYING' && snapshot.view.completedTricks.length > prevCompleted;

  if (justSettled) {
    state.showSettledTrick = true;
    if (state.trickClearTimer !== null) {
      window.clearTimeout(state.trickClearTimer);
    }
    state.trickClearTimer = window.setTimeout(() => {
      state.trickClearTimer = null;
      state.showSettledTrick = false;
      render();
    }, TRICK_CLEAR_MS);
    return;
  }

  if (snapshot.view.currentTrick && snapshot.view.currentTrick.plays.length > 0) {
    if (state.trickClearTimer !== null) {
      window.clearTimeout(state.trickClearTimer);
      state.trickClearTimer = null;
    }
    state.showSettledTrick = false;
  }
}

async function leaveTable(): Promise<void> {
  if (state.client) {
    state.client.send({ type: 'LEAVE' });
  }
  detachClient();
  state.role = 'menu';
  state.error = null;
  render();
}

async function openGuest(roomCode: string): Promise<void> {
  if (!window.fodinha) {
    return;
  }
  await window.fodinha.openGuestWindow(roomCode);
}
