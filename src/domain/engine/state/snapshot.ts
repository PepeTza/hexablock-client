import type { IPrototype } from './prototype';

/**
 * Memento: a frozen point of something that changes while a game is played,
 * such as a piece source or a random source, kept inside the game state.
 *
 * It exposes nothing of what it keeps: it can only hand out a new,
 * independent copy (`fork`). So once a state is saved (by the engine, by the
 * undo history or by autosave), nothing can advance its source: a snapshot
 * has no `next` or `draw`, and calling them does not compile. Going back to
 * an older state therefore always deals the same pieces again (RN-05, RN-16,
 * RN-31).
 *
 * `SourcedGameRules` forks the snapshot before each move and stores a new
 * one after it, so variants never handle snapshots themselves.
 */
export class Snapshot<T extends IPrototype<T>> {
  private constructor(private readonly frozen: T) {}

  /**
   * A snapshot of `source` as it is now. It keeps its own copy, so advancing
   * `source` afterwards does not change the snapshot.
   */
  static of<T extends IPrototype<T>>(source: T): Snapshot<T> {
    return new Snapshot(source.clone());
  }

  /** A new copy starting at the captured point; each call gives another one. */
  fork(): T {
    return this.frozen.clone();
  }
}
