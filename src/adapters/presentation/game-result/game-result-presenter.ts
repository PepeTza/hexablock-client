import type {
  GameResultInput,
  GameResultOutcome,
  GameResultViewModel,
} from './game-result-view-model';

const SAVE_FAILED_WARNING = 'Progress could not be saved on this device.';

/**
 * Presenter: translates `FinishGameOutput` and variant context into a
 * ready-to-render `GameResultViewModel` for the victory and defeat screen
 * without branching on `gameId` (RF-16, CU-07, RN-05, OCP).
 */
export class GameResultPresenter {
  present(input: GameResultInput): GameResultViewModel {
    const { result, variantName } = input;
    const isVictory = result.reason === 'victory';
    const outcome: GameResultOutcome = isVictory ? 'victory' : 'defeat';

    return {
      outcome,
      title: isVictory ? 'Victory!' : 'Defeat',
      variantName,
      scoreLabel: `Score: ${result.score}`,
      newRecordLabel: result.isNewRecord ? 'New record!' : null,
      starsLabel: result.stars !== null ? `Stars: ${result.stars} / 3` : null,
      seedLabel: result.seed !== null ? `Seed: ${result.seed}` : null,
      warningLabel: result.saveFailed ? SAVE_FAILED_WARNING : null,
      nextLevelId: isVictory ? result.unlockedLevelId : null,
    };
  }
}
