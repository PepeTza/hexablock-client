import { Board } from '../../engine/board/board';
import { BoardShape } from '../../engine/board/board-shape';
import { Piece } from '../../engine/pieces/piece';
import {
  PieceShape,
  type PieceGeometry,
} from '../../engine/pieces/piece-shape';
import { FitRules } from './fit-rules';

function position(column: number) {
  return { column, key: () => String(column) };
}

it('should_complete_the_figure_when_a_piece_uses_a_non_hex_coordinate', () => {
  // Arrange
  const origin = position(0);
  const target = position(1);
  const geometry: PieceGeometry<typeof origin> = {
    origin,
    directions: [],
    axes: [],
    rotationSteps: 2,
    neighbours: () => [],
    neighbour: () => {
      throw new RangeError('No directions');
    },
    line: () => [],
    ring: (centre, radius) => (radius === 0 ? [centre] : []),
    translate: (coord, from, to) =>
      position(coord.column - from.column + to.column),
    rotate: (coord) => coord,
  };
  const piece = Piece.of(PieceShape.of('single', [origin], geometry));
  const board = new Board<number, typeof origin>(
    BoardShape.of([target]),
    geometry,
  );
  const rules = new FitRules<typeof origin>({ pointsFor: () => 0 });

  // Act
  const result = rules.play(
    board,
    {
      score: 0,
      moveCount: 0,
      placedPieces: [],
      pendingPieces: [{ id: 0, piece }],
    },
    { pieceId: 0, anchor: target },
  );

  // Assert
  expect(result).toMatchObject({
    kind: 'applied',
    outcome: 'victory',
    state: { moveCount: 1, pendingPieces: [] },
  });
  expect(board.cellAt(target)).toBe(0);
});
