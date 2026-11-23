import type { IUndoableSession } from '@domain/engine/commands/command';
import type { GameState } from '@domain/engine/game/game-state';
import type { GameStatus } from '@domain/engine/game/session-states';
import type { GameId } from '@domain/progress/player-progress';

import type { IUseCase } from './use-case';

/** Input handed by the UI when the player requests an undo (CU-04). */
export interface UndoMoveInput<TState extends GameState = GameState> {
  readonly gameId: GameId;
  readonly engine: IUndoableSession<TState>;
}

/**
 * Result returned to the UI after an undo request (CU-04): whether a move
 * was reverted (`false` when ignored, CU-04 A1, A2, A4), the current state
 * and status, and the updated button flags (`canUndo`, `canRedo`).
 */
export interface UndoMoveOutput<TState extends GameState = GameState> {
  readonly undone: boolean;
  readonly state: TState;
  readonly status: GameStatus;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
}

/**
 * Generic use case CU-04 (Undo move): delegates an undo request to the
 * active session without variant conditionals (OCP, RF-07).
 *
 * Wrapped with `LoggingUseCaseDecorator` at app start-up (RNF-04, #116).
 */
export class UndoMoveUseCase<
  TState extends GameState = GameState,
> implements IUseCase<UndoMoveInput<TState>, UndoMoveOutput<TState>> {
  execute(input: UndoMoveInput<TState>): UndoMoveOutput<TState> {
    const undone = input.engine.undo();
    return {
      undone,
      state: input.engine.state,
      status: input.engine.status,
      canUndo: input.engine.canUndo,
      canRedo: input.engine.canRedo,
    };
  }
}
