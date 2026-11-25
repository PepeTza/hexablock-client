import { BoardShape } from '../../engine/board/board-shape';
import { Axis } from '../../engine/geometry/axis';
import type { IBoardGeometry } from '../../engine/geometry/board-geometry';
import type { ICoord } from '../../engine/geometry/coord';
import { Direction } from '../../engine/geometry/direction';
import { createSortGame, type SortSetup } from './sort-game';

/**
 * A square cell for the OCP check: Hexa Sort must run on it without any
 * change in its own code.
 */
class SquareCoord implements ICoord {
  constructor(
    readonly x: number,
    readonly y: number,
  ) {}

  key(): string {
    return `${this.x},${this.y}`;
  }
}

const EAST = new Direction('EAST');
const SOUTH = new Direction('SOUTH');
const WEST = new Direction('WEST');
const NORTH = new Direction('NORTH');
const STEP = new Map([
  [EAST, [1, 0]],
  [SOUTH, [0, 1]],
  [WEST, [-1, 0]],
  [NORTH, [0, -1]],
]);

/** Test double: a square grid where each cell has four neighbours. */
class SquareGeometry implements IBoardGeometry<SquareCoord> {
  readonly origin = new SquareCoord(0, 0);
  readonly directions = [EAST, SOUTH, WEST, NORTH];
  readonly axes = [new Axis('ROW')];

  neighbour(coord: SquareCoord, direction: Direction): SquareCoord {
    const [dx = 0, dy = 0] = STEP.get(direction) ?? [];
    return new SquareCoord(coord.x + dx, coord.y + dy);
  }

  neighbours(coord: SquareCoord): SquareCoord[] {
    return this.directions.map((direction) => this.neighbour(coord, direction));
  }

  line(): SquareCoord[] {
    return [];
  }

  ring(): SquareCoord[] {
    return [];
  }

  translate(coord: SquareCoord): SquareCoord {
    return coord;
  }
}

/** A 3 x 3 square board: x and y from 0 to 2. */
function squareBoard(): BoardShape<SquareCoord> {
  const cells: SquareCoord[] = [];
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      cells.push(new SquareCoord(x, y));
    }
  }
  return BoardShape.of(cells);
}

const TRAY = { colors: 3, minHeight: 1, maxHeight: 3, maxColorsPerStack: 1 };
const at = (x: number, y: number) => new SquareCoord(x, y);

function squareSetup(
  extra: Partial<SortSetup<SquareCoord>> = {},
): SortSetup<SquareCoord> {
  return {
    geometry: new SquareGeometry(),
    shape: squareBoard(),
    tray: TRAY,
    ...extra,
  };
}

describe('createSortGame on a square board (OCP)', () => {
  it('should_build_the_given_figure_when_the_geometry_is_square', () => {
    // Act
    const game = createSortGame(1, squareSetup());

    // Assert
    expect(game.board.shape.size).toBe(9);
    expect(game.board.neighbours(at(1, 1))).toHaveLength(4);
  });

  it('should_run_the_cascade_when_the_cells_are_squares', () => {
    // Arrange: the tray stack is one colour (maxColorsPerStack 1); the
    // stack east of the centre has that colour on top.
    const tray = createSortGame(4, squareSetup()).state.tray;
    const top = tray.top();
    const other = (top + 1) % TRAY.colors;
    const game = createSortGame(
      4,
      squareSetup({
        initialStacks: [{ cell: at(2, 1), chips: [other, top] }],
      }),
    );

    // Act
    const result = game.applyMove({ cell: at(1, 1) });

    // Assert: the same rules and cascade work on squares.
    expect(result.kind).toBe('applied');
    expect(game.board.cellAt(at(1, 1))?.chips).toEqual([...tray.chips, top]);
    expect(game.board.cellAt(at(2, 1))?.chips).toEqual([other]);
  });

  it('should_remove_blocked_cells_from_any_figure', () => {
    // Arrange
    const game = createSortGame(1, squareSetup({ blocked: [at(1, 1)] }));

    // Act
    const result = game.applyMove({ cell: at(1, 1) });

    // Assert
    expect(game.board.shape.size).toBe(8);
    expect(result).toMatchObject({
      kind: 'rejected',
      reason: 'Cell is not on the board',
    });
  });
});
