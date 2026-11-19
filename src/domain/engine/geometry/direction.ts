/**
 * Value object: a neighbourhood direction of a cell, identified by its name.
 *
 * A direction does not know which grid it belongs to or what step it
 * represents: each geometry declares its own directions and their steps
 * (`HexDirection` in `HexGeometry`). A new cell shape therefore adds its
 * directions in its own file, without changing this one (RNF-14).
 *
 * Each geometry creates its directions once, so they can be compared with
 * `===`.
 *
 * `kind` exists only for the compiler: TypeScript compares classes by their
 * shape, so without a private member a `Direction` and an `Axis` (both just a
 * `name`) would be accepted in place of each other.
 */
export class Direction {
  private readonly kind = 'direction';

  constructor(readonly name: string) {}

  toString(): string {
    return this.name;
  }
}
