import type { FinishGameOutput } from '@application/use-cases/finish-game';

import { GameResultPresenter } from './game-result-presenter';

function createFinishOutput(
  overrides: Partial<FinishGameOutput> = {},
): FinishGameOutput {
  return {
    score: 320,
    seed: 42,
    reason: 'victory',
    isNewRecord: false,
    stars: null,
    unlockedLevelId: null,
    saveFailed: false,
    ...overrides,
  };
}

describe('GameResultPresenter', () => {
  it('should_format_victory_with_seed_and_new_record_when_seeded_game_is_won', () => {
    // Arrange
    const presenter = new GameResultPresenter();

    // Act
    const viewModel = presenter.present({
      gameId: 'hexa-merge',
      variantName: 'Hexa Merge',
      levelId: null,
      result: createFinishOutput({
        score: 2048,
        seed: 777,
        reason: 'victory',
        isNewRecord: true,
      }),
    });

    // Assert
    expect(viewModel).toEqual({
      outcome: 'victory',
      title: 'Victory!',
      variantName: 'Hexa Merge',
      scoreLabel: 'Score: 2048',
      newRecordLabel: 'New record!',
      starsLabel: null,
      seedLabel: 'Seed: 777',
      warningLabel: null,
      nextLevelId: null,
    });
  });

  it('should_format_victory_with_stars_and_next_level_when_level_variant_is_won', () => {
    // Arrange
    const presenter = new GameResultPresenter();

    // Act
    const viewModel = presenter.present({
      gameId: 'hexa-fit',
      variantName: 'Hexa Fit',
      levelId: 'fit-01',
      result: createFinishOutput({
        score: 950,
        seed: null,
        reason: 'victory',
        isNewRecord: true,
        stars: 3,
        unlockedLevelId: 'fit-02',
      }),
    });

    // Assert
    expect(viewModel.outcome).toBe('victory');
    expect(viewModel.starsLabel).toBe('Stars: 3 / 3');
    expect(viewModel.seedLabel).toBeNull();
    expect(viewModel.nextLevelId).toBe('fit-02');
  });

  it('should_format_a_sort_victory_without_stars_with_seed_and_next_level', () => {
    // Arrange: Hexa Sort has levels and a seed, but no stars (RN-25).
    const presenter = new GameResultPresenter();

    // Act
    const viewModel = presenter.present({
      gameId: 'hexa-sort',
      variantName: 'Hexa Sort',
      levelId: 'sort-01',
      result: createFinishOutput({
        score: 120,
        seed: 7,
        reason: 'victory',
        isNewRecord: true,
        stars: null,
        unlockedLevelId: 'sort-02',
      }),
    });

    // Assert
    expect(viewModel).toEqual({
      outcome: 'victory',
      title: 'Victory!',
      variantName: 'Hexa Sort',
      scoreLabel: 'Score: 120',
      newRecordLabel: 'New record!',
      starsLabel: null,
      seedLabel: 'Seed: 7',
      warningLabel: null,
      nextLevelId: 'sort-02',
    });
  });

  it('should_hide_seed_when_result_seed_is_null', () => {
    // Arrange
    const presenter = new GameResultPresenter();

    // Act
    const viewModel = presenter.present({
      gameId: 'hexa-fit',
      variantName: 'Hexa Fit',
      levelId: 'fit-01',
      result: createFinishOutput({ seed: null }),
    });

    // Assert
    expect(viewModel.seedLabel).toBeNull();
  });

  it('should_format_defeat_with_seed_and_hide_next_level_when_game_is_lost', () => {
    // Arrange
    const presenter = new GameResultPresenter();

    // Act
    const viewModel = presenter.present({
      gameId: 'hexa-lines',
      variantName: 'Hexa Lines',
      levelId: null,
      result: createFinishOutput({
        score: 410,
        seed: 12345,
        reason: 'defeat',
        unlockedLevelId: 'ignored-on-defeat',
      }),
    });

    // Assert
    expect(viewModel.outcome).toBe('defeat');
    expect(viewModel.title).toBe('Defeat');
    expect(viewModel.seedLabel).toBe('Seed: 12345');
    expect(viewModel.nextLevelId).toBeNull();
  });

  it('should_show_save_warning_when_local_save_failed', () => {
    // Arrange
    const presenter = new GameResultPresenter();

    // Act
    const viewModel = presenter.present({
      gameId: 'hexa-lines',
      variantName: 'Hexa Lines',
      levelId: null,
      result: createFinishOutput({
        reason: 'defeat',
        saveFailed: true,
      }),
    });

    // Assert
    expect(viewModel.warningLabel).toBe(
      'Progress could not be saved on this device.',
    );
  });
});
