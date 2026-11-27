import { Board } from '../../engine/board/board';
import { BoardShape } from '../../engine/board/board-shape';
import type { DomainEvent } from '../../engine/events/domain-event';
import { GameEngine } from '../../engine/game/game-engine';
import { Axis } from '../../engine/geometry/axis';
import type { IBoardGeometry } from '../../engine/geometry/board-geometry';
import type { ICoord } from '../../engine/geometry/coord';
import { Direction } from '../../engine/geometry/direction';
import { SeededRandom } from '../../engine/random/seeded-random';
import { Snapshot } from '../../engine/state/snapshot';
import { MergeRules, type TargetReached } from './merge-rules';
import type { TileSpawned } from './spawn-tile';
import { Tile } from './tile';

function isTileSpawned(event: DomainEvent): event is TileSpawned<SquareCoord> {
  return (
    event.type === 'TileSpawned' &&
    'cell' in event &&
    'value' in event &&
    typeof event.value === 'number'
  );
}

function isTargetReached(event: DomainEvent): event is TargetReached {
  return (
    event.type === 'TargetReached' &&
    'target' in event &&
    typeof event.target === 'number'
  );
}

/**
 * A square cell for the OCP check (RNF-14): `MergeRules` must run on it
 * without any change in its own code.
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

const at = (x: number, y: number) => new SquareCoord(x, y);

/** Starts a game on a 3 x 3 square board (x and y from 0 to 2). */
function startSquareGame(
  tiles: ReadonlyArray<readonly [SquareCoord, Tile]>,
  spawnWeights?: readonly { readonly item: Tile; readonly weight: number }[],
  targetTile?: number,
) {
  const cells: SquareCoord[] = [];
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      cells.push(at(x, y));
    }
  }
  const board = new Board<Tile, SquareCoord>(
    BoardShape.of(cells),
    new SquareGeometry(),
  );
  for (const [coord, tile] of tiles) {
    board.place(coord, tile);
  }
  return GameEngine.start({
    board,
    state: {
      score: 0,
      moveCount: 0,
      targetReached: false,
      source: Snapshot.of(new SeededRandom(1)),
    },
    rules: new MergeRules<SquareCoord>(
      { pointsFor: () => 0 },
      spawnWeights,
      targetTile,
    ),
    seed: 1,
  });
}

describe('MergeRules on a square board (RNF-14)', () => {
  it('should_slide_the_tile_to_the_far_edge_when_merge_rules_play_on_a_square_board', () => {
    // Arrange
    const game = startSquareGame([[at(0, 0), new Tile(2)]]);
    let spawned: TileSpawned<SquareCoord> | undefined;
    game.subscribe((event) => {
      if (isTileSpawned(event)) {
        spawned = event;
      }
    });

    // Act
    const result = game.applyMove({ direction: EAST });

    // Assert
    expect(result).toMatchObject({ kind: 'applied' });
    expect(game.board.cellAt(at(2, 0))?.value).toBe(2);
    if (spawned?.cell.key() !== at(0, 0).key()) {
      expect(game.board.cellAt(at(0, 0))).toBeUndefined();
    }
    expect(game.state.moveCount).toBe(1);
  });

  it('should_reject_the_move_when_no_tile_can_slide_on_a_square_board', () => {
    // Arrange
    const game = startSquareGame([[at(2, 0), new Tile(2)]]);

    // Act
    const result = game.applyMove({ direction: EAST });

    // Assert
    expect(result).toEqual({
      kind: 'rejected',
      reason: 'Slide does not move any tile',
    });
    expect(game.state.moveCount).toBe(0);
  });

  it('should_reject_the_move_when_the_direction_is_not_square', () => {
    // Arrange
    const game = startSquareGame([[at(0, 0), new Tile(2)]]);
    const northEast = new Direction('NORTH_EAST');

    // Act
    const result = game.applyMove({ direction: northEast });

    // Assert
    expect(result).toEqual({
      kind: 'rejected',
      reason: 'Slide direction does not belong to the board geometry',
    });
    expect(game.state.moveCount).toBe(0);
  });

  it('should_merge_equal_tiles_on_a_square_board_when_merge_rules_play_on_it', () => {
    // Arrange
    const game = startSquareGame([
      [at(0, 0), new Tile(2)],
      [at(2, 0), new Tile(2)],
    ]);
    let spawned: TileSpawned<SquareCoord> | undefined;
    game.subscribe((event) => {
      if (isTileSpawned(event)) {
        spawned = event;
      }
    });

    // Act
    const result = game.applyMove({ direction: EAST });

    // Assert
    expect(result).toMatchObject({ kind: 'applied' });
    expect(game.board.cellAt(at(2, 0))?.value).toBe(4);
    if (spawned?.cell.key() !== at(0, 0).key()) {
      expect(game.board.cellAt(at(0, 0))).toBeUndefined();
    }
  });

  it('should_spawn_a_tile_on_an_empty_cell_when_merge_rules_play_on_a_square_board', () => {
    // Arrange
    const game = startSquareGame([[at(0, 0), new Tile(2)]]);
    const spawnedEvents: TileSpawned<SquareCoord>[] = [];
    game.subscribe((event) => {
      if (isTileSpawned(event)) {
        spawnedEvents.push(event);
      }
    });

    // Act
    const result = game.applyMove({ direction: EAST });

    // Assert
    expect(result).toMatchObject({ kind: 'applied' });
    expect(spawnedEvents).toHaveLength(1);
    const [spawned] = spawnedEvents;
    expect(spawned).toBeDefined();
    if (spawned !== undefined) {
      expect(spawned.cell.key()).not.toBe(at(2, 0).key());
      expect([2, 4]).toContain(spawned.value);
      expect(game.board.cellAt(spawned.cell)?.value).toBe(spawned.value);
    }
  });

  it('should_emit_target_reached_and_detect_defeat_when_merge_rules_play_on_a_square_board', () => {
    // Arrange
    const game = startSquareGame(
      [
        [at(0, 0), new Tile(2)],
        [at(1, 0), new Tile(16)],
        [at(2, 0), new Tile(16)],
        [at(0, 1), new Tile(4)],
        [at(1, 1), new Tile(8)],
        [at(2, 1), new Tile(64)],
        [at(0, 2), new Tile(128)],
        [at(1, 2), new Tile(256)],
        [at(2, 2), new Tile(1024)],
      ],
      [{ item: new Tile(512), weight: 1 }],
      32,
    );
    const targetEvents: TargetReached[] = [];
    game.subscribe((event) => {
      if (isTargetReached(event)) {
        targetEvents.push(event);
      }
    });

    // Act
    const result = game.applyMove({ direction: EAST });
    game.resolutionDone();

    // Assert
    expect(result).toMatchObject({ kind: 'applied' });
    expect(targetEvents).toEqual([{ type: 'TargetReached', target: 32 }]);
    expect(game.status).toBe('finished');
    expect(game.outcome).toBe('defeat');
  });
});
