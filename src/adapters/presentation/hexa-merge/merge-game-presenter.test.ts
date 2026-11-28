import { Either } from '@application/common/either';
import type { FinishGameOutput } from '@application/use-cases/finish-game';
import type { AsyncCommandService } from '@application/use-cases/use-case';
import { Board } from '@domain/engine/board/board';
import { BoardShape } from '@domain/engine/board/board-shape';
import { CommandHistory } from '@domain/engine/commands/command-history';
import { GameEngine } from '@domain/engine/game/game-engine';
import type { Axis } from '@domain/engine/geometry/axis';
import type { IBoardGeometry } from '@domain/engine/geometry/board-geometry';
import type { ICoord } from '@domain/engine/geometry/coord';
import { Direction } from '@domain/engine/geometry/direction';
import { HexCoord } from '@domain/engine/hex/hex-coord';
import { HexDirection } from '@domain/engine/hex/hex-geometry';
import { SeededRandom } from '@domain/engine/random/seeded-random';
import { Snapshot } from '@domain/engine/state/snapshot';
import type { FinishedGameSummary } from '@domain/progress/progress-model';
import {
  startMergeGame,
  type InitialMergeTile,
} from '@domain/variants/hexa-merge/merge-game';
import { MergeRules } from '@domain/variants/hexa-merge/merge-rules';
import { MergeScoringPolicy } from '@domain/variants/hexa-merge/merge-scoring-policy';
import type { SlideMove } from '@domain/variants/hexa-merge/slide-tiles';
import { Tile } from '@domain/variants/hexa-merge/tile';

import { MergeGamePresenter } from './merge-game-presenter';

function createFinishStub(output: Partial<FinishGameOutput> = {}): {
  readonly finishGame: AsyncCommandService<
    FinishedGameSummary,
    FinishGameOutput
  >;
  readonly calls: FinishedGameSummary[];
} {
  const calls: FinishedGameSummary[] = [];
  const finishGame: AsyncCommandService<FinishedGameSummary, FinishGameOutput> =
    {
      execute: (summary) => {
        calls.push(summary);
        return Promise.resolve(
          Either.right({
            score: summary.score,
            seed: summary.seed,
            reason: summary.reason,
            isNewRecord: true,
            stars: null,
            unlockedLevelId: null,
            saveFailed: false,
            ...output,
          }),
        );
      },
    };
  return { finishGame, calls };
}

class SquareCoord implements ICoord {
  constructor(
    readonly x: number,
    readonly y: number,
  ) {}

  key(): string {
    return `${this.x},${this.y}`;
  }
}

const SQUARE_RIGHT = new Direction('RIGHT');
const SQUARE_LEFT = new Direction('LEFT');

class LineSquareGeometry implements IBoardGeometry<SquareCoord> {
  readonly origin = new SquareCoord(0, 0);
  readonly directions = [SQUARE_RIGHT, SQUARE_LEFT];
  readonly axes: readonly Axis[] = [];

  neighbour(coord: SquareCoord, direction: Direction): SquareCoord {
    return direction === SQUARE_RIGHT
      ? new SquareCoord(coord.x + 1, coord.y)
      : new SquareCoord(coord.x - 1, coord.y);
  }

  neighbours(coord: SquareCoord): SquareCoord[] {
    return this.directions.map((direction) => this.neighbour(coord, direction));
  }

  line(): SquareCoord[] {
    return [];
  }

  ring(centre: SquareCoord, radius: number): SquareCoord[] {
    if (radius === 0) return [centre];
    return [
      new SquareCoord(centre.x - radius, centre.y),
      new SquareCoord(centre.x + radius, centre.y),
    ];
  }

  translate(
    coord: SquareCoord,
    from: SquareCoord,
    to: SquareCoord,
  ): SquareCoord {
    return new SquareCoord(coord.x - from.x + to.x, coord.y - from.y + to.y);
  }
}

describe('MergeGamePresenter', () => {
  it('should_expose_board_tiles_score_and_undo_flag_when_game_starts', () => {
    // Arrange
    const session = startMergeGame(42, {
      initialTiles: [
        [new HexCoord(0, 0), new Tile(2)],
        [new HexCoord(-1, 0), new Tile(4)],
      ],
    });
    const { finishGame } = createFinishStub();
    const presenter = new MergeGamePresenter(session, finishGame, () => 1000);

    // Act
    const { view } = presenter;

    // Assert
    expect(view.board).toHaveLength(19);
    expect(view.score).toBe(0);
    expect(view.moveCount).toBe(0);
    expect(view.targetReached).toBe(false);
    expect(view.canUndo).toBe(false);
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
    const session = startMergeGame(42, {
      initialTiles: [
        [new HexCoord(-2, 0), new Tile(2)],
        [new HexCoord(0, 0), new Tile(2)],
      ],
    });
    const { finishGame } = createFinishStub();
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
    const session = startMergeGame(42, {
      initialTiles: [[new HexCoord(2, 0), new Tile(2)]],
    });
    const { finishGame } = createFinishStub();
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
    const session = startMergeGame(42, {
      initialTiles: [
        [new HexCoord(-2, 0), new Tile(2)],
        [new HexCoord(0, 0), new Tile(2)],
      ],
    });
    const { finishGame } = createFinishStub();
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
    // Arrange: radius-1 board (7 cells), only (1,0) is empty. Sliding EAST
    // shifts (-1,0) and (0,0) east and spawns 512 at (-1,0), leaving zero
    // equal neighbours and zero empty cells.
    const deterministicTiles: InitialMergeTile[] = [
      [new HexCoord(-1, 0), new Tile(128)],
      [new HexCoord(0, 0), new Tile(256)],
      [new HexCoord(0, -1), new Tile(4)],
      [new HexCoord(1, -1), new Tile(8)],
      [new HexCoord(-1, 1), new Tile(16)],
      [new HexCoord(0, 1), new Tile(32)],
    ];
    const session = startMergeGame(99, {
      boardRadius: 1,
      initialTiles: deterministicTiles,
      spawnWeights: [{ item: new Tile(512), weight: 1 }],
    });
    let currentTime = 1_000;
    const { finishGame, calls } = createFinishStub();
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
    const { finishGame } = createFinishStub();
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
