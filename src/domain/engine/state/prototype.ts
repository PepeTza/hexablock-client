/**
 * Prototype: an object that can make an independent copy of itself, at the
 * same point and with the same content.
 *
 * `T` is the type of the copy, so `T extends IPrototype<T>` reads "a `T`
 * that can produce another `T`" (a recursive bounded generic, in the style
 * of `TCoord extends ICoord`). `IPieceSource` and `IRandomSource` are
 * prototypes, which is what lets a `Snapshot` keep them.
 */
export interface IPrototype<T> {
  clone(): T;
}
