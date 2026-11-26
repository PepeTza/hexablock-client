import { HexCoord } from '../../engine/hex/hex-coord';
import { createHexSortGame, type HexSortSpec } from './hex-sort-game';

const TRAY = { colors: 4, minHeight: 2, maxHeight: 5, maxColorsPerStack: 2 };
// High enough that the tests about moves never end the game by goals.
const SETUP: HexSortSpec = { tray: TRAY, goalTarget: 99 };

const CENTER = new HexCoord(0, 0);
const EAST = new HexCoord(1, 0);
const FAR_EAST = new HexCoord(2, 0);
const FAR_WEST = new HexCoord(-2, 0);
const FAR_SOUTH_WEST = new HexCoord(-2, 1);
const WEST = new HexCoord(-1, 0);

/** `count` chips of one colour, for tall runs. */
function run(color: number, count: number): number[] {
  return Array.from({ length: count }, () => color);
}

/**
 * A stack whose top run of `color` is nine, on another colour: any run of
 * that colour joining it completes a goal, and it always wins the transfer
 * because a tray run is at most five.
 */
function towerOf(color: number): number[] {
  return [(color + 1) % TRAY.colors, ...run(color, 9)];
}

/** The first tray stack a seed deals, to build boards around it. */
function firstTray(seed: number) {
  return createHexSortGame(seed, SETUP).state.tray;
}

/** The first seed whose first tray stack has two colours. */
function seedWithTwoColourTray(): number {
  for (let seed = 1; seed < 1000; seed++) {
    const tray = firstTray(seed);
    if (tray.withoutTopRun() !== null) return seed;
  }
  throw new Error('No seed deals a two-colour stack first');
}

/**
 * A stack on every cell of the radius-2 board but `free` and `skip`, each
 * topped by a colour other than `trayTop`, so placing the tray on `free`
 * moves nothing.
 */
function fillAllBut(
  trayTop: number,
  free: HexCoord,
  skip: readonly HexCoord[] = [],
) {
  const other = (trayTop + 1) % TRAY.colors;
  const left = [free, ...skip].map((cell) => cell.key());
  return createHexSortGame(1, SETUP)
    .board.shape.coords.filter((cell) => !left.includes(cell.key()))
    .map((cell) => ({ cell, chips: [other] }));
}

