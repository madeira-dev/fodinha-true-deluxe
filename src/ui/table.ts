import { isVisibleCard } from '../engine';
import type { GameView, PlayerView, ViewCard } from '../engine';
import type { LobbySnapshot } from '../host';
import { t, tagLabel } from '../i18n';
import { facedownStack, playingCard } from './card';
import { el } from './dom';
import { cardLabel, formatVisibleCard, phaseLabel } from './format';
import { occupySeats, seatForPlayer, type OccupiedSeat } from './seats';

export interface GameTableHandlers {
  onPredict: (value: number) => void;
  onPlay: (cardId: string) => void;
  onAdvance: () => void;
}

export interface GameTableRenderOptions {
  dealing?: boolean;
  justDealt?: boolean;
  arrivingCardIds?: string[];
  showSettledTrick?: boolean;
}

export interface LobbyInvite {
  roomCode: string;
  shareUrl: string | null;
}

export interface LobbyTableHandlers {
  onStart: () => void;
  onOpenGuest?: () => void;
  onCopy: (value: string) => void;
}

export function renderGameTable(
  view: GameView,
  ownerId: string,
  letterDeltas: Record<string, number>,
  handlers: GameTableHandlers,
  options: GameTableRenderOptions = {},
): HTMLElement {
  const seats = occupySeats(view.players, view.you.id);
  const stageClass = [
    'table-stage',
    options.dealing ? 'dealing' : '',
    options.justDealt ? 'just-dealt' : '',
  ]
    .filter((item) => item)
    .join(' ');
  return el(
    'div',
    { class: stageClass },
    el(
      'div',
      { class: 'table-wrap' },
      el(
        'div',
        { class: 'rail' },
        el(
          'div',
          { class: 'felt' },
          ...seats.map((seat) => renderSeat(seat, view, ownerId)),
          ...renderDealTargets(seats, Boolean(options.dealing)),
          renderCenter(view, seats, letterDeltas, handlers, Boolean(options.dealing)),
          ...renderTrickCards(
            view,
            seats,
            options.arrivingCardIds || [],
            Boolean(options.showSettledTrick),
          ),
        ),
      ),
    ),
    renderHandDock(view, handlers),
  );
}

export function renderLobbyTable(
  snapshot: LobbySnapshot,
  invite: LobbyInvite | null,
  handlers: LobbyTableHandlers,
): HTMLElement {
  const seats = occupySeats(snapshot.players, snapshot.youId);
  return el(
    'div',
    { class: 'table-stage lobby' },
    el(
      'div',
      { class: 'table-wrap' },
      el(
        'div',
        { class: 'rail' },
        el(
          'div',
          { class: 'felt' },
          ...seats.map((seat) =>
            el(
              'div',
              {
                class: `seat ${seat.slot.region}${seat.isYou ? ' you' : ''}`,
                style: `left:${seat.slot.x}%;top:${seat.slot.y}%`,
              },
              nameplate(seat.occupant.displayName, [
                seat.isYou ? 'you' : '',
                seat.occupant.id === snapshot.ownerId ? 'host' : '',
                seat.occupant.connected ? '' : 'away',
              ]),
            ),
          ),
          renderLobbyCenter(snapshot, invite, handlers),
        ),
      ),
    ),
  );
}

function renderSeat(
  seat: OccupiedSeat<PlayerView>,
  view: GameView,
  ownerId: string,
): HTMLElement {
  const player = seat.occupant;
  const tags = [
    seat.isYou ? 'you' : '',
    player.id === ownerId ? 'host' : '',
    player.id === view.dealerId ? 'dealer' : '',
    view.currentPlayerId === player.id ? 'turn' : '',
    player.connected ? '' : 'away',
    player.eliminated ? 'out' : '',
  ];
  const classes = [
    'seat',
    seat.slot.region,
    seat.isYou ? 'you' : '',
    view.currentPlayerId === player.id ? 'active' : '',
    player.eliminated ? 'eliminated' : '',
    player.connected ? '' : 'disconnected',
  ]
    .filter((item) => item)
    .join(' ');

  return el(
    'div',
    {
      class: classes,
      'data-player-id': player.id,
      style: `left:${seat.slot.x}%;top:${seat.slot.y}%`,
    },
    nameplate(player.displayName, tags),
    renderPenaltyTrack(player.penaltyWord),
    el(
      'div',
      { class: 'seat-stats' },
      el(
        'span',
        null,
        t('bidStat', { value: player.prediction === null ? '—' : String(player.prediction) }),
      ),
      el('span', null, t('tricksStat', { value: player.tricksWon })),
    ),
    seat.isYou ? null : renderOpponentCards(player, view),
  );
}

