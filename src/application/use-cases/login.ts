import type {
  AuthRole,
  Credentials,
  IAuthService,
  LoginResult,
} from '../ports/auth-service';
import type { IUseCase } from './use-case';

export class LoginUseCase implements IUseCase<
  Credentials,
  Promise<LoginResult>
> {
  constructor(
    private readonly auth: IAuthService,
    private readonly requiredRole: AuthRole,
  ) {}

  async execute(credentials: Credentials): Promise<LoginResult> {
    const result = await this.auth.login(credentials);
    return result.status === 'authenticated' &&
      result.session.role !== this.requiredRole
      ? { status: 'forbidden' }
      : result;
  }
}
