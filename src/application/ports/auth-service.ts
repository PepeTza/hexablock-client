export type AuthRole = 'admin' | 'player';

export interface Credentials {
  readonly username: string;
  readonly password: string;
}

export interface AuthSession {
  readonly accessToken: string;
  readonly username: string;
  readonly role: AuthRole;
}

export type LoginResult =
  | { readonly status: 'authenticated'; readonly session: AuthSession }
  | {
      readonly status:
        | 'invalid-input'
        | 'invalid-credentials'
        | 'forbidden'
        | 'rate-limited'
        | 'unavailable';
    };

export interface IAuthService {
  login(credentials: Credentials): Promise<LoginResult>;
}
