import { MergeGamePresenter } from '@adapters/presentation/hexa-merge/merge-game-presenter';
import { Either } from '@application/common/either';
import type { FinishGameOutput } from '@application/use-cases/finish-game';
import { HexCoord } from '@domain/engine/hex/hex-coord';
import {
  startMergeGame,
  type InitialMergeTile,
} from '@domain/variants/hexa-merge/merge-game';
import { Tile } from '@domain/variants/hexa-merge/tile';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { createAppServices, type AppServices } from '../../composition-root';
import type { RootStackParamList } from '../navigation/routes';
import { ServicesProvider } from '../services/ServicesContext';
import { GameResultScreen } from './GameResultScreen';
import { MergeGameScreen } from './MergeGameScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

function touchHistory(
  x0: number,
  y0: number,
  x: number,
  y: number,
  active: boolean,
) {
  return {
    touchHistory: {
      numberActiveTouches: active ? 1 : 0,
      indexOfSingleActiveTouch: 0,
      mostRecentTimeStamp: 100,
      touchBank: [
        {
          touchActive: active,
          startPageX: x0,
          startPageY: y0,
          previousPageX: x0,
          previousPageY: y0,
          currentPageX: x,
          currentPageY: y,
          startTimeStamp: 10,
          previousTimeStamp: 50,
          currentTimeStamp: 100,
        },
      ],
    },
  };
}

async function swipeBoard(dx: number, dy: number) {
  const board = screen.getByTestId('merge-board');
  const startX = 150;
  const startY = 150;
  await fireEvent(
    board,
    'responderGrant',
    touchHistory(startX, startY, startX, startY, true),
  );
  await fireEvent(
    board,
    'responderMove',
    touchHistory(startX, startY, startX + dx, startY + dy, true),
  );
  await fireEvent(
    board,
    'responderRelease',
    touchHistory(startX, startY, startX + dx, startY + dy, false),
  );
}

