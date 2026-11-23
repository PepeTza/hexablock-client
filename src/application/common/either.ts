/**
 * Functional disjoint union representing either a controlled failure (`Left`)
 * or a successful result (`Right`).
 *
 * Used by `CommandService` and `AsyncCommandService` (Mark Seemann's AOP
 * design adapted with Railway-Oriented Programming) so use cases return errors
 * explicitly without throwing exceptions or using type casts.
 */
export class Left<TLeft, TRight = never> {
  readonly kind = 'left' as const;

  constructor(readonly value: TLeft) {}

  isLeft(): this is Left<TLeft, TRight> {
    return true;
  }

  isRight(): this is Right<TLeft, TRight> {
    return false;
  }

  fold<TOut>(
    onLeft: (left: TLeft) => TOut,
    _onRight: (right: TRight) => TOut,
  ): TOut {
    void _onRight;
    return onLeft(this.value);
  }

  map<TNext>(_fn: (right: TRight) => TNext): Either<TLeft, TNext> {
    void _fn;
    return new Left<TLeft, TNext>(this.value);
  }

  mapLeft<TNextLeft>(
    fn: (left: TLeft) => TNextLeft,
  ): Either<TNextLeft, TRight> {
    return new Left<TNextLeft, TRight>(fn(this.value));
  }

  flatMap<TNextLeft, TNext>(
    _fn: (right: TRight) => Either<TNextLeft, TNext>,
  ): Either<TLeft | TNextLeft, TNext> {
    void _fn;
    return new Left<TLeft, TNext>(this.value);
  }
}

export class Right<TLeft = never, TRight = void> {
  readonly kind = 'right' as const;

  constructor(readonly value: TRight) {}

  isLeft(): this is Left<TLeft, TRight> {
    return false;
  }

  isRight(): this is Right<TLeft, TRight> {
    return true;
  }

  fold<TOut>(
    _onLeft: (left: TLeft) => TOut,
    onRight: (right: TRight) => TOut,
  ): TOut {
    void _onLeft;
    return onRight(this.value);
  }

  map<TNext>(fn: (right: TRight) => TNext): Either<TLeft, TNext> {
    return new Right<TLeft, TNext>(fn(this.value));
  }

  mapLeft<TNextLeft>(
    _fn: (left: TLeft) => TNextLeft,
  ): Either<TNextLeft, TRight> {
    void _fn;
    return new Right<TNextLeft, TRight>(this.value);
  }

  flatMap<TNextLeft, TNext>(
    fn: (right: TRight) => Either<TNextLeft, TNext>,
  ): Either<TLeft | TNextLeft, TNext> {
    return fn(this.value);
  }
}

export type Either<TLeft, TRight> = Left<TLeft, TRight> | Right<TLeft, TRight>;

export const Either = Object.freeze({
  left<TLeft, TRight = never>(value: TLeft): Either<TLeft, TRight> {
    return new Left<TLeft, TRight>(value);
  },
  right<TRight, TLeft = never>(value: TRight): Either<TLeft, TRight> {
    return new Right<TLeft, TRight>(value);
  },
});
