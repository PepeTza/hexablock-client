/**
 * Value object: an immutable stack of coloured chips in Hexa Sort (RN-20).
 *
 * `chips` lists colour indexes from bottom to top, as in the level spec
 * (backend api-contracts §6). A stack always holds at least one chip: an
 * emptied cell holds no stack at all. Every change returns a new stack,
 * because `Board.clone` shares cell values between a game and its previews.
 */
export class ColorStack {
  readonly chips: readonly number[];

  private constructor(chips: readonly number[]) {
    this.chips = chips;
  }

  /** A stack with these colour indexes, listed bottom to top. */
  static of(chips: readonly number[]): ColorStack {
    if (chips.length === 0) {
      throw new RangeError('A stack needs at least one chip');
    }
    const invalid = chips.find((chip) => !Number.isInteger(chip) || chip < 0);
    if (invalid !== undefined) {
      throw new RangeError(`A chip colour must be an integer >= 0: ${invalid}`);
    }
    return new ColorStack([...chips]);
  }

  get height(): number {
    return this.chips.length;
  }

  /** The colour of the chip on top. */
  top(): number {
    const top = this.chips.at(-1);
    if (top === undefined) {
      // Unreachable: `of` never builds an empty stack.
      throw new Error('A stack always has a top chip');
    }
    return top;
  }

  /** How many chips of the top colour lie together on top (the top run). */
  topRun(): number {
    const color = this.top();
    let run = 0;
    for (
      let i = this.chips.length - 1;
      i >= 0 && this.chips[i] === color;
      i--
    ) {
      run += 1;
    }
    return run;
  }

  /** This stack without its top run, or `null` when nothing is left. */
  withoutTopRun(): ColorStack | null {
    const rest = this.chips.slice(0, this.chips.length - this.topRun());
    return rest.length === 0 ? null : new ColorStack(rest);
  }

  /** This stack with `count` chips of `color` added on top. */
  plusRun(color: number, count: number): ColorStack {
    if (!Number.isInteger(count) || count < 1) {
      throw new RangeError(`A run needs at least one chip: ${count}`);
    }
    return ColorStack.of([...this.chips, ...Array<number>(count).fill(color)]);
  }

  equals(other: ColorStack): boolean {
    return (
      this.chips.length === other.chips.length &&
      this.chips.every((chip, i) => chip === other.chips[i])
    );
  }
}
