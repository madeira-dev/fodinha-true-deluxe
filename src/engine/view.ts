import { legalPredictionValues } from './predictions';
import { penaltyWord } from './scoring';
import type {
  Game,
  GameView,
  HiddenCard,
  Player,
  PlayerView,
  ViewCard,
  VisibleCard,
} from './types';

export function isVisibleCard(card: ViewCard): card is VisibleCard {
  return 'rank' in card && 'suit' in card;
}

function toVisible(card: { id: string; rank: VisibleCard['rank']; suit: VisibleCard['suit'] }): VisibleCard {
  return { id: card.id, rank: card.rank, suit: card.suit };
}

function toHidden(card: { id: string }): HiddenCard {
  return { id: card.id };
}

function projectPlayer(game: Game, player: Player, viewerId: string): PlayerView {
  const isSelf = player.id === viewerId;
  const hideOwnValues = game.firstRoundSpecialVisibility;

  let hand: ViewCard[];
  if (isSelf) {
    hand = hideOwnValues
      ? player.hand.map(toHidden)
      : player.hand.map(toVisible);
  } else if (hideOwnValues) {
    hand = player.hand.map(toVisible);
  } else {
    hand = [];
  }

  return {
    id: player.id,
    displayName: player.displayName,
    hand,
    handCount: player.hand.length,
    prediction: player.prediction,
    tricksWon: player.tricksWon,
    penaltyCount: player.penaltyCount,
    penaltyWord: penaltyWord(player.penaltyCount),
    eliminated: player.eliminated,
    connected: player.connected,
  };
}

export function projectView(game: Game, playerId: string): GameView {
  const you = game.players.find((player) => player.id === playerId);
  if (!you) {
    throw new Error(`Unknown player: ${playerId}`);
  }

  const isYourTurn = game.currentPlayerId === playerId;
  const legalPredictions =
    game.phase === 'PREDICTION' && isYourTurn ? legalPredictionValues(game) : null;

  const playableCardIds =
    game.phase === 'PLAYING' && isYourTurn
      ? you.hand.map((card) => card.id)
      : [];

  return {
    id: game.id,
    you: projectPlayer(game, you, playerId),
    players: game.players.map((player) => projectPlayer(game, player, playerId)),
    dealerId: game.players[game.dealerIndex].id,
    currentPlayerId: game.currentPlayerId,
    roundNumber: game.roundNumber,
    cardsPerPlayer: game.cardsPerPlayer,
    direction: game.direction,
    phase: game.phase,
    vira: game.vira ? toVisible(game.vira) : null,
    manilhaRank: game.manilhaRank,
    currentTrick: game.currentTrick
      ? {
          leaderId: game.currentTrick.leaderId,
          plays: game.currentTrick.plays.map((play) => ({
            playerId: play.playerId,
            card: toVisible(play.card),
          })),
          winnerId: game.currentTrick.winnerId,
          tied: game.currentTrick.tied,
        }
      : null,
    completedTricks: game.completedTricks.map((trick) => ({
      leaderId: trick.leaderId,
      plays: trick.plays.map((play) => ({
        playerId: play.playerId,
        card: toVisible(play.card),
      })),
      winnerId: trick.winnerId,
      tied: trick.tied,
    })),
    firstRoundSpecialVisibility: game.firstRoundSpecialVisibility,
    winnerId: game.winnerId,
    tied: game.tied,
    letterStake: game.letterStake < 1 ? 1 : game.letterStake,
    legalPredictions,
    playableCardIds,
  };
}
