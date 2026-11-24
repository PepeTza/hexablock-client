import type { Board } from '../../engine/board/board';
import type { DomainEvent } from '../../engine/events/domain-event';
import type { GameState } from '../../engine/game/game-state';
import type { ICoord } from '../../engine/geometry/coord';
import type { LinesResolution } from './lines-scoring-policy';

export interface LinesState extends GameState {
  readonly streak: number;
}

export interface LineCleared<TCoord extends ICoord> extends DomainEvent {
  readonly type: 'LineCleared';
  readonly linesCleared: number;
  readonly cells: readonly TCoord[];
}

/** Resolve an accepted placement on the engine's working board (RN-09). */
export function resolveLines<
  TCell extends NonNullable<unknown>,
  TCoord extends ICoord,
  TState extends LinesState,
>(board: Board<TCell, TCoord>, state: TState, cellsPlaced: number) {
  const cellsToClear = new Map<string, TCoord>();
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
  const events: readonly LineCleared<TCoord>[] =
    linesCleared === 0 ? [] : [{ type: 'LineCleared', linesCleared, cells }];

  return { state: { ...state, streak }, resolution, events };
}
