import { Board } from '@domain/engine/board/board';
import { BoardShape } from '@domain/engine/board/board-shape';
import { HexCoord } from '@domain/engine/hex/hex-coord';
import { HexGeometry } from '@domain/engine/hex/hex-geometry';
import { ColorStack } from '@domain/variants/hexa-sort/color-stack';
import { resolveCascade } from '@domain/variants/hexa-sort/resolve-cascade';
import { DEFAULT_CLEAR_AT } from '@domain/variants/hexa-sort/sort-rules';

const R = 0;
const B = 1;
const G = 2;

// The rules' goal size; tests that change it say so.
const CLEAR_AT = DEFAULT_CLEAR_AT;

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

/** `count` chips of one colour, for tall runs. */
function run(color: number, count: number): number[] {
  return Array.from({ length: count }, () => color);
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
    const { resolution } = resolveCascade(board, CENTER, CLEAR_AT);

    // Assert
    expect(chipsAt(board, EAST)).toEqual([B, R, R, R, R, R]);
    expect(chipsAt(board, CENTER)).toBeUndefined();
    expect(resolution).toEqual({ transfers: 1, goals: 0, chipsCleared: 0 });
  });

  it('should_not_transfer_when_no_neighbour_shares_the_top_colour', () => {
    // Arrange: red buried under blue does not count, only the top does.
    const board = boardWith([
      [CENTER, [R]],
      [EAST, [R, B]],
    ]);

    // Act
    const { resolution, events } = resolveCascade(board, CENTER, CLEAR_AT);

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
    const { resolution } = resolveCascade(board, CENTER, CLEAR_AT);

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
    resolveCascade(board, CENTER, CLEAR_AT);

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
    resolveCascade(board, CENTER, CLEAR_AT);

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
    const a = resolveCascade(first, CENTER, CLEAR_AT);
    const b = resolveCascade(second, CENTER, CLEAR_AT);

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
    const { events, resolution } = resolveCascade(board, CENTER, CLEAR_AT);

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
    const { resolution } = resolveCascade(board, CENTER, CLEAR_AT);

    // Assert
    expect(resolution.transfers).toBe(0);
    expect(chipsAt(board, EAST)).toEqual([R]);
  });

  describe('goals (RN-23)', () => {
    it('should_remove_the_whole_stack_when_its_top_run_reaches_ten', () => {
      // Arrange: two reds join eight reds sitting on three blues.
      const board = boardWith([
        [CENTER, [R, R]],
        [EAST, [B, B, B, ...run(R, 8)]],
      ]);

      // Act
      const { resolution } = resolveCascade(board, CENTER, CLEAR_AT);

      // Assert: the blues under the run go too, and all 13 chips count.
      expect(chipsAt(board, EAST)).toBeUndefined();
      expect(chipsAt(board, CENTER)).toBeUndefined();
      expect(resolution).toEqual({ transfers: 1, goals: 1, chipsCleared: 13 });
    });

    it('should_keep_the_stack_when_its_top_run_is_nine', () => {
      // Arrange
      const board = boardWith([
        [CENTER, [R]],
        [EAST, run(R, 8)],
      ]);

      // Act
      const { resolution } = resolveCascade(board, CENTER, CLEAR_AT);

      // Assert
      expect(chipsAt(board, EAST)).toEqual(run(R, 9));
      expect(resolution).toEqual({ transfers: 1, goals: 0, chipsCleared: 0 });
    });

    it('should_not_count_buried_chips_of_the_same_colour', () => {
      // Arrange: after the transfer there are ten reds, but a blue pair
      // splits them, so the top run is only four.
      const board = boardWith([
        [CENTER, [R]],
        [EAST, [...run(R, 6), B, B, R, R, R]],
      ]);

      // Act
      const { resolution } = resolveCascade(board, CENTER, CLEAR_AT);

      // Assert
      expect(chipsAt(board, EAST)).toEqual([...run(R, 6), B, B, ...run(R, 4)]);
      expect(resolution.goals).toBe(0);
    });

    it('should_gather_the_whole_group_before_removing_the_stack', () => {
      // Arrange: the first transfer already makes ten; the second neighbour
      // still joins before the stack is removed.
      const board = boardWith([
        [CENTER, run(R, 8)],
        [EAST, [R, R]],
        [WEST, [R, R]],
      ]);

      // Act
      const { resolution } = resolveCascade(board, CENTER, CLEAR_AT);

      // Assert
      expect(chipsAt(board, CENTER)).toBeUndefined();
      expect(chipsAt(board, EAST)).toBeUndefined();
      expect(chipsAt(board, WEST)).toBeUndefined();
      expect(resolution).toEqual({ transfers: 2, goals: 1, chipsCleared: 12 });
    });

    it('should_remove_the_stack_after_its_step_when_later_steps_could_grow_it', () => {
      // Arrange: the centre reaches ten in the first step. East then gives
      // its blue to far east and shows three reds, which would join the
      // centre if the check waited for the end of the cascade.
      const board = boardWith([
        [CENTER, run(R, 8)],
        [EAST, [R, R, R, B, R, R]],
        [FAR_EAST, [B, B]],
      ]);

      // Act
      const { resolution } = resolveCascade(board, CENTER, CLEAR_AT);

      // Assert
      expect(chipsAt(board, CENTER)).toBeUndefined();
      expect(chipsAt(board, EAST)).toEqual([R, R, R]);
      expect(chipsAt(board, FAR_EAST)).toEqual([B, B, B]);
      expect(resolution).toEqual({ transfers: 2, goals: 1, chipsCleared: 10 });
    });

    it('should_remove_a_source_when_its_exposed_top_run_reaches_the_size', () => {
      // Arrange: with a goal size of three, east's blue goes to the centre
      // (a tie, so the resolving cell wins) and exposes three reds.
      const board = boardWith([
        [CENTER, [B]],
        [EAST, [R, R, R, B]],
      ]);

      // Act
      const { resolution } = resolveCascade(board, CENTER, 3);

      // Assert
      expect(chipsAt(board, EAST)).toBeUndefined();
      expect(chipsAt(board, CENTER)).toEqual([B, B]);
      expect(resolution).toEqual({ transfers: 1, goals: 1, chipsCleared: 3 });
    });

    it('should_count_two_goals_when_one_cascade_completes_two_towers', () => {
      // Arrange: the blue completes a tower on the centre and exposes five
      // greens on east, which then complete a tower with the five further
      // east.
      const board = boardWith([
        [CENTER, run(B, 9)],
        [EAST, [...run(G, 5), B]],
        [FAR_EAST, run(G, 5)],
      ]);

      // Act
      const { resolution } = resolveCascade(board, CENTER, CLEAR_AT);

      // Assert
      expect(chipsAt(board, CENTER)).toBeUndefined();
      expect(chipsAt(board, EAST)).toBeUndefined();
      expect(chipsAt(board, FAR_EAST)).toBeUndefined();
      expect(resolution).toEqual({ transfers: 2, goals: 2, chipsCleared: 20 });
    });

    it('should_use_the_configured_size_when_clear_at_is_twelve', () => {
      // Arrange: eleven reds would be a goal with the default size of ten.
      const board = boardWith([
        [CENTER, [R]],
        [EAST, run(R, 10)],
      ]);

      // Act
      const { resolution } = resolveCascade(board, CENTER, 12);

      // Assert
      expect(chipsAt(board, EAST)).toEqual(run(R, 11));
      expect(resolution.goals).toBe(0);
    });

    it('should_emit_goal_completed_with_the_removed_chips', () => {
      // Arrange
      const board = boardWith([
        [CENTER, [R, R]],
        [EAST, [B, B, B, ...run(R, 8)]],
      ]);

      // Act
      const { events } = resolveCascade(board, CENTER, CLEAR_AT);

      // Assert: the transfer first, then the goal it completed.
      expect(events).toEqual([
        { type: 'StackMerged', from: CENTER, to: EAST, color: R, count: 2 },
        { type: 'GoalCompleted', at: EAST, color: R, chips: 13 },
      ]);
    });
  });
});
