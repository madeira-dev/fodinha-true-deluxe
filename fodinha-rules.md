# Fodinha — Game Rules

> This document defines the authoritative ruleset for implementing the multiplayer game.
> When a Fodinha house rule differs from this document, **this document is authoritative**.

## 1. Objective

Fodinha is a trick-taking and prediction card game.

The goal of each round is **not simply to win as many tricks as possible**. Before playing the round, each player predicts exactly how many tricks they expect to win.

At the end of the round:

- If a player wins exactly the number of tricks they predicted, they receive no penalty.
- If they win more or fewer tricks than predicted, they receive penalty letters.
- The number of penalty letters is the absolute difference between the prediction and the actual number of tricks won.
- The penalty letters spell **FODINHA**.
- A player is eliminated as soon as their accumulated penalties complete the word **FODINHA**.
- The last remaining player wins the match.

---

## 2. Terminology

- **Match**: The complete game, lasting until there is a winner.
- **Round / Hand**: A deal in which every active player receives the same number of cards, predicts a number of tricks, and then plays all of those cards.
- **Trick**: One play in which every active player plays one card.
- **Prediction / Bid / Palpite**: The number of tricks a player says they will win during the current round.
- **Trick won**: A trick in which that player's card is the winning card.
- **Vira**: The face-up card revealed after dealing. Its rank determines the manilha.
- **Manilha**: The special rank immediately above the vira. All manilhas beat every non-manilha.
- **Penalty letter**: One accumulated letter toward the word `FODINHA`.

---

## 3. Deck

Use a 40-card deck.

The game does **not** use:

- 8
- 9
- 10
- Jokers

The ranks used in this ruleset are:

```text
4, 5, 6, 7, Q, J, K, A, 2, 3
```

Each rank exists in four suits:

- Diamonds (`♦`, ouros)
- Spades (`♠`, espadas)
- Hearts (`♥`, copas)
- Clubs (`♣`, paus)

---

## 4. Normal Card Strength

From weakest to strongest, the normal rank order is:

```text
4 < 5 < 6 < 7 < Q < J < K < A < 2 < 3
```

This order is circular when determining the manilha.

For normal cards, suit does **not** affect strength.

Example:

```text
K♦ == K♣
```

unless `K` is the manilha rank for that round.

If two or more non-manilha cards share the highest rank in a trick, they are tied according to the tie rules defined later in this document.

---

## 5. Vira and Manilha

After the cards for the round have been dealt to all active players, the remaining undealt cards stay in a stack.

Those remaining cards are not otherwise used during that round.

The one exception is the top card of that remaining stack.

That card is turned face-up and becomes the **vira**.

The vira determines the **manilha** for the entire round.

### 5.1 Determining the manilha rank

The manilha is the rank immediately after the vira in the normal card sequence.

The sequence is:

```text
4 -> 5
5 -> 6
6 -> 7
7 -> Q
Q -> J
J -> K
K -> A
A -> 2
2 -> 3
3 -> 4
```

The sequence is circular.

Therefore, after `3`, it wraps back to `4`.

Examples:

```text
Vira = 4  -> Manilha = 5
Vira = 7  -> Manilha = Q
Vira = Q  -> Manilha = J
Vira = A  -> Manilha = 2
Vira = 2  -> Manilha = 3
Vira = 3  -> Manilha = 4
```

The **suit of the vira does not matter** when determining the manilha rank.

Only the vira's rank matters.

### 5.2 Manilha strength

Every card whose rank matches the manilha rank becomes a manilha for that round.

Every manilha beats every non-manilha card, independent of the normal rank sequence.

Example:

```text
Vira = 4
Manilha = 5
```

If a trick contains:

```text
Player A -> 3
Player B -> 5
```

the `5` wins, even though `3` is normally the strongest rank.

This is because `5` is the manilha for that round.

### 5.3 Manilha suit ranking

When two or more manilhas are played in the same trick, their suits determine which manilha is stronger.

From weakest to strongest:

```text
Diamonds < Spades < Hearts < Clubs
♦ < ♠ < ♥ < ♣
```

Therefore, for any manilha rank:

```text
manilha♦ < manilha♠ < manilha♥ < manilha♣
```

A manilha of Clubs (`♣`) is the absolute strongest card in that round.

No other card can beat it.

