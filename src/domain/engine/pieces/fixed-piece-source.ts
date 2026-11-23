import { assertDrawCount, type IPieceSource } from './piece-source';

/**
 * Strategy (`IPieceSource`): delivers a fixed, finite list of pieces in order
 * (RF-04). Used by variants whose levels prescribe an exact set of pieces
 * (Hexa Fit, RN-13) and by deterministic tests.
 *
 * Prototype: `clone()` preserves the current position independently of the
 * original source.
 */
export class FixedPieceSource<TPiece> implements IPieceSource<TPiece> {
  private readonly items: readonly TPiece[];
  private index = 0;

  constructor(items: Iterable<TPiece>) {
    this.items = [...items];
  }

  hasNext(): boolean {
    return this.index < this.items.length;
  }

  next(): TPiece | null {
    const item = this.items[this.index];
    if (item === undefined) {
      return null;
    }
    this.index += 1;
    return item;
  }

  draw(count: number): TPiece[] {
    assertDrawCount(count);
    const drawn: TPiece[] = [];
    for (let i = 0; i < count; i++) {
      const item = this.next();
      if (item === null) {
        break;
      }
      drawn.push(item);
    }
    return drawn;
  }

  clone(): FixedPieceSource<TPiece> {
    const copy = new FixedPieceSource<TPiece>(this.items);
    copy.index = this.index;
    return copy;
  }
}
