import type {
  LoadProgressSummaryInput,
  ProgressSummary,
} from '@application/use-cases/load-progress-summary';
import type { IUseCase } from '@application/use-cases/use-case';

import { MainMenuPresenter } from './main-menu-presenter';
import type { MenuVariantEntry } from './main-menu-view-model';
import { MENU_VARIANTS } from './menu-variants';

function createFakeLoadSummary(
  summaries: readonly ProgressSummary[] = [],
): IUseCase<LoadProgressSummaryInput, Promise<readonly ProgressSummary[]>> {
  return {
    execute: (input) =>
      Promise.resolve(
        summaries.filter((summary) => input.gameIds.includes(summary.gameId)),
      ),
  };
}

describe('MainMenuPresenter', () => {
  it('should_list_variants_in_configured_order_when_loaded', async () => {
    // Arrange
    const presenter = new MainMenuPresenter(
      createFakeLoadSummary(),
      MENU_VARIANTS,
    );

    // Act
    const viewModel = await presenter.load();

    // Assert
    expect(viewModel.title).toBe('HexaBlock Suite');
    expect(viewModel.variants.map((variant) => variant.gameId)).toEqual([
      'hexa-lines',
      'hexa-fit',
      'hexa-sort',
      'hexa-merge',
    ]);
  });

  it('should_show_high_score_label_when_variant_tracks_high_score', async () => {
    // Arrange
    const presenter = new MainMenuPresenter(
      createFakeLoadSummary([
        { gameId: 'hexa-lines', highScore: 1450, completedLevels: 0 },
      ]),
      [
        {
          gameId: 'hexa-lines',
          name: 'Hexa Lines',
          progressKind: 'high-score',
        },
      ],
    );

    // Act
    const viewModel = await presenter.load();

    // Assert
    expect(viewModel.variants).toEqual([
      {
        gameId: 'hexa-lines',
        name: 'Hexa Lines',
        progressLabel: 'Best: 1450',
      },
    ]);
  });

  it('should_show_completed_levels_label_when_variant_tracks_levels', async () => {
    // Arrange
    const presenter = new MainMenuPresenter(
      createFakeLoadSummary([
        { gameId: 'hexa-fit', highScore: 0, completedLevels: 4 },
      ]),
      [{ gameId: 'hexa-fit', name: 'Hexa Fit', progressKind: 'levels' }],
    );

    // Act
    const viewModel = await presenter.load();

    // Assert
    expect(viewModel.variants).toEqual([
      {
        gameId: 'hexa-fit',
        name: 'Hexa Fit',
        progressLabel: 'Levels completed: 4',
      },
    ]);
  });

  it('should_list_new_variant_when_its_entry_is_added_to_configuration', async () => {
    // Arrange
    const entries: readonly MenuVariantEntry[] = [
      ...MENU_VARIANTS,
      { gameId: 'hexa-quest', name: 'Hexa Quest', progressKind: 'levels' },
    ];
    const presenter = new MainMenuPresenter(
      createFakeLoadSummary([
        { gameId: 'hexa-quest', highScore: 0, completedLevels: 2 },
      ]),
      entries,
    );

    // Act
    const viewModel = await presenter.load();

    // Assert
    expect(viewModel.variants).toHaveLength(5);
    expect(viewModel.variants[4]).toEqual({
      gameId: 'hexa-quest',
      name: 'Hexa Quest',
      progressLabel: 'Levels completed: 2',
    });
  });
});
