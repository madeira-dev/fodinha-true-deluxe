export const SHUFFLE_MS = 680;
export const FLIGHT_MS = 360;
export const VIRA_GAP_MS = 70;
export const VIRA_MS = 260;

export type DealStep =
  | { kind: 'card'; playerId: string }
  | { kind: 'vira' };

export interface DealTable {
  cardsPerPlayer: number;
  direction: 1 | -1;
  dealerId: string;
  players: Array<{ id: string; eliminated: boolean }>;
}

function nextActiveIndex(table: DealTable, fromIndex: number): number {
  const count = table.players.length;
  let index = fromIndex;
  for (let step = 0; step < count; step += 1) {
    index = (index + table.direction + count) % count;
    if (!table.players[index].eliminated) {
      return index;
    }
  }
  return fromIndex;
}

export function dealSequence(table: DealTable): DealStep[] {
  const steps: DealStep[] = [];
  const active = table.players.filter((player) => !player.eliminated);
  let dealerIndex = table.players.findIndex((player) => player.id === table.dealerId);
  if (dealerIndex < 0) {
    dealerIndex = 0;
  }

  for (let n = 0; n < table.cardsPerPlayer; n += 1) {
    let seat = dealerIndex;
    for (let dealt = 0; dealt < active.length; dealt += 1) {
      seat = nextActiveIndex(table, seat);
      steps.push({ kind: 'card', playerId: table.players[seat].id });
    }
  }

  steps.push({ kind: 'vira' });
  return steps;
}

export function dealStaggerMs(cardCount: number): number {
  if (cardCount > 16) {
    return 52;
  }
  if (cardCount > 8) {
    return 68;
  }
  return 88;
}

export function dealDurationMs(table: DealTable): number {
  const cards = dealSequence(table).filter((step) => step.kind === 'card').length;
  return SHUFFLE_MS + cards * dealStaggerMs(cards) + FLIGHT_MS + VIRA_GAP_MS + VIRA_MS;
}
