import { BoardShape } from '@domain/engine/board/board-shape';
import { HexGeometry } from '@domain/engine/hex/hex-geometry';

import { cellCenter, findDropCenter, pointToCell } from './hex-projection';

describe('Skia spike projection', () => {
  const board = BoardShape.ofRadius(new HexGeometry(), 4);
  const offsets = [
    { q: 0, r: 0 },
    { q: 1, r: 0 },
    { q: 0, r: 1 },
  ];
  const origin = { x: 180, y: 180 };

  it('should_round_trip_when_projecting_each_board_cell', () => {
    // Arrange
    const size = 20;

    // Act
    const cells = board.coords.map(({ q, r }) =>
      pointToCell(cellCenter({ q, r }, origin, size), origin, size),
    );

    // Assert
    expect(cells).toHaveLength(61);
    expect(cells).toEqual(board.coords.map(({ q, r }) => ({ q, r })));
  });

  it('should_snap_to_the_center_when_the_piece_fits', () => {
    // Arrange
    const drop = { x: 183, y: 178 };

    // Act
    const center = findDropCenter(drop, origin, 20, board.coords, offsets);

    // Assert
    expect(center).toEqual(origin);
  });

  it('should_reject_a_drop_when_an_offset_is_outside_the_board', () => {
    // Arrange
    const drop = cellCenter({ q: 4, r: 0 }, origin, 20);

    // Act
    const center = findDropCenter(drop, origin, 20, board.coords, offsets);

    // Assert
    expect(center).toBeNull();
  });
});
