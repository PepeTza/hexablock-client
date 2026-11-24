import type {
  IVariantFactory,
  VariantStartContext,
} from '../../engine/game/variant-factory';
import type { PlayerProgress } from '../../progress/player-progress';
import type {
  FinishedGameSummary,
  IProgressModel,
} from '../../progress/progress-model';
import {
  createLinesGame,
  type LinesGameState,
  type PlacePieceMove,
} from './lines-game';

/** Strategy: only replace a saved high score when the new score is greater. */
class LinesProgressModel implements IProgressModel {
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

/** Abstract Factory: creates the Lines session and its high-score model. */
export class LinesVariantFactory implements IVariantFactory<
  PlacePieceMove,
  LinesGameState
> {
  readonly gameId = 'hexa-lines';
  readonly usesSeed = true;
  readonly usesLevels = false;

  createEngine({ seed, listeners }: VariantStartContext) {
    if (seed === null) throw new RangeError('Hexa Lines requires a seed');
    return createLinesGame(seed, undefined, { listeners });
  }

  createProgressModel() {
    return new LinesProgressModel();
  }
}
