import { LinesGamePresenter } from '@adapters/presentation/hexa-lines/lines-game-presenter';
import { createLinesGame } from '@domain/variants/hexa-lines/lines-game';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { createAppServices } from '../../composition-root';
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
    expect(screen.getByRole('button', { name: 'Piece 1' })).toBeTruthy();
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

  it('should_show_the_result_when_the_last_legal_placement_ends_the_game', async () => {
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
    const finish = jest.fn(
      ({ score, seed }: { score: number; seed: number | null }) =>
        Promise.resolve({
          score,
          seed,
          reason: 'defeat' as const,
          isNewRecord: true,
          stars: null,
          unlockedLevelId: null,
          saveFailed: false,
        }),
    );
    const services = {
      ...base,
      startLines: () =>
        new LinesGamePresenter(game, { execute: finish }, () => 0),
    };
    await render(
      <ServicesProvider services={services}>
        <RootNavigator />
      </ServicesProvider>,
    );
    await screen.findByRole('header', { name: 'HexaBlock Suite' });
    await fireEvent.press(screen.getByRole('button', { name: 'Hexa Lines' }));
    await screen.findByRole('header', { name: /^Score:/ });

    // Act
    await fireEvent.press(
      screen.getByRole('button', { name: `Piece ${lastMove.slot + 1}` }),
    );
    await fireEvent.press(
      screen.getByRole('button', { name: `Cell ${lastMove.anchor.key()}` }),
    );

    // Assert
    expect(await screen.findByText('Seed: 42')).toBeTruthy();
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
