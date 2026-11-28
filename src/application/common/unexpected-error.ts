/**
 * Wraps any value thrown or rejected by a use case or its ports into an
 * `Error`, so the left side of `Either<Error, TResult>` is always an `Error`.
 *
 * Whatever was thrown is not inspected (no `instanceof`, AGENTS.md §3): the
 * message is `String(cause)` and the original value is kept in `cause`
 * (the `cause` option of the `Error` constructor, ECMAScript 2022; MDN,
 * "Error: cause", https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause).
 */
export class UnexpectedError extends Error {
  constructor(cause: unknown) {
    super(String(cause), { cause });
    this.name = 'UnexpectedError';
  }
}
