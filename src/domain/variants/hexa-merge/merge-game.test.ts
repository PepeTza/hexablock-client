import { Direction } from '../../engine/geometry/direction';
import type { HexBoard } from '../../engine/hex/hex-board';
import { HexCoord } from '../../engine/hex/hex-coord';
import { HexDirection } from '../../engine/hex/hex-geometry';
import { createMergeBoard, startMergeGame } from './merge-game';
import { slideTiles } from './slide-tiles';
import { Tile } from './tile';

const coord = (q: number, r: number) => new HexCoord(q, r);

function occupiedSnapshot(board: HexBoard<Tile>): Record<string, number> {
  const entries: Array<[string, number]> = [];
  for (const cell of board.shape.coords) {
    const tile = board.cellAt(cell);
    if (tile !== undefined) {
      entries.push([cell.key(), tile.value]);
    }
  }
  return Object.fromEntries(entries);
}

describe('Hexa Merge slide (HU24)', () => {
  it('should_slide_tiles_to_the_east_edge_when_sliding_east', () => {
    // Arrange
    const game = startMergeGame([
      [coord(-2, 0), new Tile(2)],
      [coord(-1, -1), new Tile(4)],
    ]);

    // Act
    const result = game.applyMove({ direction: HexDirection.EAST });

    // Assert
    expect(result).toMatchObject({ kind: 'applied', points: 0 });
    expect(occupiedSnapshot(game.board)).toEqual({
      '2,0': 2,
      '2,-1': 4,
    });
  });

  it('should_slide_tiles_to_the_south_east_edge_when_sliding_south_east', () => {
    // Arrange
    const game = startMergeGame([
      [coord(0, -2), new Tile(2)],
      [coord(1, -2), new Tile(4)],
    ]);

    // Act
    const result = game.applyMove({ direction: HexDirection.SOUTH_EAST });

    // Assert
    expect(result).toMatchObject({ kind: 'applied', points: 0 });
    expect(occupiedSnapshot(game.board)).toEqual({
      '0,2': 2,
      '1,1': 4,
    });
  });

  it('should_slide_tiles_to_the_south_west_edge_when_sliding_south_west', () => {
    // Arrange
    const game = startMergeGame([
      [coord(2, -2), new Tile(2)],
      [coord(2, -1), new Tile(4)],
    ]);

    // Act
    const result = game.applyMove({ direction: HexDirection.SOUTH_WEST });

    // Assert
    expect(result).toMatchObject({ kind: 'applied', points: 0 });
    expect(occupiedSnapshot(game.board)).toEqual({
      '-2,2': 2,
      '-1,2': 4,
    });
  });

  it('should_slide_tiles_to_the_west_edge_when_sliding_west', () => {
    // Arrange
    const game = startMergeGame([
      [coord(2, 0), new Tile(2)],
      [coord(1, 1), new Tile(4)],
    ]);

    // Act
    const result = game.applyMove({ direction: HexDirection.WEST });

    // Assert
    expect(result).toMatchObject({ kind: 'applied', points: 0 });
    expect(occupiedSnapshot(game.board)).toEqual({
      '-2,0': 2,
      '-2,1': 4,
    });
  });

  it('should_slide_tiles_to_the_north_west_edge_when_sliding_north_west', () => {
    // Arrange
    const game = startMergeGame([
      [coord(0, 2), new Tile(2)],
      [coord(-1, 2), new Tile(4)],
    ]);

    // Act
    const result = game.applyMove({ direction: HexDirection.NORTH_WEST });

    // Assert
    expect(result).toMatchObject({ kind: 'applied', points: 0 });
    expect(occupiedSnapshot(game.board)).toEqual({
      '0,-2': 2,
      '-1,-1': 4,
    });
  });

  it('should_slide_tiles_to_the_north_east_edge_when_sliding_north_east', () => {
    // Arrange
    const game = startMergeGame([
      [coord(-2, 2), new Tile(2)],
      [coord(-2, 1), new Tile(4)],
    ]);

    // Act
    const result = game.applyMove({ direction: HexDirection.NORTH_EAST });

    // Assert
    expect(result).toMatchObject({ kind: 'applied', points: 0 });
    expect(occupiedSnapshot(game.board)).toEqual({
      '2,-2': 2,
      '1,-2': 4,
    });
  });

  it('should_pack_tiles_in_order_behind_each_other_when_multiple_tiles_share_a_line', () => {
    // Arrange
    const game = startMergeGame([
      [coord(-2, 0), new Tile(2)],
      [coord(0, 0), new Tile(4)],
      [coord(2, 0), new Tile(8)],
    ]);

    // Act
    const result = game.applyMove({ direction: HexDirection.EAST });

    // Assert
    expect(result).toMatchObject({ kind: 'applied' });
    expect(occupiedSnapshot(game.board)).toEqual({
      '2,0': 8,
      '1,0': 4,
      '0,0': 2,
    });
    expect(game.state.moveCount).toBe(1);
  });

  it('should_advance_every_occupied_line_simultaneously_when_sliding', () => {
    // Arrange
    const game = startMergeGame([
      [coord(-1, -1), new Tile(2)],
      [coord(0, -1), new Tile(4)],
      [coord(-1, 0), new Tile(8)],
      [coord(0, 2), new Tile(16)],
    ]);

    // Act
    const result = game.applyMove({ direction: HexDirection.EAST });

    // Assert
    expect(result).toMatchObject({ kind: 'applied' });
    expect(occupiedSnapshot(game.board)).toEqual({
      '2,-1': 4,
      '1,-1': 2,
      '2,0': 8,
      '0,2': 16,
    });
  });

  it('should_reject_the_move_atomically_when_all_tiles_are_already_against_the_target_edge', () => {
    // Arrange
    const game = startMergeGame([
      [coord(2, 0), new Tile(2)],
      [coord(1, 0), new Tile(4)],
      [coord(0, 2), new Tile(8)],
    ]);
    const stateBefore = game.state;

    // Act
    const result = game.applyMove({ direction: HexDirection.EAST });

    // Assert
    expect(result).toEqual({
      kind: 'rejected',
      reason: 'Slide does not move any tile',
    });
    expect(game.state).toBe(stateBefore);
    expect(occupiedSnapshot(game.board)).toEqual({
      '2,0': 2,
      '1,0': 4,
      '0,2': 8,
    });
  });

  it('should_reject_the_move_when_the_direction_does_not_belong_to_the_board_geometry', () => {
    // Arrange
    const game = startMergeGame([[HexCoord.ORIGIN, new Tile(2)]]);
    const foreignDirection = new Direction('UP');

    // Act
    const result = game.applyMove({ direction: foreignDirection });

    // Assert
    expect(result).toEqual({
      kind: 'rejected',
      reason: 'Slide direction does not belong to the board geometry',
    });
    expect(game.state.moveCount).toBe(0);
  });

  it('should_throw_range_error_when_sliding_directly_with_a_foreign_direction', () => {
    // Arrange
    const board = createMergeBoard([[HexCoord.ORIGIN, new Tile(2)]]);
    const foreignDirection = new Direction('UP');

    // Act
    const slide = () => slideTiles(board, foreignDirection);

    // Assert
    expect(slide).toThrow(RangeError);
  });
});
