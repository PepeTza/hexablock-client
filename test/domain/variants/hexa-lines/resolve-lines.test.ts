import { Axis } from '@domain/engine/geometry/axis';
import type { IBoardGeometry } from '@domain/engine/geometry/board-geometry';
import { Board } from '@domain/engine/board/board';
import { BoardShape } from '@domain/engine/board/board-shape';
import { HexCoord } from '@domain/engine/hex/hex-coord';
import { HexAxis, HexGeometry } from '@domain/engine/hex/hex-geometry';
import { resolveLines } from '@domain/variants/hexa-lines/resolve-lines';

function makeBoard() {
  const geometry = new HexGeometry();
  return new Board<string, HexCoord>(
    BoardShape.ofRadius(geometry, 4),
    geometry,
  );
}

const state = { score: 20, moveCount: 2, streak: 1 };

describe('resolveLines', () => {
  it.each([HexAxis.Q, HexAxis.R, HexAxis.S])(
    'should_clear_the_entire_row_when_axis_%s_has_a_complete_line',
    (axis) => {
      // Arrange
      const board = makeBoard();
      const edge = new HexCoord(0, -4);
      const line = board.line(edge, axis);
      line.forEach((cell, index) =>
        board.place(cell, index % 2 ? 'red' : 'blue'),
      );

      // Act
      const result = resolveLines(board, state, 1);

      // Assert
      expect(line.every((cell) => board.isEmpty(cell))).toBe(true);
      expect(result.state).toEqual({ ...state, streak: 2 });
      expect(result.resolution).toEqual({
        cellsPlaced: 1,
        linesCleared: 1,
        streak: 2,
      });
      expect(result.events).toEqual([
        { type: 'LineCleared', cells: line, linesCleared: 1 },
      ]);
    },
  );

  it('should_remove_shared_cells_once_when_three_lines_cross', () => {
    // Arrange
    const board = makeBoard();
    const centre = HexCoord.ORIGIN;
    const crossing = board.geometry.axes.flatMap((axis) =>
      board.line(centre, axis),
    );
    crossing.forEach((cell) => board.place(cell, 'red'));
    const survivor = new HexCoord(1, 1);
    board.place(survivor, 'blue');
    const remove = jest.spyOn(board, 'remove');

    // Act
    const result = resolveLines(board, state, 1);

    // Assert
    expect(result.resolution.linesCleared).toBe(3);
    expect(remove).toHaveBeenCalledTimes(25);
    expect(crossing.every((cell) => board.isEmpty(cell))).toBe(true);
    expect(board.cellAt(survivor)).toBe('blue');
    expect(result.events).toHaveLength(1);
    const event = result.events[0];
    expect(event?.type).toBe('LineCleared');
    expect(event?.linesCleared).toBe(3);
    expect(event?.cells).toHaveLength(25);
    expect(new Set(event?.cells.map((cell) => cell.key()))).toEqual(
      new Set(crossing.map((cell) => cell.key())),
    );
  });

  it('should_reset_the_streak_when_a_row_still_has_a_gap', () => {
    // Arrange
    const board = makeBoard();
    const row = board.line(HexCoord.ORIGIN, HexAxis.R);
    const occupied = row.filter((cell) => !cell.equals(HexCoord.ORIGIN));
    occupied.forEach((cell) => board.place(cell, 'red'));

    // Act
    const result = resolveLines(board, state, 4);

    // Assert
    expect(occupied.every((cell) => board.cellAt(cell) === 'red')).toBe(true);
    expect(result.state.streak).toBe(0);
    expect(result.resolution).toEqual({
      cellsPlaced: 4,
      linesCleared: 0,
      streak: 0,
    });
    expect(result.events).toEqual([]);
  });
});

it('should_keep_the_board_coordinate_type_when_clearing_a_non_hex_line', () => {
  // Arrange
  const origin = { column: 0, key: () => '0' };
  const end = { column: 1, key: () => '1' };
  const axis = new Axis('column');
  const geometry: IBoardGeometry<typeof origin> = {
    origin,
    directions: [],
    axes: [axis],
    neighbour: () => {
      throw new RangeError('No directions');
    },
    neighbours: () => [],
    line: (coord, _axis, isInside) =>
      isInside(coord) ? [origin, end].filter(isInside) : [],
    ring: (centre, radius) => (radius === 0 ? [centre] : []),
    translate: (coord) => coord,
  };
  const board = new Board<string, typeof origin>(
    BoardShape.of([origin, end]),
    geometry,
  );
  board.place(origin, 'red');
  board.place(end, 'blue');

  // Act
  const { events } = resolveLines(board, state, 1);

  // Assert
  expect(events[0]?.cells.map(({ column }) => column)).toEqual([0, 1]);
  expect(board.isEmpty(origin)).toBe(true);
  expect(board.isEmpty(end)).toBe(true);
});
