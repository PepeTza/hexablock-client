import type { IRandomSource, WeightedEntry } from '../random/random-source';
import { assertDrawCount, type IPieceSource } from './piece-source';

/**
 * Strategy (`IPieceSource`): unbounded piece source backed by an injected
 * `IRandomSource` (RF-04, RF-05, RN-05). Supports uniform and weighted pools
 * (for example weighted piece shapes in D-07 or 90/10 tile spawns in RN-28).
 *
 * Pool entries and weights are validated eagerly on construction so invalid
 * configurations fail at game start (CU-01) instead of mid-game.
 *
 * Prototype: `clone()` clones the underlying `IRandomSource` so previews
 * (CU-03) and undo (RN-31) never advance the active generator.
 */
export class RandomPieceSource<TPiece> implements IPieceSource<TPiece> {
  private constructor(
    private readonly entries: readonly WeightedEntry<TPiece>[],
    private readonly random: IRandomSource,
  ) {}

  /** Every item in `items` is drawn with equal probability. */
  static uniform<TPiece>(
    items: Iterable<TPiece>,
    random: IRandomSource,
  ): RandomPieceSource<TPiece> {
    const entries = [...items].map((item) => ({ item, weight: 1 }));
    return RandomPieceSource.weighted(entries, random);
  }

  /** Each item is drawn proportionally to its positive finite weight. */
  static weighted<TPiece>(
    entries: Iterable<WeightedEntry<TPiece>>,
    random: IRandomSource,
  ): RandomPieceSource<TPiece> {
    const validated: WeightedEntry<TPiece>[] = [];
    for (const entry of entries) {
      if (!Number.isFinite(entry.weight) || entry.weight <= 0) {
        throw new RangeError(
          `Every weight must be a positive finite number: ${entry.weight}`,
        );
      }
      validated.push({ item: entry.item, weight: entry.weight });
    }
    if (validated.length === 0) {
      throw new RangeError('RandomPieceSource needs at least one entry');
    }
    return new RandomPieceSource(validated, random);
  }

  hasNext(): boolean {
    return true;
  }

  next(): TPiece {
    return this.random.pickWeighted(this.entries);
  }

  draw(count: number): TPiece[] {
    assertDrawCount(count);
    return Array.from({ length: count }, () => this.next());
  }

  clone(): RandomPieceSource<TPiece> {
    return new RandomPieceSource(this.entries, this.random.clone());
  }
}
