import type {
  IVariantFactory,
  VariantStartContext,
} from '../../engine/game/variant-factory';
import type { PlayerProgress } from '../../progress/player-progress';
import type {
  FinishedGameSummary,
  IProgressModel,
} from '../../progress/progress-model';
import { startMergeGame } from './merge-game';
import type { MergeState } from './merge-rules';
import type { SlideMove } from './slide-tiles';

/** Strategy: only replace a saved high score when the new score is greater. */
class MergeProgressModel implements IProgressModel {
  evaluate(current: PlayerProgress, summary: FinishedGameSummary) {
    const isNewRecord = summary.score > current.highScore;
    return {
      progress: isNewRecord ? { ...current, highScore: summary.score } : null,
      isNewRecord,
      stars: null,
      unlockedLevelId: null,
      shouldSubmitScore: summary.score > 0,
    };
  }
}

/** Abstract Factory: creates the Hexa Merge session and its high-score model. */
export class MergeVariantFactory implements IVariantFactory<
  SlideMove,
  MergeState
> {
  readonly gameId = 'hexa-merge';
  readonly usesSeed = true;
  readonly usesLevels = false;

  createEngine({ seed, listeners }: VariantStartContext) {
    if (seed === null) throw new RangeError('Hexa Merge requires a seed');
    return startMergeGame(seed, { listeners });
  }

  createProgressModel() {
    return new MergeProgressModel();
  }
}
