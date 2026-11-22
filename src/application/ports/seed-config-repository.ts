import type { SeedConfig } from '@domain/content/seed-config';
import type { GameId } from '@domain/progress/player-progress';

/**
 * Port (DIP): reads the seed configuration for a variant or a specific level
 * (RN-05, CU-01, D-15). Returns `null` when none was downloaded yet so the
 * use case falls back to random mode (CU-01 A3).
 */
export interface ISeedConfigRepository {
  findSeedConfig(gameId: GameId, levelId?: string): Promise<SeedConfig | null>;
}

/**
 * Port (DIP): generates a new integer seed when a game runs in random seed
 * mode (RN-05, CU-01). Injected so tests stay deterministic without calling
 * `Math.random()`.
 */
export interface ISeedGenerator {
  generate(): number;
}
