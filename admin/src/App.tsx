import type {
  AuthSession,
  Credentials,
  LoginResult,
} from '@application/ports/auth-service';
import type { IUseCase } from '@application/use-cases/use-case';
import { BoardShape } from '@domain/engine/board/board-shape';
import { HexGeometry } from '@domain/engine/hex/hex-geometry';
import { type FormEvent, useState } from 'react';

const LINES_BOARD_RADIUS = 4;
const LOGIN_ERRORS = {
  'invalid-input': 'Check the username and password format.',
  'invalid-credentials': 'Invalid username or password.',
  forbidden: 'This account cannot access the admin panel.',
  'rate-limited': 'Too many attempts. Try again later.',
  unavailable: 'Unable to sign in. Try again later.',
};

interface AppProps {
  readonly login: IUseCase<Credentials, Promise<LoginResult>>;
}

export function App({ login }: AppProps) {
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
      const result = await login.execute({
        username: typeof username === 'string' ? username : '',
        password: typeof password === 'string' ? password : '',
      });
      form.reset();
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

  return (
    <main>
      <h1>HexaBlock Admin</h1>
      {session ? (
        <>
          <button type="button" onClick={() => setSession(null)}>
            Sign out
          </button>
          <p>
            A radius-{LINES_BOARD_RADIUS} board has{' '}
            {BoardShape.ofRadius(new HexGeometry(), LINES_BOARD_RADIUS).size}{' '}
            cells.
          </p>
        </>
      ) : (
        <form
          onSubmit={(event) => {
            void signIn(event);
          }}
        >
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            autoComplete="username"
            required
          />
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
          <button type="submit" disabled={submitting}>
            Sign in
          </button>
          {error && <p role="alert">{error}</p>}
        </form>
      )}
    </main>
  );
}
