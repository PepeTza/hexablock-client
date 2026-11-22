import type { GameId, PlayerProgress } from './player-progress';

/** Why a game ended when handed to `FinishGameUseCase` (CU-07). */
export type FinishReason = 'victory' | 'defeat' | 'quit';

/** Facts about a finished game passed to the variant's progress model (CU-07). */
export interface FinishedGameSummary {
  readonly gameId: GameId;
  readonly levelId: string | null;
  readonly reason: FinishReason;
  readonly score: number;
  readonly moveCount: number;
  readonly durationMs: number;
  readonly seed: number | null;
}

/** What a variant's progress model decided after evaluating a finished game. */
export interface ProgressEvaluation {
  /** Updated progress to save, or `null` when nothing changed (CU-07 A1). */
  readonly progress: PlayerProgress | null;
  readonly isNewRecord: boolean;
  /** Stars awarded on level completion (Hexa Fit, RN-18), or `null`. */
  readonly stars: number | null;
  /** Next level unlocked by this victory (RN-19, RN-25), or `null`. */
  readonly unlockedLevelId: string | null;
  /** Whether the finished score should be queued for the leaderboard. */
  readonly shouldSubmitScore: boolean;
}

/**
 * Strategy: how a variant updates `PlayerProgress` when a game ends (RF-04,
 * RN-04, CU-07). Variants share or swap models (`HighScoreProgress`,
 * `LevelStarsProgress`, `LevelProgress`) without changing `FinishGameUseCase`.
 */
export interface IProgressModel {
  evaluate(
    current: PlayerProgress,
    summary: FinishedGameSummary,
  ): ProgressEvaluation;
}
