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

/** A stack removed after its top run reached the goal size (RN-23). */
export interface GoalCompleted<TCoord extends ICoord> extends DomainEvent {
  readonly type: 'GoalCompleted';
  readonly at: TCoord;
  /** The colour of the top run that completed the goal. */
  readonly color: number;
  /** Every chip of the removed stack, including those under the run. */
  readonly chips: number;
}

export type SortEvent<TCoord extends ICoord> =
  StackMerged<TCoord> | GoalCompleted<TCoord>;

/** What one placement produced, for scoring and the screen. */
export interface SortResolution {
  readonly transfers: number;
  /** Stacks removed as goals in this cascade (RN-23). */
  readonly goals: number;
  /** Chips of every removed stack (RN-40 scores each one). */
  readonly chipsCleared: number;
}

/**
 * Resolve the transfers after a stack is placed on `start`, in cascade,
 * until no top run can move (RN-21, RN-22), removing completed goals
 * (RN-23). Works on the engine's working board and uses only
 * `neighbours()` and `key()`, so it does not depend on the hexagonal
 * geometry.
 *
 * For each cell taken from the queue, the group is that cell plus the
 * neighbours whose top chip has the same colour, in this order: the cell
 * itself, then its neighbours in the geometry's order. The target is the
 * stack with the longest top run; on a tie, the first one in the group.
 * Every other stack of the group moves its top run onto the target, and
 * every stack that changed goes back to the queue. Once the whole group has
 * moved, a target whose top run reached `clearAt` is removed as a goal.
 *
 * It always ends: each transfer joins two runs into one and each removal
 * takes runs off the board, so the number of runs drops with every step.
 * Worked examples are in `docs/rules/hexa-sort.md`.
 */
export function resolveCascade<TCoord extends ICoord>(
  board: Board<ColorStack, TCoord>,
  start: TCoord,
  clearAt: number,
): {
  readonly resolution: SortResolution;
  readonly events: readonly SortEvent<TCoord>[];
} {
  const events: SortEvent<TCoord>[] = [];
  const queue: TCoord[] = [start];
  let transfers = 0;
  let goals = 0;
  let chipsCleared = 0;

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
      transfers += 1;
      events.push({
        type: 'StackMerged',
        from: source,
        to: target,
        color,
        count,
      });
      queue.push(source);
    }

    const tower = board.cellAt(target);
    if (tower !== undefined && tower.topRun() >= clearAt) {
      board.remove(target);
      goals += 1;
      chipsCleared += tower.chips.length;
      events.push({
        type: 'GoalCompleted',
        at: target,
        color: tower.top(),
        chips: tower.chips.length,
      });
      continue;
    }
    queue.push(target);
  }

  return { resolution: { transfers, goals, chipsCleared }, events };
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