function nameplate(name: string, tags: string[]): HTMLElement {
  const chips = tags.filter((tag) => tag);
  return el(
    'div',
    { class: 'nameplate' },
    el('strong', null, name),
    chips.length > 0
      ? el(
          'div',
          { class: 'chips' },
          ...chips.map((tag) => el('span', { class: `chip-tag ${tag}` }, tagLabel(tag))),
        )
      : null,
  );
}

function renderPenaltyTrack(word: string): HTMLElement {
  const letters = 'FODINHA'.split('');
  return el(
    'div',
    { class: 'fodinha', 'aria-label': word ? t('penaltyLabel', { word }) : t('noPenalty') },
    ...letters.map((letter, index) =>
      el('span', { class: index < word.length ? 'lit' : 'dim' }, letter),
    ),
  );
}

function renderOpponentCards(player: PlayerView, view: GameView): HTMLElement | null {
  if (player.eliminated || player.handCount === 0) {
    return null;
  }
  if (player.hand.length > 0) {
    return el(
      'div',
      { class: 'seat-cards' },
      ...player.hand.map((card) =>
        playingCard(card, {
          size: 'sm',
          manilha: isVisibleCard(card) && card.rank === view.manilhaRank,
        }),
      ),
    );
  }
  return el('div', { class: 'seat-cards' }, facedownStack(player.handCount, 'sm'));
}

function renderCenter(
  view: GameView,
  seats: Array<OccupiedSeat<PlayerView>>,
  letterDeltas: Record<string, number>,
  handlers: GameTableHandlers,
  dealing = false,
): HTMLElement {
  const yourTurn = view.currentPlayerId === view.you.id;
  if (dealing) {
    return el('div', { class: 'felt-center' }, renderDealCenter(view));
  }

  const children: Array<HTMLElement | null> = [renderVira(view)];

  if (view.phase === 'PREDICTION' && yourTurn && view.legalPredictions) {
    const legal = new Set(view.legalPredictions);
    const allValues = Array.from({ length: view.cardsPerPlayer + 1 }, (_, value) => value);
    const forbidden = allValues.find((value) => !legal.has(value));
    children.push(
      el(
        'div',
        { class: 'center-prompt' },
        el(
          'p',
          null,
          view.firstRoundSpecialVisibility ? t('hiddenBidPrompt') : t('bidPrompt'),
        ),
        el(
          'div',
          { class: 'bid-row' },
          ...allValues.map((value) => {
            const allowed = legal.has(value);
            const attrs: Record<string, string | boolean | ((event: Event) => void)> = {
              class: allowed ? 'bid-btn' : 'bid-btn bid-btn-forbidden',
              disabled: !allowed,
            };
            if (allowed) {
              attrs.click = () => handlers.onPredict(value);
            }
            return el('button', attrs, String(value));
          }),
        ),
        forbidden === undefined
          ? null
          : el('p', { class: 'bid-rule' }, t('bidCannotClose', { n: forbidden })),
      ),
    );
  } else if (view.phase === 'PREDICTION') {
    children.push(
      el('p', { class: 'center-wait' }, t('isBidding', { name: nameOf(view, view.currentPlayerId) })),
    );
  } else if (view.phase === 'PLAYING' && !yourTurn) {
    children.push(
      el('p', { class: 'center-wait' }, t('isPlaying', { name: nameOf(view, view.currentPlayerId) })),
    );
  } else if (view.phase === 'PLAYING' && yourTurn) {
    children.push(el('p', { class: 'center-wait' }, t('playACard')));
  } else if (view.phase === 'SCORING' || view.phase === 'FINISHED') {
    children.push(renderScoreSheet(view, letterDeltas, handlers));
  }

  if (view.phase === 'PLAYING') {
    children.push(renderLastTrickNote(view));
  }

  return el('div', { class: 'felt-center' }, ...children);
}

function renderDealTargets(
  seats: Array<OccupiedSeat<PlayerView>>,
  dealing: boolean,
): HTMLElement[] {
  if (!dealing) {
    return [];
  }
  return seats
    .filter((seat) => !seat.occupant.eliminated)
    .map((seat) =>
      el('div', {
        class: 'deal-target',
        'data-deal-target': seat.occupant.id,
        style: `left:${seat.slot.innerX}%;top:${seat.slot.innerY}%`,
      }),
    );
}

