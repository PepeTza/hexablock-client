import { HexCoord } from '../../engine/hex/hex-coord';
import { SeededRandom } from '../../engine/random/seeded-random';
import { createMergeBoard } from './merge-game';
import {
  DEFAULT_MERGE_SPAWN_WEIGHTS,
  interiorCells,
  spawnInitialTiles,
  spawnTile,
  validateSpawnWeights,
} from './spawn-tile';
import { Tile } from './tile';

const coord = (q: number, r: number) => new HexCoord(q, r);

describe('Hexa Merge tile spawning (HU26)', () => {
  it('should_spawn_a_two_or_four_on_an_empty_cell_when_spawning_a_tile', () => {
    // Arrange
    const occupied = coord(0, 0);
    const board = createMergeBoard([[occupied, new Tile(8)]]);
    const random = new SeededRandom(42);

    // Act
    const event = spawnTile(board, random);

    // Assert
    expect(event).not.toBeNull();
    expect(event?.type).toBe('TileSpawned');
    expect(event?.cell.key()).not.toBe(occupied.key());
    expect([2, 4]).toContain(event?.value);
    if (event !== null) {
      expect(board.cellAt(event.cell)?.value).toBe(event.value);
    }
  });

  it('should_follow_the_ninety_ten_ratio_when_spawning_many_tiles', () => {
    // Arrange
    const random = new SeededRandom(12345);
    const trials = 1000;
    let twos = 0;
    let fours = 0;

    // Act
    for (let i = 0; i < trials; i++) {
      const board = createMergeBoard();
      const event = spawnTile(board, random, DEFAULT_MERGE_SPAWN_WEIGHTS);
      if (event?.value === 2) {
        twos += 1;
      } else if (event?.value === 4) {
        fours += 1;
      }
    }

    // Assert
    expect(twos + fours).toBe(trials);
    expect(twos / trials).toBeGreaterThan(0.85);
    expect(twos / trials).toBeLessThan(0.95);
    expect(fours / trials).toBeGreaterThan(0.05);
    expect(fours / trials).toBeLessThan(0.15);
  });

  it('should_return_null_when_the_board_has_no_empty_cells', () => {
    // Arrange
    const board = createMergeBoard();
    for (const cell of board.shape.coords) {
      board.place(cell, new Tile(2));
    }
    const random = new SeededRandom(7);

    // Act
    const event = spawnTile(board, random);

    // Assert
    expect(event).toBeNull();
  });

  it('should_reject_empty_or_non_positive_spawn_weights_when_validating_weights', () => {
    // Arrange
    const empty: Array<{ item: Tile; weight: number }> = [];
    const zeroWeight = [{ item: new Tile(2), weight: 0 }];
    const negativeWeight = [{ item: new Tile(2), weight: -5 }];
    const infiniteWeight = [
      { item: new Tile(2), weight: Number.POSITIVE_INFINITY },
    ];

    // Act
    const validateEmpty = () => validateSpawnWeights(empty);
    const validateZero = () => validateSpawnWeights(zeroWeight);
    const validateNegative = () => validateSpawnWeights(negativeWeight);
    const validateInfinite = () => validateSpawnWeights(infiniteWeight);

    // Assert
    expect(validateEmpty).toThrow(RangeError);
    expect(validateZero).toThrow(RangeError);
    expect(validateNegative).toThrow(RangeError);
    expect(validateInfinite).toThrow(RangeError);
  });

  it('should_place_two_tiles_on_non_border_cells_when_spawning_initial_tiles_with_defaults', () => {
    // Arrange
    const board = createMergeBoard();
    const interiorKeys = new Set(
      interiorCells(board).map((cell) => cell.key()),
    );
    const random = new SeededRandom(99);

    // Act
    const spawned = spawnInitialTiles(board, random);

    // Assert
    expect(interiorKeys.size).toBe(7);
    expect(spawned).toHaveLength(2);
    expect(spawned[0]?.cell.key()).not.toBe(spawned[1]?.cell.key());
    for (const event of spawned) {
      expect(interiorKeys.has(event.cell.key())).toBe(true);
      expect(board.neighbours(event.cell)).toHaveLength(6);
      expect([2, 4]).toContain(event.value);
      expect(board.cellAt(event.cell)?.value).toBe(event.value);
    }
  });

  it('should_place_the_configured_number_of_initial_tiles_when_a_custom_count_is_given', () => {
    // Arrange
    const emptyBoard = createMergeBoard();
    const fullInteriorBoard = createMergeBoard();
    const random = new SeededRandom(11);

    // Act
    const zeroSpawned = spawnInitialTiles(emptyBoard, random, 0);
    const sevenSpawned = spawnInitialTiles(fullInteriorBoard, random, 7);

    // Assert
    expect(zeroSpawned).toHaveLength(0);
    expect(sevenSpawned).toHaveLength(7);
    const distinctKeys = new Set(sevenSpawned.map((event) => event.cell.key()));
    expect(distinctKeys.size).toBe(7);
  });

  it('should_throw_range_error_when_initial_tile_count_exceeds_interior_cells', () => {
    // Arrange
    const radiusTwoBoard = createMergeBoard([], { boardRadius: 2 });
    const radiusOneBoard = createMergeBoard([], { boardRadius: 1 });
    const random = new SeededRandom(3);

    // Act
    const tooManyForRadiusTwo = () =>
      spawnInitialTiles(radiusTwoBoard, random, 8);
    const tooManyForRadiusOne = () =>
      spawnInitialTiles(radiusOneBoard, random, 2);

    // Assert
    expect(tooManyForRadiusTwo).toThrow(RangeError);
    expect(tooManyForRadiusOne).toThrow(RangeError);
  });

  it('should_throw_range_error_when_initial_tile_count_is_negative_or_not_an_integer', () => {
    // Arrange
    const board = createMergeBoard();
    const random = new SeededRandom(5);

    // Act
    const negative = () => spawnInitialTiles(board, random, -1);
    const fractional = () => spawnInitialTiles(board, random, 1.5);

    // Assert
    expect(negative).toThrow(RangeError);
    expect(fractional).toThrow(RangeError);
  });
});
