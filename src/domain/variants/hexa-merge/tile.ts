/**
 * Value object: an immutable numbered tile in Hexa Merge.
 *
 * Every tile holds a positive power of two (2, 4, 8, ..., 2048, ...),
 * preserving the domain-model invariant.
 */
export class Tile {
  readonly value: number;

  constructor(value: number) {
    if (!isPowerOfTwo(value)) {
      throw new RangeError(`Tile value must be a power of two >= 2: ${value}`);
    }
    this.value = value;
  }

  equals(other: Tile): boolean {
    return this.value === other.value;
  }

  /** The new tile that two equal tiles merge into (RN-27). */
  doubled(): Tile {
    return new Tile(this.value * 2);
  }
}

function isPowerOfTwo(value: number): boolean {
  if (!Number.isSafeInteger(value) || value < 2) {
    return false;
  }
  let remaining = value;
  while (remaining > 1 && remaining % 2 === 0) {
    remaining /= 2;
  }
  return remaining === 1;
}
