import { BoardShape } from '@domain/engine/board/board-shape';
import { HexCoord } from '@domain/engine/hex/hex-coord';
import { HexGeometry } from '@domain/engine/hex/hex-geometry';

import { HexBoardProjection } from './hex-board-projection';

describe('HexBoardProjection', () => {
  it('should_round_trip_when_projecting_all_61_board_cells', () => {
    // Arrange
    const shape = BoardShape.ofRadius(new HexGeometry(), 4);
    const projection = new HexBoardProjection({ x: 143, y: 185 }, 26);

    // Act
    const roundTrips = shape.coords.map((coord) =>
      projection.coordAt(projection.centerOf(coord)),
    );

    // Assert
    expect(roundTrips).toEqual(shape.coords);
    expect(roundTrips).toHaveLength(61);
  });

  it('should_choose_the_adjacent_cell_when_the_pointer_is_past_the_boundary', () => {
    // Arrange
    const projection = new HexBoardProjection({ x: 0, y: 0 }, 20);

    // Act
    const coord = projection.coordAt({ x: 19, y: 0 });

    // Assert
    expect(coord).toEqual(new HexCoord(1, 0));
  });

  it('should_reject_a_non_positive_cell_size_when_constructed', () => {
    // Arrange
    const origin = { x: 0, y: 0 };

    // Act and assert
    expect(() => new HexBoardProjection(origin, 0)).toThrow(RangeError);
  });
});
