import type { DomainEvent } from '../../engine/events/domain-event';
import { Direction } from '../../engine/geometry/direction';
import type { HexBoard } from '../../engine/hex/hex-board';
import { HexCoord } from '../../engine/hex/hex-coord';
import { HexDirection } from '../../engine/hex/hex-geometry';
import { SeededRandom } from '../../engine/random/seeded-random';
import { Snapshot } from '../../engine/state/snapshot';
import {
  createMergeBoard,
  startMergeGame,
  type InitialMergeTile,
  type MergeGameOptions,
} from './merge-game';
import { MergeRules } from './merge-rules';
import { MergeScoringPolicy } from './merge-scoring-policy';
import { slideTiles } from './slide-tiles';
import type { TileSpawned } from './spawn-tile';
import { Tile } from './tile';

const coord = (q: number, r: number) => new HexCoord(q, r);

function isTileSpawned(event: DomainEvent): event is TileSpawned<HexCoord> {
  return (
    event.type === 'TileSpawned' &&
    'cell' in event &&
    'value' in event &&
    typeof event.value === 'number'
  );
}

function occupiedSnapshot(
  board: HexBoard<Tile>,
  excludedCell?: HexCoord,
): Record<string, number> {
  const entries: Array<[string, number]> = [];
  const excludedKey = excludedCell?.key();
  for (const cell of board.shape.coords) {
    if (cell.key() === excludedKey) {
      continue;
    }
    const tile = board.cellAt(cell);
    if (tile !== undefined) {
      entries.push([cell.key(), tile.value]);
    }
  }
  return Object.fromEntries(entries);
}

/**
 * Starts a deterministic Hexa Merge scenario with explicit tiles and tracks
 * the last `TileSpawned` event so slide/merge assertions stay exact without
 * depending on which empty cell the seed picked.
 */
function startScenario(
  initialTiles: readonly InitialMergeTile[],
  options: Omit<MergeGameOptions, 'initialTiles'> = {},
) {
  const game = startMergeGame(1, { ...options, initialTiles });
  let lastSpawned: TileSpawned<HexCoord> | undefined;
  game.subscribe((event) => {
    if (isTileSpawned(event)) {
      lastSpawned = event;
    }
  });
  return {
    game,
    get lastSpawned() {
      return lastSpawned;
    },
  };
}

