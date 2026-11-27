import type {
  AuthSession,
  Credentials,
  LoginResult,
} from '@application/ports/auth-service';
import type { AsyncCommandService } from '@application/use-cases/use-case';
import { BoardShape } from '@domain/engine/board/board-shape';
import { HexGeometry } from '@domain/engine/hex/hex-geometry';
import { type FormEvent, useMemo, useState } from 'react';

import { SeedSettings, type SeedSettingsServices } from './SeedSettings';

const LINES_BOARD_RADIUS = 4;
const LOGIN_ERRORS = {
  'invalid-input': 'Check the username and password format.',
  'invalid-credentials': 'Invalid username or password.',
  forbidden: 'This account cannot access the admin panel.',
  'rate-limited': 'Too many attempts. Try again later.',
  unavailable: 'Unable to sign in. Try again later.',
};

interface AppProps {
  readonly login: AsyncCommandService<Credentials, LoginResult>;
  readonly seedSettingsFor?: (session: AuthSession) => SeedSettingsServices;
}

export function App({ login, seedSettingsFor }: AppProps) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const form = event.currentTarget;
    const fields = new FormData(form);
    const username = fields.get('username');
    const password = fields.get('password');
    setError(null);
    setSubmitting(true);
    try {
      const outcome = await login.execute({
        username: typeof username === 'string' ? username : '',
        password: typeof password === 'string' ? password : '',
      });
      form.reset();
      if (outcome.isLeft()) {
        setError(LOGIN_ERRORS.unavailable);
        return;
      }
      const result = outcome.value;
      if (
        result.status === 'authenticated' &&
        result.session.role === 'admin'
      ) {
        setSession(result.session);
      } else {
        setError(
          LOGIN_ERRORS[
            result.status === 'authenticated' ? 'forbidden' : result.status
          ],
        );
      }
    } catch {
      form.reset();
      setError(LOGIN_ERRORS.unavailable);
    } finally {
      setSubmitting(false);
    }
  }

  const seedSettings = useMemo(
    () => (session ? seedSettingsFor?.(session) : null),
    [session, seedSettingsFor],
  );

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <h1>HexaBlock Admin</h1>
        {session && (
          <div className="admin-session">
            <span className="admin-account">{session.username}</span>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setSession(null)}
            >
              Sign out
            </button>
          </div>
        )}
      </header>
      {session ? (
        <div className="admin-content">
          {seedSettings && <SeedSettings {...seedSettings} />}
          <p className="board-meta">
            A radius-{LINES_BOARD_RADIUS} board has{' '}
            {BoardShape.ofRadius(new HexGeometry(), LINES_BOARD_RADIUS).size}{' '}
            cells.
          </p>
        </div>
      ) : (
        <form
          className="login-card"
          onSubmit={(event) => {
            void signIn(event);
          }}
        >
          <div className="field-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              autoComplete="username"
              required
            />
          </div>
          <div className="field-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={submitting}>
            Sign in
          </button>
          {error && (
            <p role="alert" className="alert-banner">
              {error}
            </p>
          )}
        </form>
      )}
    </main>
  );
}
