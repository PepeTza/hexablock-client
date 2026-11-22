import { fireEvent, render, screen } from '@testing-library/react-native';

import type { MainMenuViewModel } from '@adapters/presentation/main-menu/main-menu-view-model';

import { MainMenuView } from './MainMenuView';

function createViewModel(): MainMenuViewModel {
  return {
    title: 'HexaBlock Suite',
    variants: [
      { gameId: 'hexa-lines', name: 'Hexa Lines', progressLabel: 'Best: 1200' },
      {
        gameId: 'hexa-fit',
        name: 'Hexa Fit',
        progressLabel: 'Levels completed: 3',
      },
      {
        gameId: 'hexa-sort',
        name: 'Hexa Sort',
        progressLabel: 'Levels completed: 1',
      },
      { gameId: 'hexa-merge', name: 'Hexa Merge', progressLabel: 'Best: 512' },
    ],
  };
}

describe('MainMenuView', () => {
  it('should_show_suite_name_and_four_variants_when_rendered', async () => {
    // Arrange
    const viewModel = createViewModel();

    // Act
    await render(
      <MainMenuView
        viewModel={viewModel}
        onSelectVariant={() => undefined}
        onOpenSettings={() => undefined}
      />,
    );

    // Assert
    expect(
      screen.getByRole('header', { name: 'HexaBlock Suite' }),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Hexa Lines' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Hexa Fit' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Hexa Sort' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Hexa Merge' })).toBeTruthy();
  });

  it('should_call_on_select_variant_with_game_id_when_variant_pressed', async () => {
    // Arrange
    const onSelectVariant = jest.fn();
    await render(
      <MainMenuView
        viewModel={createViewModel()}
        onSelectVariant={onSelectVariant}
        onOpenSettings={() => undefined}
      />,
    );

    // Act
    await fireEvent.press(screen.getByRole('button', { name: 'Hexa Merge' }));

    // Assert
    expect(onSelectVariant).toHaveBeenCalledWith('hexa-merge', 'Hexa Merge');
  });

  it('should_call_on_open_settings_when_settings_pressed', async () => {
    // Arrange
    const onOpenSettings = jest.fn();
    await render(
      <MainMenuView
        viewModel={createViewModel()}
        onSelectVariant={() => undefined}
        onOpenSettings={onOpenSettings}
      />,
    );

    // Act
    await fireEvent.press(screen.getByRole('button', { name: 'Settings' }));

    // Assert
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('should_hide_the_progress_label_when_it_is_missing', async () => {
    // Arrange
    const viewModel: MainMenuViewModel = {
      title: 'HexaBlock Suite',
      variants: [
        { gameId: 'hexa-lines', name: 'Hexa Lines', progressLabel: null },
        {
          gameId: 'hexa-merge',
          name: 'Hexa Merge',
          progressLabel: 'Best: 512',
        },
      ],
    };

    // Act
    await render(
      <MainMenuView
        viewModel={viewModel}
        onSelectVariant={() => undefined}
        onOpenSettings={() => undefined}
      />,
    );

    // Assert
    expect(screen.getByRole('button', { name: 'Hexa Lines' })).toBeTruthy();
    expect(screen.queryByText('null')).toBeNull();
    expect(screen.getAllByText(/Best:|Levels completed:/)).toHaveLength(1);
  });
});
