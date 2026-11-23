import { HexCoord } from '../../engine/hex/hex-coord';
import { createLinesGame } from './lines-game';

const MONOMINO_WEIGHTS = new Map([['p1-01', 1_000_000]]);
const EDGE = [0, 1, 2, 3, 4].map((q) => new HexCoord(q, -4));

describe('createLinesGame', () => {
  it('should_deal_three_pieces_when_starting_with_an_injected_seed', () => {
    // Arrange
    const seed = 0;

    // Act
    const game = createLinesGame(seed);

    // Assert
    expect(game.seed).toBe(seed);
    expect(game.state.tray).toHaveLength(3);
    expect(game.state.tray.every((piece) => piece !== null)).toBe(true);
    expect(game.board.shape.size).toBe(61);
  });

  it('should_refill_only_after_all_slots_are_used_in_any_order', () => {
    // Arrange
    const game = createLinesGame(42, MONOMINO_WEIGHTS);
    const originalTray = game.state.tray;
    const [firstPiece, middlePiece] = originalTray;
    const nextDeal = game.state.source.fork().draw(3);

    // Act
    const first = game.applyMove({ slot: 2, anchor: new HexCoord(0, 0) });
    const afterFirst = game.state.tray;
    game.resolutionDone();
    const second = game.applyMove({ slot: 0, anchor: new HexCoord(1, 0) });
    const afterSecond = game.state.tray;
    game.resolutionDone();
    const third = game.applyMove({ slot: 1, anchor: new HexCoord(2, 0) });

    // Assert
    expect([first.kind, second.kind, third.kind]).toEqual([
      'applied',
      'applied',
      'applied',
    ]);
    expect(afterFirst).toEqual([firstPiece, middlePiece, null]);
    expect(afterSecond).toEqual([null, middlePiece, null]);
    expect(originalTray.every((piece) => piece !== null)).toBe(true);
    expect(game.state.tray).toEqual(nextDeal);
    expect(game.state.moveCount).toBe(3);
    expect(game.state.score).toBe(3);
  });

  it('should_keep_the_tray_and_board_when_placement_is_rejected', () => {
    // Arrange
    const game = createLinesGame(42, MONOMINO_WEIGHTS);
    game.applyMove({ slot: 0, anchor: HexCoord.ORIGIN });
    game.resolutionDone();
    const before = game.state;
    const boardBefore = game.board;

    // Act
    const usedSlot = game.applyMove({ slot: 0, anchor: new HexCoord(1, 0) });
    const missingSlot = game.applyMove({ slot: 3, anchor: new HexCoord(1, 0) });
    const overlap = game.applyMove({ slot: 1, anchor: HexCoord.ORIGIN });
    const outside = game.applyMove({ slot: 1, anchor: new HexCoord(5, 0) });

    // Assert
    expect([
      usedSlot.kind,
      missingSlot.kind,
      overlap.kind,
      outside.kind,
    ]).toEqual(['rejected', 'rejected', 'rejected', 'rejected']);
    expect(game.state).toBe(before);
    expect(game.board).toBe(boardBefore);
  });

  it('should_place_the_spawned_rotation_when_the_whole_piece_fits', () => {
    // Arrange
    const game = createLinesGame(42, new Map([['p2-01', 10_000]]));
    const edge = new HexCoord(0, -4);

    // Act
    const overhang = game.applyMove({ slot: 0, anchor: edge });
    const edgeStayedEmpty = game.board.isEmpty(edge);
    const placement = game.applyMove({ slot: 0, anchor: HexCoord.ORIGIN });

    // Assert
    expect(overhang.kind).toBe('rejected');
    expect(edgeStayedEmpty).toBe(true);
    expect(placement.kind).toBe('applied');
    const occupied = game.board.shape.coords.filter(
      (cell) => !game.board.isEmpty(cell),
    );
    expect(new Set(occupied.map((cell) => cell.key()))).toEqual(
      new Set(['0,0', '1,-1']),
    );
    expect(game.state.score).toBe(2);
  });

  it('should_keep_the_deal_reproducible_when_a_refill_is_previewed', () => {
    // Arrange
    const plain = createLinesGame(42, MONOMINO_WEIGHTS);
    const withPreview = createLinesGame(42, MONOMINO_WEIGHTS);
    for (const game of [plain, withPreview]) {
      game.applyMove({ slot: 0, anchor: new HexCoord(0, 0) });
      game.resolutionDone();
      game.applyMove({ slot: 2, anchor: new HexCoord(1, 0) });
      game.resolutionDone();
    }
    const before = withPreview.state;
    const finalMove = { slot: 1, anchor: new HexCoord(2, 0) };
    const describeTray = (game: ReturnType<typeof createLinesGame>) =>
      game.state.tray.map((piece) => [piece?.shape.id, piece?.rotation]);

    // Act
    const preview = withPreview.preview(finalMove);
    const stateAfterPreview = withPreview.state;
    plain.applyMove(finalMove);
    withPreview.applyMove(finalMove);

    // Assert
    expect(preview.kind).toBe('applied');
    expect(stateAfterPreview).toBe(before);
    expect(describeTray(withPreview)).toEqual(describeTray(plain));
    if (preview.kind === 'applied') {
      expect(withPreview.state.tray).toEqual(preview.state.tray);
    }
  });

  it('should_score_and_clear_a_full_row_when_a_tray_piece_completes_it', () => {
    // Arrange
    const game = createLinesGame(42, MONOMINO_WEIGHTS);

    // Act
    EDGE.forEach((anchor, index) => {
      game.applyMove({ slot: index % 3, anchor });
      game.resolutionDone();
    });

    // Assert
    expect(game.state.moveCount).toBe(5);
    expect(game.state.score).toBe(15);
    expect(game.state.streak).toBe(1);
    expect(EDGE.every((cell) => game.board.isEmpty(cell))).toBe(true);
  });
});

it('should_finish_in_defeat_when_no_remaining_tray_piece_can_fit', () => {
  // Arrange
  const game = createLinesGame(42, new Map([['p5-01', 1_000_000]]));

  // Act
  for (let step = 0; step < 80; step++) {
    const candidates = game.state.tray.flatMap((piece, slot) =>
      piece === null
        ? []
        : game.board.shape.coords
            .filter((anchor) =>
              piece
                .cellsAt(anchor)
                .every(
                  (cell) =>
                    game.board.contains(cell) && game.board.isEmpty(cell),
                ),
            )
            .map((anchor) => ({ slot, anchor })),
    );
    const next = candidates[0];
    if (next === undefined) break;
    expect(game.applyMove(next).kind).toBe('applied');
    game.resolutionDone();
  }

  // Assert
  expect(game.state.moveCount).toBeGreaterThan(0);
  expect(game.outcome).toBe('defeat');
});
