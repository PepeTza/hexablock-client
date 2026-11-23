import { Board } from '../../engine/board/board';
import { BoardShape } from '../../engine/board/board-shape';
import { HexCoord } from '../../engine/hex/hex-coord';
import { HexAxis, HexGeometry } from '../../engine/hex/hex-geometry';
import { resolveLines } from './resolve-lines';

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
