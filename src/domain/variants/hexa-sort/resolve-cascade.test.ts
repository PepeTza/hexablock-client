import { Board } from '../../engine/board/board';
import { BoardShape } from '../../engine/board/board-shape';
import { HexCoord } from '../../engine/hex/hex-coord';
import { HexGeometry } from '../../engine/hex/hex-geometry';
import { ColorStack } from './color-stack';
import { resolveCascade } from './resolve-cascade';

const R = 0;
const B = 1;
const G = 2;

const CENTER = new HexCoord(0, 0);
// Neighbours of the centre in the geometry's order: E, SE, SW, W, NW, NE.
const EAST = new HexCoord(1, 0);
const SOUTH_EAST = new HexCoord(0, 1);
const WEST = new HexCoord(-1, 0);
const FAR_EAST = new HexCoord(2, 0);

/** A radius-2 board (19 cells) with these stacks, listed bottom to top. */
function boardWith(stacks: ReadonlyArray<[HexCoord, number[]]>) {
  const geometry = new HexGeometry();
  const board = new Board<ColorStack, HexCoord>(
    BoardShape.ofRadius(geometry, 2),
    geometry,
  );
  for (const [coord, chips] of stacks) {
    board.place(coord, ColorStack.of(chips));
  }
  return board;
}

function chipsAt(board: Board<ColorStack, HexCoord>, coord: HexCoord) {
  return board.cellAt(coord)?.chips;
}

describe('resolveCascade', () => {
  it('should_move_the_shorter_run_onto_the_longer_one_when_tops_match', () => {
    // Arrange: two red chips placed next to a stack with three reds on top.
    const board = boardWith([
      [CENTER, [R, R]],
      [EAST, [B, R, R, R]],
    ]);

    // Act
    const { resolution } = resolveCascade(board, CENTER);

    // Assert
    expect(chipsAt(board, EAST)).toEqual([B, R, R, R, R, R]);
    expect(chipsAt(board, CENTER)).toBeUndefined();
    expect(resolution).toEqual({ transfers: 1, chipsCleared: 0 });
  });

  it('should_not_transfer_when_no_neighbour_shares_the_top_colour', () => {
    // Arrange: red buried under blue does not count, only the top does.
    const board = boardWith([
      [CENTER, [R]],
      [EAST, [R, B]],
    ]);

    // Act
    const { resolution, events } = resolveCascade(board, CENTER);

    // Assert
    expect(chipsAt(board, CENTER)).toEqual([R]);
    expect(chipsAt(board, EAST)).toEqual([R, B]);
    expect(resolution.transfers).toBe(0);
    expect(events).toEqual([]);
  });

  it('should_keep_transferring_when_a_transfer_exposes_a_matching_top', () => {
    // Arrange: placing blue on the centre takes the blue from east, which
    // exposes green on east; that green then joins the green further east.
    const board = boardWith([
      [CENTER, [B, B]],
      [EAST, [G, B]],
      [FAR_EAST, [G, G]],
    ]);

    // Act
    const { resolution } = resolveCascade(board, CENTER);

    // Assert
    expect(chipsAt(board, CENTER)).toEqual([B, B, B]);
    expect(chipsAt(board, EAST)).toBeUndefined();
    expect(chipsAt(board, FAR_EAST)).toEqual([G, G, G]);
    expect(resolution.transfers).toBe(2);
  });

  it('should_send_chips_to_the_resolving_cell_when_runs_tie', () => {
    // Arrange: both stacks have two reds on top.
    const board = boardWith([
      [CENTER, [G, R, R]],
      [EAST, [B, R, R]],
    ]);

    // Act
    resolveCascade(board, CENTER);

    // Assert: the centre (the resolving cell) wins the tie.
    expect(chipsAt(board, CENTER)).toEqual([G, R, R, R, R]);
    expect(chipsAt(board, EAST)).toEqual([B]);
  });

  it('should_follow_the_geometry_order_when_neighbours_tie', () => {
    // Arrange: west and south-east both have three reds; south-east comes
    // first in the geometry's order (E, SE, SW, W, NW, NE).
    const board = boardWith([
      [CENTER, [R]],
      [WEST, [B, R, R, R]],
      [SOUTH_EAST, [G, R, R, R]],
    ]);

    // Act
    resolveCascade(board, CENTER);

    // Assert
    expect(chipsAt(board, SOUTH_EAST)).toEqual([G, R, R, R, R, R, R, R]);
    expect(chipsAt(board, WEST)).toEqual([B]);
    expect(chipsAt(board, CENTER)).toBeUndefined();
  });

  it('should_resolve_identically_when_run_twice_on_the_same_board', () => {
    // Arrange
    const stacks: ReadonlyArray<[HexCoord, number[]]> = [
      [CENTER, [B, R]],
      [EAST, [G, R, R]],
      [WEST, [G, B, R]],
      [SOUTH_EAST, [B, B]],
      [FAR_EAST, [G]],
    ];
    const first = boardWith(stacks);
    const second = boardWith(stacks);

    // Act
    const a = resolveCascade(first, CENTER);
    const b = resolveCascade(second, CENTER);

    // Assert
    expect(a.events).toEqual(b.events);
    for (const coord of first.shape.coords) {
      expect(chipsAt(first, coord)).toEqual(chipsAt(second, coord));
    }
  });

  it('should_emit_one_stack_merged_event_per_transfer', () => {
    // Arrange
    const board = boardWith([
      [CENTER, [B, B]],
      [EAST, [G, B]],
      [FAR_EAST, [G, G]],
    ]);

    // Act
    const { events, resolution } = resolveCascade(board, CENTER);

    // Assert
    expect(events).toEqual([
      { type: 'StackMerged', from: EAST, to: CENTER, color: B, count: 1 },
      { type: 'StackMerged', from: EAST, to: FAR_EAST, color: G, count: 1 },
    ]);
    expect(events).toHaveLength(resolution.transfers);
  });

  it('should_do_nothing_when_the_start_cell_is_empty', () => {
    // Arrange
    const board = boardWith([[EAST, [R]]]);

    // Act
    const { resolution } = resolveCascade(board, CENTER);

    // Assert
    expect(resolution.transfers).toBe(0);
    expect(chipsAt(board, EAST)).toEqual([R]);
  });
});
