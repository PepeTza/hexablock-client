/**
 * Port (DIP): reports whether the player currently has an authenticated
 * account session (CU-07, RN-35). Guests play offline with no session.
 */
export interface ISessionProvider {
  hasActiveSession(): Promise<boolean>;
}
