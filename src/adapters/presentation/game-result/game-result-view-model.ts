import type { FinishGameOutput } from '@application/use-cases/finish-game';
import type { GameId } from '@domain/progress/player-progress';

/** Visual outcome category for the game result screen (RF-16, CU-07). */
export type GameResultOutcome = 'victory' | 'defeat';

/** Context passed to the result screen when a game session finishes (CU-07). */
export interface GameResultInput {
  readonly gameId: GameId;
  readonly variantName: string;
  readonly levelId: string | null;
  readonly result: FinishGameOutput;
}

/** Ready-to-render view model consumed by the passive `GameResultView`. */
export interface GameResultViewModel {
  readonly outcome: GameResultOutcome;
  readonly title: string;
  readonly variantName: string;
  readonly scoreLabel: string;
  readonly newRecordLabel: string | null;
  readonly starsLabel: string | null;
  readonly seedLabel: string | null;
  readonly warningLabel: string | null;
  readonly nextLevelId: string | null;
}
