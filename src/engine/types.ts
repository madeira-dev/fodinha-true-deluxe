export type Suit = 'diamonds' | 'spades' | 'hearts' | 'clubs';

export type Rank = '4' | '5' | '6' | '7' | 'Q' | 'J' | 'K' | 'A' | '2' | '3';

export interface Card {
  id: string;
  rank: Rank;
  suit: Suit;
}

export type Phase =
  | 'DEALING'
  | 'PREDICTION'
  | 'PLAYING'
  | 'SCORING'
  | 'FINISHED';

export interface Player {
  id: string;
  displayName: string;
  hand: Card[];
  prediction: number | null;
  tricksWon: number;
  penaltyCount: number;
  eliminated: boolean;
  connected: boolean;
}

export interface TrickPlay {
  playerId: string;
  card: Card;
}

export interface Trick {
  leaderId: string;
  plays: TrickPlay[];
  winnerId: string | null;
  tied: boolean;
}

export type PlayDirection = 1 | -1;

export interface Game {
  id: string;
  players: Player[];
  dealerIndex: number;
  currentPlayerId: string | null;
  roundNumber: number;
  cardsPerPlayer: number;
  direction: PlayDirection;
  cardsPerPlayerDirection: PlayDirection;
  phase: Phase;
  deck: Card[];
  vira: Card | null;
  manilhaRank: Rank | null;
  currentTrick: Trick | null;
  completedTricks: Trick[];
  firstRoundSpecialVisibility: boolean;
  winnerId: string | null;
  tied: boolean;
  letterStake: number;
  rngSeed: number | null;
  nextCardSeq: number;
}

export type Action =
  | { type: 'PREDICT'; playerId: string; value: number }
  | { type: 'PLAY_CARD'; playerId: string; cardId: string }
  | { type: 'ADVANCE'; deck?: Card[] }
  | { type: 'FINISH_DEAL' };

export type ErrorCode =
  | 'WRONG_PHASE'
  | 'NOT_YOUR_TURN'
  | 'INVALID_PREDICTION'
  | 'CARD_NOT_IN_HAND'
  | 'PLAYER_ELIMINATED'
  | 'GAME_FINISHED'
  | 'UNKNOWN_PLAYER';

export interface EngineError {
  code: ErrorCode;
  message: string;
}

export type ApplyResult =
  | { ok: true; state: Game }
  | { ok: false; error: EngineError };

export interface CreateMatchOptions {
  players: Array<{ id: string; displayName: string }>;
  id?: string;
  seed?: number;
  dealerIndex?: number;
  deck?: Card[];
}

export interface HiddenCard {
  id: string;
}

export interface VisibleCard {
  id: string;
  rank: Rank;
  suit: Suit;
}

export type ViewCard = HiddenCard | VisibleCard;

export interface PlayerView {
  id: string;
  displayName: string;
  hand: ViewCard[];
  handCount: number;
  prediction: number | null;
  tricksWon: number;
  penaltyCount: number;
  penaltyWord: string;
  eliminated: boolean;
  connected: boolean;
}

export interface GameView {
  id: string;
  you: PlayerView;
  players: PlayerView[];
  dealerId: string;
  currentPlayerId: string | null;
  roundNumber: number;
  cardsPerPlayer: number;
  direction: PlayDirection;
  phase: Phase;
  vira: VisibleCard | null;
  manilhaRank: Rank | null;
  currentTrick: Trick | null;
  completedTricks: Trick[];
  firstRoundSpecialVisibility: boolean;
  winnerId: string | null;
  tied: boolean;
  letterStake: number;
  legalPredictions: number[] | null;
  playableCardIds: string[];
}
