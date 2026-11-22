import type { Board } from '../board/board';
import type { ICoord } from '../geometry/coord';
import type { IPrototype } from '../state/prototype';
import { Snapshot } from '../state/snapshot';
import { BaseGameRules, type Resolved } from './base-game-rules';
import type { GameState } from './game-state';

/**
 * The state of a variant that deals pieces or uses randomness while it is
 * played (Hexa Lines, Hexa Sort, Hexa Merge): it keeps its source as a
 * `Snapshot`, so every saved state carries the exact point of its source.
 */
export interface SourcedState<
  TSource extends IPrototype<TSource>,
> extends GameState {
  readonly source: Snapshot<TSource>;
}

/**
 * Template Method + Memento: the rules of a variant that draws from a source
 * (an `IPieceSource` in Lines and Sort, an `IRandomSource` in Merge) during a
 * move.
 *
 * It fills the `resolve` step of `BaseGameRules`: it forks the snapshot of
 * the state, hands the working copy to the variant's `resolveWith`, and always
 * stores the advanced snapshot in the resolved state. The variant never
 * clones and never writes `source`, so it cannot forget either. Because the
 * source travels inside the state, the engine keeps it or drops it together
 * with the state: a rejected move, an error, a preview (CU-03) or going back
 * to an older state (undo, RN-16, RN-31) never changes the pieces a seed
 * deals (RN-05).
 *
 * Only `resolve` receives the source: Lines, Sort and Merge draw there.
 * `resolve` must not be overridden (TypeScript has no `final`). Variants that
 * draw nothing during a move (Hexa Fit) extend `BaseGameRules` directly.
 */
export abstract class SourcedGameRules<
  TCell extends NonNullable<unknown>,
  TCoord extends ICoord,
  TMove,
  TState extends SourcedState<TSource>,
  TResolution,
  TSource extends IPrototype<TSource>,
> extends BaseGameRules<TCell, TCoord, TMove, TState, TResolution> {
  protected resolve(
    board: Board<TCell, TCoord>,
    state: TState,
    move: TMove,
  ): Resolved<TState, TResolution> {
    const source = state.source.fork();
    const resolved = this.resolveWith(board, state, move, source);
    return {
      ...resolved,
      // Always the advanced copy, even if `resolveWith` spread the old one.
      state: { ...resolved.state, source: Snapshot.of(source) },
    };
  }

  /**
   * The consequences of the applied move, drawing from `source` as needed.
   * `source` is a working copy: the state's own snapshot is never advanced.
   */
  protected abstract resolveWith(
    board: Board<TCell, TCoord>,
    state: TState,
    move: TMove,
    source: TSource,
  ): Resolved<TState, TResolution>;
}
