/**
 * Value object: a line orientation of the board, identified by its name.
 *
 * Like `Direction`, an axis does not know which grid it belongs to: each
 * geometry declares its own axes (`HexAxis` in `HexGeometry`). Each geometry
 * creates its axes once, so they can be compared with `===`.
 */
export class Axis {
  constructor(readonly name: string) {}

  toString(): string {
    return this.name;
  }
}
