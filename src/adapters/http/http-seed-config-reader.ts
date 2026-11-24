import type { ISeedConfigRepository } from '@application/ports/seed-config-repository';
import { isSeedValue, type SeedConfig } from '@domain/content/seed-config';
import type { GameId } from '@domain/progress/player-progress';

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readConfig(value: unknown): SeedConfig | null {
  if (!record(value)) return null;
  if (value.mode === 'random' && !Object.hasOwn(value, 'value'))
    return { mode: 'random' };
  return value.mode === 'fixed' && isSeedValue(value.value)
    ? { mode: 'fixed', value: value.value }
    : null;
}

/** Reads public seed settings at game start. Unavailable data leaves seed choice to CU-01. */
export class HttpSeedConfigReader implements ISeedConfigRepository {
  constructor(
    private readonly baseUrl: string,
    private readonly request: (
      url: string,
      init?: RequestInit,
    ) => Promise<Response> = (url, init) => fetch(url, init),
    private readonly timeoutMs = 2000,
  ) {}

  async findSeedConfig(
    gameId: GameId,
    levelId?: string,
  ): Promise<SeedConfig | null> {
    if (gameId === 'hexa-fit' || (gameId === 'hexa-sort' && !levelId))
      return null;

    const controller = new AbortController();
    let deadline: ReturnType<typeof setTimeout> | undefined;
    try {
      const timeout = new Promise<null>((resolve) => {
        deadline = setTimeout(() => {
          resolve(null);
          controller.abort();
        }, this.timeoutMs);
      });
      return await Promise.race([
        this.read(gameId, levelId, controller.signal),
        timeout,
      ]);
    } catch {
      return null;
    } finally {
      clearTimeout(deadline);
    }
  }

  private async read(
    gameId: GameId,
    levelId: string | undefined,
    signal: AbortSignal,
  ): Promise<SeedConfig | null> {
    const response = await this.request(
      this.baseUrl.replace(/\/$/, '') + '/seed-config/' + gameId,
      { signal },
    );
    if (!response.ok) return null;
    const data: unknown = await response.json();
    if (!record(data) || data.gameId !== gameId) return null;
    if (gameId !== 'hexa-sort') return readConfig(data.config);
    if (!Array.isArray(data.levels)) return null;
    const levels: readonly unknown[] = data.levels;
    const matches = levels.filter(
      (entry): entry is Record<string, unknown> =>
        record(entry) && entry.levelId === levelId,
    );
    return matches.length === 1 ? readConfig(matches[0]?.config) : null;
  }
}
