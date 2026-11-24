import { createAppServices } from './composition-root';

it('should_log_allowlisted_fields_when_a_lines_game_finishes', async () => {
  // Arrange
  const now = jest.spyOn(Date, 'now').mockReturnValue(42);
  const info = jest.spyOn(console, 'info').mockImplementation(() => undefined);
  try {
    const game = createAppServices().startLines();

    // Act
    for (let turn = 0; turn < 100; turn++) {
      const { board, tray } = game.view;
      const candidate = tray
        .flatMap((piece, slot) =>
          piece === null ? [] : board.map(({ coord }) => ({ coord, slot })),
        )
        .find(({ coord, slot }) => game.preview(slot, coord).valid);
      if (candidate === undefined) break;
      expect(game.place(candidate.slot, candidate.coord)).toBe(true);
    }
    const result = await game.finishIfOver();

    // Assert
    expect(result?.isRight()).toBe(true);
    const [entry] = info.mock.calls.filter(
      ([message]) => message === 'FinishGame executed',
    );
    expect(entry).toEqual([
      'FinishGame executed',
      expect.objectContaining({
        input: { gameId: 'hexa-lines', reason: 'defeat' },
        output: { saveFailed: false },
      }),
    ]);
  } finally {
    info.mockRestore();
    now.mockRestore();
  }
});
