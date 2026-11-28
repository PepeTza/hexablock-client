import { Either } from '@application/common/either';
import type {
  LoadProgressSummaryInput,
  ProgressSummary,
} from '@application/use-cases/load-progress-summary';
import type { AsyncCommandService } from '@application/use-cases/use-case';

import {
  MainMenuPresenter,
  resolveCarouselSwipe,
  stepCarouselIndex,
  toggleMenuMode,
} from '@adapters/presentation/main-menu/main-menu-presenter';
import type { MenuVariantEntry } from '@adapters/presentation/main-menu/main-menu-view-model';
import { MENU_VARIANTS } from '@adapters/presentation/main-menu/menu-variants';

function createFakeLoadSummary(
  summaries: readonly ProgressSummary[] = [],
): AsyncCommandService<LoadProgressSummaryInput, readonly ProgressSummary[]> {
  return {
    execute: (input) =>
      Promise.resolve(
        Either.right(
          summaries.filter((summary) => input.gameIds.includes(summary.gameId)),
        ),
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

  it('should_list_every_variant_without_progress_labels_when_loading_progress_fails', async () => {
    // Arrange
    const failingLoadSummary: AsyncCommandService<
      LoadProgressSummaryInput,
      readonly ProgressSummary[]
    > = {
      execute: () => Promise.resolve(Either.left(new Error('storage failed'))),
    };
    const rejectingLoadSummary: AsyncCommandService<
      LoadProgressSummaryInput,
      readonly ProgressSummary[]
    > = { execute: () => Promise.reject(new Error('storage unavailable')) };
    const presenterFromLeft = new MainMenuPresenter(
      failingLoadSummary,
      MENU_VARIANTS,
    );
    const presenterFromThrow = new MainMenuPresenter(
      rejectingLoadSummary,
      MENU_VARIANTS,
    );

    // Act
    const viewModel = await presenterFromLeft.load();
    const throwViewModel = await presenterFromThrow.load();

    // Assert
    expect(viewModel.title).toBe('HexaBlock Suite');
    const expectedVariants = MENU_VARIANTS.map((entry) => ({
      gameId: entry.gameId,
      name: entry.name,
      progressLabel: null,
    }));
    expect(viewModel.variants).toEqual(expectedVariants);
    expect(throwViewModel.variants).toEqual(expectedVariants);
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

  it('should_wrap_around_in_both_directions_when_stepping_carousel_index', () => {
    // Arrange
    const count = 4;

    // Act
    const backwardWrap = stepCarouselIndex(0, count, -1);
    const forwardWrap = stepCarouselIndex(3, count, 1);
    const forwardStep = stepCarouselIndex(0, count, 1);
    const backwardStep = stepCarouselIndex(2, count, -1);
    const emptyStep = stepCarouselIndex(0, 0, 1);

    // Assert
    expect(backwardWrap).toBe(3);
    expect(forwardWrap).toBe(0);
    expect(forwardStep).toBe(1);
    expect(backwardStep).toBe(1);
    expect(emptyStep).toBe(0);
  });

  it('should_switch_between_carousel_and_list_when_toggling_menu_mode', () => {
    // Arrange
    const initial = 'carousel';

    // Act
    const toList = toggleMenuMode(initial);
    const backToCarousel = toggleMenuMode(toList);

    // Assert
    expect(toList).toBe('list');
    expect(backToCarousel).toBe('carousel');
  });

  it('should_resolve_swipe_direction_only_when_horizontal_distance_exceeds_threshold', () => {
    // Arrange
    const leftSwipeDx = -50;
    const rightSwipeDx = 50;
    const shortRightDx = 20;
    const shortLeftDx = -20;

    // Act & Assert
    expect(resolveCarouselSwipe(leftSwipeDx)).toBe(1);
    expect(resolveCarouselSwipe(rightSwipeDx)).toBe(-1);
    expect(resolveCarouselSwipe(shortRightDx)).toBe(0);
    expect(resolveCarouselSwipe(shortLeftDx)).toBe(0);
  });
});
