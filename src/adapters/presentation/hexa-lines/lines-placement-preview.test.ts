import { HexCoord } from '@domain/engine/hex/hex-coord';
import { createLinesGame } from '@domain/variants/hexa-lines/lines-game';

import { previewLinesPlacement } from './lines-placement-preview';

describe('previewLinesPlacement', () => {
  const weights = new Map([['p1-01', 1_000_000]]);

  it('should_highlight_the_row_without_mutating_the_game_when_the_drop_completes_it', () => {
    // Arrange
    const game = createLinesGame(42, weights);
    const row = [0, 1, 2, 3, 4].map((q) => new HexCoord(q, -4));
    row.slice(0, 4).forEach((anchor, index) => {
      game.applyMove({ slot: index % 3, anchor });
      game.resolutionDone();
    });
    const anchor = new HexCoord(4, -4);
    const state = game.state;
    const board = game.board;
    const listener = jest.fn();
    game.subscribe(listener);

    // Act
    const preview = previewLinesPlacement(game, { slot: 1, anchor });

    // Assert
    expect(preview).toEqual({ valid: true, cells: [anchor], clearing: row });
    expect(game.state).toBe(state);
    expect(game.board).toBe(board);
    expect(game.board.isEmpty(anchor)).toBe(true);
    expect(listener).not.toHaveBeenCalled();
  });

  it('should_return_invalid_when_the_piece_leaves_the_board', () => {
    // Arrange
    const game = createLinesGame(42, weights);
    const anchor = new HexCoord(5, 0);

    // Act
    const preview = previewLinesPlacement(game, { slot: 0, anchor });

    // Assert
    expect(preview).toMatchObject({
      valid: false,
      cells: [anchor],
      clearing: [],
    });
  });

  it('should_return_no_cells_when_the_tray_slot_does_not_exist', () => {
    // Arrange
    const game = createLinesGame(42, weights);

    // Act
    const preview = previewLinesPlacement(game, {
      slot: 5,
      anchor: HexCoord.ORIGIN,
    });

    // Assert
    expect(preview).toMatchObject({ valid: false, cells: [], clearing: [] });
  });
});
