import type { DomainEvent } from '../../engine/events/domain-event';
import type { GameState } from '../../engine/game/game-state';
import type { HexBoard } from '../../engine/hex/hex-board';
import type { HexCoord } from '../../engine/hex/hex-coord';
import type { LinesResolution } from './lines-scoring-policy';

export interface LinesState extends GameState {
  readonly streak: number;
}

export interface LineCleared extends DomainEvent {
  readonly type: 'LineCleared';
  readonly linesCleared: number;
  readonly cells: readonly HexCoord[];
}

/** Resolve an accepted placement on the engine's working board (RN-09). */
export function resolveLines<
  TCell extends NonNullable<unknown>,
  TState extends LinesState,
>(board: HexBoard<TCell>, state: TState, cellsPlaced: number) {
  const cellsToClear = new Map<string, HexCoord>();
  let linesCleared = 0;

  // Discover every complete line before removing cells from any of them.
  for (const axis of board.geometry.axes) {
    for (const line of board.lines(axis)) {
      if (line.every((cell) => !board.isEmpty(cell))) {
        linesCleared += 1;
        line.forEach((cell) => cellsToClear.set(cell.key(), cell));
      }
    }
  }

  const cells = [...cellsToClear.values()];
  cells.forEach((cell) => board.remove(cell));
  const streak = linesCleared === 0 ? 0 : state.streak + 1;
  const resolution: LinesResolution = { cellsPlaced, linesCleared, streak };
  const events: readonly LineCleared[] =
    linesCleared === 0 ? [] : [{ type: 'LineCleared', linesCleared, cells }];

  return { state: { ...state, streak }, resolution, events };
}
