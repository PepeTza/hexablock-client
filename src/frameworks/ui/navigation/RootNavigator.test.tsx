import { Either } from '@application/common/either';
import type { FinishGameOutput } from '@application/use-cases/finish-game';
import { LinesGamePresenter } from '@adapters/presentation/hexa-lines/lines-game-presenter';
import { createLinesGame } from '@domain/variants/hexa-lines/lines-game';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { createAppServices } from '../../composition-root';
import { ServicesProvider } from '../services/ServicesContext';
import { RootNavigator } from './RootNavigator';

describe('RootNavigator', () => {
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
      await screen.findByRole('button', { name: 'Hexa Sort' }),
    );

    // Assert
    expect(await screen.findByText('Hexa Sort is coming soon.')).toBeTruthy();
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
    const finish = jest.fn(
      ({ score, seed }: { score: number; seed: number | null }) =>
        Promise.resolve(
          failure === 'finish'
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
              }),
        ),
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
    if (failure === 'finish') {
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
