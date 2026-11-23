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
  it('should_show_centred_variant_card_with_demo_placeholder_in_carousel_by_default', async () => {
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
    expect(screen.getByText('Demo coming soon')).toBeTruthy();
    expect(screen.getByText('Best: 1200')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Hexa Fit' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Hexa Sort' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Hexa Merge' })).toBeNull();
  });

  it('should_wrap_around_in_both_directions_when_previous_and_next_arrows_are_pressed', async () => {
    // Arrange
    await render(
      <MainMenuView
        viewModel={createViewModel()}
        onSelectVariant={() => undefined}
        onOpenSettings={() => undefined}
      />,
    );

    // Act & Assert
    await fireEvent.press(
      screen.getByRole('button', { name: 'Previous variant' }),
    );
    expect(screen.getByRole('button', { name: 'Hexa Merge' })).toBeTruthy();
    expect(screen.getByText('Best: 512')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Next variant' }));
    expect(screen.getByRole('button', { name: 'Hexa Lines' })).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Next variant' }));
    expect(screen.getByRole('button', { name: 'Hexa Fit' })).toBeTruthy();
  });

  it('should_switch_between_carousel_and_list_showing_all_variants_when_toggle_is_pressed', async () => {
    // Arrange
    await render(
      <MainMenuView
        viewModel={createViewModel()}
        onSelectVariant={() => undefined}
        onOpenSettings={() => undefined}
      />,
    );

    // Act
    await fireEvent.press(
      screen.getByRole('button', { name: 'Switch to list view' }),
    );

    // Assert
    expect(screen.getByRole('button', { name: 'Hexa Lines' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Hexa Fit' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Hexa Sort' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Hexa Merge' })).toBeTruthy();
    expect(screen.queryByText('Demo coming soon')).toBeNull();

    // Act
    await fireEvent.press(
      screen.getByRole('button', { name: 'Switch to carousel view' }),
    );

    // Assert
    expect(screen.getByRole('button', { name: 'Hexa Lines' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Hexa Merge' })).toBeNull();
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
    await fireEvent.press(
      screen.getByRole('button', { name: 'Previous variant' }),
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
    expect(screen.queryByText(/Best:|Levels completed:/)).toBeNull();
  });
});
