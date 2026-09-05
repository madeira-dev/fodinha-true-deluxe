import type { Locale, Messages } from './messages';
import { en, LOCALES, ptBR } from './messages';

const STORAGE_KEY = 'fodinha.locale';
const catalogs: Record<Locale, Messages> = {
  'pt-BR': ptBR,
  en,
};

let current: Locale = 'pt-BR';

export function isLocale(value: string): value is Locale {
  return LOCALES.indexOf(value as Locale) !== -1;
}

export function detectLocale(): Locale {
  if (typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && isLocale(stored)) {
        return stored;
      }
    } catch {
      // Ignore blocked storage.
    }
  }

  return 'pt-BR';
}

export function getLocale(): Locale {
  return current;
}

export function setLocale(locale: Locale): void {
  current = locale;
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale;
  }
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // Ignore blocked storage.
    }
  }
}

export function initLocale(): Locale {
  setLocale(detectLocale());
  return current;
}

export function t(key: keyof Messages, vars?: Record<string, string | number>): string {
  const table = catalogs[current] || catalogs['pt-BR'];
  let text = table[key] || catalogs['pt-BR'][key] || String(key);
  if (!vars) {
    return text;
  }
  const names = Object.keys(vars);
  for (let i = 0; i < names.length; i += 1) {
    const name = names[i];
    text = text.split(`{${name}}`).join(String(vars[name]));
  }
  return text;
}

const ERROR_KEYS: Record<string, keyof Messages> = {
  LOCAL_SERVER_DOWN: 'errorLocalServer',
  WRONG_PHASE: 'errorWrongPhase',
  NOT_YOUR_TURN: 'errorNotYourTurn',
  INVALID_PREDICTION: 'errorInvalidPrediction',
  CARD_NOT_IN_HAND: 'errorCardNotInHand',
  PLAYER_ELIMINATED: 'errorPlayerEliminated',
  GAME_FINISHED: 'errorGameFinished',
  UNKNOWN_PLAYER: 'errorUnknownPlayer',
  NOT_IN_ROOM: 'errorNotInRoom',
  LOBBY_FULL: 'errorLobbyFull',
  GAME_ALREADY_STARTED: 'errorGameAlreadyStarted',
  GAME_NOT_STARTED: 'errorGameNotStarted',
  NOT_ENOUGH_PLAYERS: 'errorNotEnoughPlayers',
  NOT_OWNER: 'errorNotOwner',
  INVALID_NAME: 'errorInvalidName',
  DUPLICATE_PLAYER: 'errorDuplicatePlayer',
  UNKNOWN_MESSAGE: 'errorUnknownMessage',
  PROTOCOL_ERROR: 'errorProtocol',
  NOT_JOINED: 'errorNotJoined',
  ALREADY_JOINED: 'errorAlreadyJoined',
  ROOM_NOT_FOUND: 'errorRoomNotFound',
};

export function translateError(error: { code?: string; message?: string } | Error): string {
  const coded = error as { code?: string; message?: string };
  if (coded.code && ERROR_KEYS[coded.code]) {
    return t(ERROR_KEYS[coded.code]);
  }
  if (error instanceof Error) {
    return error.message;
  }
  return error.message || t('errorGeneric');
}

export function tagLabel(tag: string): string {
  if (tag === 'you') {
    return t('tagYou');
  }
  if (tag === 'host') {
    return t('tagHost');
  }
  if (tag === 'dealer') {
    return t('tagDealer');
  }
  if (tag === 'turn') {
    return t('tagTurn');
  }
  if (tag === 'away') {
    return t('tagAway');
  }
  if (tag === 'out') {
    return t('tagOut');
  }
  return tag;
}

export { LOCALES };
export type { Locale };
