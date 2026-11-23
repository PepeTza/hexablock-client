import { Either } from './either';

describe('Either', () => {
  it('should_wrap_error_and_skip_right_transformations_when_either_is_left', () => {
    // Arrange
    const error = new RangeError('level locked');
    const outcome = Either.left<Error, number>(error);
    let mappedRight = false;
    let flatMappedRight = false;

    // Act
    const mapped = outcome.map((value) => {
      mappedRight = true;
      return value * 2;
    });
    const chained = mapped.flatMap((value) => {
      flatMappedRight = true;
      return Either.right<number, Error>(value + 1);
    });
    const remappedError = chained.mapLeft(
      (err) => new Error(`wrapped: ${err.message}`),
    );

    // Assert
    expect(outcome.isLeft()).toBe(true);
    expect(outcome.isRight()).toBe(false);
    expect(mappedRight).toBe(false);
    expect(flatMappedRight).toBe(false);
    expect(remappedError.isLeft()).toBe(true);
    expect(
      remappedError.fold(
        (err) => err.message,
        () => 'ok',
      ),
    ).toBe('wrapped: level locked');
  });

  it('should_wrap_value_and_apply_map_and_flat_map_when_either_is_right', () => {
    // Arrange
    const outcome = Either.right<number, Error>(21);
    let mappedLeft = false;

    // Act
    const doubled = outcome.map((value) => value * 2);
    const chained = doubled.flatMap((value) =>
      Either.right<string, Error>(`score:${value}`),
    );
    const preserved = chained.mapLeft((err) => {
      mappedLeft = true;
      return err;
    });

    // Assert
    expect(outcome.isRight()).toBe(true);
    expect(outcome.isLeft()).toBe(false);
    expect(mappedLeft).toBe(false);
    expect(preserved.isRight()).toBe(true);
    expect(
      preserved.fold(
        () => 'err',
        (value) => value,
      ),
    ).toBe('score:42');
  });

  it('should_invoke_the_matching_branch_when_folding_either', () => {
    // Arrange
    const left = Either.left<Error, string>(new Error('boom'));
    const right = Either.right<string, Error>('ok');

    // Act
    const leftFolded = left.fold(
      (err) => `left:${err.message}`,
      (value) => `right:${value}`,
    );
    const rightFolded = right.fold(
      (err) => `left:${err.message}`,
      (value) => `right:${value}`,
    );

    // Assert
    expect(leftFolded).toBe('left:boom');
    expect(rightFolded).toBe('right:ok');
  });
});
