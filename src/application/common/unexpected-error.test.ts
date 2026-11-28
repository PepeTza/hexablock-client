import { UnexpectedError } from './unexpected-error';

describe('UnexpectedError', () => {
  it('should_keep_original_in_cause_and_stringify_message_when_wrapping_an_error', () => {
    // Arrange
    const original = new TypeError('storage corrupted');

    // Act
    const wrapped = new UnexpectedError(original);

    // Assert
    expect(wrapped).toBeInstanceOf(Error);
    expect(wrapped.name).toBe('UnexpectedError');
    expect(wrapped.cause).toBe(original);
    expect(wrapped.message).toBe('TypeError: storage corrupted');
  });

  it('should_keep_original_in_cause_and_stringify_message_when_wrapping_a_non_error', () => {
    // Arrange
    const original = 'raw failure';

    // Act
    const wrapped = new UnexpectedError(original);

    // Assert
    expect(wrapped).toBeInstanceOf(Error);
    expect(wrapped.name).toBe('UnexpectedError');
    expect(wrapped.cause).toBe(original);
    expect(wrapped.message).toBe('raw failure');
  });
});
