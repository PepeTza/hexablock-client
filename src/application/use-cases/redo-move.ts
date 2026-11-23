import type { IUndoableSession } from '@domain/engine/commands/command';
import type { GameState } from '@domain/engine/game/game-state';
import type { GameStatus } from '@domain/engine/game/session-states';
import type { GameId } from '@domain/progress/player-progress';

import type { IUseCase } from './use-case';

/** Input handed by the UI when the player requests a redo (CU-05). */
export interface RedoMoveInput<TState extends GameState = GameState> {
  readonly gameId: GameId;
  readonly engine: IUndoableSession<TState>;
}

/**
 * Result returned to the UI after a redo request (CU-05): whether an undone
 * move was reapplied (`false` when ignored, CU-05 A1, A2), the current
 * state and status, and the updated button flags (`canUndo`, `canRedo`).
 */
export interface RedoMoveOutput<TState extends GameState = GameState> {
  readonly redone: boolean;
  readonly state: TState;
  readonly status: GameStatus;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
}

/**
 * Generic use case CU-05 (Redo move): delegates a redo request to the
 * active session without variant conditionals (OCP, RF-07).
 *
 * Wrapped with `LoggingUseCaseDecorator` at app start-up (RNF-04, #116).
 */
export class RedoMoveUseCase<
  TState extends GameState = GameState,
> implements IUseCase<RedoMoveInput<TState>, RedoMoveOutput<TState>> {
  execute(input: RedoMoveInput<TState>): RedoMoveOutput<TState> {
    const redone = input.engine.redo();
    return {
      redone,
      state: input.engine.state,
      status: input.engine.status,
      canUndo: input.engine.canUndo,
      canRedo: input.engine.canRedo,
    };
  }
}