describe('Hexa Merge slide (HU24)', () => {
  it('should_slide_tiles_to_the_east_edge_when_sliding_east', () => {
    // Arrange
    const scenario = startScenario([
      [coord(-2, 0), new Tile(2)],
      [coord(-1, -1), new Tile(4)],
    ]);

    // Act
    const result = scenario.game.applyMove({ direction: HexDirection.EAST });

    // Assert
    expect(result).toMatchObject({ kind: 'applied', points: 0 });
    expect(scenario.lastSpawned).toBeDefined();
    expect(
      occupiedSnapshot(scenario.game.board, scenario.lastSpawned?.cell),
    ).toEqual({
      '2,0': 2,
      '2,-1': 4,
    });
  });

  it('should_slide_tiles_to_the_south_east_edge_when_sliding_south_east', () => {
    // Arrange
    const scenario = startScenario([
      [coord(0, -2), new Tile(2)],
      [coord(1, -2), new Tile(4)],
    ]);

    // Act
    const result = scenario.game.applyMove({
      direction: HexDirection.SOUTH_EAST,
    });

    // Assert
    expect(result).toMatchObject({ kind: 'applied', points: 0 });
    expect(scenario.lastSpawned).toBeDefined();
    expect(
      occupiedSnapshot(scenario.game.board, scenario.lastSpawned?.cell),
    ).toEqual({
      '0,2': 2,
      '1,1': 4,
    });
  });

  it('should_slide_tiles_to_the_south_west_edge_when_sliding_south_west', () => {
    // Arrange
    const scenario = startScenario([
      [coord(2, -2), new Tile(2)],
      [coord(2, -1), new Tile(4)],
    ]);

    // Act
    const result = scenario.game.applyMove({
      direction: HexDirection.SOUTH_WEST,
    });

    // Assert
    expect(result).toMatchObject({ kind: 'applied', points: 0 });
    expect(scenario.lastSpawned).toBeDefined();
    expect(
      occupiedSnapshot(scenario.game.board, scenario.lastSpawned?.cell),
    ).toEqual({
      '-2,2': 2,
      '-1,2': 4,
    });
  });

  it('should_slide_tiles_to_the_west_edge_when_sliding_west', () => {
    // Arrange
    const scenario = startScenario([
      [coord(2, 0), new Tile(2)],
      [coord(1, 1), new Tile(4)],
    ]);

    // Act
    const result = scenario.game.applyMove({ direction: HexDirection.WEST });

    // Assert
    expect(result).toMatchObject({ kind: 'applied', points: 0 });
    expect(scenario.lastSpawned).toBeDefined();
    expect(
      occupiedSnapshot(scenario.game.board, scenario.lastSpawned?.cell),
    ).toEqual({
      '-2,0': 2,
      '-2,1': 4,
    });
  });

  it('should_slide_tiles_to_the_north_west_edge_when_sliding_north_west', () => {
    // Arrange
    const scenario = startScenario([
      [coord(0, 2), new Tile(2)],
      [coord(-1, 2), new Tile(4)],
    ]);

    // Act
    const result = scenario.game.applyMove({
      direction: HexDirection.NORTH_WEST,
    });

    // Assert
    expect(result).toMatchObject({ kind: 'applied', points: 0 });
    expect(scenario.lastSpawned).toBeDefined();
    expect(
      occupiedSnapshot(scenario.game.board, scenario.lastSpawned?.cell),
    ).toEqual({
      '0,-2': 2,
      '-1,-1': 4,
    });
  });

  it('should_slide_tiles_to_the_north_east_edge_when_sliding_north_east', () => {
    // Arrange
    const scenario = startScenario([
      [coord(-2, 2), new Tile(2)],
      [coord(-2, 1), new Tile(4)],
    ]);

    // Act
    const result = scenario.game.applyMove({
      direction: HexDirection.NORTH_EAST,
    });

    // Assert
    expect(result).toMatchObject({ kind: 'applied', points: 0 });
    expect(scenario.lastSpawned).toBeDefined();
    expect(
      occupiedSnapshot(scenario.game.board, scenario.lastSpawned?.cell),
    ).toEqual({
      '2,-2': 2,
      '1,-2': 4,
    });
  });

  it('should_pack_tiles_in_order_behind_each_other_when_multiple_tiles_share_a_line', () => {
    // Arrange
    const scenario = startScenario([
      [coord(-2, 0), new Tile(2)],
      [coord(0, 0), new Tile(4)],
      [coord(2, 0), new Tile(8)],
    ]);

    // Act
    const result = scenario.game.applyMove({ direction: HexDirection.EAST });

    // Assert
    expect(result).toMatchObject({ kind: 'applied' });
    expect(scenario.lastSpawned).toBeDefined();
    expect(
      occupiedSnapshot(scenario.game.board, scenario.lastSpawned?.cell),
    ).toEqual({
      '2,0': 8,
      '1,0': 4,
      '0,0': 2,
    });
    expect(scenario.game.state.moveCount).toBe(1);
  });

  it('should_advance_every_occupied_line_simultaneously_when_sliding', () => {
    // Arrange
    const scenario = startScenario([
      [coord(-1, -1), new Tile(2)],
      [coord(0, -1), new Tile(4)],
      [coord(-1, 0), new Tile(8)],
      [coord(0, 2), new Tile(16)],
    ]);

    // Act
    const result = scenario.game.applyMove({ direction: HexDirection.EAST });

    // Assert
    expect(result).toMatchObject({ kind: 'applied' });
    expect(scenario.lastSpawned).toBeDefined();
    expect(
      occupiedSnapshot(scenario.game.board, scenario.lastSpawned?.cell),
    ).toEqual({
      '2,-1': 4,
      '1,-1': 2,
      '2,0': 8,
      '0,2': 16,
    });
  });

  it('should_reject_the_move_atomically_when_all_tiles_are_already_against_the_target_edge', () => {
    // Arrange
    const { game } = startScenario([
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
    const { game } = startScenario([[HexCoord.ORIGIN, new Tile(2)]]);
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

describe('Hexa Merge board size (#161)', () => {
  it('should_build_a_radius_two_board_when_no_radius_is_given', () => {
    // Arrange
    const options = {};

    // Act
    const board = createMergeBoard([], options);

    // Assert
    expect(board.shape.coords).toHaveLength(19);
  });

  it('should_build_a_board_of_the_given_radius_when_a_radius_is_given', () => {
    // Arrange
    const options = { boardRadius: 3 };

    // Act
    const board = createMergeBoard([], options);

    // Assert
    expect(board.shape.coords).toHaveLength(37);
  });

  it('should_slide_tiles_to_the_radius_three_edge_when_the_board_has_radius_three', () => {
    // Arrange
    const scenario = startScenario([[coord(-3, 0), new Tile(2)]], {
      boardRadius: 3,
    });

    // Act
    const result = scenario.game.applyMove({ direction: HexDirection.EAST });

    // Assert
    expect(result).toMatchObject({ kind: 'applied' });
    expect(
      occupiedSnapshot(scenario.game.board, scenario.lastSpawned?.cell),
    ).toEqual({ '3,0': 2 });
  });
});

describe('Hexa Merge merge (HU25)', () => {
  it('should_merge_two_equal_tiles_into_one_of_double_value_when_they_collide', () => {
    // Arrange
    const scenario = startScenario([
      [coord(-2, 0), new Tile(2)],
      [coord(0, 0), new Tile(2)],
    ]);

    // Act
    const result = scenario.game.applyMove({ direction: HexDirection.EAST });

    // Assert
    expect(result).toMatchObject({ kind: 'applied' });
    expect(
      occupiedSnapshot(scenario.game.board, scenario.lastSpawned?.cell),
    ).toEqual({ '2,0': 4 });
  });

  it('should_add_the_merged_value_to_the_score_when_two_tiles_merge', () => {
    // Arrange
    const { game } = startScenario([
      [coord(-2, 0), new Tile(2)],
      [coord(0, 0), new Tile(2)],
    ]);

    // Act
    const result = game.applyMove({ direction: HexDirection.EAST });

    // Assert
    expect(result).toMatchObject({ kind: 'applied', points: 4 });
    expect(game.state.score).toBe(4);
  });

  it('should_add_every_merged_value_when_several_merges_happen_in_one_move', () => {
    // Arrange
    const scenario = startScenario([
      [coord(-2, 0), new Tile(2)],
      [coord(0, 0), new Tile(2)],
      [coord(-1, -1), new Tile(4)],
      [coord(1, -1), new Tile(4)],
    ]);

    // Act
    const result = scenario.game.applyMove({ direction: HexDirection.EAST });

    // Assert
    expect(result).toMatchObject({ kind: 'applied', points: 12 });
    expect(
      occupiedSnapshot(scenario.game.board, scenario.lastSpawned?.cell),
    ).toEqual({ '2,0': 4, '2,-1': 8 });
    expect(scenario.game.state.score).toBe(12);
  });

  it('should_not_merge_a_tile_twice_when_a_merged_tile_meets_an_equal_one', () => {
    // Arrange
    const scenario = startScenario([
      [coord(2, 0), new Tile(2)],
      [coord(1, 0), new Tile(2)],
      [coord(0, 0), new Tile(4)],
    ]);

    // Act
    const result = scenario.game.applyMove({ direction: HexDirection.EAST });

    // Assert
    expect(result).toMatchObject({ kind: 'applied', points: 4 });
    expect(
      occupiedSnapshot(scenario.game.board, scenario.lastSpawned?.cell),
    ).toEqual({ '2,0': 4, '1,0': 4 });
  });

  it('should_merge_the_tiles_closest_to_the_edge_first_when_three_equal_tiles_share_a_line', () => {
    // Arrange
    const scenario = startScenario([
      [coord(-2, 0), new Tile(2)],
      [coord(0, 0), new Tile(2)],
      [coord(1, 0), new Tile(2)],
    ]);

    // Act
    const result = scenario.game.applyMove({ direction: HexDirection.EAST });

    // Assert
    expect(result).toMatchObject({ kind: 'applied', points: 4 });
    expect(
      occupiedSnapshot(scenario.game.board, scenario.lastSpawned?.cell),
    ).toEqual({ '2,0': 4, '1,0': 2 });
  });

  it('should_merge_into_two_tiles_when_four_equal_tiles_share_a_line', () => {
    // Arrange
    const scenario = startScenario([
      [coord(-2, 0), new Tile(2)],
      [coord(-1, 0), new Tile(2)],
      [coord(0, 0), new Tile(2)],
      [coord(1, 0), new Tile(2)],
    ]);

    // Act
    const result = scenario.game.applyMove({ direction: HexDirection.EAST });

    // Assert
    expect(result).toMatchObject({ kind: 'applied', points: 8 });
    expect(
      occupiedSnapshot(scenario.game.board, scenario.lastSpawned?.cell),
    ).toEqual({ '2,0': 4, '1,0': 4 });
  });

  it('should_accept_the_move_when_tiles_only_merge_without_sliding', () => {
    // Arrange
    const scenario = startScenario([
      [coord(2, 0), new Tile(2)],
      [coord(1, 0), new Tile(2)],
    ]);

    // Act
    const result = scenario.game.applyMove({ direction: HexDirection.EAST });

    // Assert
    expect(result).toMatchObject({ kind: 'applied', points: 4 });
    expect(
      occupiedSnapshot(scenario.game.board, scenario.lastSpawned?.cell),
    ).toEqual({ '2,0': 4 });
    expect(scenario.game.state.moveCount).toBe(1);
  });

  it('should_emit_a_tile_merged_event_with_cell_and_value_when_tiles_merge', () => {
    // Arrange
    const rules = new MergeRules<HexCoord>(new MergeScoringPolicy<HexCoord>());
    const board = createMergeBoard([
      [coord(-2, 0), new Tile(2)],
      [coord(0, 0), new Tile(2)],
    ]);

    // Act
    const outcome = rules.play(
      board,
      { score: 0, moveCount: 0, source: Snapshot.of(new SeededRandom(1)) },
      { direction: HexDirection.EAST },
    );

    // Assert
    expect(outcome).toMatchObject({ kind: 'applied' });
    if (outcome.kind === 'applied') {
      expect(outcome.events).toContainEqual({
        type: 'TileMerged',
        cell: coord(2, 0),
        value: 4,
      });
    }
  });

  it('should_merge_equal_tiles_on_a_radius_three_board_when_the_board_has_radius_three', () => {
    // Arrange
    const scenario = startScenario(
      [
        [coord(-3, 0), new Tile(2)],
        [coord(0, 0), new Tile(2)],
      ],
      { boardRadius: 3 },
    );

    // Act
    const result = scenario.game.applyMove({ direction: HexDirection.EAST });

    // Assert
    expect(result).toMatchObject({ kind: 'applied', points: 4 });
    expect(
      occupiedSnapshot(scenario.game.board, scenario.lastSpawned?.cell),
    ).toEqual({ '3,0': 4 });
  });
});

describe('Hexa Merge spawn (HU26)', () => {
  it('should_spawn_a_new_tile_and_emit_tile_spawned_when_a_move_changes_the_board', () => {
    // Arrange
    const game = startMergeGame(42, {
      initialTiles: [[coord(-2, 0), new Tile(2)]],
    });
    const spawned: TileSpawned<HexCoord>[] = [];
    game.subscribe((event) => {
      if (isTileSpawned(event)) {
        spawned.push(event);
      }
    });

    // Act
    const result = game.applyMove({ direction: HexDirection.EAST });

    // Assert
    expect(result).toMatchObject({ kind: 'applied' });
    expect(spawned).toHaveLength(1);
    const [tileSpawned] = spawned;
    expect(tileSpawned).toBeDefined();
    if (tileSpawned !== undefined) {
      expect([2, 4]).toContain(tileSpawned.value);
      expect(tileSpawned.cell.key()).not.toBe('2,0');
      expect(game.board.cellAt(tileSpawned.cell)?.value).toBe(
        tileSpawned.value,
      );
    }
    expect(Object.keys(occupiedSnapshot(game.board))).toHaveLength(2);
  });

  it('should_not_spawn_a_tile_or_advance_the_seed_when_a_move_is_rejected', () => {
    // Arrange
    const initialTiles: InitialMergeTile[] = [[coord(2, 0), new Tile(2)]];
    const gameWithReject = startMergeGame(77, { initialTiles });
    const controlGame = startMergeGame(77, { initialTiles });

    // Act
    const rejected = gameWithReject.applyMove({ direction: HexDirection.EAST });
    const afterReject = gameWithReject.applyMove({
      direction: HexDirection.WEST,
    });
    const controlMove = controlGame.applyMove({ direction: HexDirection.WEST });

    // Assert
    expect(rejected).toEqual({
      kind: 'rejected',
      reason: 'Slide does not move any tile',
    });
    expect(afterReject).toMatchObject({ kind: 'applied' });
    expect(controlMove).toMatchObject({ kind: 'applied' });
    expect(occupiedSnapshot(gameWithReject.board)).toEqual(
      occupiedSnapshot(controlGame.board),
    );
  });

  it('should_produce_identical_starting_and_spawned_tiles_when_played_with_the_same_seed', () => {
    // Arrange
    const first = startMergeGame(2026);
    const second = startMergeGame(2026);

    // Act
    const initialFirst = occupiedSnapshot(first.board);
    const initialSecond = occupiedSnapshot(second.board);
    first.applyMove({ direction: HexDirection.EAST });
    first.applyMove({ direction: HexDirection.NORTH_WEST });
    second.applyMove({ direction: HexDirection.EAST });
    second.applyMove({ direction: HexDirection.NORTH_WEST });

    // Assert
    expect(Object.keys(initialFirst)).toHaveLength(2);
    expect(initialFirst).toEqual(initialSecond);
    expect(occupiedSnapshot(first.board)).toEqual(
      occupiedSnapshot(second.board),
    );
  });

  it('should_expose_the_seed_on_the_game_engine_when_started', () => {
    // Arrange & Act
    const game = startMergeGame(31415);

    // Assert
    expect(game.seed).toBe(31415);
  });

  it('should_respect_custom_spawn_weights_when_configured_in_game_options', () => {
    // Arrange
    const game = startMergeGame(9, {
      spawnWeights: [{ item: new Tile(4), weight: 1 }],
    });
    const spawnedValues: number[] = [];
    game.subscribe((event) => {
      if (isTileSpawned(event)) {
        spawnedValues.push(event.value);
      }
    });

    // Act
    const initialValues = Object.values(occupiedSnapshot(game.board));
    game.applyMove({ direction: HexDirection.EAST });

    // Assert
    expect(initialValues).toEqual([4, 4]);
    expect(spawnedValues).toEqual([4]);
  });
});
