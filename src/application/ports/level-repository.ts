import type { GameId } from '@domain/progress/player-progress';

/**
 * Minimum metadata a generic use case needs about a level to load it and
 * check sequential unlocking (CU-01, RN-19, RN-25). Concrete level
 * definitions (T22) extend this shape with variant-specific data.
 */
export interface ILevelSummary {
  readonly id: string;
  readonly gameId: GameId;
  readonly order: number;
}

/**
 * Port (DIP): loads bundled or downloaded level definitions for a variant
 * (CU-01, CU-08, CU-15, RN-38).
 */
export interface ILevelRepository {
  findByGame(gameId: GameId): Promise<readonly ILevelSummary[]>;
  findById(gameId: GameId, levelId: string): Promise<ILevelSummary | null>;
}