describe('createHexSortGame', () => {
  it('should_start_on_a_19_cell_board_with_one_stack_in_the_tray', () => {
    // Act
    const game = createHexSortGame(1, SETUP);

    // Assert
    expect(game.board.shape.size).toBe(19);
    expect(game.state.tray.height).toBeGreaterThanOrEqual(TRAY.minHeight);
    expect(game.state).toMatchObject({ score: 0, moveCount: 0, goals: 0 });
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

  it('should_count_the_goal_and_score_its_chips_when_a_tower_completes', () => {
    // Arrange: a tower of nine next to the centre, in the tray's top colour.
    const tray = firstTray(11);
    const game = createHexSortGame(11, {
      ...SETUP,
      initialStacks: [{ cell: EAST, chips: towerOf(tray.top()) }],
    });

    // Act
    game.applyMove({ cell: CENTER });

    // Assert: the tower (10 chips plus the tray's run) is gone and scored.
    expect(game.board.cellAt(EAST)).toBeUndefined();
    expect(game.state.goals).toBe(1);
    expect(game.state.score).toBe(10 + tray.topRun());
  });

  it('should_add_the_goals_of_each_move_to_the_counter', () => {
    // Arrange: one tower for the first tray stack and one, far from it, for
    // the second.
    const first = firstTray(11);
    const [second] = createHexSortGame(11, SETUP).state.source.fork().draw(1);
    if (second === undefined) {
      throw new Error('The tray always deals a next stack');
    }
    const game = createHexSortGame(11, {
      ...SETUP,
      initialStacks: [
        { cell: EAST, chips: towerOf(first.top()) },
        { cell: FAR_SOUTH_WEST, chips: towerOf(second.top()) },
      ],
    });

    // Act
    game.applyMove({ cell: CENTER });
    game.resolutionDone();
    game.applyMove({ cell: FAR_WEST });

    // Assert
    expect(game.board.cellAt(FAR_SOUTH_WEST)).toBeUndefined();
    expect(game.state.goals).toBe(2);
  });

  describe('end of the game (RN-24)', () => {
    it('should_win_when_a_cascade_reaches_the_goal_target', () => {
      // Arrange
      const tray = firstTray(11);
      const game = createHexSortGame(11, {
        ...SETUP,
        goalTarget: 1,
        initialStacks: [{ cell: EAST, chips: towerOf(tray.top()) }],
      });

      // Act
      const result = game.applyMove({ cell: CENTER });
      game.resolutionDone();

      // Assert
      expect(result).toMatchObject({ pendingOutcome: 'victory' });
      expect(game.status).toBe('finished');
      expect(game.outcome).toBe('victory');
    });

    it('should_win_when_one_cascade_passes_the_goal_target', () => {
      // Arrange: the tray's top run completes the tower on east; what is
      // left of the tray then completes the tower on west. Two goals for a
      // target of one.
      const seed = seedWithTwoColourTray();
      const tray = firstTray(seed);
      const rest = tray.withoutTopRun();
      if (rest === null) throw new Error('The tray has two colours');
      const game = createHexSortGame(seed, {
        ...SETUP,
        goalTarget: 1,
        initialStacks: [
          { cell: EAST, chips: towerOf(tray.top()) },
          {
            cell: WEST,
            chips: [
              (rest.top() + 1) % TRAY.colors,
              ...run(rest.top(), 10 - rest.topRun()),
            ],
          },
        ],
      });

      // Act
      game.applyMove({ cell: CENTER });
      game.resolutionDone();

      // Assert
      expect(game.state.goals).toBe(2);
      expect(game.outcome).toBe('victory');
    });

    it('should_keep_playing_when_goals_are_below_the_target', () => {
      // Arrange
      const tray = firstTray(11);
      const game = createHexSortGame(11, {
        ...SETUP,
        goalTarget: 2,
        initialStacks: [{ cell: EAST, chips: towerOf(tray.top()) }],
      });

      // Act
      const result = game.applyMove({ cell: CENTER });
      game.resolutionDone();

      // Assert
      expect(game.state.goals).toBe(1);
      expect(result).toMatchObject({ pendingOutcome: null });
      expect(game.status).toBe('playing');
    });

    it('should_lose_and_reject_moves_when_the_board_is_full_after_the_cascade', () => {
      // Arrange: every cell but the centre holds a stack the tray ignores.
      const tray = firstTray(11);
      const game = createHexSortGame(11, {
        ...SETUP,
        initialStacks: fillAllBut(tray.top(), CENTER),
      });

      // Act
      const result = game.applyMove({ cell: CENTER });
      game.resolutionDone();
      const next = game.applyMove({ cell: EAST });

      // Assert
      expect(result).toMatchObject({ pendingOutcome: 'defeat' });
      expect(game.outcome).toBe('defeat');
      expect(next).toEqual({ kind: 'rejected', reason: 'the game is over' });
    });

    it('should_keep_playing_when_the_cascade_frees_the_last_filled_cell', () => {
      // Arrange: the centre is the last free cell, but east is a tower the
      // tray completes, so the cascade frees east.
      const tray = firstTray(11);
      const game = createHexSortGame(11, {
        ...SETUP,
        initialStacks: [
          ...fillAllBut(tray.top(), CENTER, [EAST]),
          { cell: EAST, chips: towerOf(tray.top()) },
        ],
      });

      // Act
      const result = game.applyMove({ cell: CENTER });
      game.resolutionDone();

      // Assert
      expect(game.board.isEmpty(EAST)).toBe(true);
      expect(result).toMatchObject({ pendingOutcome: null });
      expect(game.status).toBe('playing');
    });

    it('should_not_count_blocked_cells_as_empty_when_the_board_fills', () => {
      // Arrange: far east is blocked and left without a stack.
      const tray = firstTray(11);
      const game = createHexSortGame(11, {
        ...SETUP,
        blocked: [FAR_EAST],
        initialStacks: fillAllBut(tray.top(), CENTER, [FAR_EAST]),
      });

      // Act
      game.applyMove({ cell: CENTER });
      game.resolutionDone();

      // Assert
      expect(game.outcome).toBe('defeat');
    });

    it.each([0, -1, 1.5])(
      'should_throw_when_goal_target_is_not_a_positive_integer (%p)',
      (goalTarget) => {
        // Act
        const act = () => createHexSortGame(1, { ...SETUP, goalTarget });

        // Assert
        expect(act).toThrow(
          `The goal target must be an integer >= 1: ${goalTarget}`,
        );
      },
    );
  });
});
