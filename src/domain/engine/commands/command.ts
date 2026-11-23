import type { Board } from '../board/board';
import type { GameState } from '../game/game-state';
import type { ICoord } from '../geometry/coord';

/**
 * ISP capability contract for variant `GameState` types whose baseline rules
 * support undo (Hexa Fit and Hexa Merge; Hexa Lines and Hexa Sort omit it).
 *
 * `CommandHistory` also buffers past moves even when `allowancePerMove` is `0`
 * so an in-game booster Decorator can still grant extra undos mid-game via
 * `grantUndo` without modifying variants.
 */
export interface IUndoable {
  readonly undoable: true;
}

/**
 * Command pattern (GoF, RF-07, CU-04, CU-05): encapsulates a single executed
 * move along with the snapshots needed to revert or reapply it without
 * re-running rule validation.
 */
export interface ICommand<TMove = unknown> {
  readonly move: TMove;
  /** Reapplies the command without re-running rule validation (CU-05 step 2). */
  execute(): void;
  /** Reverts the command to the snapshot before the move (CU-04 step 2). */
  undo(): void;
}

/** Board and state pair captured right before or right after a move. */
export interface MoveSnapshot<
  TCell extends NonNullable<unknown>,
  TCoord extends ICoord,
  TState extends GameState,
> {
  readonly board: Board<TCell, TCoord>;
  readonly state: TState;
}

/** Callback used by `ApplyMoveCommand` to restore the engine's active board and state. */
export type RestoreSessionState<
  TCell extends NonNullable<unknown>,
  TCoord extends ICoord,
  TState extends GameState,
> = (board: Board<TCell, TCoord>, state: TState) => void;

/**
 * Command + Prototype (`Board.clone`): captures a validated move together with
 * isolated clones of the board before and after the move, plus the immutable
 * states (which carry any `Snapshot<TSource>` for RNG or piece sources).
 */
export class ApplyMoveCommand<
  TCell extends NonNullable<unknown>,
  TCoord extends ICoord,
  TMove,
  TState extends GameState,
> implements ICommand<TMove> {
  private readonly beforeBoard: Board<TCell, TCoord>;
  private readonly beforeState: TState;
  private readonly afterBoard: Board<TCell, TCoord>;
  private readonly afterState: TState;

  constructor(
    readonly move: TMove,
    before: MoveSnapshot<TCell, TCoord, TState>,
    after: MoveSnapshot<TCell, TCoord, TState>,
    private readonly restore: RestoreSessionState<TCell, TCoord, TState>,
  ) {
    this.beforeBoard = before.board.clone();
    this.beforeState = before.state;
    this.afterBoard = after.board.clone();
    this.afterState = after.state;
  }

  execute(): void {
    this.restore(this.afterBoard.clone(), this.afterState);
  }

  undo(): void {
    this.restore(this.beforeBoard.clone(), this.beforeState);
  }
}