async function renderMergeScreen(overrides: Partial<AppServices> = {}) {
  const services: AppServices = {
    ...createAppServices(),
    ...overrides,
  };
  await render(
    <ServicesProvider services={services}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="Variant"
            component={MergeGameScreen}
            initialParams={{ gameId: 'hexa-merge', name: 'Hexa Merge' }}
          />
          <Stack.Screen name="GameResult" component={GameResultScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ServicesProvider>,
  );
}

describe('MergeGameScreen', () => {
  it('should_render_initial_tiles_score_and_disabled_undo_when_screen_mounts', async () => {
    // Arrange
    const session = startMergeGame(42, {
      initialTiles: [
        [new HexCoord(0, 0), new Tile(2)],
        [new HexCoord(-1, 0), new Tile(4)],
      ],
    });
    const finishStub = {
      execute: () => Promise.resolve(Either.left(new Error('not over'))),
    };

    // Act
    await renderMergeScreen({
      startMerge: () => new MergeGamePresenter(session, finishStub, () => 0),
    });

    // Assert
    expect(screen.getByText('Score: 0')).toBeTruthy();
    expect(screen.getByText('Moves: 0')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('4')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();
  });

  it('should_slide_tiles_and_enable_undo_when_swiping_in_a_valid_hex_direction', async () => {
    // Arrange
    const session = startMergeGame(42, {
      initialTiles: [
        [new HexCoord(-2, 0), new Tile(2)],
        [new HexCoord(0, 0), new Tile(2)],
      ],
    });
    const finishStub = {
      execute: () => Promise.resolve(Either.left(new Error('not over'))),
    };
    await renderMergeScreen({
      startMerge: () => new MergeGamePresenter(session, finishStub, () => 0),
    });

    // Act
    await swipeBoard(80, 0);

    // Assert
    expect(screen.getByText('Score: 4')).toBeTruthy();
    expect(screen.getByText('Moves: 1')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Undo' })).toBeEnabled();
  });

  it('should_undo_last_move_when_undo_button_is_pressed', async () => {
    // Arrange
    const session = startMergeGame(42, {
      initialTiles: [
        [new HexCoord(-2, 0), new Tile(2)],
        [new HexCoord(0, 0), new Tile(2)],
      ],
    });
    const finishStub = {
      execute: () => Promise.resolve(Either.left(new Error('not over'))),
    };
    await renderMergeScreen({
      startMerge: () => new MergeGamePresenter(session, finishStub, () => 0),
    });
    await swipeBoard(80, 0);
    expect(screen.getByText('Score: 4')).toBeTruthy();

    // Act
    await fireEvent.press(screen.getByRole('button', { name: 'Undo' }));

    // Assert
    expect(screen.getByText('Score: 0')).toBeTruthy();
    expect(screen.getByText('Moves: 0')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();
    expect(screen.getByText('Last move undone.')).toBeTruthy();
  });

  it('should_show_target_reached_notice_while_allowing_play_to_continue_when_target_tile_is_formed', async () => {
    // Arrange
    const session = startMergeGame(42, {
      targetTile: 8,
      initialTiles: [
        [new HexCoord(-2, 0), new Tile(4)],
        [new HexCoord(0, 0), new Tile(4)],
      ],
    });
    const finishStub = {
      execute: () => Promise.resolve(Either.left(new Error('not over'))),
    };
    await renderMergeScreen({
      startMerge: () => new MergeGamePresenter(session, finishStub, () => 0),
    });

    // Act
    await swipeBoard(80, 0);

    // Assert
    expect(
      screen.getByText('Target reached! Keep playing for a higher score.'),
    ).toBeTruthy();
    expect(screen.getByText('Score: 8')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Undo' })).toBeEnabled();
  });

  it('should_navigate_to_game_result_when_no_moves_remain_after_a_swipe', async () => {
    // Arrange
    const almostFull: InitialMergeTile[] = [
      [new HexCoord(-1, 0), new Tile(128)],
      [new HexCoord(0, 0), new Tile(256)],
      [new HexCoord(0, -1), new Tile(4)],
      [new HexCoord(1, -1), new Tile(8)],
      [new HexCoord(-1, 1), new Tile(16)],
      [new HexCoord(0, 1), new Tile(32)],
    ];
    const session = startMergeGame(77, {
      boardRadius: 1,
      initialTiles: almostFull,
      spawnWeights: [{ item: new Tile(512), weight: 1 }],
    });
    const finishResult: FinishGameOutput = {
      score: 0,
      seed: 77,
      reason: 'defeat',
      isNewRecord: false,
      stars: null,
      unlockedLevelId: null,
      saveFailed: false,
    };
    const execute = jest.fn(() => Promise.resolve(Either.right(finishResult)));
    await renderMergeScreen({
      startMerge: () => new MergeGamePresenter(session, { execute }, () => 0),
    });

    // Act
    await swipeBoard(80, 0);

    // Assert
    expect(await screen.findByText('Seed: 77')).toBeTruthy();
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('should_show_status_message_when_finish_game_fails_on_defeat', async () => {
    // Arrange
    const almostFull: InitialMergeTile[] = [
      [new HexCoord(-1, 0), new Tile(128)],
      [new HexCoord(0, 0), new Tile(256)],
      [new HexCoord(0, -1), new Tile(4)],
      [new HexCoord(1, -1), new Tile(8)],
      [new HexCoord(-1, 1), new Tile(16)],
      [new HexCoord(0, 1), new Tile(32)],
    ];
    const session = startMergeGame(77, {
      boardRadius: 1,
      initialTiles: almostFull,
      spawnWeights: [{ item: new Tile(512), weight: 1 }],
    });
    const execute = jest.fn(() =>
      Promise.resolve(Either.left(new Error('storage offline'))),
    );
    await renderMergeScreen({
      startMerge: () => new MergeGamePresenter(session, { execute }, () => 0),
    });

    // Act
    await swipeBoard(80, 0);

    // Assert
    expect(
      await screen.findByText('Game over. The result could not be saved.'),
    ).toBeTruthy();
  });

  it('should_start_with_fixed_seed_when_load_merge_seed_resolves', async () => {
    // Arrange
    const base = createAppServices();
    const startMerge = jest.fn((seed?: number) => base.startMerge(seed));

    // Act
    await renderMergeScreen({
      startMerge,
      loadMergeSeed: () => Promise.resolve(1234),
    });

    // Assert
    expect(await screen.findByText('Score: 0')).toBeTruthy();
    expect(startMerge).toHaveBeenCalledWith(1234);
  });
});
