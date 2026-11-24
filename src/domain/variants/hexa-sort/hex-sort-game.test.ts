import { HexCoord } from '../../engine/hex/hex-coord';
import { createHexSortGame, type HexSortSpec } from './hex-sort-game';

const TRAY = { colors: 4, minHeight: 2, maxHeight: 5, maxColorsPerStack: 2 };
const SETUP: HexSortSpec = { tray: TRAY };

const CENTER = new HexCoord(0, 0);
const EAST = new HexCoord(1, 0);
const FAR_EAST = new HexCoord(2, 0);

/** The first tray stack a seed deals, to build boards around it. */
function firstTray(seed: number) {
  return createHexSortGame(seed, SETUP).state.tray;
}

describe('createHexSortGame', () => {
  it('should_start_on_a_19_cell_board_with_one_stack_in_the_tray', () => {
    // Act
    const game = createHexSortGame(1, SETUP);

    // Assert
    expect(game.board.shape.size).toBe(19);
    expect(game.state.tray.height).toBeGreaterThanOrEqual(TRAY.minHeight);
    expect(game.state).toMatchObject({ score: 0, moveCount: 0 });
  });

  it('should_build_a_bigger_board_when_the_setup_sets_the_radius', () => {
    // Act
    const game = createHexSortGame(1, { ...SETUP, radius: 3 });

    // Assert: radius comes from the level, not from a constant.
    expect(game.board.shape.size).toBe(37);
  });

  it('should_start_with_the_level_initial_stacks', () => {
    // Act
    const game = createHexSortGame(1, {
      ...SETUP,
      initialStacks: [{ cell: EAST, chips: [0, 1, 1] }],
    });

    // Assert
    expect(game.board.cellAt(EAST)?.chips).toEqual([0, 1, 1]);
  });

  it('should_place_the_tray_stack_and_draw_the_next_one', () => {
    // Arrange
    const game = createHexSortGame(5, SETUP);
    const placed = game.state.tray;
    const [next] = game.state.source.fork().draw(1);

    // Act
    const result = game.applyMove({ cell: CENTER });

    // Assert
    expect(result.kind).toBe('applied');
    expect(game.board.cellAt(CENTER)?.equals(placed)).toBe(true);
    expect(next && game.state.tray.equals(next)).toBe(true);
    expect(game.state.moveCount).toBe(1);
  });

  it('should_reject_a_move_when_the_cell_is_occupied', () => {
    // Arrange
    const game = createHexSortGame(5, {
      ...SETUP,
      initialStacks: [{ cell: CENTER, chips: [3] }],
    });
    const tray = game.state.tray;

    // Act
    const result = game.applyMove({ cell: CENTER });

    // Assert: nothing changes (RN-20).
    expect(result).toMatchObject({
      kind: 'rejected',
      reason: 'Cell already holds a stack',
    });
    expect(game.board.cellAt(CENTER)?.chips).toEqual([3]);
    expect(game.state.tray).toBe(tray);
    expect(game.state.moveCount).toBe(0);
  });

  it.each([
    ['blocked', CENTER],
    ['off the board', new HexCoord(3, 0)],
  ])('should_reject_a_move_when_the_cell_is_%s', (_case, cell) => {
    // Arrange
    const game = createHexSortGame(5, { ...SETUP, blocked: [CENTER] });

    // Act
    const result = game.applyMove({ cell });

    // Assert
    expect(result).toMatchObject({
      kind: 'rejected',
      reason: 'Cell is not on the board',
    });
  });

  it('should_run_the_cascade_after_placing', () => {
    // Arrange: two stacks east of the centre, built around the tray's top
    // colour so placing on the centre starts a chain of two transfers.
    const tray = firstTray(11);
    const top = tray.top();
    const other = (top + 1) % TRAY.colors;
    const game = createHexSortGame(11, {
      ...SETUP,
      initialStacks: [
        { cell: EAST, chips: [other, top] },
        { cell: FAR_EAST, chips: [other, other] },
      ],
    });

    // Act
    const result = game.applyMove({ cell: CENTER });

    // Assert: east's top joins the centre; the exposed colour moves on.
    expect(result.kind).toBe('applied');
    expect(game.board.cellAt(CENTER)?.chips).toEqual([...tray.chips, top]);
    expect(game.board.cellAt(EAST)).toBeUndefined();
    expect(game.board.cellAt(FAR_EAST)?.chips).toEqual([other, other, other]);
  });

  it('should_play_the_same_game_when_the_seed_is_the_same', () => {
    // Arrange
    const moves = [CENTER, EAST, FAR_EAST, new HexCoord(0, 1)];
    const play = () => {
      const game = createHexSortGame(21, SETUP);
      return moves.map((cell) => {
        game.applyMove({ cell });
        game.resolutionDone();
        return [
          game.state.tray.chips,
          moves.map((c) => game.board.cellAt(c)?.chips),
        ];
      });
    };

    // Act / Assert
    expect(play()).toEqual(play());
  });
});
