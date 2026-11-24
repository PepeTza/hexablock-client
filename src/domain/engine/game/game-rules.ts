import type { Board } from '../board/board';
import type { DomainEvent, GameOutcome } from '../events/domain-event';
import type { ICoord } from '../geometry/coord';
import type { GameState } from './game-state';

/** The result of playing a move: rejected, or applied with its new state. */
export type MoveOutcome<
  TState extends GameState,
  TEvent extends DomainEvent = DomainEvent,
> =
  | { readonly kind: 'rejected'; readonly reason: string }
  | {
      readonly kind: 'applied';
      readonly state: TState;
      /** Points the move added to the score. */
      readonly points: number;
      /** Events of the variant, in the order they happened. */
      readonly events: readonly TEvent[];
      /** Set when this move ended the game (RN-12, RN-15, RN-24, RN-30). */
      readonly outcome: GameOutcome | null;
    };

/**
 * The rules of a variant, as the engine sees them (RF-02): given a board, a
 * state and a move, say what happens. The engine knows nothing else about the
 * variant, so it has no `if` per variant.
 *
 * `play` receives a copy of the board and may change it; the engine keeps
 * the copy only when the move is applied.
 *
 * Variants extend `BaseGameRules`, which fixes the order of the steps. A rules
 * decorator (time limit, boosters; docs/EXTENSIBILITY.md) implements this
 * interface and wraps another rules object.
 */
export interface IGameRules<
  TCell extends NonNullable<unknown>,
  TCoord extends ICoord,
  TMove,
  TState extends GameState,
  TEvent extends DomainEvent = DomainEvent,
> {
  play(
    board: Board<TCell, TCoord>,
    state: TState,
    move: TMove,
  ): MoveOutcome<TState, TEvent>;
}
