import type { IUndoableSession } from '@domain/engine/commands/command';
import type { GameState } from '@domain/engine/game/game-state';
import type { GameStatus } from '@domain/engine/game/session-states';
import type { GameId } from '@domain/progress/player-progress';

import { Either } from '../common/either';
import type { CommandService } from './use-case';

/** Command handed by the UI when the player requests a redo (CU-05). */
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
 */
export class RedoMoveUseCase<
  TState extends GameState = GameState,
> implements CommandService<RedoMoveInput<TState>, RedoMoveOutput<TState>> {
  execute(input: RedoMoveInput<TState>): Either<Error, RedoMoveOutput<TState>> {
    const redone = input.engine.redo();
    return Either.right({
      redone,
      state: input.engine.state,
      status: input.engine.status,
      canUndo: input.engine.canUndo,
      canRedo: input.engine.canRedo,
    });
  }
}
