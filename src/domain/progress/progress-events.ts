import type { DomainEvent } from '../engine/events/domain-event';
import type { GameId } from './player-progress';
import type { FinishReason } from './progress-model';

/**
 * The player's progress was evaluated after a game ended, by victory, defeat
 * or quit (CU-07 step 5). Not the engine's `GameOver`, which only says that
 * the rules ended the game; this one comes later and carries the result.
 */
export interface GameFinished extends DomainEvent {
  readonly type: 'GameFinished';
  readonly gameId: GameId;
  readonly reason: FinishReason;
  readonly score: number;
  readonly isNewRecord: boolean;
}

/** A level of Hexa Fit or Hexa Sort was won and its progress evaluated (CU-07). */
export interface LevelCompleted extends DomainEvent {
  readonly type: 'LevelCompleted';
  readonly gameId: GameId;
  readonly levelId: string;
  /** Stars awarded (Hexa Fit, RN-18), or `null` in a variant without stars. */
  readonly stars: number | null;
}

/** Every event `FinishGameUseCase` publishes; exactly one per finished game. */
export type ProgressEvent = GameFinished | LevelCompleted;
