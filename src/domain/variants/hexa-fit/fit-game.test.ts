import { BoardShape } from '../../engine/board/board-shape';
import { HexCoord } from '../../engine/hex/hex-coord';
import { loadHexPieceCatalog } from '../../engine/hex/hex-piece-catalog';
import { Piece } from '../../engine/pieces/piece';
import { startFitGame } from './fit-game';

const catalog = loadHexPieceCatalog();
const origin = HexCoord.ORIGIN;
const east = new HexCoord(1, 0);
const west = new HexCoord(-1, 0);
const single = Piece.of(catalog.get('p1-01'));
const pair = Piece.of(catalog.get('p2-01'));

describe('Hexa Fit core', () => {
  it('should_count_one_move_when_relocating_a_piece_to_a_free_cell', () => {
    // Arrange
    const game = startFitGame(BoardShape.of([west, origin, east]), [
      single,
      single,
      single,
    ]);
    game.applyMove({ pieceId: 0, anchor: west });
    game.resolutionDone();

    // Act
    const result = game.applyMove({
      kind: 'relocate',
      pieceId: 0,
      anchor: origin,
    });

    // Assert
    expect(result.kind).toBe('applied');
    expect(game.board.isEmpty(west)).toBe(true);
    expect(game.board.cellAt(origin)).toBe(0);
    expect(game.state.moveCount).toBe(2);
  });

  it('should_keep_the_original_footprint_when_an_invalid_relocation_overlaps_another_piece', () => {
    // Arrange
    const game = startFitGame(BoardShape.of([west, origin, east]), [
      single,
      single,
      single,
    ]);
    game.applyMove({ pieceId: 0, anchor: west });
    game.resolutionDone();
    game.applyMove({ pieceId: 1, anchor: east });
    game.resolutionDone();

    // Act
    const rejected = game.applyMove({
      kind: 'relocate',
      pieceId: 0,
      anchor: east,
    });

    // Assert
    expect(rejected.kind).toBe('rejected');
    expect(game.board.cellAt(west)).toBe(0);
    expect(game.board.cellAt(east)).toBe(1);
    expect(game.state.moveCount).toBe(2);
  });

  it('should_restore_a_removed_piece_when_undoing_without_refunding_a_move', () => {
    // Arrange
    const game = startFitGame(BoardShape.of([origin, east]), [single, single]);
    game.applyMove({ pieceId: 0, anchor: origin });
    game.resolutionDone();

    // Act
    const removal = game.applyMove({ kind: 'remove', pieceId: 0 });
    game.resolutionDone();
    const emptyAfterRemoval = game.board.isEmpty(origin);
    const movesAfterRemoval = game.state.moveCount;
    const undo = game.undo();

    // Assert
    expect(removal.kind).toBe('applied');
    expect(emptyAfterRemoval).toBe(true);
    expect(movesAfterRemoval).toBe(1);
    expect(undo).toBe(true);
    expect(game.board.cellAt(origin)).toBe(0);
  });

  it('should_rotate_a_placed_piece_without_counting_a_move_when_its_new_cells_fit', () => {
    // Arrange
    const original = pair.cellsAt(origin);
    const rotated = pair.rotate(1).cellsAt(origin);
    const game = startFitGame(
      BoardShape.of(
        new Map(
          [...original, ...rotated].map((cell) => [cell.key(), cell]),
        ).values(),
      ),
      [pair, single],
    );
    game.applyMove({ pieceId: 0, anchor: origin });
    game.resolutionDone();

    // Act
    const result = game.applyMove({
      kind: 'rotate',
      pieceId: 0,
      rotationSteps: 1,
    });

    // Assert
    expect(result.kind).toBe('applied');
    expect(rotated.map((cell) => game.board.cellAt(cell))).toEqual([0, 0]);
    expect(
      original
        .filter((cell) => !rotated.some((next) => next.equals(cell)))
        .every((cell) => game.board.isEmpty(cell)),
    ).toBe(true);
    expect(game.state.moveCount).toBe(1);
  });

  it('should_keep_the_original_orientation_when_a_rotation_leaves_the_figure', () => {
    // Arrange
    const original = pair.cellsAt(origin);
    const game = startFitGame(BoardShape.of(original), [pair, single]);
    game.applyMove({ pieceId: 0, anchor: origin });
    game.resolutionDone();
    const before = game.state;

    // Act
    const result = game.applyMove({
      kind: 'rotate',
      pieceId: 0,
      rotationSteps: 1,
    });

    // Assert
    expect(result.kind).toBe('rejected');
    expect(original.map((cell) => game.board.cellAt(cell))).toEqual([0, 0]);
    expect(game.state).toBe(before);
  });

  it('should_place_the_rotated_catalog_piece_when_its_cells_fit_at_the_anchor', () => {
    // Arrange
    const anchor = new HexCoord(2, -1);
    const covered = new HexCoord(1, -1);
    const game = startFitGame(BoardShape.of([anchor, covered]), [
      pair.rotate(1),
    ]);

    // Act
    const result = game.applyMove({ pieceId: 0, anchor });

    // Assert
    expect(result).toMatchObject({
      kind: 'applied',
      pendingOutcome: 'victory',
    });
    expect(game.board.cellAt(anchor)).toBe(0);
    expect(game.board.cellAt(covered)).toBe(0);
  });

  it('should_win_when_the_last_piece_completes_the_figure', () => {
    // Arrange
    const game = startFitGame(BoardShape.of([origin, east]), [single, single]);

    // Act
    const firstMove = game.applyMove({ pieceId: 1, anchor: origin });
    game.resolutionDone();
    const lastMove = game.applyMove({ pieceId: 0, anchor: east });
    game.resolutionDone();

    // Assert
    expect(firstMove).toMatchObject({ kind: 'applied', pendingOutcome: null });
    expect(lastMove).toMatchObject({
      kind: 'applied',
      pendingOutcome: 'victory',
    });
    expect(game.outcome).toBe('victory');
    expect(game.board.cellAt(origin)).toBe(1);
    expect(game.board.cellAt(east)).toBe(0);
    expect(game.state.pendingPieces).toEqual([]);
    expect(game.state.moveCount).toBe(2);
  });

  it('should_reject_atomically_when_only_part_of_a_piece_is_inside_the_figure', () => {
    // Arrange
    const game = startFitGame(BoardShape.of([origin, east]), [pair]);
    const before = game.state;

    // Act
    const result = game.applyMove({ pieceId: 0, anchor: origin });

    // Assert
    expect(result).toEqual({
      kind: 'rejected',
      reason: 'A piece cell is outside the figure',
    });
    expect(game.board.isEmpty(origin)).toBe(true);
    expect(game.state).toBe(before);
  });

  it('should_reject_atomically_when_a_piece_overlaps_an_occupied_cell', () => {
    // Arrange
    const game = startFitGame(
      BoardShape.of([origin, west, new HexCoord(-1, 1)]),
      [single, pair],
    );
    game.applyMove({ pieceId: 0, anchor: new HexCoord(-1, 1) });
    game.resolutionDone();
    const before = game.state;

    // Act
    const result = game.applyMove({ pieceId: 1, anchor: origin });

    // Assert
    expect(result).toEqual({
      kind: 'rejected',
      reason: 'A piece cell overlaps a placed piece',
    });
    expect(game.board.isEmpty(origin)).toBe(true);
    expect(game.board.cellAt(new HexCoord(-1, 1))).toBe(0);
    expect(game.state).toBe(before);
  });

  it.each([0, 99])('should_reject_when_piece_%s_is_not_pending', (pieceId) => {
    // Arrange
    const game = startFitGame(BoardShape.of([origin, east]), [single, single]);
    game.applyMove({ pieceId: 0, anchor: origin });
    game.resolutionDone();

    // Act
    const result = game.applyMove({ pieceId, anchor: east });

    // Assert
    expect(result).toEqual({
      kind: 'rejected',
      reason: 'The piece is not pending',
    });
    expect(game.board.isEmpty(east)).toBe(true);
    expect(game.state.pendingPieces.map((entry) => entry.id)).toEqual([1]);
  });

  it('should_keep_playing_when_all_pieces_are_used_but_a_gap_remains', () => {
    // Arrange
    const game = startFitGame(BoardShape.of([origin, east]), [single]);

    // Act
    const result = game.applyMove({ pieceId: 0, anchor: origin });
    game.resolutionDone();

    // Assert
    expect(result).toMatchObject({ kind: 'applied', pendingOutcome: null });
    expect(game.status).toBe('playing');
    expect(game.board.isEmpty(east)).toBe(true);
  });

  it('should_keep_playing_when_the_figure_is_full_but_a_piece_is_pending', () => {
    // Arrange
    const game = startFitGame(BoardShape.of([origin]), [single, single]);

    // Act
    const result = game.applyMove({ pieceId: 0, anchor: origin });
    game.resolutionDone();

    // Assert
    expect(result).toMatchObject({ kind: 'applied', pendingOutcome: null });
    expect(game.status).toBe('playing');
    expect(game.state.pendingPieces.map((entry) => entry.id)).toEqual([1]);
  });

  it('should_leave_the_board_and_tray_untouched_when_previewing_a_placement', () => {
    // Arrange
    const game = startFitGame(BoardShape.of([origin]), [single]);

    // Act
    const result = game.preview({ pieceId: 0, anchor: origin });

    // Assert
    expect(result).toMatchObject({ kind: 'applied', outcome: 'victory' });
    expect(game.board.isEmpty(origin)).toBe(true);
    expect(game.state.pendingPieces).toHaveLength(1);
    expect(game.state.moveCount).toBe(0);
  });
});

it('should_restore_board_tray_and_moves_when_undoing_and_redoing_fit', () => {
  // Arrange
  const game = startFitGame(BoardShape.of([west, origin, east]), [
    single,
    single,
    single,
  ]);
  game.applyMove({ pieceId: 0, anchor: origin });
  game.resolutionDone();
  game.applyMove({ pieceId: 1, anchor: east });
  game.resolutionDone();

  // Act and assert
  expect(game.undo()).toBe(true);
  expect(game.undo()).toBe(true);
  expect(game.board.isEmpty(origin)).toBe(true);
  expect(game.state.pendingPieces).toHaveLength(3);
  expect(game.state.moveCount).toBe(0);
  expect(game.redo()).toBe(true);
  expect(game.board.cellAt(origin)).toBe(0);
  expect(game.state.moveCount).toBe(1);
  game.applyMove({ pieceId: 2, anchor: west });
  game.resolutionDone();
  expect(game.redo()).toBe(false);
});