function renderDealCenter(view: GameView): HTMLElement {
  return el(
    'div',
    { class: 'deal-center' },
    el(
      'div',
      { class: 'deal-deck', 'aria-hidden': 'true' },
      playingCard({ id: 'deal-deck-0' }, { size: 'md' }),
      playingCard({ id: 'deal-deck-1' }, { size: 'md' }),
      playingCard({ id: 'deal-deck-2' }, { size: 'md' }),
      playingCard({ id: 'deal-deck-3' }, { size: 'md' }),
      playingCard({ id: 'deal-deck-4' }, { size: 'md' }),
    ),
    el(
      'div',
      { class: 'deal-vira' },
      view.vira
        ? playingCard(view.vira, { size: 'md', manilha: false })
        : el('div', { class: 'playing-card md empty' }),
    ),
    el('p', { class: 'center-wait' }, t('dealPrompt')),
  );
}

function renderVira(view: GameView): HTMLElement {
  return el(
    'div',
    { class: 'vira-block' },
    view.vira
      ? playingCard(view.vira, { size: 'md', manilha: false })
      : el('div', { class: 'playing-card md empty' }),
    el('div', { class: 'vira-meta' }, el('span', null, 'Vira'), el('strong', null, `Manilha ${view.manilhaRank || '—'}`)),
  );
}

export function visibleTrick(
  view: GameView,
  options: { showSettledTrick?: boolean } = {},
): GameView['currentTrick'] {
  if (view.currentTrick && view.currentTrick.plays.length > 0) {
    return view.currentTrick;
  }
  if (view.phase !== 'PLAYING' || !options.showSettledTrick) {
    return null;
  }
  const last = view.completedTricks[view.completedTricks.length - 1];
  if (!last || last.plays.length === 0) {
    return null;
  }
  return last;
}

function renderTrickCards(
  view: GameView,
  seats: Array<OccupiedSeat<PlayerView>>,
  arrivingCardIds: string[],
  showSettledTrick: boolean,
): HTMLElement[] {
  const trick = visibleTrick(view, { showSettledTrick });
  if (!trick) {
    return [];
  }

  const arriving = new Set(arrivingCardIds);
  const reduceMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return trick.plays.map((play) => {
    const seat = seatForPlayer(seats, play.playerId);
    const toX = seat ? seat.slot.innerX : 50;
    const toY = seat ? seat.slot.innerY : 50;
    const fromX = seat ? (seat.isYou ? 50 : seat.slot.x) : 50;
    const fromY = seat ? (seat.isYou ? 108 : seat.slot.y) : 50;
    const flyIn = !reduceMotion && arriving.has(play.card.id);
    const rot = (((play.playerId.charCodeAt(0) || 10) % 13) - 6);
    return el(
      'div',
      {
        class: flyIn ? 'trick-card arriving' : 'trick-card',
        'data-card-id': play.card.id,
        style: [
          `left:${toX}%`,
          `top:${toY}%`,
          `--play-from-x:${fromX}%`,
          `--play-from-y:${fromY}%`,
          `--play-to-x:${toX}%`,
          `--play-to-y:${toY}%`,
          `--play-rot:${rot}deg`,
        ].join(';'),
        title: `${nameOf(view, play.playerId)} · ${cardLabel(play.card)}`,
      },
      playingCard(play.card, {
        size: 'md',
        manilha: isVisibleCard(play.card) && play.card.rank === view.manilhaRank,
      }),
    );
  });
}

function renderLastTrickNote(view: GameView): HTMLElement | null {
  if (view.currentTrick && view.currentTrick.plays.length > 0) {
    return null;
  }
  const last = view.completedTricks[view.completedTricks.length - 1];
  if (!last) {
    return null;
  }
  if (last.tied) {
    return el('p', { class: 'trick-note' }, t('tiedTrick'));
  }
  return el('p', { class: 'trick-note' }, t('takesTrick', { name: nameOf(view, last.winnerId) }));
}

function renderScoreSheet(
  view: GameView,
  letterDeltas: Record<string, number>,
  handlers: GameTableHandlers,
): HTMLElement {
  return el(
    'div',
    { class: 'score-sheet' },
    el('h2', null, view.phase === 'FINISHED' ? finishTitle(view) : t('roundResults')),
    el(
      'ul',
      null,
      ...view.players.map((player) => {
        const delta = letterDeltas[player.id] || 0;
        const result =
          player.prediction === null
            ? '—'
            : player.prediction === player.tricksWon
              ? t('exact')
              : t(delta === 1 ? 'letterOne' : 'letterMany', { n: delta > 0 ? `+${delta}` : String(delta) });
        return el(
          'li',
          { class: player.eliminated ? 'eliminated' : '' },
          el('strong', null, player.displayName),
          el(
            'span',
            null,
            t('bidWord', { value: player.prediction === null ? '—' : String(player.prediction) }),
          ),
          el('span', null, t('wonWord', { value: player.tricksWon })),
          el('span', { class: delta === 0 ? 'exact' : 'miss' }, result),
        );
      }),
    ),
    view.phase === 'SCORING'
      ? el('button', { class: 'primary', click: () => handlers.onAdvance() }, t('nextRound'))
      : null,
  );
}

