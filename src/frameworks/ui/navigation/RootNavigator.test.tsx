import { Dimensions } from 'react-native';
import { Either } from '@application/common/either';
import type { FinishGameOutput } from '@application/use-cases/finish-game';
import { FitGamePresenter } from '@adapters/presentation/hexa-fit/fit-game-presenter';
import { LinesGamePresenter } from '@adapters/presentation/hexa-lines/lines-game-presenter';
import { createLinesGame } from '@domain/variants/hexa-lines/lines-game';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { createAppServices } from '../../composition-root';
import { FIT_DEMO_FACTORY, FIT_DEMO_ID } from '../../fit-demo';
import { ServicesProvider } from '../services/ServicesContext';
import { RootNavigator } from './RootNavigator';
import {
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LinesGameScreen } from '../screens/LinesGameScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { GameResultScreen } from '../screens/GameResultScreen';
import type { RootStackParamList } from './routes';

const TestStack = createNativeStackNavigator<RootStackParamList>();

describe('RootNavigator', () => {
  it('should_open_lines_with_a_fresh_score_when_the_player_finishes_fit', async () => {
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
    await press('Hexa Lines');
    expect(await screen.findByText('Score: 0')).toBeTruthy();
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

  it('should_open_variant_placeholder_when_an_unimplemented_variant_is_selected', async () => {
    // Arrange
    await render(
      <ServicesProvider services={createAppServices()}>
        <RootNavigator />
      </ServicesProvider>,
    );
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Switch to list view' }),
    );

    // Act
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Hexa Merge' }),
    );

    // Assert
    expect(await screen.findByText('Hexa Merge is coming soon.')).toBeTruthy();
  });

  it('should_fit_the_touch_targets_when_the_lines_tray_has_four_slots', async () => {
    // Arrange
    const game = createLinesGame(42, undefined, { traySize: 4 });
    const services = {
      ...createAppServices(),
      startLines: () =>
        new LinesGamePresenter(
          game,
          {
            execute: () =>
              Promise.resolve(
                Either.left(new Error('Game is still in progress')),
              ),
          },
          () => 0,
        ),
    };

    // Act
    await render(
      <ServicesProvider services={services}>
        <RootNavigator />
      </ServicesProvider>,
    );
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Hexa Lines' }),
    );

    // Assert
    const fourth = await screen.findByRole('button', { name: 'Piece 4' });
    const { width, height } = Dimensions.get('window');
    const edge = Math.max(64, Math.min(width - 20, (height - 220) * 0.85, 480));
    expect(fourth.parent).toHaveStyle({ left: edge * 0.75, width: edge / 4 });
  });

  it('should_play_a_lines_move_when_the_player_opens_lines_from_home', async () => {
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
    expect(await screen.findByText('Score: 0')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Piece 1' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Cell 0,0' }));
    expect(screen.getByText(/^Score: [1-5]$/)).toBeTruthy();
  });

  it.each([
    {
      name: 'should_show_the_result_when_the_last_legal_placement_ends_the_game',
      failure: 'none',
    },
    {
      name: 'should_show_an_inline_error_when_finishing_returns_left',
      failure: 'finish',
    },
    {
      name: 'should_show_the_result_with_a_warning_when_saving_fails',
      failure: 'save',
    },
    {
      name: 'should_keep_the_lines_route_when_finishing_while_settings_is_open',
      failure: 'leave',
    },
  ])('$name', async ({ failure }) => {
    // Arrange
    const game = createLinesGame(42, new Map([['p5-01', 1_000_000]]));
    function nextMove() {
      for (const [slot, piece] of game.state.tray.entries()) {
        if (piece === null) continue;
        const anchor = game.board.shape.coords.find(
          (candidate) =>
            game.preview({ slot, anchor: candidate }).kind === 'applied',
        );
        if (anchor) return { slot, anchor };
      }
      return null;
    }
    let lastMove = null;
    for (let step = 0; step < 80; step++) {
      const move = nextMove();
      if (move === null) break;
      const preview = game.preview(move);
      if (preview.kind === 'applied' && preview.outcome === 'defeat') {
        lastMove = move;
        break;
      }
      game.applyMove(move);
      game.resolutionDone();
    }
    if (lastMove === null)
      throw new Error('Expected a finishing move in the seeded game');
    const base = createAppServices();
    let release: () => void = () => undefined;
    const waitForSettings = new Promise<void>((resolve) => {
      release = resolve;
    });
    const finish = jest.fn(
      async ({ score, seed }: { score: number; seed: number | null }) => {
        if (failure === 'leave') await waitForSettings;
        return failure === 'finish'
          ? Either.left<Error, FinishGameOutput>(
              new Error('Progress unavailable'),
            )
          : Either.right<FinishGameOutput>({
              score,
              seed,
              reason: 'defeat',
              isNewRecord: true,
              stars: null,
              unlockedLevelId: null,
              saveFailed: failure === 'save',
            });
      },
    );

    const services = {
      ...base,
      startLines: () =>
        new LinesGamePresenter(game, { execute: finish }, () => 0),
    };
    const navigation = createNavigationContainerRef<RootStackParamList>();
    if (failure === 'leave') {
      await render(
        <ServicesProvider services={services}>
          <NavigationContainer ref={navigation}>
            <TestStack.Navigator>
              <TestStack.Screen
                name="Variant"
                component={LinesGameScreen}
                initialParams={{ gameId: 'hexa-lines', name: 'Hexa Lines' }}
              />
              <TestStack.Screen name="Settings" component={SettingsScreen} />
              <TestStack.Screen
                name="GameResult"
                component={GameResultScreen}
              />
            </TestStack.Navigator>
          </NavigationContainer>
        </ServicesProvider>,
      );
    } else {
      await render(
        <ServicesProvider services={services}>
          <RootNavigator />
        </ServicesProvider>,
      );
      await screen.findByRole('header', { name: 'HexaBlock Suite' });
      await fireEvent.press(screen.getByRole('button', { name: 'Hexa Lines' }));
    }
    await screen.findByRole('header', { name: /^Score:/ });

    // Act
    await fireEvent.press(
      screen.getByRole('button', { name: `Piece ${lastMove.slot + 1}` }),
    );
    await fireEvent.press(
      screen.getByRole('button', { name: `Cell ${lastMove.anchor.key()}` }),
    );

    // Assert
    if (failure === 'leave') {
      await act(() => navigation.navigate('Settings'));
      await screen.findByText('Settings are coming soon.');
      await act(async () => {
        release();
        await finish.mock.results[0]?.value;
      });
      expect(navigation.getState().routes.map((route) => route.name)).toEqual([
        'Variant',
        'Settings',
      ]);
      await act(() => navigation.goBack());
      expect(await screen.findByText('Seed: 42')).toBeTruthy();
    } else if (failure === 'finish') {
      expect(
        await screen.findByText('Game over. The result could not be saved.'),
      ).toBeTruthy();
      expect(screen.queryByText('Seed: 42')).toBeNull();
    } else {
      expect(await screen.findByText('Seed: 42')).toBeTruthy();
      if (failure === 'save') {
        expect(
          screen.getByText('Progress could not be saved on this device.'),
        ).toBeTruthy();
      }
    }
    expect(finish).toHaveBeenCalledTimes(1);
    expect(finish).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'defeat', gameId: 'hexa-lines' }),
    );
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
