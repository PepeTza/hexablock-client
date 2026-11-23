import type { PlayerProgress } from '../../progress/player-progress';
import type {
  FinishedGameSummary,
  IProgressModel,
  ProgressEvaluation,
} from '../../progress/progress-model';

const BASE_SCORE = 1000;
const MIN_SCORE = 100;
const MOVE_COST = 20;
const SECOND_COST = 2;

export function completedFitScore(
  moves: number,
  pieceCount: number,
  durationMs: number,
): number {
  const extraMoves = Math.max(0, moves - pieceCount);
  const seconds = Math.floor(Math.max(0, durationMs) / 1000);
  return Math.max(
    MIN_SCORE,
    BASE_SCORE - MOVE_COST * extraMoves - SECOND_COST * seconds,
  );
}

export interface FitLevelRewards {
  readonly twoStars: number;
  readonly threeStars: number;
  readonly nextLevelId: string | null;
}

/** Strategy: award Fit stars and keep the best result per completed level (RN-18). */
export class FitProgressModel implements IProgressModel {
  constructor(
    private readonly rewardsFor: (id: string) => FitLevelRewards | undefined,
  ) {}

  evaluate(
    current: PlayerProgress,
    summary: FinishedGameSummary,
  ): ProgressEvaluation {
    const levelId = summary.levelId;
    if (summary.reason !== 'victory' || levelId === null) {
      return {
        progress: null,
        isNewRecord: false,
        stars: null,
        unlockedLevelId: null,
        shouldSubmitScore: false,
      };
    }

    const rewards = this.rewardsFor(levelId);
    if (!rewards)
      throw new RangeError(`Missing Hexa Fit rewards for level ${levelId}`);
    const stars =
      summary.score >= rewards.threeStars
        ? 3
        : summary.score >= rewards.twoStars
          ? 2
          : 1;
    const previous = Object.hasOwn(current.levels, levelId)
      ? current.levels[levelId]
      : undefined;
    const firstCompletion = previous?.completed !== true;
    const bestScore = Math.max(previous?.bestScore ?? 0, summary.score);
    const bestStars = Math.max(previous?.stars ?? 0, stars);
    const isNewRecord =
      previous === undefined || bestScore > previous.bestScore;
    const changed =
      firstCompletion || isNewRecord || bestStars !== previous?.stars;

    return {
      progress: changed
        ? {
            ...current,
            levels: {
              ...current.levels,
              [levelId]: { completed: true, bestScore, stars: bestStars },
            },
          }
        : null,
      isNewRecord,
      stars,
      unlockedLevelId: firstCompletion ? rewards.nextLevelId : null,
      shouldSubmitScore: isNewRecord,
    };
  }
}