Example:

```text
Vira = 4
Manilha = 5

5♠ < 5♣
```

Therefore, if one player plays `5♠` and another plays `5♣`, the `5♣` wins.

### 5.4 Absolute strength order for a round

Conceptually, card comparison works in two layers:

1. Every non-manilha card follows the normal rank order:

   ```text
   4 < 5 < 6 < 7 < Q < J < K < A < 2 < 3
   ```

2. All four manilhas are moved above every non-manilha card and ordered by suit:

   ```text
   manilha♦ < manilha♠ < manilha♥ < manilha♣
   ```

For example, if `5` is the manilha, the effective top of the ranking is:

```text
... < 2 < 3 < 5♦ < 5♠ < 5♥ < 5♣
```

The normal position of `5` in the rank sequence is ignored for that round because every `5` is a manilha.

### 5.5 Circular edge case

If the vira is `3`, the manilha wraps to the beginning of the sequence:

```text
Vira = 3
Manilha = 4
```

Therefore all `4`s become the strongest rank category for that round, ordered by suit:

```text
4♦ < 4♠ < 4♥ < 4♣
```

Even a `3` loses to any of those `4`s.

---

## 6. Round Size

The match begins with **1 card per player**.

Each new round increases the number of cards dealt to each player by one:

```text
1, 2, 3, 4, ...
```

The count increases until the deck can no longer deal that many cards to every active player while still leaving one card available for the vira.

For `P` active players and a 40-card deck:

```text
maximumCardsPerPlayer = floor((40 - 1) / P)
```

After reaching that maximum, the number of cards decreases by one each round until it returns to 1:

```text
..., 4, 3, 2, 1
```

Then it begins increasing again.

If players are eliminated, calculate the legal maximum using the number of **currently active players**.

---

## 7. Special Rule — First Round

The first round is different from every later round.

### 7.1 Cards dealt

In round 1:

```text
cardsPerPlayer = 1
```

Each active player receives exactly one card.

### 7.2 Visibility

A player **must not see their own card** during the first round.

However, that card is visible to every other active player.

Therefore, during round 1:

- Player A cannot see Player A's own card.
- Player A can see Player B's card, Player C's card, and every other opponent's card.
- Player B cannot see Player B's own card.
- Player B can see Player A's card, Player C's card, and every other opponent's card.
- The same rule applies to every player.

In other words, each player knows every first-round card **except their own**.

The implementation must keep each player's own card hidden from that player while making it observable to all opponents.

### 7.3 Prediction in the first round

Because there is only one card, the only legal predictions are:

```text
0 or 1
```

The player makes this prediction **without knowing their own card**.

Instead, they must estimate whether they are likely to win the trick by looking at:

- every opponent's visible card;
- the vira;
- the resulting manilha;
- the normal card-strength rules;
- the manilha suit-strength rules.

This makes the first round an inverse-information prediction round: the player reasons about their unknown card from the cards they can see.

### 7.4 Playing the first-round card

After predictions are complete, the single trick is played normally.

A player's own card remains unknown to that player until it is played/revealed according to the game implementation.

The trick winner is determined using the normal card-comparison rules.

After the trick, scoring works normally:

```text
penalty = abs(predictedTricks - tricksWon)
```

### 7.5 Later rounds

Starting with round 2, the normal visibility rule applies:

- each player sees all cards in their own hand;
- opponents cannot see those cards;
- each player cannot see cards currently held by opponents.

Examples:

```text
Round 1 -> 1 card per player, own card hidden, opponents' cards visible
Round 2 -> 2 cards per player, own hand visible, opponents' hands hidden
Round 3 -> 3 cards per player, own hand visible, opponents' hands hidden
Round 4 -> 4 cards per player, own hand visible, opponents' hands hidden
...
```

---

## 8. Beginning a Round

For every round:

1. Choose the dealer.
2. Shuffle the deck.
3. Deal the round's required number of cards to every active player.
4. Leave all remaining undealt cards in a stack.
5. Turn the top card of that remaining stack face-up. This card is the vira.
6. Determine the manilha as the next rank after the vira in the circular rank sequence.
7. Players make their predictions.
8. After every active player has predicted, trick play begins.

The player immediately after the dealer in the established direction of play is the first player to:

- make a prediction; and
- lead the first trick.

