import type {
  Credentials,
  IAuthService,
  LoginResult,
} from '@application/ports/auth-service';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function decodeRole(token: string): unknown {
  const payload = token.split('.')[1];
  if (!payload || token.split('.').length !== 3) return undefined;
  const decoded: unknown = JSON.parse(
    atob(payload.replace(/-/g, '+').replace(/_/g, '/')),
  );
  return isRecord(decoded) ? decoded.role : undefined;
}

/** Adapter for the API login endpoint. The server authorizes protected requests. */
export class HttpAuthService implements IAuthService {
  constructor(
    private readonly baseUrl: string,
    private readonly request: typeof fetch = (input, init) =>
      fetch(input, init),
  ) {}

  async login(credentials: Credentials): Promise<LoginResult> {
    try {
      const response = await this.request(
        this.baseUrl.replace(/\/$/, '') + '/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        },
      );
      if (response.status === 400) return { status: 'invalid-input' };
      if (response.status === 401) return { status: 'invalid-credentials' };
      if (response.status === 429) return { status: 'rate-limited' };
      if (!response.ok) return { status: 'unavailable' };

      const data: unknown = await response.json();
      if (!isRecord(data) || !isRecord(data.user))
        return { status: 'unavailable' };
      const { accessToken, expiresAt, user } = data;
      const { username, role } = user;
      if (
        typeof accessToken !== 'string' ||
        typeof username !== 'string' ||
        typeof expiresAt !== 'string' ||
        !(Date.parse(expiresAt) > Date.now()) ||
        (role !== 'admin' && role !== 'player')
      ) {
        return { status: 'unavailable' };
      }
      if (decodeRole(accessToken) !== role) return { status: 'forbidden' };
      return {
        status: 'authenticated',
        session: { accessToken, username, role },
      };
    } catch {
      return { status: 'unavailable' };
    }
  }
}
