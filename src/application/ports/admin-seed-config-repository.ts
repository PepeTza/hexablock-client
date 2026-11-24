import type { SeedConfig } from '@domain/content/seed-config';
import type { Either } from '../common/either';

export type SeedGameId = 'hexa-lines' | 'hexa-merge' | 'hexa-sort';
export type SeedTarget =
  | { readonly gameId: 'hexa-lines' | 'hexa-merge' }
  | { readonly gameId: 'hexa-sort'; readonly levelId: string };

export interface SeedSettingsEntry {
  readonly levelId: string | null;
  readonly config: SeedConfig;
}

export class SeedSettingsError extends Error {
  constructor(
    readonly code: 'invalid-input' | 'forbidden' | 'not-found' | 'unavailable',
    message: string,
  ) {
    super(message);
  }
}

/** Port for reading and administering the published seed configuration (CU-18). */
export interface IAdminSeedConfigRepository {
  read(
    gameId: SeedGameId,
  ): Promise<Either<SeedSettingsError, readonly SeedSettingsEntry[]>>;
  save(
    target: SeedTarget,
    config: SeedConfig,
  ): Promise<Either<SeedSettingsError, void>>;
}