The dealer position rotates by one active player after each round.

---

## 9. Predictions

Each player must predict how many tricks they will win during the round.

A prediction must be an integer between:

```text
0 and cardsDealtToEachPlayer
```

inclusive.

Examples for a 3-card round:

```text
0, 1, 2, or 3
```

A prediction is locked once the trick-playing phase begins.

The prediction represents an **exact target**, not a minimum.

Therefore:

- Predict 2 and win 2 -> success.
- Predict 2 and win 1 -> penalty of 1.
- Predict 2 and win 3 -> penalty of 1.
- Predict 0 and win 2 -> penalty of 2.

There is no advantage to winning extra tricks if doing so makes the player miss their prediction.

---

## 10. Playing a Trick

A trick works as follows:

1. The current trick leader plays one card.
2. Every other active player plays exactly one card, in turn order.
3. After every active player has played, compare the cards.
4. Determine the winner of the trick.
5. If there is a winner:
   - increment that player's `tricksWon` by 1;
   - that player leads the next trick.
6. If the trick is tied:
   - nobody receives the trick;
   - no player's `tricksWon` is incremented;
   - the player who led the tied trick leads the next trick.

Players may play any card from their hand. There is no requirement to follow suit.

The round ends after every player has played every card they were dealt.

---

## 11. Determining the Trick Winner

Use the following comparison rules in order.

### 11.1 If one or more manilhas were played

Ignore all non-manilha cards for purposes of finding the winner.

The strongest manilha wins using the manilha suit order:

```text
♦ < ♠ < ♥ < ♣
```

### 11.2 If no manilha was played

Compare cards using the normal rank order:

```text
4 < 5 < 6 < 7 < Q < J < K < A < 2 < 3
```

Suit does not affect strength for normal cards.

If two or more cards share the same rank, those cards **amarram**. Every card of that rank is cancelled and ignored for the rest of the trick.

After cancelling every rank that appeared more than once, compare only the remaining unique cards.

- If exactly one card remains, that player wins the trick.
- If two or more unique ranks remain, the strongest remaining rank wins.
- If no cards remain, the trick is tied and **nobody wins it**.

Example — cancelled high cards:

```text
Player A: 5♦
Player B: 3♣
Player C: 3♥
Player D: 3♠
```

Assuming `3` is not manilha, the three `3`s amarram and cancel. The `5` is the only card left, so Player A wins.

Example — a weaker leftover after a pair cancels:

```text
Player A: A♦
Player B: A♣
Player C: K♥
```

The Aces amarram and cancel. The `K` remains, so Player C wins.

Example — everything cancels:

```text
Player A: 2♣
Player B: 2♦
```

No unique card remains. The trick is tied and nobody gains a trick.

---

## 12. End-of-Round Scoring

Each round has a **letter stake**. It starts at `1`.

At the end of the round, calculate each active player's penalty independently:

```text
roundPenalty = abs(predictedTricks - tricksWon) * letterStake
```

If every active player hits their prediction exactly, the round is considered tied for letters. Nobody receives letters, and the next round's stake increases by 1:

```text
1 -> 2 -> 3 -> ...
```

The stake keeps accumulating until a round is not tied (at least one player misses). Then letters are applied using the current stake, and the stake resets to `1`.

Examples:

- Round 1 everyone exact → next round is worth 2 letters per missed vaza.
- Round 2 also everyone exact → next round is worth 3.
- Round 3 a player misses by 1 → they receive 3 letters, and the following round is worth 1 again.

At the end of the round, if a player misses:

```text
roundPenalty = abs(predictedTricks - tricksWon) * letterStake
```

If:

```text
roundPenalty == 0
```

the player receives no letters.

Otherwise, add `roundPenalty` letters to that player's accumulated progress through:

```text
F O D I N H A
1 2 3 4 5 6 7
```

### Examples

#### Exact prediction

```text
Prediction: 2
Actual tricks won: 2
Penalty: abs(2 - 2) = 0
```

No letter is added.

#### Won too many

```text
Prediction: 1
Actual tricks won: 3
Penalty: abs(1 - 3) = 2
```

Add 2 letters.

If the player previously had:

```text
FOD
```

they now have:

```text
FODIN
```

#### Won too few

