import { MergeGamePresenter } from '@adapters/presentation/hexa-merge/merge-game-presenter';
import { Board } from '@domain/engine/board/board';
import { BoardShape } from '@domain/engine/board/board-shape';
import { CommandHistory } from '@domain/engine/commands/command-history';
import { GameEngine } from '@domain/engine/game/game-engine';
import { HexDirection } from '@domain/engine/hex/hex-geometry';
import { SeededRandom } from '@domain/engine/random/seeded-random';
import { Snapshot } from '@domain/engine/state/snapshot';
import { MergeRules } from '@domain/variants/hexa-merge/merge-rules';
import { MergeScoringPolicy } from '@domain/variants/hexa-merge/merge-scoring-policy';
import type { SlideMove } from '@domain/variants/hexa-merge/slide-tiles';
import { Tile } from '@domain/variants/hexa-merge/tile';
import { HexaMergeTestBuilder } from '@test/builders/hexa-merge-test-builder';
import {
  LineSquareGeometry,
  SQUARE_RIGHT,
  SquareCoord,
} from '@test/builders/square-geometry';
import { createFinishGameStub } from '@test/builders/use-case-test-builder';

describe('MergeGamePresenter', () => {
  it('should_expose_board_tiles_score_and_undo_flag_when_game_starts', () => {
    // Arrange
    const { session } = new HexaMergeTestBuilder()
      .givenSeed(42)
      .givenTiles([
        [0, 0, 2],
        [-1, 0, 4],
      ])
      .build();
    const { finishGame } = createFinishGameStub();
    const presenter = new MergeGamePresenter(session, finishGame, () => 1000);

    // Act
    const { view } = presenter;

    // Assert
    expect(view.board).toHaveLength(19);
    expect(view.score).toBe(0);
    expect(view.moveCount).toBe(0);
    expect(view.targetReached).toBe(false);
    expect(view.canUndo).toBe(false);
    expect(view.isOver).toBe(false);
    expect(view.seed).toBe(42);
    expect(view.board.find((cell) => cell.coord.key() === '0,0')?.value).toBe(
      2,
    );
    expect(view.board.find((cell) => cell.coord.key() === '-1,0')?.value).toBe(
      4,
    );
  });

  it('should_apply_valid_slide_and_enable_undo_when_tiles_can_move', () => {
    // Arrange
    const { session } = new HexaMergeTestBuilder()
      .givenTiles([
        [-2, 0, 2],
        [0, 0, 2],
      ])
      .build();
    const { finishGame } = createFinishGameStub();
    const presenter = new MergeGamePresenter(session, finishGame, () => 1000);

    // Act
    const applied = presenter.slide(HexDirection.EAST);
    const { view } = presenter;

    // Assert
    expect(applied).toBe(true);
    expect(view.score).toBe(4);
    expect(view.moveCount).toBe(1);
    expect(view.canUndo).toBe(true);
    expect(view.board.find((cell) => cell.coord.key() === '2,0')?.value).toBe(
      4,
    );
  });

  it('should_return_false_and_keep_state_when_slide_cannot_move_any_tile', () => {
    // Arrange
    const { session } = new HexaMergeTestBuilder().givenTile(2, 0, 2).build();
    const { finishGame } = createFinishGameStub();
    const presenter = new MergeGamePresenter(session, finishGame, () => 1000);

    // Act
    const applied = presenter.slide(HexDirection.EAST);

    // Assert
    expect(applied).toBe(false);
    expect(presenter.view.moveCount).toBe(0);
    expect(presenter.view.canUndo).toBe(false);
  });

  it('should_restore_previous_board_and_disable_undo_when_undo_is_called', () => {
    // Arrange
    const { session } = new HexaMergeTestBuilder()
      .givenTiles([
        [-2, 0, 2],
        [0, 0, 2],
      ])
      .build();
    const { finishGame } = createFinishGameStub();
    const presenter = new MergeGamePresenter(session, finishGame, () => 1000);
    presenter.slide(HexDirection.EAST);

    // Act
    const undone = presenter.undo();
    const secondUndo = presenter.undo();

    // Assert
    expect(undone).toBe(true);
    expect(secondUndo).toBe(false);
    expect(presenter.view.score).toBe(0);
    expect(presenter.view.moveCount).toBe(0);
    expect(presenter.view.canUndo).toBe(false);
    expect(
      presenter.view.board.find((cell) => cell.coord.key() === '-2,0')?.value,
    ).toBe(2);
  });

  it('should_call_finish_game_once_when_defeat_is_reached', async () => {
    // Arrange
    const { session } = new HexaMergeTestBuilder()
      .givenSeed(99)
      .givenOneMoveFromDefeat()
      .build();
    let currentTime = 1_000;
    const { finishGame, calls } = createFinishGameStub();
    const presenter = new MergeGamePresenter(
      session,
      finishGame,
      () => currentTime,
    );

    // Act
    expect(presenter.finishIfOver()).toBeNull();
    currentTime = 4_500;
    const moved = presenter.slide(HexDirection.EAST);
    const first = presenter.finishIfOver();
    const second = presenter.finishIfOver();
    const outcome = await first;

    // Assert
    expect(moved).toBe(true);
    expect(presenter.view.isOver).toBe(true);
    expect(first).not.toBeNull();
    expect(second).toBe(first);
    expect(calls).toEqual([
      {
        gameId: 'hexa-merge',
        levelId: null,
        reason: 'defeat',
        score: 0,
        moveCount: 1,
        durationMs: 3_500,
        seed: 99,
      },
    ]);
    expect(outcome?.kind).toBe('right');
  });

  it('should_work_with_a_non_hexagonal_coordinate_when_presenting_a_merge_session', () => {
    // Arrange
    const geometry = new LineSquareGeometry();
    const coords = [
      new SquareCoord(0, 0),
      new SquareCoord(1, 0),
      new SquareCoord(2, 0),
    ];
    const board = new Board<Tile, SquareCoord>(BoardShape.of(coords), geometry);
    board.place(new SquareCoord(0, 0), new Tile(2));
    board.place(new SquareCoord(1, 0), new Tile(2));
    const engine = GameEngine.start({
      board,
      state: {
        score: 0,
        moveCount: 0,
        targetReached: false,
        source: Snapshot.of(new SeededRandom(7)),
      },
      rules: new MergeRules<SquareCoord>(new MergeScoringPolicy<SquareCoord>()),
      seed: 7,
      history: new CommandHistory<SlideMove>({
        allowancePerMove: 1,
        allowRedo: false,
      }),
    });
    const { finishGame } = createFinishGameStub();
    const presenter = new MergeGamePresenter(engine, finishGame, () => 0);

    // Act
    const applied = presenter.slide(SQUARE_RIGHT);

    // Assert
    expect(applied).toBe(true);
    expect(presenter.view.score).toBe(4);
    expect(
      presenter.view.board.find((cell) => cell.coord.key() === '2,0')?.value,
    ).toBe(4);
  });
});
