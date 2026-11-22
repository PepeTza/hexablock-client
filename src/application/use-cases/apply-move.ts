import type { GameState } from '@domain/engine/game/game-state';
import type {
  GameStatus,
  MoveResult,
} from '@domain/engine/game/session-states';
import type { IGameSession } from '@domain/engine/game/variant-factory';
import type { GameId } from '@domain/progress/player-progress';

import type { IUseCase } from './use-case';

/** Input handed by the UI when the player performs a move (CU-02). */
export interface ApplyMoveInput<TMove, TState extends GameState = GameState> {
  readonly gameId: GameId;
  readonly engine: IGameSession<TMove, TState>;
  readonly move: TMove;
}

/**
 * What the UI gets right after the move (CU-02): what happened with it
 * (rejected, or applied with its points and pending outcome), and the state
 * and status of the game after it.
 */
export interface ApplyMoveOutput<TState extends GameState = GameState> {
  readonly result: MoveResult;
  readonly state: TState;
  readonly status: GameStatus;
}

/**
 * Generic use case CU-02 (Apply move): delegates a player move to the active
 * `GameEngine` session without knowing which variant is running (OCP).
 *
 * Wrapped with `LoggingUseCaseDecorator` at app start-up so every move of
 * every variant is logged through one aspect (RNF-04, HU11).
 */
export class ApplyMoveUseCase<
  TMove,
  TState extends GameState = GameState,
> implements IUseCase<ApplyMoveInput<TMove, TState>, ApplyMoveOutput<TState>> {
  execute(input: ApplyMoveInput<TMove, TState>): ApplyMoveOutput<TState> {
    const result = input.engine.applyMove(input.move);
    return {
      result,
      state: input.engine.state,
      status: input.engine.status,
    };
  }
}