```text
Prediction: 3
Actual tricks won: 1
Penalty: abs(3 - 1) = 2
```

Add 2 letters.

#### Penalty completes the word

If a player currently has:

```text
FODIN
```

and receives a penalty of 3, only 2 more letters are needed:

```text
FODIN -> FODINHA
```

The player is eliminated. Penalties do not continue past `FODINHA`.

---

## 13. Penalty State

Internally, penalty progress can be represented as an integer:

```text
0 = ""
1 = "F"
2 = "FO"
3 = "FOD"
4 = "FODI"
5 = "FODIN"
6 = "FODINH"
7 = "FODINHA" -> eliminated
```

When applying a penalty:

```text
newPenaltyCount = min(
    7,
    currentPenaltyCount + abs(predictedTricks - tricksWon)
)
```

A player is eliminated when:

```text
newPenaltyCount >= 7
```

---

## 14. Elimination

Elimination is evaluated after all tricks in the current round have been played and the round's penalties have been calculated.

A player who reaches `FODINHA` is removed from future rounds.

All players who reach `FODINHA` during the same scoring phase are eliminated simultaneously.

An eliminated player:

- receives no future cards;
- makes no future predictions;
- does not participate in tricks;
- cannot become dealer or trick leader.

---

## 15. Winning the Match

After round penalties and eliminations are processed:

- If exactly one player remains active, that player wins the match.
- If two or more players remain, start the next round.
- If all remaining players are eliminated during the same round, the match is considered tied unless a separate house-rule tiebreaker is configured.

---

## 16. Gameplay Consequences

The implementation and UI should reflect that maximizing tricks is **not** the objective.

The primary objective of a player during a round is:

```text
actualTricksWon == predictedTricks
```

This means a player may intentionally try to **lose** a trick.

Example:

```text
Prediction: 1
Current tricks won: 1
Tricks remaining: 1
```

Winning the final trick would produce:

```text
actual = 2
prediction = 1
penalty = 1
```

Therefore, if possible, the strategically correct action may be to play a weaker card and intentionally lose.

Likewise:

```text
Prediction: 3
Current tricks won: 1
Tricks remaining: 2
```

The player must try to win both remaining tricks to hit the prediction exactly.

---

## 17. Player-Visible Information

The game is multiplayer. There is no AI-controlled player requirement in this ruleset.

Each player must receive only the information they are allowed to see according to the current round.

### 17.1 Round 1

The first round intentionally uses asymmetric information.

For each player:

- their own single dealt card is hidden;
- every opponent's single dealt card is visible;
- the vira is visible;
- the manilha rank is visible;
- announced predictions are visible;
- accumulated `FODINHA` penalty progress is visible;
- dealer and play order are visible.

A player's own round-1 card must remain hidden until it is revealed/played according to the game flow.

### 17.2 Round 2 and later

From the second round onward:

- a player can see all cards in their own hand;
- a player cannot see cards currently held by opponents;
- the vira is visible;
- the manilha rank is visible;
- cards already played are visible;
- previous trick results are visible;
- announced predictions are visible;
- current trick counts are visible;
- accumulated `FODINHA` penalty progress is visible;
- dealer and play order are visible.

### 17.3 Multiplayer state isolation

Hidden information must be enforced by the game architecture.

Do **not** send secret card values to a client and rely on the UI to hide them.

For example:

- In round 1, Player A's client should not receive Player A's own hidden card value before reveal.
- In round 1, Player A's client may receive the visible cards belonging to Players B, C, and so on.
- From round 2 onward, Player A's client should receive Player A's own hand but not the unrevealed cards belonging to other players.

The authoritative game state should remain on the server or host responsible for validating moves and distributing player-specific views of the state.

---

## 18. Implementation Requirements

The AI used during development may help generate code, tests, UI, networking logic, or game-state handling, but there are no AI-controlled players required by these rules.

The implementation must support the following player actions:

### 18.1 Prediction action

During the prediction phase, each active player submits an integer prediction:

```text
0 <= predictedTricks <= cardsPerPlayer
```

In round 1, the valid values are therefore only:

```text
0 or 1
```

The prediction must be validated by the authoritative game state and locked once the playing phase begins.

### 18.2 Card-play action

During each trick, the active player selects one legal card to play.

The authoritative game state must:

