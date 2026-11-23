import type { IRandomSource, WeightedEntry } from './random-source';

/**
 * Seeded pseudo-random number generator implementing `IRandomSource`
 * (Strategy, RF-05, RN-05) with the `mulberry32` 32-bit algorithm.
 *
 * External source: `mulberry32` by Tommy Ettinger (2017, public domain),
 * documented at
 * https://gist.github.com/tommyettinger/46a874533244883189141785d1235295 and
 * https://github.com/bryc/code/blob/master/jshash/PRNGs.md#mulberry32
 * (listed in README -> References).
 *
 * `mulberry32` adds a non-zero Weyl constant (`0x6d2b79f5`) before mixing on
 * every step, so seed `0` produces a full sequence without getting stuck, and
 * its entire state fits in one 32-bit integer, making `clone()` trivial
 * (Prototype, RN-31).
 */
export class SeededRandom implements IRandomSource {
  /** The initial seed, normalised to an unsigned 32-bit integer. */
  readonly seed: number;
  private state: number;

  constructor(seed: number) {
    if (!Number.isInteger(seed)) {
      throw new RangeError(`Seed must be an integer: ${seed}`);
    }
    this.seed = seed >>> 0;
    this.state = this.seed;
  }

  next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 0x100000000;
  }

  nextInt(min: number, max: number): number {
    if (!Number.isInteger(min) || !Number.isInteger(max)) {
      throw new RangeError(`Bounds must be integers: [${min}, ${max}]`);
    }
    if (min > max) {
      throw new RangeError(`Min (${min}) cannot be greater than max (${max})`);
    }
    const span = max - min + 1;
    return min + Math.floor(this.next() * span);
  }

  pick<T>(items: readonly T[]): T {
    const [first] = items;
    if (first === undefined) {
      throw new RangeError('Cannot pick from an empty list');
    }
    return items[this.nextInt(0, items.length - 1)] ?? first;
  }

  pickWeighted<T>(entries: readonly WeightedEntry<T>[]): T {
    let totalWeight = 0;
    let last: WeightedEntry<T> | undefined;
    for (const entry of entries) {
      if (!Number.isFinite(entry.weight) || entry.weight <= 0) {
        throw new RangeError(
          `Every weight must be a positive finite number: ${entry.weight}`,
        );
      }
      totalWeight += entry.weight;
      last = entry;
    }
    if (last === undefined) {
      throw new RangeError('Cannot pick from an empty weighted list');
    }
    const threshold = this.next() * totalWeight;
    let cumulative = 0;
    for (const entry of entries) {
      cumulative += entry.weight;
      if (threshold < cumulative) {
        return entry.item;
      }
    }
    return last.item;
  }

  clone(): SeededRandom {
    const copy = new SeededRandom(this.seed);
    copy.state = this.state;
    return copy;
  }
}
