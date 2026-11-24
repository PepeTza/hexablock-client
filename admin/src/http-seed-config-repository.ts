import { Either } from '@application/common/either';
import {
  SeedSettingsError,
  type IAdminSeedConfigRepository,
  type SeedGameId,
  type SeedSettingsEntry,
  type SeedTarget,
} from '@application/ports/admin-seed-config-repository';
import { isSeedValue, type SeedConfig } from '@domain/content/seed-config';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseConfig(value: unknown): SeedConfig | null {
  if (!isRecord(value)) return null;
  if (value.mode === 'random' && !Object.hasOwn(value, 'value'))
    return { mode: 'random' };
  return value.mode === 'fixed' && isSeedValue(value.value)
    ? { mode: 'fixed', value: value.value }
    : null;
}

function parseEntries(
  data: unknown,
  gameId: SeedGameId,
): readonly SeedSettingsEntry[] | null {
  if (!isRecord(data) || data.gameId !== gameId) return null;
  if (gameId !== 'hexa-sort') {
    const config = parseConfig(data.config);
    return config === null ? null : [{ levelId: null, config }];
  }
  if (!Array.isArray(data.levels)) return null;
  const entries: SeedSettingsEntry[] = [];
  const seen = new Set<string>();
  const levels: readonly unknown[] = data.levels;
  for (const level of levels) {
    if (
      !isRecord(level) ||
      typeof level.levelId !== 'string' ||
      !level.levelId.trim() ||
      seen.has(level.levelId)
    )
      return null;
    const config = parseConfig(level.config);
    if (config === null) return null;
    entries.push({ levelId: level.levelId, config });
    seen.add(level.levelId);
  }
  return entries;
}

function responseError(status: number): SeedSettingsError {
  switch (status) {
    case 400:
      return new SeedSettingsError(
        'invalid-input',
        'The server rejected the seed settings.',
      );
    case 401:
    case 403:
      return new SeedSettingsError(
        'forbidden',
        'You are not authorized to change seed settings.',
      );
    case 404:
      return new SeedSettingsError(
        'not-found',
        'The requested seed configuration was not found.',
      );
    default:
      return new SeedSettingsError(
        'unavailable',
        'Seed settings are unavailable.',
      );
  }
}

/** Browser HTTP adapter for CU-18. Authorization is enforced by the server. */
export class HttpSeedConfigRepository implements IAdminSeedConfigRepository {
  constructor(
    private readonly baseUrl: string,
    private readonly accessToken: string,
    private readonly request: typeof fetch = (input, init) =>
      fetch(input, init),
  ) {}

  async read(
    gameId: SeedGameId,
  ): Promise<Either<SeedSettingsError, readonly SeedSettingsEntry[]>> {
    try {
      const response = await this.request(this.url(gameId));
      if (!response.ok) return Either.left(responseError(response.status));
      const entries = parseEntries(await response.json(), gameId);
      if (entries !== null) return Either.right(entries);
    } catch {
      return Either.left(responseError(0));
    }
    return Either.left(responseError(0));
  }

  async save(
    target: SeedTarget,
    config: SeedConfig,
  ): Promise<Either<SeedSettingsError, void>> {
    const suffix =
      target.gameId === 'hexa-sort'
        ? '?levelId=' + encodeURIComponent(target.levelId)
        : '';
    try {
      const response = await this.request(this.url(target.gameId) + suffix, {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer ' + this.accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });
      return response.ok
        ? Either.right(undefined)
        : Either.left(responseError(response.status));
    } catch {
      return Either.left(responseError(0));
    }
  }

  private url(gameId: SeedGameId): string {
    return this.baseUrl.replace(/\/$/, '') + '/seed-config/' + gameId;
  }
}
