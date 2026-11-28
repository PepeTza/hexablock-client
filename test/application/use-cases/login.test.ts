import type { Either } from '@application/common/either';
import type { IAuthService } from '@application/ports/auth-service';
import { LoginUseCase } from '@application/use-cases/login';

function expectRight<T>(outcome: Either<Error, T>): T {
  if (outcome.isLeft()) {
    throw outcome.value;
  }
  return outcome.value;
}

const credentials = { username: 'test_admin', password: 'synthetic-password' };

describe('LoginUseCase', () => {
  it('should_return_the_session_when_the_authenticated_role_matches', async () => {
    // Arrange
    const session = {
      accessToken: 'token',
      username: 'test_admin',
      role: 'admin',
    } as const;
    const auth: IAuthService = {
      login: () => Promise.resolve({ status: 'authenticated', session }),
    };

    // Act
    const result = expectRight(
      await new LoginUseCase(auth, 'admin').execute(credentials),
    );

    // Assert
    expect(result).toEqual({ status: 'authenticated', session });
  });

  it('should_discard_the_session_when_the_authenticated_role_differs', async () => {
    // Arrange
    const auth: IAuthService = {
      login: () =>
        Promise.resolve({
          status: 'authenticated',
          session: {
            accessToken: 'token',
            username: 'test_player',
            role: 'player',
          },
        }),
    };

    // Act
    const result = expectRight(
      await new LoginUseCase(auth, 'admin').execute(credentials),
    );

    // Assert
    expect(result).toEqual({ status: 'forbidden' });
  });

  it('should_forward_the_failure_when_authentication_fails', async () => {
    // Arrange
    const auth: IAuthService = {
      login: () => Promise.resolve({ status: 'invalid-credentials' }),
    };

    // Act
    const result = expectRight(
      await new LoginUseCase(auth, 'admin').execute(credentials),
    );

    // Assert
    expect(result).toEqual({ status: 'invalid-credentials' });
  });
});
