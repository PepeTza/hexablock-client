import type { PlayerProgress } from '../../progress/player-progress';
import type {
  FinishedGameSummary,
  IProgressModel,
  ProgressEvaluation,
} from '../../progress/progress-model';

const NO_CHANGE: ProgressEvaluation = {
  progress: null,
  isNewRecord: false,
  stars: null,
  unlockedLevelId: null,
  shouldSubmitScore: false,
};

/**
 * Strategy: Hexa Sort progress (CU-07). A victory completes the level, keeps
 * its best score and unlocks the next level the first time (RN-25); Hexa
 * Sort has no stars, so they are saved as `0` and reported as `null`. A
 * defeat or a quit changes nothing and sends no score (CU-07 A1).
 */
export class SortProgressModel implements IProgressModel {
  constructor(
    /** The level after `levelId`, or `null` after the last one. */
    private readonly nextLevelFor: (levelId: string) => string | null,
  ) {}

  evaluate(
    current: PlayerProgress,
    summary: FinishedGameSummary,
  ): ProgressEvaluation {
    const levelId = summary.levelId;
    if (summary.reason !== 'victory' || levelId === null) {
      return NO_CHANGE;
    }

    const previous = Object.hasOwn(current.levels, levelId)
      ? current.levels[levelId]
      : undefined;
    const firstCompletion = previous?.completed !== true;
    const isNewRecord =
      previous === undefined || summary.score > previous.bestScore;
    if (!firstCompletion && !isNewRecord) {
      return NO_CHANGE;
    }

    const bestScore = Math.max(previous?.bestScore ?? 0, summary.score);
    return {
      progress: {
        ...current,
        levels: {
          ...current.levels,
          [levelId]: { completed: true, bestScore, stars: 0 },
        },
      },
      isNewRecord,
      stars: null,
      unlockedLevelId: firstCompletion ? this.nextLevelFor(levelId) : null,
      shouldSubmitScore: isNewRecord,
    };
  }
}
