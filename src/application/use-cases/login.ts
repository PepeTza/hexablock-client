import { Either } from '../common/either';
import type {
  AuthRole,
  Credentials,
  IAuthService,
  LoginResult,
} from '../ports/auth-service';
import type { AsyncCommandService } from './use-case';

export class LoginUseCase implements AsyncCommandService<
  Credentials,
  LoginResult
> {
  constructor(
    private readonly auth: IAuthService,
    private readonly requiredRole: AuthRole,
  ) {}

  async execute(credentials: Credentials): Promise<Either<Error, LoginResult>> {
    const result = await this.auth.login(credentials);
    return Either.right(
      result.status === 'authenticated' &&
        result.session.role !== this.requiredRole
        ? { status: 'forbidden' }
        : result,
    );
  }
}