- verify that the card belongs to that player;
- verify that it is currently that player's turn;
- remove the card from the player's hand;
- add the card to the current trick;
- determine the trick result after all active players have played;
- update `tricksWon` when applicable;
- advance the trick leader and turn order;
- reject invalid or duplicated actions.

## 19. Canonical State Model

A game implementation can expose state approximately like this:

```text
Game
- id
- players[]
- dealerIndex
- currentPlayerId
- roundNumber
- cardsPerPlayer
- direction
- phase
- deck
- vira
- manilhaRank
- currentTrick
- firstRoundSpecialVisibility

Player
- id
- displayName
- hand[]
- prediction
- tricksWon
- penaltyCount
- penaltyWord
- eliminated
- connected

Trick
- leaderId
- plays[]
- winnerId | null
- tied
```

For multiplayer implementations, this canonical state is the authoritative internal state.

Clients should receive a **player-specific projection** of this state with hidden cards removed according to the visibility rules above.

Suggested phases:

```text
DEALING
PREDICTION
PLAYING
SCORING
FINISHED
```

---

## 20. Core Invariants

The implementation must preserve these rules:

1. `prediction` is always between `0` and `cardsPerPlayer`.
2. A player plays exactly one card per trick while active.
3. A played card is removed from that player's hand.
4. A player can win at most one point (`tricksWon += 1`) per trick.
5. A tied trick gives a trick to nobody.
5a. Non-manilha cards of the same rank amarram: that entire rank is cancelled, then the strongest remaining unique card wins. If nothing remains, the trick is tied.
6. Every manilha beats every non-manilha.
7. Only manilhas use suit to break strength ties.
8. Round penalty is always:

   ```text
   abs(prediction - tricksWon)
   ```

9. Correct predictions produce zero penalty.
10. Both over-performing and under-performing produce penalties.
11. Penalty progress can never exceed 7.
12. Reaching 7 letters means `FODINHA` and elimination.
13. A player's objective is to hit their prediction exactly, not to maximize tricks.
14. Round 1 always deals exactly one card to each active player.
15. During round 1, a player cannot observe their own card before it is revealed/played.
16. During round 1, a player can observe every opponent's dealt card.
17. From round 2 onward, each player's hand is private and visible only to that player.
18. The number of cards per player follows the round progression: round 1 = 1 card, round 2 = 2 cards, round 3 = 3 cards, and so on, subject to the legal deck-size limit described above.
19. After dealing, exactly one card from the top of the undealt stack is revealed as the vira.
20. Only the vira's rank determines the manilha rank; the vira's suit is irrelevant.
21. The manilha rank is the next rank in the circular sequence `4, 5, 6, 7, Q, J, K, A, 2, 3`.
22. If the vira is `3`, the manilha is `4`.
23. Every manilha beats every non-manilha.
24. Among manilhas, suit strength is always `♦ < ♠ < ♥ < ♣`.
25. The manilha of Clubs is unbeatable within that round.

---

## 21. Reference Examples

### Example A — Perfect round

Player predicts:

```text
2
```

and wins:

```text
2
```

Result:

```text
penalty = 0
```

Penalty word does not change.

### Example B — One trick above prediction

Player predicts:

```text
1
```

and wins:

```text
2
```

Result:

```text
penalty = 1
```

If they had `FO`, they move to:

```text
FOD
```

### Example C — Two tricks below prediction

Player predicts:

```text
3
```

and wins:

```text
1
```

Result:

```text
penalty = 2
```

If they had `FODI`, they move to:

```text
FODINH
```

### Example D — Elimination

Player currently has:

```text
FODINH
```

They predict:

```text
2
```

and win:

```text
0
```

Their raw penalty is:

```text
abs(2 - 0) = 2
```

Only one letter remains before completing `FODINHA`, so their state becomes:

```text
FODINHA
```

They are eliminated.

---

## 22. Summary

The essential rule of Fodinha is:

> **Predict exactly how many tricks you will win.**

Winning too many tricks is a mistake just as winning too few is.

For every round:

```text
penalty = abs(predictedTricks - actualTricksWon)
```

Penalty progress spells:

```text
F -> FO -> FOD -> FODI -> FODIN -> FODINH -> FODINHA
```

Completing:

```text
FODINHA
```

eliminates the player.

The last active player wins the match.
