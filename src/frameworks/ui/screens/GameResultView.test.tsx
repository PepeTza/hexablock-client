import { fireEvent, render, screen } from '@testing-library/react-native';

import type { GameResultViewModel } from '@adapters/presentation/game-result/game-result-view-model';

import { GameResultView } from './GameResultView';

function createViewModel(
  overrides: Partial<GameResultViewModel> = {},
): GameResultViewModel {
  return {
    outcome: 'victory',
    title: 'Victory!',
    variantName: 'Hexa Sort',
    scoreLabel: 'Score: 740',
    newRecordLabel: 'New record!',
    starsLabel: null,
    seedLabel: 'Seed: 9021',
    warningLabel: null,
    nextLevelId: 'sort-02',
    ...overrides,
  };
}

describe('GameResultView', () => {
  it('should_show_score_seed_and_actions_when_victory_view_renders', async () => {
    // Arrange
    const viewModel = createViewModel();

    // Act
    await render(
      <GameResultView
        viewModel={viewModel}
        onRetry={() => undefined}
        onNextLevel={() => undefined}
        onNewGame={() => undefined}
        onBackToMenu={() => undefined}
      />,
    );

    // Assert
    expect(screen.getByRole('header', { name: 'Victory!' })).toBeTruthy();
    expect(screen.getByText('Hexa Sort')).toBeTruthy();
    expect(screen.getByText('Score: 740')).toBeTruthy();
    expect(screen.getByText('Seed: 9021')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Next level' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'New game' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Main menu' })).toBeTruthy();
  });

  it('should_omit_seed_and_next_level_when_both_are_null', async () => {
    // Arrange
    const viewModel = createViewModel({
      outcome: 'defeat',
      title: 'Defeat',
      variantName: 'Hexa Fit',
      newRecordLabel: null,
      seedLabel: null,
      nextLevelId: null,
    });

    // Act
    await render(
      <GameResultView
        viewModel={viewModel}
        onRetry={() => undefined}
        onNextLevel={() => undefined}
        onNewGame={() => undefined}
        onBackToMenu={() => undefined}
      />,
    );

    // Assert
    expect(screen.getByRole('header', { name: 'Defeat' })).toBeTruthy();
    expect(screen.queryByText(/Seed:/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Next level' })).toBeNull();
  });

  it('should_show_warning_banner_when_warning_label_is_present', async () => {
    // Arrange
    const viewModel = createViewModel({
      warningLabel: 'Progress could not be saved on this device.',
    });

    // Act
    await render(
      <GameResultView
        viewModel={viewModel}
        onRetry={() => undefined}
        onNextLevel={() => undefined}
        onNewGame={() => undefined}
        onBackToMenu={() => undefined}
      />,
    );

    // Assert
    expect(
      screen.getByRole('alert', {
        name: 'Progress could not be saved on this device.',
      }),
    ).toBeTruthy();
  });

  it('should_call_retry_next_level_new_game_and_menu_callbacks_when_buttons_pressed', async () => {
    // Arrange
    const onRetry = jest.fn();
    const onNextLevel = jest.fn();
    const onNewGame = jest.fn();
    const onBackToMenu = jest.fn();
    await render(
      <GameResultView
        viewModel={createViewModel({ nextLevelId: 'sort-03' })}
        onRetry={onRetry}
        onNextLevel={onNextLevel}
        onNewGame={onNewGame}
        onBackToMenu={onBackToMenu}
      />,
    );

    // Act
    await fireEvent.press(screen.getByRole('button', { name: 'Next level' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
    await fireEvent.press(screen.getByRole('button', { name: 'New game' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Main menu' }));

    // Assert
    expect(onNextLevel).toHaveBeenCalledWith('sort-03');
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onNewGame).toHaveBeenCalledTimes(1);
    expect(onBackToMenu).toHaveBeenCalledTimes(1);
  });
});
