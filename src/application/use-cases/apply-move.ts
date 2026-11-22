import type { GameOutcome } from '@domain/engine/events/domain-event';
import type { GameState } from '@domain/engine/game/game-state';
import type { GameStatus } from '@domain/engine/game/session-states';
import type { IGameSession } from '@domain/engine/game/variant-factory';
import type { GameId } from '@domain/progress/player-progress';

import type { IUseCase } from './use-case';

/** Input handed by the UI when the player performs a move (CU-02). */
export interface ApplyMoveInput<TMove, TState extends GameState = GameState> {
  readonly gameId: GameId;
  readonly engine: IGameSession<TMove, TState>;
  readonly move: TMove;
}

/** Snapshot returned to the UI right after applying the move (CU-02). */
export interface ApplyMoveOutput<TState extends GameState = GameState> {
  readonly state: TState;
  readonly status: GameStatus;
  readonly outcome: GameOutcome | null;
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
    input.engine.applyMove(input.move);
    return {
      state: input.engine.state,
      status: input.engine.status,
      outcome: input.engine.outcome,
    };
  }
}
