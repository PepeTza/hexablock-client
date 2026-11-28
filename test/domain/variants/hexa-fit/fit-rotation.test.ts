import { BoardShape } from '@domain/engine/board/board-shape';
import { HexCoord } from '@domain/engine/hex/hex-coord';
import { loadHexPieceCatalog } from '@domain/engine/hex/hex-piece-catalog';
import { Piece } from '@domain/engine/pieces/piece';
import { startFitGame } from '@domain/variants/hexa-fit/fit-game';

const pair = Piece.of(loadHexPieceCatalog().get('p2-01'));

it('should_preview_and_apply_a_rotation_when_the_turned_piece_fits', () => {
  // Arrange
  const anchor = new HexCoord(2, -1);
  const covered = new HexCoord(1, -1);
  const game = startFitGame(BoardShape.of([anchor, covered]), [pair]);
  const move = { pieceId: 0, anchor, rotationSteps: 1 };

  // Act
  const preview = game.preview(move);

  // Assert
  expect(preview.kind).toBe('applied');
  expect(game.state.moveCount).toBe(0);
  expect(game.board.isEmpty(anchor)).toBe(true);
  expect(game.applyMove(move).kind).toBe('applied');
  expect(game.board.cellAt(covered)).toBe(0);
  expect(game.state.moveCount).toBe(1);
});

it('should_keep_piece_and_move_count_when_the_rotation_overhangs_the_figure', () => {
  // Arrange
  const anchor = HexCoord.ORIGIN;
  const game = startFitGame(BoardShape.of(pair.cellsAt(anchor)), [pair]);

  // Act
  const invalid = { pieceId: 0, anchor, rotationSteps: 1 };
  const preview = game.preview(invalid);
  const result = game.applyMove(invalid);

  // Assert
  expect(preview.kind).toBe('rejected');
  expect(result.kind).toBe('rejected');
  expect(game.state.moveCount).toBe(0);
  expect(game.state.pendingPieces[0]?.piece).toBe(pair);
  expect(game.board.isEmpty(anchor)).toBe(true);
});
