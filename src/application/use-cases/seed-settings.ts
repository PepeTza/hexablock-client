import { isSeedValue, type SeedConfig } from '@domain/content/seed-config';

import { Either } from '../common/either';
import {
  SeedSettingsError,
  type IAdminSeedConfigRepository,
  type SeedGameId,
  type SeedSettingsEntry,
  type SeedTarget,
} from '../ports/admin-seed-config-repository';
import type { AsyncCommandService } from './use-case';

export interface LoadSeedConfigsInput {
  readonly gameId: SeedGameId;
}

export interface SaveSeedConfigInput {
  readonly target: SeedTarget;
  readonly config: SeedConfig;
}

/**
 * Read the configured mode before editing a game or a Sort level (CU-18).
 * `execute` declares `SeedSettingsError`, narrower than the `Error` of
 * `AsyncCommandService`, so callers holding this class keep its `code` (D-23).
 */
export class LoadSeedConfigsUseCase implements AsyncCommandService<
  LoadSeedConfigsInput,
  readonly SeedSettingsEntry[]
> {
  constructor(
    private readonly repository: Pick<IAdminSeedConfigRepository, 'read'>,
  ) {}

  execute({
    gameId,
  }: LoadSeedConfigsInput): Promise<
    Either<SeedSettingsError, readonly SeedSettingsEntry[]>
  > {
    return this.repository.read(gameId);
  }
}

/**
 * Validate the requested configuration before passing it to the admin port
 * (CU-18). Like `LoadSeedConfigsUseCase`, `execute` keeps `SeedSettingsError`.
 */
export class SaveSeedConfigUseCase implements AsyncCommandService<
  SaveSeedConfigInput,
  void
> {
  constructor(
    private readonly repository: Pick<IAdminSeedConfigRepository, 'save'>,
  ) {}

  execute({
    target,
    config,
  }: SaveSeedConfigInput): Promise<Either<SeedSettingsError, void>> {
    if (target.gameId === 'hexa-sort' && target.levelId.trim().length === 0) {
      return Promise.resolve(
        Either.left(
          new SeedSettingsError('invalid-input', 'Choose a Hexa Sort level.'),
        ),
      );
    }
    if (config.mode === 'fixed' && !isSeedValue(config.value)) {
      return Promise.resolve(
        Either.left(
          new SeedSettingsError(
            'invalid-input',
            'Use an integer seed between 0 and 4294967295.',
          ),
        ),
      );
    }
    return this.repository.save(target, config);
  }
}
