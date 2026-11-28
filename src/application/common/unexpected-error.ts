/**
 * Wraps any value thrown or rejected by a use case or its ports into an
 * `Error`, so the left side of `Either<Error, TResult>` is always an `Error`.
 *
 * Whatever was thrown is not inspected (no `instanceof`, AGENTS.md §3): the
 * message is `String(cause)` and the original value is kept in `cause`
 * (the ES2022 `cause` option of the `Error` constructor, ECMAScript 2022).
 */
export class UnexpectedError extends Error {
  constructor(cause: unknown) {
    super(String(cause), { cause });
    this.name = 'UnexpectedError';
  }
}
