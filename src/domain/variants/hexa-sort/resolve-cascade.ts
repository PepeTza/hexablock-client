import type { Board } from '../../engine/board/board';
import type { DomainEvent } from '../../engine/events/domain-event';
import type { ICoord } from '../../engine/geometry/coord';
import type { ColorStack } from './color-stack';

/** One top run moved from one stack onto another (RN-21). */
export interface StackMerged<TCoord extends ICoord> extends DomainEvent {
  readonly type: 'StackMerged';
  readonly from: TCoord;
  readonly to: TCoord;
  readonly color: number;
  readonly count: number;
}

/** What one placement produced, for scoring and the screen. */
export interface SortResolution {
  readonly transfers: number;
  /** Chips removed from the board; stacks of ten are removed in HU21 (#73). */
  readonly chipsCleared: number;
}

/**
 * Resolve the transfers after a stack is placed on `start`, in cascade,
 * until no top run can move (RN-21, RN-22). Works on the engine's working
 * board and uses only `neighbours()` and `key()`, so it does not depend on
 * the hexagonal geometry.
 *
 * For each cell taken from the queue, the group is that cell plus the
 * neighbours whose top chip has the same colour, in this order: the cell
 * itself, then its neighbours in the geometry's order. The target is the
 * stack with the longest top run; on a tie, the first one in the group.
 * Every other stack of the group moves its top run onto the target, and
 * every stack that changed goes back to the queue.
 *
 * It always ends: each transfer joins two runs into one, so the number of
 * runs on the board drops with every transfer. Worked examples are in
 * `docs/rules/hexa-sort.md`.
 */
export function resolveCascade<TCoord extends ICoord>(
  board: Board<ColorStack, TCoord>,
  start: TCoord,
): {
  readonly resolution: SortResolution;
  readonly events: readonly StackMerged<TCoord>[];
} {
  const events: StackMerged<TCoord>[] = [];
  const queue: TCoord[] = [start];

  for (let coord = queue.shift(); coord !== undefined; coord = queue.shift()) {
    const stack = board.cellAt(coord);
    if (stack === undefined) {
      continue;
    }
    const color = stack.top();
    const group = [coord, ...board.neighbours(coord)].filter(
      (cell) => board.cellAt(cell)?.top() === color,
    );
    if (group.length < 2) {
      continue;
    }

    const target = longestRun(board, group);
    for (const source of group) {
      if (source.key() === target.key()) {
        continue;
      }
      const count = transfer(board, source, target);
      events.push({
        type: 'StackMerged',
        from: source,
        to: target,
        color,
        count,
      });
      queue.push(source);
    }
    queue.push(target);
  }

  return {
    resolution: { transfers: events.length, chipsCleared: 0 },
    events,
  };
}

/** The first cell of `group` whose stack has the longest top run (RN-22). */
function longestRun<TCoord extends ICoord>(
  board: Board<ColorStack, TCoord>,
  group: readonly TCoord[],
): TCoord {
  let best = group[0];
  let bestRun = 0;
  for (const cell of group) {
    const run = board.cellAt(cell)?.topRun() ?? 0;
    if (run > bestRun) {
      best = cell;
      bestRun = run;
    }
  }
  if (best === undefined) {
    // Unreachable: a group always holds at least the resolving cell.
    throw new Error('A transfer group cannot be empty');
  }
  return best;
}

/** Moves the top run of `source` onto `target`; returns the chips moved. */
function transfer<TCoord extends ICoord>(
  board: Board<ColorStack, TCoord>,
  source: TCoord,
  target: TCoord,
): number {
  const from = board.cellAt(source);
  const to = board.cellAt(target);
  if (from === undefined || to === undefined) {
    // Unreachable: both cells were read from the board in this same step.
    throw new Error('A transfer needs a stack on both cells');
  }
  const count = from.topRun();
  board.place(target, to.plusRun(from.top(), count));
  const rest = from.withoutTopRun();
  if (rest === null) {
    board.remove(source);
  } else {
    board.place(source, rest);
  }
  return count;
}
