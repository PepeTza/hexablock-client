/** An item paired with its positive relative weight for weighted draws. */
export interface WeightedEntry<T> {
  readonly item: T;
  readonly weight: number;
}

/**
 * Strategy: injectable source of randomness (RF-05, RN-05). Domain code and
 * variants never call `Math.random()` directly: every random decision goes
 * through this interface so runs and tests are reproducible from a seed.
 *
 * Prototype: `clone()` returns an independent copy at the exact same point in
 * the sequence, so undo (Hexa Merge, RN-31) and move previews (CU-03) can
 * restore or fork the generator without exposing its internal state.
 */
export interface IRandomSource {
  /** A pseudo-random number in the half-open interval `[0, 1)`. */
  next(): number;

  /** A pseudo-random integer in the inclusive interval `[min, max]`. */
  nextInt(min: number, max: number): number;

  /** Picks one item uniformly from a non-empty list. */
  pick<T>(items: readonly T[]): T;

  /**
   * Picks one item proportionally to its positive finite weight from a
   * non-empty list (used by weighted piece pools in D-07 and tile spawns in
   * RN-28).
   */
  pickWeighted<T>(entries: readonly WeightedEntry<T>[]): T;

  /** An independent copy positioned at the same point in the sequence. */
  clone(): IRandomSource;
}