function finishTitle(view: GameView): string {
  if (view.tied) {
    return t('everybodyOut');
  }
  return t('playerWins', { name: nameOf(view, view.winnerId) });
}

function renderHandDock(view: GameView, handlers: GameTableHandlers): HTMLElement {
  const canPlay = view.phase === 'PLAYING' && view.currentPlayerId === view.you.id;
  return el(
    'section',
    { class: 'hand-dock' },
    el(
      'div',
      { class: 'hand-heading' },
      el(
        'h2',
        null,
        view.firstRoundSpecialVisibility ? t('yourCardHidden') : t('yourHand'),
      ),
      el(
        'p',
        { class: 'muted' },
        view.phase === 'PLAYING' && canPlay
          ? t('chooseCard')
          : t(view.you.handCount === 1 ? 'cardOne' : 'cardMany', { count: view.you.handCount }),
      ),
    ),
    el(
      'div',
      { class: 'hand-fan' },
      ...view.you.hand.map((card: ViewCard) =>
        playingCard(card, {
          size: 'lg',
          interactive: true,
          disabled: !canPlay || view.playableCardIds.indexOf(card.id) === -1,
          manilha: isVisibleCard(card) && card.rank === view.manilhaRank,
          onPlay: () => handlers.onPlay(card.id),
        }),
      ),
      view.you.hand.length === 0 ? el('p', { class: 'muted' }, t('noCards')) : null,
    ),
  );
}

function renderLobbyCenter(
  snapshot: LobbySnapshot,
  invite: LobbyInvite | null,
  handlers: LobbyTableHandlers,
): HTMLElement {
  const youAreOwner = snapshot.youId === snapshot.ownerId;
  const roomCode = invite ? invite.roomCode : '';

  return el(
    'div',
    { class: 'felt-center lobby-center' },
    el('p', { class: 'kicker' }, t('tableCode')),
    roomCode
      ? el('p', { class: 'room-code' }, roomCode)
      : el('h2', null, youAreOwner ? t('yourTable') : t('waitingHost')),
    el('p', { class: 'muted' }, t('lobbyHint')),
    el(
      'div',
      { class: 'actions' },
      roomCode
        ? el('button', { class: 'ghost tiny', click: () => handlers.onCopy(roomCode) }, t('copyCode'))
        : null,
      invite && invite.shareUrl
        ? el(
            'button',
            { class: 'ghost tiny', click: () => handlers.onCopy(invite.shareUrl as string) },
            t('copyLink'),
          )
        : null,
    ),
    el(
      'div',
      { class: 'actions' },
      youAreOwner
        ? el('button', { class: 'primary', click: () => handlers.onStart() }, t('startMatch'))
        : el('p', { class: 'muted' }, t('waitingHost')),
      youAreOwner && handlers.onOpenGuest
        ? el(
            'button',
            {
              click: () => {
                if (handlers.onOpenGuest) {
                  handlers.onOpenGuest();
                }
              },
            },
            t('openGuest'),
          )
        : null,
    ),
  );
}

function nameOf(view: GameView, playerId: string | null): string {
  if (!playerId) {
    return t('someone');
  }
  const player = view.players.find((item) => item.id === playerId);
  return player ? player.displayName : playerId;
}

export function renderHud(
  title: string,
  subtitle: string,
  onLeave: (() => void) | null,
  extras?: HTMLElement | null,
): HTMLElement {
  return el(
    'header',
    { class: 'hud' },
    el('div', null, el('p', { class: 'kicker' }, 'Fodinha'), el('h1', null, title)),
    el('p', { class: 'hud-sub' }, subtitle),
    el(
      'div',
      { class: 'hud-actions' },
      extras || null,
      onLeave ? el('button', { class: 'ghost', click: () => onLeave() }, t('leave')) : null,
    ),
  );
}

export function hudSubtitle(view: GameView, dealing = false): string {
  const vira = view.vira ? formatVisibleCard(view.vira) : '—';
  const cards = t(view.cardsPerPlayer === 1 ? 'cardOne' : 'cardMany', {
    count: view.cardsPerPlayer,
  });
  const stake =
    view.letterStake > 1
      ? t('roundStakeMany', { n: view.letterStake })
      : t('roundStakeOne');
  return t('hudLine', {
    n: view.roundNumber,
    cards,
    phase: dealing ? t('phaseDealing') : phaseLabel(view.phase),
    vira,
    stake,
  });
}
