import { FitGamePresenter } from '@adapters/presentation/hexa-fit/fit-game-presenter';
import { Either } from '@application/common/either';
import type { FinishGameOutput } from '@application/use-cases/finish-game';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { createAppServices } from '../../composition-root';
import { FIT_DEMO_FACTORY, FIT_DEMO_ID } from '../../fit-demo';
import { ServicesProvider } from '../services/ServicesContext';
import { RootNavigator } from './RootNavigator';

describe('RootNavigator', () => {
  it('should_edit_the_fit_board_and_reach_victory_when_playing_the_demo', async () => {
    // Arrange
    await render(
      <ServicesProvider services={createAppServices()}>
        <RootNavigator />
      </ServicesProvider>,
    );
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Next variant' }),
    );
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Hexa Fit' }),
    );
    await screen.findByText('Fit demo');
    const press = (name: string) =>
      fireEvent.press(screen.getByRole('button', { name }));

    // Act
    await press('Piece 1');
    await press('Cell 0,0');
    expect(screen.getByText('A piece cell is outside the figure')).toBeTruthy();
    await press('Rotate');
    await press('Cell 0,0');
    expect(screen.getByText('Moves: 1')).toBeTruthy();
    await press('Cell 0,0');
    await press('Cell 1,0');
    expect(screen.getByText('Moves: 2')).toBeTruthy();
    await press('Cell 1,0');
    await press('Remove');
    expect(screen.getByRole('button', { name: 'Piece 1' })).toBeTruthy();
    await press('Undo');
    expect(screen.queryByRole('button', { name: 'Piece 1' })).toBeNull();
    await press('Redo');
    expect(screen.getByRole('button', { name: 'Piece 1' })).toBeTruthy();
    await press('Undo');
    await press('Piece 2');
    await press('Cell -1,0');

    // Assert
    expect(await screen.findByText('Victory!')).toBeTruthy();
    expect(screen.getByText(/^Score: [1-9][0-9]+$/)).toBeTruthy();
    expect(screen.getByText(/^Stars: [1-3] \/ 3$/)).toBeTruthy();

    await press('Main menu');
    await screen.findByRole('header', { name: 'HexaBlock Suite' });
    await press('Switch to list view');
    const fit = await screen.findByRole('button', { name: 'Hexa Fit' });
    expect(fit.props.accessibilityHint).toBe('Levels completed: 1');
  });

  it('should_open_the_playable_fit_demo_when_hexa_fit_is_selected', async () => {
    // Arrange
    await render(
      <ServicesProvider services={createAppServices()}>
        <RootNavigator />
      </ServicesProvider>,
    );
    await screen.findByRole('header', { name: 'HexaBlock Suite' });

    // Act
    await fireEvent.press(screen.getByRole('button', { name: 'Next variant' }));
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Hexa Fit' }),
    );

    // Assert
    expect(await screen.findByText('Fit demo')).toBeTruthy();
    expect(screen.getByText('Moves: 0')).toBeTruthy();
    expect(await screen.findByText(/^Time: [0-9]+:[0-9]{2}$/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Piece 1' })).toBeTruthy();
  });

  it.each([
    {
      name: 'should_show_an_inline_error_when_finishing_fit_returns_left',
      saveFailed: false,
    },
    {
      name: 'should_show_the_fit_result_with_a_warning_when_saving_fails',
      saveFailed: true,
    },
  ])('$name', async ({ saveFailed }) => {
    // Arrange
    const base = createAppServices();
    const execute = jest.fn(() =>
      Promise.resolve(
        saveFailed
          ? Either.right<FinishGameOutput>({
              reason: 'victory',
              score: 1000,
              seed: null,
              stars: 3,
              isNewRecord: true,
              unlockedLevelId: null,
              saveFailed: true,
            })
          : Either.left<Error, FinishGameOutput>(
              new Error('Progress unavailable'),
            ),
      ),
    );
    const services = {
      ...base,
      startFit: () =>
        new FitGamePresenter(
          FIT_DEMO_FACTORY.createEngine(),
          FIT_DEMO_ID,
          { execute },
          () => 0,
        ),
    };
    await render(
      <ServicesProvider services={services}>
        <RootNavigator />
      </ServicesProvider>,
    );
    const press = async (name: string) =>
      fireEvent.press(await screen.findByRole('button', { name }));
    await press('Next variant');
    await press('Hexa Fit');
    await screen.findByText('Fit demo');

    // Act
    await press('Piece 1');
    await press('Rotate');
    await press('Cell 0,0');
    await press('Piece 2');
    await press('Cell 1,0');

    // Assert
    if (saveFailed) {
      expect(await screen.findByText('Victory!')).toBeTruthy();
      expect(screen.getByText('Score: 1000')).toBeTruthy();
      expect(
        screen.getByText('Progress could not be saved on this device.'),
      ).toBeTruthy();
    } else {
      expect(
        await screen.findByText(
          'Figure complete. The result could not be loaded.',
        ),
      ).toBeTruthy();
      expect(screen.queryByText('Victory!')).toBeNull();
      expect(screen.getByText('Moves: 2')).toBeTruthy();
    }
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('should_open_settings_screen_when_settings_pressed_from_home', async () => {
    // Arrange
    await render(
      <ServicesProvider services={createAppServices()}>
        <RootNavigator />
      </ServicesProvider>,
    );
    await screen.findByRole('header', { name: 'HexaBlock Suite' });

    // Act
    await fireEvent.press(screen.getByRole('button', { name: 'Settings' }));

    // Assert
    expect(await screen.findByText('Settings are coming soon.')).toBeTruthy();
  });

  it('should_open_variant_placeholder_when_variant_pressed_from_home', async () => {
    // Arrange
    await render(
      <ServicesProvider services={createAppServices()}>
        <RootNavigator />
      </ServicesProvider>,
    );
    await screen.findByRole('header', { name: 'HexaBlock Suite' });

    // Act
    await fireEvent.press(screen.getByRole('button', { name: 'Hexa Lines' }));

    // Assert
    expect(await screen.findByText('Hexa Lines is coming soon.')).toBeTruthy();
  });

  it('should_navigate_from_game_result_to_home_when_main_menu_pressed', async () => {
    // Arrange
    await render(
      <ServicesProvider services={createAppServices()}>
        <RootNavigator
          initialRouteName="GameResult"
          initialResultParams={{
            gameId: 'hexa-lines',
            variantName: 'Hexa Lines',
            levelId: null,
            result: {
              score: 640,
              seed: 101,
              reason: 'defeat',
              isNewRecord: false,
              stars: null,
              unlockedLevelId: null,
              saveFailed: false,
            },
          }}
        />
      </ServicesProvider>,
    );
    expect(await screen.findByText('Score: 640')).toBeTruthy();
    expect(screen.getByText('Seed: 101')).toBeTruthy();

    // Act
    await fireEvent.press(screen.getByRole('button', { name: 'Main menu' }));

    // Assert
    expect(
      await screen.findByRole('header', { name: 'HexaBlock Suite' }),
    ).toBeTruthy();
  });
});
